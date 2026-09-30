import { Router } from "express";
import { adminAuth } from "../middleware/authMiddleware.js";
import { loginLimiter } from "../middleware/rateLimitMiddleware.js";
import * as c from "../modules/admin/admin.controller.js";

const router = Router();

router.post("/login", loginLimiter, c.login);

// Everything below requires an admin JWT.
router.use(adminAuth);

router.post("/refresh-token", c.refreshToken);
router.get("/me", c.me);
router.put("/change-password", c.changePassword);

router.get("/stats", c.stats);
router.get("/system-health", c.systemHealth);

router.get("/merchants", c.merchants);
router.post("/merchants", c.addMerchant);
router.patch("/merchants/:id", c.patchMerchant);
router.post("/merchants/:id/regenerate-key", c.regenerateKey);

router.get("/transactions", c.transactions);
router.get("/orders", c.orders);
router.get("/logs", c.logs);

router.get("/applications", c.applications);
router.get("/applications/:id", c.applicationDetail);
router.post("/applications/:id/approve", c.approveApplication);
router.post("/applications/:id/reject", c.rejectApplication);

router.get("/contact-messages", c.contactMessages);
router.patch("/contact-messages/:id", c.updateContactMessage);

export default router;
