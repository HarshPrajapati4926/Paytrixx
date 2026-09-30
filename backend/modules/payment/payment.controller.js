import Order from "../../models/Order.js";
import config from "../../config/env.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createPayment, getPaymentStatus } from "./payment.service.js";

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// POST /api/payment/create   (x-api-key)
export const create = asyncHandler(async (req, res) => {
  const { amount, currency, customerDetails, returnUrl } = req.body || {};
  const idempotencyKey = req.get("idempotency-key") || undefined;
  const { replayed, ...data } = await createPayment(req.merchant, { amount, currency, customerDetails, returnUrl, idempotencyKey });
  // 201 for a new order, 200 when an earlier request with the same Idempotency-Key is replayed.
  res.status(replayed ? 200 : 201).json({ success: true, ...data });
});

// GET /api/payment/status/:orderId   (x-api-key)
export const status = asyncHandler(async (req, res) => {
  const data = await getPaymentStatus(req.merchant._id, req.params.orderId);
  res.json({ success: true, ...data });
});

// GET /api/payment/checkout/:orderId  (public; the orderId is unguessable)
// Paytm's payment page must be opened with a POST carrying the txnToken, so the
// paymentUrl we hand out is this tiny page that auto-submits that form.
export const checkout = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId }).select("+paytmTxnToken").lean();
  res.set("Cache-Control", "no-store");

  if (!order || order.status !== "pending" || !order.paytmTxnToken) {
    return res
      .status(order ? 409 : 404)
      .type("html")
      .send("<h3>This payment link is no longer valid.</h3>");
  }

  const action = `${config.paytm.host}/theia/api/v1/showPaymentPage?mid=${encodeURIComponent(
    config.paytm.mid
  )}&orderId=${encodeURIComponent(order.orderId)}`;

  res.type("html").send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Redirecting to Paytm…</title></head>
<body onload="document.getElementById('f').submit()">
<p>Redirecting to Paytm…</p>
<form id="f" method="post" action="${esc(action)}">
  <input type="hidden" name="mid" value="${esc(config.paytm.mid)}">
  <input type="hidden" name="orderId" value="${esc(order.orderId)}">
  <input type="hidden" name="txnToken" value="${esc(order.paytmTxnToken)}">
  <noscript><button type="submit">Continue to Paytm</button></noscript>
</form></body></html>`);
});
