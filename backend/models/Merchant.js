import mongoose from "mongoose";

const merchantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Dashboard login (merchants created through self-registration).
    email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
    phone: { type: String, default: "" },
    passwordHash: { type: String, select: false },
    // Only the SHA-256 hash of the API key is stored; the raw key is shown once.
    // Optional: a self-registered merchant generates their first key from the dashboard.
    apiKeyHash: { type: String, unique: true, sparse: true, select: false },
    apiKeyPreview: { type: String, default: "" },
    // Used to HMAC-sign callbacks sent to the merchant.
    webhookSecret: { type: String, required: true, select: false },
    callbackUrl: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Merchant", merchantSchema);
