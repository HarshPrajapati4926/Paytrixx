import { Router } from "express";
import { publicFormLimiter, honeypot } from "../middleware/rateLimitMiddleware.js";
import * as c from "../modules/contact/contact.controller.js";

const router = Router();

// `website` is a hidden field real users never fill in; bots do.
router.post("/", publicFormLimiter, honeypot("website"), c.create);
router.get("/topics", (req, res) => res.json({ success: true, topics: c.TOPICS }));

export default router;
