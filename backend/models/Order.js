import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: "Merchant", required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending", index: true },
    gateway: { type: String, default: "paytm" },
    paytmTxnId: { type: String, default: "" },
    // Paytm txn token needed to open the payment page; never returned by list APIs.
    paytmTxnToken: { type: String, default: "", select: false },
    customerDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Where to send the customer's browser after payment (optional, merchant-supplied).
    returnUrl: { type: String, default: "" },
    // Client-supplied Idempotency-Key header: a retried create returns this same order.
    idempotencyKey: { type: String },
  },
  { timestamps: true }
);

orderSchema.index(
  { merchantId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
);

export default mongoose.model("Order", orderSchema);
