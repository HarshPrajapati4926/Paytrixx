import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import config from "./config/env.js";
import { apiLimiter } from "./middleware/rateLimitMiddleware.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

import adminRoutes from "./routes/admin.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import merchantRoutes from "./routes/merchant.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import authRoutes from "./routes/auth.routes.js";
import onboardingRoutes from "./routes/onboarding.routes.js";
import contactRoutes from "./routes/contact.routes.js";

const app = express();

app.set("trust proxy", 1); // behind Render / a reverse proxy
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(apiLimiter);

// Paytm posts form-encoded webhooks/browser callbacks; merchants send JSON.
// `extended: false` keeps every field a plain string (no nested-object injection).
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

// Browser apps only: the admin panel and the merchant dashboard. Payment API calls
// (x-api-key) and Paytm webhooks are server-to-server and need no CORS.
app.use("/api/admin", cors({ origin: config.adminOrigins }));
for (const path of ["/api/merchant", "/api/auth", "/api/onboarding", "/api/contact"]) {
  app.use(path, cors({ origin: config.webOrigins }));
}

app.get("/", (req, res) => res.json({ success: true, service: "paytrixx-api" }));

app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/merchant", merchantRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/contact", contactRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
