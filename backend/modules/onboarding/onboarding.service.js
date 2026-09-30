import crypto from "crypto";
import bcrypt from "bcryptjs";
import Merchant from "../../models/Merchant.js";
import MerchantApplication from "../../models/MerchantApplication.js";
import { HttpError } from "../../utils/asyncHandler.js";
import { sha256, generateWebhookSecret } from "../../utils/crypto.js";
import { encrypt, decrypt, last4 } from "../../utils/secretBox.js";
import { sendMail } from "../../services/mail.service.js";

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

export const STEPS = ["business", "owners", "address", "bank", "documents"];
export const BUSINESS_TYPES = ["Sole proprietorship", "Partnership", "LLP", "Private limited", "Public limited", "Trust / NGO", "Other"];

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RX = /^[6-9]\d{9}$/;
const PASSWORD_RX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;
const PIN_RX = /^[1-9]\d{5}$/;
const IFSC_RX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_RX = /^\d{9,18}$/;
const PAN_RX = /^[A-Z]{5}\d{4}[A-Z]$/;
const GST_RX = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/;

export const PASSWORD_HINT = "At least 8 characters, with an uppercase letter, a lowercase letter, a digit and a symbol.";

const str = (v) => (typeof v === "string" ? v.trim() : "");

// Accepts "98765 43210", "+91 98765 43210" or "919876543210". A bare 10-digit number that
// merely starts with 91 (e.g. 9123456780) is a valid mobile number and must not be stripped.
const normalizePhone = (v) => {
  const compact = str(v).replace(/[\s-]/g, "");
  if (compact.startsWith("+91")) return compact.slice(3);
  if (/^91\d{10}$/.test(compact)) return compact.slice(2);
  return compact;
};
const fail = (fields, message = "Please fix the highlighted fields") => {
  throw new HttpError(400, message, fields);
};

/* ── Account ──────────────────────────────────────────────────────────── */

const newOtp = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");

const issueOtp = async (app) => {
  const otp = newOtp();
  app.otpHash = sha256(`${app._id}:${otp}`);
  app.otpExpires = new Date(Date.now() + OTP_TTL_MS);
  app.otpAttempts = 0;
  app.otpSentAt = new Date();
  await app.save();
  await sendMail({
    to: app.email,
    subject: "Your Paytrixx verification code",
    text: `Your Paytrixx verification code is ${otp}. It expires in 10 minutes.\n\nIf you didn't create a Paytrixx account, you can ignore this email.`,
  });
};

export const register = async ({ email, phone, password, confirmPassword }) => {
  const e = str(email).toLowerCase();
  const p = normalizePhone(phone);
  const errors = {};
  if (!EMAIL_RX.test(e)) errors.email = "Enter a valid work email";
  if (!PHONE_RX.test(p)) errors.phone = "Enter a valid 10-digit Indian mobile number";
  if (typeof password !== "string" || !PASSWORD_RX.test(password)) errors.password = PASSWORD_HINT;
  else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";
  if (Object.keys(errors).length) fail(errors);

  const [existingApp, existingMerchant] = await Promise.all([
    MerchantApplication.findOne({ email: e }).lean(),
    Merchant.findOne({ email: e }).lean(),
  ]);
  if (existingApp || existingMerchant) {
    throw new HttpError(409, "An account with this email already exists. Sign in to continue.", {
      email: "Already registered — sign in instead",
    });
  }

  const app = new MerchantApplication({
    email: e,
    phone: p,
    passwordHash: await bcrypt.hash(password, 10),
  });
  await app.save();
  await issueOtp(app);
  return app;
};

export const verifyEmail = async (appId, code) => {
  const app = await MerchantApplication.findById(appId).select("+otpHash +otpExpires +otpAttempts");
  if (!app) throw new HttpError(404, "Application not found");
  if (app.emailVerified) return app;

  if (!app.otpHash || !app.otpExpires || app.otpExpires < new Date()) {
    throw new HttpError(400, "That code has expired. Request a new one.");
  }
  if (app.otpAttempts >= OTP_MAX_ATTEMPTS) {
    throw new HttpError(429, "Too many wrong attempts. Request a new code.");
  }

  const expected = Buffer.from(app.otpHash);
  const given = Buffer.from(sha256(`${app._id}:${str(code)}`));
  const ok = expected.length === given.length && crypto.timingSafeEqual(expected, given);
  if (!ok) {
    app.otpAttempts += 1;
    await app.save();
    throw new HttpError(400, "That code is incorrect.");
  }

  app.emailVerified = true;
  app.otpHash = undefined;
  app.otpExpires = undefined;
  await app.save();
  return app;
};

