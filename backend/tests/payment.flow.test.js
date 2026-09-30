import { test, before, after } from "node:test";
import assert from "node:assert/strict";

// Env must be set before config/env.js is imported.
process.env.JWT_SECRET = "test-secret";
process.env.BASE_URL = "http://localhost:5000";
process.env.PAYTM_MERCHANT_ID = "TESTMID";
process.env.PAYTM_MERCHANT_KEY = "0123456789abcdef"; // 16 chars, valid AES key
process.env.PAYTM_WEBSITE = "WEBSTAGING";

const { MongoMemoryServer } = await import("mongodb-memory-server");
const mongoose = (await import("mongoose")).default;
const PaytmChecksum = (await import("paytmchecksum")).default;
const { default: app } = await import("../app.js");
const { default: Admin } = await import("../models/Admin.js");
const { default: Order } = await import("../models/Order.js");
const { default: Transaction } = await import("../models/Transaction.js");
const { default: CallbackJob } = await import("../models/CallbackJob.js");

let mongod, server, base, apiKey, adminToken;
const realFetch = globalThis.fetch;

// Stub only Paytm's initiateTransaction; everything else (incl. our own server) is real.
const stubPaytm = () => {
  globalThis.fetch = async (url, opts) => {
    if (String(url).includes("/theia/api/v1/initiateTransaction")) {
      return new Response(JSON.stringify({ body: { resultInfo: { resultStatus: "S" }, txnToken: "TOKEN123" } }));
    }
    return realFetch(url, opts);
  };
};

const call = (path, { method = "GET", headers = {}, body, form } = {}) =>
  realFetch(base + path, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...headers,
    },
    body: form ? new URLSearchParams(form).toString() : body ? JSON.stringify(body) : undefined,
  });

const signedWebhook = async (fields) => {
  const sig = await PaytmChecksum.generateSignature(fields, process.env.PAYTM_MERCHANT_KEY);
  return { ...fields, CHECKSUMHASH: sig };
};

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Admin.create({ name: "T", email: "a@b.com", password: "secret123", role: "superadmin" });
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
  stubPaytm();
});

after(async () => {
  globalThis.fetch = realFetch;
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
});

test("admin login: wrong password rejected, correct one returns JWT", async () => {
  let r = await call("/api/admin/login", { method: "POST", body: { email: "a@b.com", password: "nope" } });
  assert.equal(r.status, 401);
  r = await call("/api/admin/login", { method: "POST", body: { email: "a@b.com", password: "secret123" } });
  const j = await r.json();
  assert.equal(r.status, 200);
  assert.ok(j.token);
  adminToken = j.token;
});

test("admin routes need a token", async () => {
  assert.equal((await call("/api/admin/merchants")).status, 401);
});

test("admin creates merchant; raw key returned once, not in list", async () => {
  const r = await call("/api/admin/merchants", {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { name: "Shop", callbackUrl: "http://127.0.0.1:9/cb" },
  });
  const j = await r.json();
  assert.equal(r.status, 201);
  assert.match(j.apiKey, /^pk_live_/);
  apiKey = j.apiKey;

  const list = await (await call("/api/admin/merchants", { headers: { Authorization: `Bearer ${adminToken}` } })).json();
  const text = JSON.stringify(list);
  assert.ok(!text.includes(apiKey));
  assert.ok(!text.includes("apiKeyHash"));
  assert.ok(!text.includes("webhookSecret"));
});

test("payment create: invalid key rejected", async () => {
  const r = await call("/api/payment/create", { method: "POST", headers: { "x-api-key": "bad" }, body: { amount: 100 } });
  assert.equal(r.status, 401);
});

