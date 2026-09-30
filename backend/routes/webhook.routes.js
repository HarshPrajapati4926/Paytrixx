import { Router } from "express";
import { paytmWebhook } from "../modules/webhook/paytm.webhook.controller.js";

const router = Router();

router.post("/paytm", paytmWebhook);

export default router;