export const resendCode = async (appId) => {
  const app = await MerchantApplication.findById(appId).select("+otpSentAt");
  if (!app) throw new HttpError(404, "Application not found");
  if (app.emailVerified) throw new HttpError(400, "Email is already verified");
  const wait = app.otpSentAt ? OTP_RESEND_MS - (Date.now() - app.otpSentAt.getTime()) : 0;
  if (wait > 0) throw new HttpError(429, `Please wait ${Math.ceil(wait / 1000)}s before requesting another code.`);
  await issueOtp(app);
};

/* ── Step validation ──────────────────────────────────────────────────── */

const validators = {
  business(d) {
    const errors = {};
    const out = {
      name: str(d.name),
      type: str(d.type),
      website: str(d.website),
      description: str(d.description),
    };
    if (out.name.length < 2 || out.name.length > 120) errors.name = "Enter your registered business name";
    if (!BUSINESS_TYPES.includes(out.type)) errors.type = "Choose a business type";
    if (out.website && !/^https?:\/\/\S+\.\S+$/i.test(out.website)) errors.website = "Enter a full URL starting with http:// or https://";
    if (out.description.length > 500) errors.description = "Keep this under 500 characters";
    if (Object.keys(errors).length) fail(errors);
    return out;
  },

  owners(d) {
    const list = Array.isArray(d.owners) ? d.owners : [];
    if (list.length < 1 || list.length > 10) fail({ owners: "Add between 1 and 10 owners or directors" });
    const errors = {};
    const out = list.map((o, i) => {
      const row = {
        name: str(o?.name),
        email: str(o?.email).toLowerCase(),
        phone: normalizePhone(o?.phone),
        designation: str(o?.designation),
      };
      if (row.name.length < 2) errors[`owners.${i}.name`] = "Enter the full name";
      if (row.email && !EMAIL_RX.test(row.email)) errors[`owners.${i}.email`] = "Enter a valid email";
      if (row.phone && !PHONE_RX.test(row.phone)) errors[`owners.${i}.phone`] = "Enter a valid 10-digit mobile number";
      return row;
    });
    if (Object.keys(errors).length) fail(errors);
    return out;
  },

  address(d) {
    const errors = {};
    const out = {
      line1: str(d.line1),
      line2: str(d.line2),
      city: str(d.city),
      state: str(d.state),
      pincode: str(d.pincode),
    };
    if (out.line1.length < 3) errors.line1 = "Enter the address";
    if (!out.city) errors.city = "Enter the city";
    if (!out.state) errors.state = "Enter the state";
    if (!PIN_RX.test(out.pincode)) errors.pincode = "Enter a valid 6-digit PIN code";
    if (Object.keys(errors).length) fail(errors);
    return out;
  },

  bank(d) {
    const errors = {};
    const accountNumber = str(d.accountNumber).replace(/\s/g, "");
    const out = {
      accountHolder: str(d.accountHolder),
      bankName: str(d.bankName),
      ifsc: str(d.ifsc).toUpperCase(),
    };
    if (out.accountHolder.length < 2) errors.accountHolder = "Enter the account holder's name";
    if (out.bankName.length < 2) errors.bankName = "Enter the bank name";
    if (!IFSC_RX.test(out.ifsc)) errors.ifsc = "Enter a valid IFSC code (e.g. HDFC0001234)";
    if (!ACCOUNT_RX.test(accountNumber)) errors.accountNumber = "Enter a valid account number (9–18 digits)";
    if (d.confirmAccountNumber !== undefined && str(d.confirmAccountNumber).replace(/\s/g, "") !== accountNumber) {
      errors.confirmAccountNumber = "Account numbers do not match";
    }
    if (Object.keys(errors).length) fail(errors);
    return { ...out, accountNumber };
  },

  documents(d) {
    const errors = {};
    const pan = str(d.pan).toUpperCase();
    const gst = str(d.gst).toUpperCase();
    if (!PAN_RX.test(pan)) errors.pan = "Enter a valid PAN (e.g. ABCDE1234F)";
    if (gst && !GST_RX.test(gst)) errors.gst = "Enter a valid 15-character GSTIN";
    if (Object.keys(errors).length) fail(errors);
    return { pan, gst };
  },
};

const apply = (app, step, v) => {
  if (step === "business") app.business = v;
  else if (step === "owners") app.owners = v;
  else if (step === "address") app.address = v;
  else if (step === "bank") {
    app.bank = {
      accountHolder: v.accountHolder,
      bankName: v.bankName,
      ifsc: v.ifsc,
      accountNumberEnc: encrypt(v.accountNumber),
      accountLast4: last4(v.accountNumber),
    };
  } else if (step === "documents") {
    app.documents = {
      panEnc: encrypt(v.pan),
      panLast4: last4(v.pan),
      gstEnc: v.gst ? encrypt(v.gst) : undefined,
      gstLast4: v.gst ? last4(v.gst) : undefined,
    };
  }
};

