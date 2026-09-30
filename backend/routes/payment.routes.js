import { Router } from "express";
import { merchantAuth } from "../middleware/merchantAuth.js";
import { createRateLimiter } from "../middleware/rateLimitMiddleware.js";
import * as c from "../modules/payment/payment.controller.js";

const router = Router();

// Merchant API: 120 order creations per minute per IP.
const createLimiter = createRateLimiter({ windowMs: 60_000, max: 120, keyPrefix: "pay-create" });

router.post("/create", createLimiter, merchantAuth, c.create);
router.get("/status/:orderId", merchantAuth, c.status);

// Public: opens the Paytm payment page for an order.
router.get("/checkout/:orderId", c.checkout);

export default router;
