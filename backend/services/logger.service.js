import Log from "../models/Log.js";

// Fire-and-forget: logging must never break the request that triggered it.
export const logEvent = async (type, status, payload) => {
  try {
    await Log.create({ type, status, payload });
  } catch (err) {
    console.error("Failed to write log:", err.message);
  }
};
