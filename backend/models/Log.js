import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  type: { type: String, enum: ["webhook", "error", "api", "callback"], required: true, index: true },
  status: { type: String, enum: ["success", "failed"], default: "success" },
  payload: { type: mongoose.Schema.Types.Mixed, default: null },
  timestamp: { type: Date, default: Date.now, index: true },
});

export default mongoose.model("Log", logSchema);
