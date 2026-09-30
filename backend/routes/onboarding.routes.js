import { Router } from "express";
import { applicantAuth } from "../middleware/applicantAuth.js";
import * as c from "../modules/onboarding/onboarding.controller.js";

const router = Router();

router.use(applicantAuth);
router.get("/me", c.me);
router.put("/steps/:step", c.saveStep);
router.post("/submit", c.submit);

export default router;
