const API = "https://api.yourdomain.com";

export const createOrderSamples = [
  {
    label: "Node.js",
    code: `// Node 18+ has fetch built in — no packages needed
const res = await fetch("${API}/api/payment/create", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.PAYTRIXX_API_KEY,
  },
  body: JSON.stringify({
    amount: 499.5,
    currency: "INR",
    customerDetails: { name: "Asha", email: "asha@example.com" },
    returnUrl: "https://yourshop.com/thank-you",
  }),
});

const { orderId, paymentUrl } = await res.json();
// Save orderId against your own order, then send the customer to paymentUrl
redirect(paymentUrl);`,
  },
  {
    label: "Python",
    code: `import os, requests

r = requests.post(
    "${API}/api/payment/create",
    headers={"x-api-key": os.environ["PAYTRIXX_API_KEY"]},
    json={
        "amount": 499.5,
        "currency": "INR",
        "customerDetails": {"name": "Asha", "email": "asha@example.com"},
        "returnUrl": "https://yourshop.com/thank-you",
    },
    timeout=15,
)
r.raise_for_status()
data = r.json()
# Save data["orderId"], then redirect the customer to data["paymentUrl"]`,
  },
  {
    label: "PHP",
    code: `<?php
$ch = curl_init("${API}/api/payment/create");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 15,
  CURLOPT_HTTPHEADER => [
    "Content-Type: application/json",
    "x-api-key: " . getenv("PAYTRIXX_API_KEY"),
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "amount" => 499.5,
    "currency" => "INR",
    "customerDetails" => ["name" => "Asha", "email" => "asha@example.com"],
    "returnUrl" => "https://yourshop.com/thank-you",
  ]),
]);
$data = json_decode(curl_exec($ch), true);
// Save $data["orderId"], then: header("Location: " . $data["paymentUrl"]);`,
  },
  {
    label: "cURL",
    code: `curl -X POST ${API}/api/payment/create \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: $PAYTRIXX_API_KEY" \\
  -d '{
    "amount": 499.5,
    "currency": "INR",
    "customerDetails": { "name": "Asha", "email": "asha@example.com" },
    "returnUrl": "https://yourshop.com/thank-you"
  }'`,
  },
];

export const verifySamples = [
  {
    label: "Node.js",
    code: `import crypto from "crypto";
import express from "express";

const app = express();

// IMPORTANT: verify against the RAW body, not re-serialised JSON.
app.post("/payment/callback", express.raw({ type: "application/json" }), (req, res) => {
  const expected = crypto
    .createHmac("sha256", process.env.PAYTRIXX_WEBHOOK_SECRET)
    .update(req.body) // Buffer of the raw body
    .digest("hex");

  const given = req.get("X-Paytrixx-Signature") || "";
  const ok =
    given.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return res.sendStatus(401);

  const { orderId, status, amount } = JSON.parse(req.body);
  // Be idempotent: the same callback can arrive more than once.
  // if (status === "success") markOrderPaid(orderId, amount);
  res.sendStatus(200);
});`,
  },
  {
    label: "Python",
    code: `import hmac, hashlib, os, json
from flask import Flask, request, abort

app = Flask(__name__)

@app.post("/payment/callback")
def callback():
    raw = request.get_data()  # raw bytes, not request.json
    expected = hmac.new(
        os.environ["PAYTRIXX_WEBHOOK_SECRET"].encode(), raw, hashlib.sha256
    ).hexdigest()
    given = request.headers.get("X-Paytrixx-Signature", "")
    if not hmac.compare_digest(given, expected):
        abort(401)

    data = json.loads(raw)
    # Be idempotent: the same callback can arrive more than once.
    # if data["status"] == "success": mark_order_paid(data["orderId"], data["amount"])
    return "", 200`,
  },
  {
    label: "PHP",
    code: `<?php
$raw = file_get_contents("php://input");
$expected = hash_hmac("sha256", $raw, getenv("PAYTRIXX_WEBHOOK_SECRET"));
$given = $_SERVER["HTTP_X_PAYTRIXX_SIGNATURE"] ?? "";

if (!hash_equals($expected, $given)) {
  http_response_code(401);
  exit;
}

$data = json_decode($raw, true);
// Be idempotent: the same callback can arrive more than once.
// if ($data["status"] === "success") markOrderPaid($data["orderId"], $data["amount"]);
http_response_code(200);`,
  },
];

export const callbackPayload = `{
  "orderId": "ORD_LXK2F9A1B2C3D4",
  "status": "success",
  "amount": 499.5
}`;

export const createResponse = `{
  "success": true,
  "orderId": "ORD_LXK2F9A1B2C3D4",
  "paymentUrl": "${API}/api/payment/checkout/ORD_LXK2F9A1B2C3D4",
  "status": "pending"
}`;

export const statusResponse = `{
  "success": true,
  "orderId": "ORD_LXK2F9A1B2C3D4",
  "status": "paid",
  "amount": 499.5,
  "currency": "INR",
  "paytmTxnId": "20260930111212800110168"
}`;
