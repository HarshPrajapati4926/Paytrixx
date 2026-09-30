import jwt from "jsonwebtoken";
import config from "../../config/env.js";
import Merchant from "../../models/Merchant.js";
import CallbackJob from "../../models/CallbackJob.js";
import { asyncHandler, HttpError } from "../../utils/asyncHandler.js";
import { sha256 } from "../../utils/crypto.js";
import {
  listOrders, listTransactions, parsePaging, updateMerchant, regenerateApiKey,
} from "./merchant.service.js";
import { getStats } from "./stats.service.js";

// Merchant-facing APIs. Everything is scoped to the authenticated merchant —
// a query-supplied merchantId is ignored.

const publicMerchant = (m) => ({
  id: m._id,
  name: m.name,
  email: m.email,
  callbackUrl: m.callbackUrl,
  apiKeyPreview: m.apiKeyPreview,
  hasApiKey: Boolean(m.apiKeyPreview),
  createdAt: m.createdAt,
});

// POST /api/merchant/login { apiKey } -> short-lived session token for the dashboard,
// so the raw API key never has to be stored in the browser.
export const login = asyncHandler(async (req, res) => {
  const apiKey = String(req.body?.apiKey || "").trim();
  if (!apiKey) throw new HttpError(400, "apiKey is required");

  const merchant = await Merchant.findOne({ apiKeyHash: sha256(apiKey) }).lean();
  if (!merchant) throw new HttpError(401, "Invalid API key");
  if (!merchant.isActive) throw new HttpError(403, "Merchant account is inactive");

  const token = jwt.sign({ sub: String(merchant._id), type: "merchant" }, config.jwtSecret, { expiresIn: "8h" });
  res.json({ success: true, token, merchant: publicMerchant(merchant) });
});

// GET /api/merchant/me
export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: publicMerchant(req.merchant) });
});

// GET /api/merchant/stats
export const stats = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getStats({ merchantId: req.merchant._id }) });
});

// GET /api/merchant/transactions
export const transactions = asyncHandler(async (req, res) => {
  const { merchantId: _ignored, ...query } = req.query;
  res.json({ success: true, ...(await listTransactions(query, { merchantId: req.merchant._id })) });
});

// GET /api/merchant/orders
export const orders = asyncHandler(async (req, res) => {
  const { merchantId: _ignored, ...query } = req.query;
  res.json({ success: true, ...(await listOrders(query, { merchantId: req.merchant._id })) });
});

// GET /api/merchant/callbacks — delivery status of callbacks Paytrixx sent to this merchant
export const callbacks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query);
  const filter = { merchantId: req.merchant._id };
  if (req.query.status) filter.status = String(req.query.status);

  const [data, total] = await Promise.all([
    CallbackJob.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    CallbackJob.countDocuments(filter),
  ]);
  res.json({ success: true, data, total, page, limit });
});

// PATCH /api/merchant/settings { callbackUrl }
export const updateSettings = asyncHandler(async (req, res) => {
  const updated = await updateMerchant(req.merchant._id, { callbackUrl: req.body?.callbackUrl ?? "" });
  res.json({ success: true, data: publicMerchant(updated) });
});

// POST /api/merchant/regenerate-key — old key stops working immediately; new one shown once
export const regenerateKey = asyncHandler(async (req, res) => {
  const { merchant, apiKey } = await regenerateApiKey(req.merchant._id);
  res.json({ success: true, data: publicMerchant(merchant), apiKey });
});

// GET /api/merchant/webhook-secret — needed to verify X-Paytrixx-Signature; session-only
export const webhookSecret = asyncHandler(async (req, res) => {
  const m = await Merchant.findById(req.merchant._id).select("+webhookSecret").lean();
  res.json({ success: true, webhookSecret: m.webhookSecret });
});
