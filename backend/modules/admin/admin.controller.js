import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import config, { paytmConfigured } from "../../config/env.js";
import Admin from "../../models/Admin.js";
import Merchant from "../../models/Merchant.js";
import Order from "../../models/Order.js";
import Log from "../../models/Log.js";
import CallbackJob from "../../models/CallbackJob.js";
import { asyncHandler, HttpError } from "../../utils/asyncHandler.js";
import {
  createMerchant, updateMerchant, regenerateApiKey, listMerchants,
  listOrders, listTransactions, parsePaging, escapeRegex,
} from "../merchant/merchant.service.js";
import { getStats } from "../merchant/stats.service.js";
import MerchantApplication from "../../models/MerchantApplication.js";
import ContactMessage from "../../models/ContactMessage.js";
import * as onboarding from "../onboarding/onboarding.service.js";

const signToken = (admin) =>
  jwt.sign({ id: admin._id, email: admin.email, role: admin.role }, config.jwtSecret, { expiresIn: "1d" });

const publicAdmin = (a) => ({ id: a._id, name: a.name, email: a.email, role: a.role });

/* ── Auth ─────────────────────────────────────────────────────────────── */

// POST /api/admin/login
export const login = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || "").toLowerCase().trim();
  const password = String(req.body?.password || "");
  if (!email || !password) throw new HttpError(400, "Email and password are required");

  const admin = await Admin.findOne({ email }).select("+password");
  // Same message for unknown email and wrong password — don't reveal which admins exist.
  if (!admin || !(await admin.comparePassword(password))) {
    throw new HttpError(401, "Invalid credentials");
  }
  if (admin.status !== "active") throw new HttpError(403, "Account inactive");

  res.json({ success: true, token: signToken(admin), admin: publicAdmin(admin) });
});

// POST /api/admin/refresh-token
export const refreshToken = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin.id);
  if (!admin) throw new HttpError(401, "Admin not found");
  res.json({ success: true, token: signToken(admin) });
});

// GET /api/admin/me
export const me = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin.id);
  if (!admin) throw new HttpError(404, "Admin not found");
  res.json({ success: true, data: publicAdmin(admin) });
});

// PUT /api/admin/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) throw new HttpError(400, "Both passwords are required");
  if (String(newPassword).length < 6) throw new HttpError(400, "New password must be at least 6 characters");

  const admin = await Admin.findById(req.admin.id).select("+password");
  if (!admin || !(await admin.comparePassword(String(currentPassword)))) {
    throw new HttpError(400, "Current password is incorrect");
  }
  admin.password = String(newPassword);
  await admin.save();
  res.json({ success: true, message: "Password changed. Please log in again." });
});

/* ── Merchants ────────────────────────────────────────────────────────── */

// GET /api/admin/merchants
export const merchants = asyncHandler(async (req, res) => {
  res.json({ success: true, ...(await listMerchants(req.query)) });
});

// POST /api/admin/merchants  ->  raw apiKey + webhookSecret returned once
export const addMerchant = asyncHandler(async (req, res) => {
  const { merchant, apiKey, webhookSecret } = await createMerchant(req.body || {});
  res.status(201).json({ success: true, data: merchant, apiKey, webhookSecret });
});

// PATCH /api/admin/merchants/:id
export const patchMerchant = asyncHandler(async (req, res) => {
  const data = await updateMerchant(req.params.id, req.body || {});
  res.json({ success: true, data });
});

// POST /api/admin/merchants/:id/regenerate-key
export const regenerateKey = asyncHandler(async (req, res) => {
  const { merchant, apiKey } = await regenerateApiKey(req.params.id);
  res.json({ success: true, data: merchant, apiKey });
});

/* ── Payments ─────────────────────────────────────────────────────────── */

// GET /api/admin/transactions
export const transactions = asyncHandler(async (req, res) => {
  res.json({ success: true, ...(await listTransactions(req.query)) });
});

// GET /api/admin/orders
export const orders = asyncHandler(async (req, res) => {
  res.json({ success: true, ...(await listOrders(req.query)) });
});

