import { test, before, after } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.BASE_URL = "http://localhost:5000";
process.env.PAYTM_MERCHANT_ID = "TESTMID";
process.env.PAYTM_MERCHANT_KEY = "0123456789abcdef";

const { MongoMemoryServer } = await import("mongodb-memory-server");
const mongoose = (await import("mongoose")).default;
const { default: app } = await import("../app.js");
const { default: Admin } = await import("../models/Admin.js");
const { default: MerchantApplication } = await import("../models/MerchantApplication.js");
const { outbox } = await import("../services/mail.service.js");

let mongod, server, base, adminToken, applicantToken, appId, merchantToken, apiKey;
const realFetch = globalThis.fetch;

const call = (path, { method = "GET", headers = {}, body } = {}) =>
  realFetch(base + path, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
const bearer = (t) => ({ Authorization: `Bearer ${t}` });
const lastCode = () => outbox.filter((m) => /verification code/i.test(m.subject)).at(-1).text.match(/\b(\d{6})\b/)[1];

const ACCOUNT = { email: "Owner@Shop.in", phone: "98765 43210", password: "Str0ng!Pass", confirmPassword: "Str0ng!Pass" };

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Admin.create({ name: "T", email: "a@b.com", password: "secret123", role: "superadmin" });
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
  adminToken = (await (await call("/api/admin/login", { method: "POST", body: { email: "a@b.com", password: "secret123" } })).json()).token;
  // Paytm is not needed for onboarding, but the payment test below creates an order.
  globalThis.fetch = async (url, opts) =>
    String(url).includes("/initiateTransaction")
      ? new Response(JSON.stringify({ body: { resultInfo: { resultStatus: "S" }, txnToken: "TOK" } }))
      : realFetch(url, opts);
});

after(async () => {
  globalThis.fetch = realFetch;
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
});

test("register: weak password and bad phone are rejected with field errors", async () => {
  const r = await call("/api/auth/register", { method: "POST", body: { email: "x@y.com", phone: "123", password: "weak", confirmPassword: "weak" } });
  const j = await r.json();
  assert.equal(r.status, 400);
  assert.ok(j.fields.phone && j.fields.password);
});

test("register: a valid mobile starting with 91 is kept, +91 prefix is stripped", async () => {
  const mk = (email, phone) => call("/api/auth/register", { method: "POST", body: { email, phone, password: "Str0ng!Pass", confirmPassword: "Str0ng!Pass" } });
  const a = await (await mk("p1@shop.in", "9123456780")).json();
  assert.equal(a.application.phone, "9123456780");
  const b = await (await mk("p2@shop.in", "+91 98765 43210")).json();
  assert.equal(b.application.phone, "9876543210");
  const c = await (await mk("p3@shop.in", "919876543211")).json();
  assert.equal(c.application.phone, "9876543211");
});

test("register creates an applicant, sends an OTP, blocks steps until verified", async () => {
  const r = await call("/api/auth/register", { method: "POST", body: ACCOUNT });
  const j = await r.json();
  assert.equal(r.status, 201);
  assert.equal(j.role, "applicant");
  assert.equal(j.application.email, "owner@shop.in");
  assert.equal(j.application.phone, "9876543210");
  assert.ok(!JSON.stringify(j).includes("Str0ng"));
  applicantToken = j.token;
  appId = j.application.id;

  const step = await call("/api/onboarding/steps/business", { method: "PUT", headers: bearer(applicantToken), body: { name: "Shop", type: "LLP" } });
  assert.equal(step.status, 403);

  // Same email again -> 409
  assert.equal((await call("/api/auth/register", { method: "POST", body: ACCOUNT })).status, 409);
});

test("email verification: wrong code fails, right code works", async () => {
  const code = lastCode();
  const wrong = code === "000000" ? "111111" : "000000";
  assert.equal((await call("/api/auth/verify-email", { method: "POST", headers: bearer(applicantToken), body: { code: wrong } })).status, 400);
  const ok = await call("/api/auth/verify-email", { method: "POST", headers: bearer(applicantToken), body: { code } });
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).application.emailVerified, true);
});

