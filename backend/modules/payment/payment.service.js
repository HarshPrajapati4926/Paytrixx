import Order from "../../models/Order.js";
import Transaction from "../../models/Transaction.js";
import Merchant from "../../models/Merchant.js";
import config from "../../config/env.js";
import { HttpError } from "../../utils/asyncHandler.js";
import { newId } from "../../utils/crypto.js";
import { initiateTransaction, fetchTransactionStatus } from "../../services/paytm.service.js";
import { enqueueCallback } from "../../services/callback.service.js";
import { logEvent } from "../../services/logger.service.js";

const round2 = (n) => Math.round(n * 100) / 100;

/** Step 3-5 of the flow: create Order + Transaction (pending), create the Paytm order, return the payment URL. */
const IDEMPOTENCY_RX = /^[A-Za-z0-9_\-:.]{1,100}$/;

const paymentUrlFor = (orderId) => `${config.baseUrl}/api/payment/checkout/${orderId}`;

export const createPayment = async (
  merchant,
  { amount, currency = "INR", customerDetails, returnUrl, idempotencyKey }
) => {
  const value = Number(amount);
  if (!Number.isFinite(value) || value < 1) throw new HttpError(400, "amount must be a number ≥ 1");
  if (currency !== "INR") throw new HttpError(400, "Only INR is supported");
  if (returnUrl && !/^https?:\/\//i.test(returnUrl)) throw new HttpError(400, "returnUrl must be an http(s) URL");

  const amt = round2(value);

  // A retried request with the same Idempotency-Key gets the original order back
  // instead of creating (and charging for) a second one.
  if (idempotencyKey !== undefined && !IDEMPOTENCY_RX.test(idempotencyKey)) {
    throw new HttpError(400, "Idempotency-Key must be 1-100 characters: letters, digits, _ - : .");
  }
  const replay = (o) => {
    if (o.amount !== amt || o.currency !== currency) {
      throw new HttpError(422, "This Idempotency-Key was already used with different parameters");
    }
    return { orderId: o.orderId, paymentUrl: paymentUrlFor(o.orderId), status: o.status, replayed: true };
  };
  if (idempotencyKey) {
    const existing = await Order.findOne({ merchantId: merchant._id, idempotencyKey }).lean();
    if (existing) return replay(existing);
  }

  const orderId = newId("ORD");

  let order;
  try {
    order = await Order.create({
      orderId,
      merchantId: merchant._id,
      amount: amt,
      currency,
      customerDetails: customerDetails || {},
      returnUrl: returnUrl || "",
      ...(idempotencyKey ? { idempotencyKey } : {}),
    });
  } catch (err) {
    // Two simultaneous requests with the same key: the loser replays the winner's order.
    if (err.code === 11000 && idempotencyKey) {
      const existing = await Order.findOne({ merchantId: merchant._id, idempotencyKey }).lean();
      if (existing) return replay(existing);
    }
    throw err;
  }
  await Transaction.create({
    transactionId: newId("TXN"),
    orderId,
    merchantId: merchant._id,
    amount: amt,
  });

  try {
    const customerId = String(customerDetails?.id || customerDetails?.email || customerDetails?.phone || "guest");
    const token = await initiateTransaction({ orderId, amount: amt, currency, customerId });
    await Order.updateOne({ _id: order._id }, { paytmTxnToken: token });
  } catch (err) {
    // The order never reached Paytm, so it can't be paid — close it out.
    await Order.updateOne({ _id: order._id }, { status: "failed" });
    await Transaction.updateOne({ orderId }, { status: "failed", gatewayResponse: { error: err.message } });
    await logEvent("error", "failed", { stage: "initiateTransaction", orderId, message: err.message });
    throw err;
  }

  return { orderId, paymentUrl: paymentUrlFor(orderId), status: "pending" };
};

export const getPaymentStatus = async (merchantId, orderId) => {
  const order = await Order.findOne({ orderId, merchantId }).lean();
  if (!order) throw new HttpError(404, "Order not found");
  return {
    orderId: order.orderId,
    status: order.status,
    amount: order.amount,
    currency: order.currency,
    paytmTxnId: order.paytmTxnId || null,
  };
};

/**
 * Normalise a Paytm result (webhook params or status-API body) and apply it.
 * Idempotent: only a *pending* order can change state, enforced atomically in Mongo,
 * so duplicate webhooks / a racing poller are harmless.
 *
 * @returns {{ applied: boolean, reason?: string, order?: object }}
 */
export const applyPaymentResult = async ({ orderId, paytmStatus, txnId, amount, raw, source }) => {
  if (paytmStatus === "PENDING") return { applied: false, reason: "still_pending" };

  const existing = await Order.findOne({ orderId }).lean();
  if (!existing) return { applied: false, reason: "unknown_order" };

  const success = paytmStatus === "SUCCESS";

  // Never mark paid unless Paytm's amount matches what we asked for.
  if (success && round2(Number(amount)) !== existing.amount) {
    await logEvent("error", "failed", {
      stage: "amount_mismatch",
      source,
      orderId,
      expected: existing.amount,
      received: amount,
    });
    return { applied: false, reason: "amount_mismatch" };
  }

  const order = await Order.findOneAndUpdate(
    { orderId, status: "pending" },
    { status: success ? "paid" : "failed", paytmTxnId: txnId || "" },
    { new: true }
  ).lean();

  if (!order) return { applied: false, reason: "already_processed" };

  await Transaction.updateOne(
    { orderId, status: "pending" },
    { status: success ? "success" : "failed", paytmTxnId: txnId || "", gatewayResponse: raw }
  );

  const merchant = await Merchant.findById(order.merchantId).lean();
  if (merchant) {
    await enqueueCallback({ order, merchant, status: success ? "success" : "failed" });
  }

  return { applied: true, order };
};

/**
 * Polling safety net: for orders still pending after a few minutes (webhook lost/late),
 * ask Paytm directly. The status API response is signature-verified in paytm.service.
 */
export const reconcilePendingOrders = async () => {
  const now = Date.now();
  const orders = await Order.find({
    status: "pending",
    createdAt: { $lte: new Date(now - 5 * 60 * 1000), $gte: new Date(now - 24 * 60 * 60 * 1000) },
  })
    .limit(20)
    .lean();

  for (const o of orders) {
    try {
      const body = await fetchTransactionStatus(o.orderId);
      const rs = body?.resultInfo?.resultStatus;
      const paytmStatus = rs === "TXN_SUCCESS" ? "SUCCESS" : rs === "TXN_FAILURE" ? "FAILURE" : "PENDING";
      await applyPaymentResult({
        orderId: o.orderId,
        paytmStatus,
        txnId: body?.txnId,
        amount: body?.txnAmount,
        raw: body,
        source: "poller",
      });
    } catch (err) {
      await logEvent("error", "failed", { stage: "reconcile", orderId: o.orderId, message: err.message });
    }
  }
};

let timer = null;
export const startReconcileWorker = () => {
  if (timer) return;
  let running = false;
  timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await reconcilePendingOrders();
    } catch (err) {
      console.error("Reconcile worker error:", err.message);
    } finally {
      running = false;
    }
  }, 2 * 60 * 1000);
  timer.unref();
};
