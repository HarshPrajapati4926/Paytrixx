import { Router } from "express";
import { merchantSessionAuth } from "../middleware/merchantAuth.js";
import { createRateLimiter } from "../middleware/rateLimitMiddleware.js";
import * as c from "../modules/merchant/merchant.controller.js";

const router = Router();

// Brute-force guard for API-key guessing on the dashboard login.
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: "merchant-login",
  message: "Too many login attempts. Please wait 15 minutes.",
});

router.post("/login", loginLimiter, c.login);

router.use(merchantSessionAuth);
router.get("/me", c.me);
router.get("/stats", c.stats);
router.get("/webhook-secret", c.webhookSecret);
router.get("/transactions", c.transactions);
router.get("/orders", c.orders);
router.get("/callbacks", c.callbacks);
router.patch("/settings", c.updateSettings);
router.post("/regenerate-key", c.regenerateKey);

export default router;