const editable = (app) => app.status === "draft" || app.status === "rejected";

export const saveStep = async (appId, step, data) => {
  if (!STEPS.includes(step)) throw new HttpError(404, "Unknown step");
  const app = await MerchantApplication.findById(appId);
  if (!app) throw new HttpError(404, "Application not found");
  if (!app.emailVerified) throw new HttpError(403, "Verify your email first");
  if (!editable(app)) throw new HttpError(409, "Your application is under review and can't be edited right now");

  const v = validators[step](data || {});
  apply(app, step, v);
  await app.save();
  return app;
};

/** Which steps have saved data — drives the wizard's "completed" ticks. */
export const progressOf = (app) => ({
  business: Boolean(app.business?.name && app.business?.type),
  owners: (app.owners?.length || 0) > 0,
  address: Boolean(app.address?.line1 && app.address?.pincode),
  bank: Boolean(app.bank?.accountLast4),
  documents: Boolean(app.documents?.panLast4),
});

export const submit = async (appId) => {
  const app = await MerchantApplication.findById(appId);
  if (!app) throw new HttpError(404, "Application not found");
  if (!app.emailVerified) throw new HttpError(403, "Verify your email first");
  if (!editable(app)) throw new HttpError(409, "Application already submitted");

  const missing = STEPS.filter((s) => !progressOf(app)[s]);
  if (missing.length) throw new HttpError(400, `Complete these steps first: ${missing.join(", ")}`);

  app.status = "submitted";
  app.submittedAt = new Date();
  app.reviewNote = "";
  await app.save();
  return app;
};

/* ── Views ────────────────────────────────────────────────────────────── */

// What the applicant sees about their own application: never the full account number/PAN.
export const applicantView = (app) => ({
  id: app._id,
  email: app.email,
  phone: app.phone,
  emailVerified: app.emailVerified,
  status: app.status,
  reviewNote: app.status === "rejected" ? app.reviewNote : "",
  submittedAt: app.submittedAt,
  progress: progressOf(app),
  business: app.business || {},
  owners: app.owners || [],
  address: app.address || {},
  bank: { accountHolder: app.bank?.accountHolder, bankName: app.bank?.bankName, ifsc: app.bank?.ifsc, accountLast4: app.bank?.accountLast4 },
  documents: { panLast4: app.documents?.panLast4, gstLast4: app.documents?.gstLast4 },
});

/* ── Admin review ─────────────────────────────────────────────────────── */

// Admins reviewing KYC need the full values; decrypted only on this admin-only path.
export const adminView = async (id) => {
  const app = await MerchantApplication.findById(id).select("+bank.accountNumberEnc +documents.panEnc +documents.gstEnc").lean();
  if (!app) throw new HttpError(404, "Application not found");
  return {
    ...applicantView(app),
    createdAt: app.createdAt,
    reviewedAt: app.reviewedAt,
    merchantId: app.merchantId,
    bank: { ...applicantView(app).bank, accountNumber: decrypt(app.bank?.accountNumberEnc) },
    documents: { pan: decrypt(app.documents?.panEnc), gst: decrypt(app.documents?.gstEnc) },
  };
};

export const approve = async (id) => {
  const app = await MerchantApplication.findById(id).select("+passwordHash");
  if (!app) throw new HttpError(404, "Application not found");
  if (app.status !== "submitted") throw new HttpError(409, "Only submitted applications can be approved");

  const merchant = await Merchant.create({
    name: app.business.name,
    email: app.email,
    phone: app.phone,
    passwordHash: app.passwordHash,
    webhookSecret: generateWebhookSecret(),
    callbackUrl: "",
  });

  app.status = "approved";
  app.reviewedAt = new Date();
  app.merchantId = merchant._id;
  await app.save();

  await sendMail({
    to: app.email,
    subject: "Your Paytrixx account is approved",
    text: `Hi,\n\nYour Paytrixx account for ${app.business.name} has been approved.\nSign in to your dashboard to generate your API key and start accepting payments.\n`,
  }).catch(() => {});
  return app;
};

export const reject = async (id, note) => {
  const app = await MerchantApplication.findById(id);
  if (!app) throw new HttpError(404, "Application not found");
  if (app.status !== "submitted") throw new HttpError(409, "Only submitted applications can be rejected");
  const reason = str(note);
  if (reason.length < 5) throw new HttpError(400, "Add a short reason so the applicant knows what to fix");

  app.status = "rejected";
  app.reviewedAt = new Date();
  app.reviewNote = reason;
  await app.save();

  await sendMail({
    to: app.email,
    subject: "Update on your Paytrixx application",
    text: `Hi,\n\nWe couldn't approve your application yet:\n\n${reason}\n\nSign in to update your details and resubmit.\n`,
  }).catch(() => {});
  return app;
};
