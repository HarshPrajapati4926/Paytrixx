import mongoose from "mongoose";

// Mongo-backed queue of merchant callbacks so a failed delivery is retried
// even if the server restarts.
const callbackJobSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: "Merchant", required: true },
    url: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, enum: ["pending", "done", "failed"], default: "pending", index: true },
    attempts: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, default: Date.now, index: true },
    lastError: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("CallbackJob", callbackJobSchema);
