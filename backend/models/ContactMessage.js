import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    business: { type: String, default: "" },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["new", "resolved"], default: "new", index: true },
  },
  { timestamps: true }
);

export default mongoose.model("ContactMessage", contactSchema);
