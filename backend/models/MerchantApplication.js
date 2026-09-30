import mongoose from "mongoose";

// A merchant's self-registration: account -> email verification -> 5 detail steps -> review.
// Sensitive identifiers (bank account, PAN, GST) are stored encrypted, plus a last-4 for display.
const ownerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    designation: { type: String, default: "" },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    passwordHash: { type: String, required: true, select: false },

    emailVerified: { type: Boolean, default: false },
    otpHash: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
    otpSentAt: { type: Date, select: false },

    status: { type: String, enum: ["draft", "submitted", "approved", "rejected"], default: "draft", index: true },

    business: {
      name: { type: String, trim: true },
      type: { type: String },
      website: { type: String, default: "" },
      description: { type: String, default: "" },
    },
    owners: { type: [ownerSchema], default: [] },
    address: {
      line1: { type: String },
      line2: { type: String, default: "" },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
    },
    bank: {
      accountHolder: { type: String },
      bankName: { type: String },
      ifsc: { type: String },
      accountNumberEnc: { type: String, select: false },
      accountLast4: { type: String },
    },
    documents: {
      panEnc: { type: String, select: false },
      panLast4: { type: String },
      gstEnc: { type: String, select: false },
      gstLast4: { type: String },
    },

    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewNote: { type: String, default: "" },
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: "Merchant" },
  },
  { timestamps: true }
);

export default mongoose.model("MerchantApplication", applicationSchema);
