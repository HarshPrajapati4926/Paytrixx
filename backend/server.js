import config, { assertRequiredEnv, paytmConfigured } from "./config/env.js";
import connectDB from "./config/db.js";
import app from "./app.js";
import { startCallbackWorker } from "./services/callback.service.js";
import { startReconcileWorker } from "./modules/payment/payment.service.js";

assertRequiredEnv();
if (!paytmConfigured()) {
  console.warn("PAYTM_MERCHANT_ID / PAYTM_MERCHANT_KEY not set — payments and webhooks will be rejected.");
}

await connectDB();
startCallbackWorker();
startReconcileWorker();

app.listen(config.port, () => {
  console.log(`Paytrixx API running on port ${config.port}`);
});
