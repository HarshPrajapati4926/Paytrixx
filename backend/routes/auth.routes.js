import { Router } from "express";
import { applicantAuth } from "../middleware/applicantAuth.js";
import { createRateLimiter } from "../middleware/rateLimitMiddleware.js";
import * as c from "../modules/onboarding/onboarding.controller.js";

const router = Router();

const registerLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 10, keyPrefix: "register", message: "Too many sign-ups from this network. Try again later." });
const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: "auth-login", message: "Too many login attempts. Please wait 15 minutes." });
const codeLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20, keyPrefix: "email-code", message: "Too many attempts. Please wait a few minutes." });

router.post("/register", registerLimiter, c.register);
router.post("/login", loginLimiter, c.login);
router.post("/verify-email", codeLimiter, applicantAuth, c.verifyEmail);
router.post("/resend-code", codeLimiter, applicantAuth, c.resendCode);

export default router;
