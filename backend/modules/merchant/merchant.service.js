import Merchant from "../../models/Merchant.js";
import Order from "../../models/Order.js";
import Transaction from "../../models/Transaction.js";
import { HttpError } from "../../utils/asyncHandler.js";
import { generateApiKey, generateWebhookSecret } from "../../utils/crypto.js";

const isHttpUrl = (u) => /^https?:\/\/\S+$/i.test(u);

export const parsePaging = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Shared filter builder for orders/transactions lists (admin + merchant). */
export const buildPaymentFilter = (query, base = {}) => {
  const filter = {};
  if (query.status) filter.status = String(query.status);
  if (query.merchantId) filter.merchantId = String(query.merchantId);
  if (query.search) {
    const rx = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [{ orderId: rx }, { paytmTxnId: rx }, ...(query.txn ? [{ transactionId: rx }] : [])];
  }
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(`${query.from}T00:00:00.000Z`);
    if (query.to) filter.createdAt.$lte = new Date(`${query.to}T23:59:59.999Z`);
  }
  // Applied last so a caller-supplied query can never widen the scope (e.g. merchantId).
  return { ...filter, ...base };
};

export const listPayments = async (Model, query, base = {}) => {
  const { page, limit, skip } = parsePaging(query);
  const filter = buildPaymentFilter({ ...query, txn: Model === Transaction }, base);
  const [data, total] = await Promise.all([
    Model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("merchantId", "name").lean(),
    Model.countDocuments(filter),
  ]);
  return { data, total, page, limit };
};

export const listOrders = (query, base) => listPayments(Order, query, base);
export const listTransactions = (query, base) => listPayments(Transaction, query, base);

export const createMerchant = async ({ name, callbackUrl = "" }) => {
  if (!name?.trim()) throw new HttpError(400, "name is required");
  if (callbackUrl && !isHttpUrl(callbackUrl)) throw new HttpError(400, "callbackUrl must be an http(s) URL");

  const { apiKey, apiKeyHash, apiKeyPreview } = generateApiKey();
  const webhookSecret = generateWebhookSecret();
  const merchant = await Merchant.create({
    name: name.trim(),
    callbackUrl,
    apiKeyHash,
    apiKeyPreview,
    webhookSecret,
  });
  // Raw secrets are returned exactly once, here.
  return { merchant: merchant.toObject({ versionKey: false, transform: stripSecrets }), apiKey, webhookSecret };
};

function stripSecrets(_doc, ret) {
  delete ret.apiKeyHash;
  delete ret.webhookSecret;
  return ret;
}

export const updateMerchant = async (id, { name, callbackUrl, isActive }) => {
  const update = {};
  if (name !== undefined) {
    if (!String(name).trim()) throw new HttpError(400, "name cannot be empty");
    update.name = String(name).trim();
  }
  if (callbackUrl !== undefined) {
    if (callbackUrl && !isHttpUrl(callbackUrl)) throw new HttpError(400, "callbackUrl must be an http(s) URL");
    update.callbackUrl = callbackUrl;
  }
  if (isActive !== undefined) update.isActive = Boolean(isActive);

  const merchant = await Merchant.findByIdAndUpdate(id, update, { new: true }).lean();
  if (!merchant) throw new HttpError(404, "Merchant not found");
  return merchant;
};

export const regenerateApiKey = async (id) => {
  const { apiKey, apiKeyHash, apiKeyPreview } = generateApiKey();
  const merchant = await Merchant.findByIdAndUpdate(id, { apiKeyHash, apiKeyPreview }, { new: true }).lean();
  if (!merchant) throw new HttpError(404, "Merchant not found");
  return { merchant, apiKey };
};

export const listMerchants = async (query) => {
  const { page, limit, skip } = parsePaging(query);
  const filter = query.search ? { name: new RegExp(escapeRegex(query.search), "i") } : {};
  const [data, total] = await Promise.all([
    Merchant.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Merchant.countDocuments(filter),
  ]);
  return { data, total, page, limit };
};
