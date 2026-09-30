import dotenv from "dotenv";

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  baseUrl: (process.env.BASE_URL || "http://localhost:5000").replace(/\/$/, ""),
  adminOrigins: (process.env.ADMIN_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  webOrigins: (process.env.WEB_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  paytm: {
    mid: process.env.PAYTM_MERCHANT_ID,
    key: process.env.PAYTM_MERCHANT_KEY,
    website: process.env.PAYTM_WEBSITE || "WEBSTAGING",
    host: (process.env.PAYTM_HOST || "https://securegw-stage.paytm.in").replace(/\/$/, ""),
  },
};

export const paytmConfigured = () => Boolean(config.paytm.mid && config.paytm.key);

export const assertRequiredEnv = () => {
  const missing = [];
  if (!config.mongoUri) missing.push("MONGO_URI");
  if (!config.jwtSecret) missing.push("JWT_SECRET");
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
};

export default config;
