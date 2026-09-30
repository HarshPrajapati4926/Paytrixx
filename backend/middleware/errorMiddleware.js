import { logEvent } from "../services/logger.service.js";

export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: "API route not found" });
};

// Centralized error handler — logs to the Log collection and hides internals in production.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const status = err.status || (err.name === "ValidationError" || err.name === "CastError" ? 400 : 500);

  if (status >= 500) {
    console.error(err);
    logEvent("error", "failed", { message: err.message, path: req.originalUrl, method: req.method });
  }

  res.status(status).json({
    success: false,
    message: status >= 500 && process.env.NODE_ENV === "production" ? "Server error" : err.message,
    ...(err.fields ? { fields: err.fields } : {}),
  });
};
