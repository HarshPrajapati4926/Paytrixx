import crypto from "crypto";
import config from "../config/env.js";

// AES-256-GCM for sensitive KYC fields at rest. Set DATA_ENCRYPTION_KEY in production;
// it falls back to a key derived from JWT_SECRET so dev/test work without extra setup.
const key = () =>
  crypto.createHash("sha256").update(process.env.DATA_ENCRYPTION_KEY || config.jwtSecret || "").digest();

export const encrypt = (plain) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ct].map((b) => b.toString("base64")).join(".");
};

export const decrypt = (payload) => {
  if (!payload) return "";
  const [iv, tag, ct] = payload.split(".").map((p) => Buffer.from(p, "base64"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
};

export const last4 = (s) => String(s).slice(-4);