test("steps validate input, and sensitive fields are encrypted and masked", async () => {
  const put = (step, body) => call(`/api/onboarding/steps/${step}`, { method: "PUT", headers: bearer(applicantToken), body });

  assert.equal((await put("business", { name: "Shop Pvt", type: "Nonsense" })).status, 400);
  assert.equal((await put("business", { name: "Shop Pvt", type: "Private limited", website: "https://shop.in" })).status, 200);
  assert.equal((await put("owners", { owners: [{ name: "Asha Rao", email: "asha@shop.in", phone: "9876543210", designation: "Director" }] })).status, 200);
  assert.equal((await put("address", { line1: "12 MG Road", city: "Pune", state: "Maharashtra", pincode: "12" })).status, 400);
  assert.equal((await put("address", { line1: "12 MG Road", city: "Pune", state: "Maharashtra", pincode: "411001" })).status, 200);
  assert.equal((await put("bank", { accountHolder: "Shop Pvt", bankName: "HDFC", ifsc: "bad", accountNumber: "123" })).status, 400);
  assert.equal((await put("bank", { accountHolder: "Shop Pvt", bankName: "HDFC", ifsc: "hdfc0001234", accountNumber: "50100123456789", confirmAccountNumber: "50100123456789" })).status, 200);

  // Submitting before every step is done is refused.
  assert.equal((await call("/api/onboarding/submit", { method: "POST", headers: bearer(applicantToken) })).status, 400);

  assert.equal((await put("documents", { pan: "ABCDE1234F", gst: "" })).status, 200);

  const me = await (await call("/api/onboarding/me", { headers: bearer(applicantToken) })).json();
  const text = JSON.stringify(me);
  assert.ok(!text.includes("50100123456789"), "full account number must not be returned to the applicant");
  assert.ok(!text.includes("ABCDE1234F"), "full PAN must not be returned to the applicant");
  assert.equal(me.application.bank.accountLast4, "6789");

  const raw = await MerchantApplication.findById(appId).select("+bank.accountNumberEnc").lean();
  assert.ok(raw.bank.accountNumberEnc && !raw.bank.accountNumberEnc.includes("50100123456789"), "stored encrypted");
});

test("submit -> locked for edits -> admin sees decrypted details", async () => {
  const s = await call("/api/onboarding/submit", { method: "POST", headers: bearer(applicantToken) });
  assert.equal(s.status, 200);
  assert.equal((await s.json()).application.status, "submitted");

  const locked = await call("/api/onboarding/steps/address", { method: "PUT", headers: bearer(applicantToken), body: { line1: "x", city: "y", state: "z", pincode: "411001" } });
  assert.equal(locked.status, 409);

  const list = await (await call("/api/admin/applications?status=submitted", { headers: bearer(adminToken) })).json();
  assert.equal(list.total, 1);
  assert.equal(list.data[0].businessName, "Shop Pvt");

  const detail = await (await call(`/api/admin/applications/${appId}`, { headers: bearer(adminToken) })).json();
  assert.equal(detail.data.bank.accountNumber, "50100123456789");
  assert.equal(detail.data.documents.pan, "ABCDE1234F");

  // Applicant token cannot reach admin routes.
  assert.equal((await call("/api/admin/applications", { headers: bearer(applicantToken) })).status, 401);
});

test("reject needs a reason, lets the applicant edit and resubmit", async () => {
  assert.equal((await call(`/api/admin/applications/${appId}/reject`, { method: "POST", headers: bearer(adminToken), body: { note: "" } })).status, 400);
  assert.equal((await call(`/api/admin/applications/${appId}/reject`, { method: "POST", headers: bearer(adminToken), body: { note: "PAN does not match business name" } })).status, 200);

  const login = await (await call("/api/auth/login", { method: "POST", body: { email: "owner@shop.in", password: "Str0ng!Pass" } })).json();
  assert.equal(login.role, "applicant");
  assert.equal(login.application.status, "rejected");
  assert.equal(login.application.reviewNote, "PAN does not match business name");
  applicantToken = login.token;

  const fix = await call("/api/onboarding/steps/documents", { method: "PUT", headers: bearer(applicantToken), body: { pan: "ABCPE1234F" } });
  assert.equal(fix.status, 200);
  assert.equal((await call("/api/onboarding/submit", { method: "POST", headers: bearer(applicantToken) })).status, 200);
});

