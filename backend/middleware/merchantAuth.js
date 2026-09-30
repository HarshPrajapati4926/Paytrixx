import jwt from "jsonwebtoken";
import config from "../config/env.js";
import Merchant from "../models/Merchant.js";
import { sha256 } from "../utils/crypto.js";

const reject = (res, status, message) => res.status(status).json({ success: false, message });

const checkActive = (res, merchant) => {
  if (!merchant) return reject(res, 401, "Invalid credentials");
  if (!merchant.isActive) return reject(res, 403, "Merchant account is inactive");
  return null;
};

// Server-to-server auth via the `x-api-key` header (payment API).
export const merchantAuth = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || typeof apiKey !== "string") return reject(res, 401, "Missing x-api-key header");

  const merchant = await Merchant.findOne({ apiKeyHash: sha256(apiKey) }).select("+webhookSecret").lean();
  const failed = checkActive(res, merchant);
  if (failed) return failed;

  req.merchant = merchant;
  next();
};

// Dashboard auth: a session JWT from POST /api/merchant/login, or the API key itself.
export const merchantSessionAuth = async (req, res, next) => {
  if (req.headers["x-api-key"]) return merchantAuth(req, res, next);

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return reject(res, 401, "Not authenticated");

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (decoded.type !== "merchant") return reject(res, 401, "Invalid token");
    const merchant = await Merchant.findById(decoded.sub).lean();
    const failed = checkActive(res, merchant);
    if (failed) return failed;
    req.merchant = merchant;
    next();
  } catch {
    return reject(res, 401, "Invalid or expired session");
  }
};