test("full flow: create -> signed webhook -> paid; duplicate is a no-op", async () => {
  const r = await call("/api/payment/create", {
    method: "POST",
    headers: { "x-api-key": apiKey },
    body: { amount: 499.5, customerDetails: { email: "c@x.com" } },
  });
  const created = await r.json();
  assert.equal(r.status, 201);
  assert.equal(created.status, "pending");
  assert.match(created.paymentUrl, /\/api\/payment\/checkout\/ORD_/);

  // Must NOT be paid before the webhook.
  let st = await (await call(`/api/payment/status/${created.orderId}`, { headers: { "x-api-key": apiKey } })).json();
  assert.equal(st.status, "pending");

  // Checkout page posts to Paytm with the token.
  const page = await (await call(`/api/payment/checkout/${created.orderId}`)).text();
  assert.match(page, /TOKEN123/);

  // Unsigned / tampered webhook rejected, order untouched.
  let bad = await call("/api/webhook/paytm", {
    method: "POST",
    form: { ORDERID: created.orderId, STATUS: "TXN_SUCCESS", TXNID: "T1", TXNAMOUNT: "499.50", CHECKSUMHASH: "forged" },
  });
  assert.equal(bad.status, 400);
  assert.equal((await Order.findOne({ orderId: created.orderId })).status, "pending");

  // Valid webhook.
  const fields = { ORDERID: created.orderId, STATUS: "TXN_SUCCESS", TXNID: "PTM-777", TXNAMOUNT: "499.50", RESPCODE: "01" };
  const good = await call("/api/webhook/paytm", { method: "POST", form: await signedWebhook(fields) });
  assert.equal(good.status, 200);

  const order = await Order.findOne({ orderId: created.orderId });
  assert.equal(order.status, "paid");
  assert.equal(order.paytmTxnId, "PTM-777");
  assert.equal((await Transaction.findOne({ orderId: created.orderId })).status, "success");

  // Duplicate webhook: 200, still exactly one callback job.
  const dup = await call("/api/webhook/paytm", { method: "POST", form: await signedWebhook(fields) });
  assert.equal(dup.status, 200);
  assert.equal(await CallbackJob.countDocuments({ orderId: created.orderId }), 1);

  // A later "failure" for an already-paid order must not flip it.
  const late = { ...fields, STATUS: "TXN_FAILURE" };
  await call("/api/webhook/paytm", { method: "POST", form: await signedWebhook(late) });
  assert.equal((await Order.findOne({ orderId: created.orderId })).status, "paid");
});

test("webhook with mismatched amount does not mark the order paid", async () => {
  const created = await (
    await call("/api/payment/create", { method: "POST", headers: { "x-api-key": apiKey }, body: { amount: 1000 } })
  ).json();
  const fields = { ORDERID: created.orderId, STATUS: "TXN_SUCCESS", TXNID: "PTM-1", TXNAMOUNT: "1.00" };
  await call("/api/webhook/paytm", { method: "POST", form: await signedWebhook(fields) });
  assert.equal((await Order.findOne({ orderId: created.orderId })).status, "pending");
});

test("merchant can only see their own orders; stats endpoint works", async () => {
  const mine = await (await call("/api/merchant/orders", { headers: { "x-api-key": apiKey } })).json();
  assert.ok(mine.total >= 2);

  const s = await (await call("/api/admin/stats", { headers: { Authorization: `Bearer ${adminToken}` } })).json();
  assert.equal(s.data.totals.merchants, 1);
  assert.equal(s.data.byStatus.success, 1);
  assert.equal(s.data.daily.length, 14);

  const h = await (await call("/api/admin/system-health", { headers: { Authorization: `Bearer ${adminToken}` } })).json();
  assert.equal(h.data.db.status, "connected");
});

test("merchant dashboard: login with API key, scoped stats, session token works", async () => {
  let r = await call("/api/merchant/login", { method: "POST", body: { apiKey: "pk_live_wrong" } });
  assert.equal(r.status, 401);

  r = await call("/api/merchant/login", { method: "POST", body: { apiKey } });
  const j = await r.json();
  assert.equal(r.status, 200);
  assert.ok(j.token);
  assert.ok(!JSON.stringify(j).includes(apiKey));
  const auth = { Authorization: `Bearer ${j.token}` };

  const st = await (await call("/api/merchant/stats", { headers: auth })).json();
  assert.equal(st.data.totals.successAmount, 499.5);
  assert.equal(st.data.daily.length, 14);

  const cbs = await (await call("/api/merchant/callbacks", { headers: auth })).json();
  assert.equal(cbs.total, 1);

  // An admin token must not work as a merchant session.
  assert.equal((await call("/api/merchant/me", { headers: { Authorization: `Bearer ${adminToken}` } })).status, 401);
  // Payment API must still require the API key, not a session token.
  assert.equal((await call("/api/payment/create", { method: "POST", headers: auth, body: { amount: 10 } })).status, 401);
});

test("merchant regenerates key: old key dies, new key works", async () => {
  const login = await (await call("/api/merchant/login", { method: "POST", body: { apiKey } })).json();
  const auth = { Authorization: `Bearer ${login.token}` };

  const r = await (await call("/api/merchant/regenerate-key", { method: "POST", headers: auth })).json();
  assert.match(r.apiKey, /^pk_live_/);
  assert.notEqual(r.apiKey, apiKey);

  assert.equal((await call("/api/merchant/orders", { headers: { "x-api-key": apiKey } })).status, 401);
  assert.equal((await call("/api/merchant/orders", { headers: { "x-api-key": r.apiKey } })).status, 200);
  apiKey = r.apiKey;
});