test("approve creates a merchant who logs in with email/password, then generates a key", async () => {
  const a = await call(`/api/admin/applications/${appId}/approve`, { method: "POST", headers: bearer(adminToken) });
  assert.equal(a.status, 200);
  assert.equal((await call(`/api/admin/applications/${appId}/approve`, { method: "POST", headers: bearer(adminToken) })).status, 409);

  assert.equal((await call("/api/auth/login", { method: "POST", body: { email: "owner@shop.in", password: "wrong" } })).status, 401);
  const login = await (await call("/api/auth/login", { method: "POST", body: { email: "owner@shop.in", password: "Str0ng!Pass" } })).json();
  assert.equal(login.role, "merchant");
  assert.equal(login.merchant.hasApiKey, false);
  merchantToken = login.token;

  // Dashboard endpoints work for a merchant that has no API key yet.
  assert.equal((await call("/api/merchant/stats", { headers: bearer(merchantToken) })).status, 200);
  const secret = await (await call("/api/merchant/webhook-secret", { headers: bearer(merchantToken) })).json();
  assert.match(secret.webhookSecret, /^whsec_/);

  const gen = await (await call("/api/merchant/regenerate-key", { method: "POST", headers: bearer(merchantToken) })).json();
  assert.match(gen.apiKey, /^pk_live_/);
  apiKey = gen.apiKey;
});

test("Idempotency-Key: a retry returns the same order; different params are rejected", async () => {
  const create = (body, key) =>
    call("/api/payment/create", { method: "POST", headers: { "x-api-key": apiKey, ...(key ? { "Idempotency-Key": key } : {}) }, body });

  const first = await create({ amount: 250 }, "cart-991");
  const a = await first.json();
  assert.equal(first.status, 201);

  const retry = await create({ amount: 250 }, "cart-991");
  const b = await retry.json();
  assert.equal(retry.status, 200);
  assert.equal(b.orderId, a.orderId);

  assert.equal((await create({ amount: 999 }, "cart-991")).status, 422);
  assert.equal((await create({ amount: 250 }, "bad key!")).status, 400);

  // Without a key every call is a fresh order.
  const x = await (await create({ amount: 250 })).json();
  const y = await (await create({ amount: 250 })).json();
  assert.notEqual(x.orderId, y.orderId);

  // Concurrent requests with one key collapse to a single order.
  const results = await Promise.all([1, 2, 3].map(() => create({ amount: 75 }, "race-1")));
  const ids = new Set((await Promise.all(results.map((r) => r.json()))).map((j) => j.orderId));
  assert.equal(ids.size, 1);
});

test("contact form: validates, stores, honeypot is silently accepted, admin can list", async () => {
  const bad = await call("/api/contact", { method: "POST", body: { topic: "Nope", name: "A", email: "x", subject: "", message: "short" } });
  assert.equal(bad.status, 400);
  assert.ok((await bad.json()).fields.message);

  const good = { topic: "API and integration", name: "Ravi", email: "ravi@shop.in", subject: "Callback question", message: "How do I verify the signature on callbacks?" };
  assert.equal((await call("/api/contact", { method: "POST", body: good })).status, 201);

  // Bots fill the hidden field; they get a fake success and nothing is stored.
  assert.equal((await call("/api/contact", { method: "POST", body: { ...good, website: "http://spam" } })).status, 201);

  const list = await (await call("/api/admin/contact-messages", { headers: bearer(adminToken) })).json();
  assert.equal(list.total, 1);
  assert.equal((await call("/api/admin/contact-messages")).status, 401);
});