/* ── Logs ─────────────────────────────────────────────────────────────── */

// GET /api/admin/logs?type=webhook|error|api|callback&status=
export const logs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query);
  const filter = {};
  if (req.query.type) filter.type = String(req.query.type);
  if (req.query.status) filter.status = String(req.query.status);

  const [data, total] = await Promise.all([
    Log.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    Log.countDocuments(filter),
  ]);
  res.json({ success: true, data, total, page, limit });
});

/* ── Dashboard stats ──────────────────────────────────────────────────── */

// GET /api/admin/stats
export const stats = asyncHandler(async (req, res) => {
  const [merchantCount, activeMerchants, data] = await Promise.all([
    Merchant.countDocuments(),
    Merchant.countDocuments({ isActive: true }),
    getStats(),
  ]);
  data.totals.merchants = merchantCount;
  data.totals.activeMerchants = activeMerchants;
  res.json({ success: true, data });
});

/* ── System health ────────────────────────────────────────────────────── */

// GET /api/admin/system-health
export const systemHealth = asyncHandler(async (req, res) => {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [webhooks24, webhooksFailed24, cbPending, cbFailed] = await Promise.all([
    Log.countDocuments({ type: "webhook", timestamp: { $gte: dayAgo } }),
    Log.countDocuments({ type: "webhook", status: "failed", timestamp: { $gte: dayAgo } }),
    CallbackJob.countDocuments({ status: "pending" }),
    CallbackJob.countDocuments({ status: "failed" }),
  ]);

  res.json({
    success: true,
    data: {
      uptimeSec: Math.floor(process.uptime()),
      db: { status: mongoose.connection.readyState === 1 ? "connected" : "disconnected" },
      paytm: { configured: paytmConfigured() },
      webhooks: { last24h: webhooks24, failed24h: webhooksFailed24 },
      callbacks: { pending: cbPending, failed: cbFailed },
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      nodeVersion: process.version,
    },
  });
});

/* ── Merchant applications (self-registration review) ─────────────────── */

// GET /api/admin/applications?status=submitted
export const applications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query);
  const filter = {};
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), "i");
    filter.$or = [{ email: rx }, { "business.name": rx }];
  }
  const [rows, total] = await Promise.all([
    MerchantApplication.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    MerchantApplication.countDocuments(filter),
  ]);
  const data = rows.map((a) => ({
    _id: a._id,
    email: a.email,
    phone: a.phone,
    emailVerified: a.emailVerified,
    status: a.status,
    businessName: a.business?.name || "",
    businessType: a.business?.type || "",
    submittedAt: a.submittedAt,
    createdAt: a.createdAt,
  }));
  res.json({ success: true, data, total, page, limit });
});

// GET /api/admin/applications/:id  — full details (decrypted KYC) for review
export const applicationDetail = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await onboarding.adminView(req.params.id) });
});

// POST /api/admin/applications/:id/approve
export const approveApplication = asyncHandler(async (req, res) => {
  const app = await onboarding.approve(req.params.id);
  res.json({ success: true, data: { id: app._id, status: app.status, merchantId: app.merchantId } });
});

// POST /api/admin/applications/:id/reject { note }
export const rejectApplication = asyncHandler(async (req, res) => {
  const app = await onboarding.reject(req.params.id, req.body?.note);
  res.json({ success: true, data: { id: app._id, status: app.status } });
});

/* ── Contact messages ─────────────────────────────────────────────────── */

// GET /api/admin/contact-messages?status=new
export const contactMessages = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query);
  const filter = req.query.status ? { status: String(req.query.status) } : {};
  const [data, total] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ContactMessage.countDocuments(filter),
  ]);
  res.json({ success: true, data, total, page, limit });
});

// PATCH /api/admin/contact-messages/:id { status }
export const updateContactMessage = asyncHandler(async (req, res) => {
  const status = req.body?.status;
  if (!["new", "resolved"].includes(status)) throw new HttpError(400, "status must be new or resolved");
  const doc = await ContactMessage.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean();
  if (!doc) throw new HttpError(404, "Message not found");
  res.json({ success: true, data: doc });
});
