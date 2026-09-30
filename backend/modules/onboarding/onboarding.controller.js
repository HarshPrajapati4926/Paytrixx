import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import config from "../../config/env.js";
import Merchant from "../../models/Merchant.js";
import MerchantApplication from "../../models/MerchantApplication.js";
import { asyncHandler, HttpError } from "../../utils/asyncHandler.js";
import * as svc from "./onboarding.service.js";

const sign = (sub, type, expiresIn) => jwt.sign({ sub: String(sub), type }, config.jwtSecret, { expiresIn });
const applicantToken = (app) => sign(app._id, "applicant", "7d");

const merchantProfile = (m) => ({
  id: m._id,
  name: m.name,
  email: m.email,
  callbackUrl: m.callbackUrl,
  apiKeyPreview: m.apiKeyPreview,
  hasApiKey: Boolean(m.apiKeyPreview),
  createdAt: m.createdAt,
});

// POST /api/auth/register { email, phone, password, confirmPassword }
export const register = asyncHandler(async (req, res) => {
  const app = await svc.register(req.body || {});
  res.status(201).json({
    success: true,
    token: applicantToken(app),
    role: "applicant",
    application: svc.applicantView(app),
  });
});

// POST /api/auth/login { email, password } -> merchant (approved) or applicant (mid-registration)
export const login = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || "").toLowerCase().trim();
  const password = String(req.body?.password || "");
  if (!email || !password) throw new HttpError(400, "Email and password are required");

  // Same message whether the email exists or not.
  const invalid = new HttpError(401, "Incorrect email or password");

  const merchant = await Merchant.findOne({ email }).select("+passwordHash").lean();
  if (merchant) {
    if (!merchant.passwordHash || !(await bcrypt.compare(password, merchant.passwordHash))) throw invalid;
    if (!merchant.isActive) throw new HttpError(403, "This merchant account is inactive");
    return res.json({
      success: true,
      role: "merchant",
      token: sign(merchant._id, "merchant", "8h"),
      merchant: merchantProfile(merchant),
    });
  }

  const app = await MerchantApplication.findOne({ email }).select("+passwordHash");
  if (!app || !(await bcrypt.compare(password, app.passwordHash))) throw invalid;
  res.json({ success: true, role: "applicant", token: applicantToken(app), application: svc.applicantView(app) });
});

// POST /api/auth/verify-email { code }   (applicant session)
export const verifyEmail = asyncHandler(async (req, res) => {
  const app = await svc.verifyEmail(req.applicantId, req.body?.code);
  res.json({ success: true, application: svc.applicantView(app) });
});

// POST /api/auth/resend-code   (applicant session)
export const resendCode = asyncHandler(async (req, res) => {
  await svc.resendCode(req.applicantId);
  res.json({ success: true, message: "A new code is on its way" });
});

// GET /api/onboarding/me
export const me = asyncHandler(async (req, res) => {
  const app = await MerchantApplication.findById(req.applicantId).lean();
  if (!app) throw new HttpError(404, "Application not found");
  res.json({ success: true, application: svc.applicantView(app), businessTypes: svc.BUSINESS_TYPES });
});

// PUT /api/onboarding/steps/:step
export const saveStep = asyncHandler(async (req, res) => {
  const app = await svc.saveStep(req.applicantId, req.params.step, req.body);
  res.json({ success: true, application: svc.applicantView(app) });
});

// POST /api/onboarding/submit
export const submit = asyncHandler(async (req, res) => {
  const app = await svc.submit(req.applicantId);
  res.json({ success: true, application: svc.applicantView(app) });
});
