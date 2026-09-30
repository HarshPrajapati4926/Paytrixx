import crypto from "crypto";

export const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

export const generateApiKey = () => {
  const apiKey = `pk_live_${crypto.randomBytes(24).toString("hex")}`;
  return {
    apiKey,
    apiKeyHash: sha256(apiKey),
    apiKeyPreview: `${apiKey.slice(0, 12)}…${apiKey.slice(-4)}`,
  };
};

export const generateWebhookSecret = () => `whsec_${crypto.randomBytes(24).toString("hex")}`;

export const hmacSha256 = (secret, body) =>
  crypto.createHmac("sha256", secret).update(body).digest("hex");

export const newId = (prefix) =>
  `${prefix}_${Date.now().toString(36)}${crypto.randomBytes(5).toString("hex")}`.toUpperCase();
