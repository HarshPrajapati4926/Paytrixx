import Order from "../../models/Order.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { verifyCallbackSignature } from "../../services/paytm.service.js";
import { logEvent } from "../../services/logger.service.js";
import { applyPaymentResult } from "../payment/payment.service.js";

const toPaytmStatus = (s) => (s === "TXN_SUCCESS" ? "SUCCESS" : s === "TXN_FAILURE" ? "FAILURE" : "PENDING");

// POST /api/webhook/paytm
// Paytm posts the same signed form payload server-to-server (webhook) and via the
// customer's browser (callbackUrl). Both land here and go through the same idempotent path.
export const paytmWebhook = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  const orderId = payload.ORDERID;
  const wantsHtml = (req.headers.accept || "").includes("text/html");

  // 1. Verify signature — CRITICAL. Nothing below runs on an unverified payload.
  const valid = await verifyCallbackSignature(payload);
  if (!valid) {
    await logEvent("webhook", "failed", { reason: "invalid_signature", orderId, payload });
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  // 2-4. Idempotent state change + store Paytm txnId + enqueue merchant callback.
  const result = await applyPaymentResult({
    orderId,
    paytmStatus: toPaytmStatus(payload.STATUS),
    txnId: payload.TXNID,
    amount: payload.TXNAMOUNT,
    raw: payload,
    source: "webhook",
  });

  // 5. Log.
  await logEvent("webhook", "success", { orderId, status: payload.STATUS, result: result.reason || "applied", payload });

  // Browser redirect: send the customer back to the merchant if they gave a returnUrl.
  if (wantsHtml) {
    const order = await Order.findOne({ orderId }).lean();
    if (order?.returnUrl) {
      const url = new URL(order.returnUrl);
      url.searchParams.set("orderId", orderId);
      return res.redirect(303, url.toString());
    }
    return res.type("html").send("<h3>Payment received. You can close this window.</h3>");
  }

  // Always 200 for verified payloads (even duplicates) so Paytm doesn't keep retrying.
  res.json({ success: true });
});
