import CallbackJob from "../models/CallbackJob.js";
import Merchant from "../models/Merchant.js";
import { hmacSha256 } from "../utils/crypto.js";
import { logEvent } from "./logger.service.js";

const MAX_ATTEMPTS = 8;
const TIMEOUT_MS = 8_000;
const POLL_INTERVAL_MS = 10_000;

// 30s, 1m, 2m, 4m ... capped at 1h
const backoffMs = (attempts) => Math.min(30_000 * 2 ** (attempts - 1), 60 * 60 * 1000);

/** Queue a callback to the merchant. Idempotent per orderId. */
export const enqueueCallback = async ({ order, merchant, status }) => {
  if (!merchant.callbackUrl) return null;

  const payload = { orderId: order.orderId, status, amount: order.amount };
  try {
    return await CallbackJob.create({
      orderId: order.orderId,
      merchantId: merchant._id,
      url: merchant.callbackUrl,
      payload,
    });
  } catch (err) {
    if (err.code === 11000) return null; // already queued
    throw err;
  }
};

const deliver = async (job) => {
  const merchant = await Merchant.findById(job.merchantId).select("+webhookSecret").lean();
  if (!merchant) throw new Error("Merchant no longer exists");

  const body = JSON.stringify(job.payload);
  const res = await fetch(job.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Paytrixx-Signature": hmacSha256(merchant.webhookSecret, body),
    },
    body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Merchant responded with HTTP ${res.status}`);
};

const processDueJobs = async () => {
  // Atomically claim one due job at a time so multiple instances don't double-send.
  // Claiming pushes nextAttemptAt forward; it is reset below based on the outcome.
  for (;;) {
    const job = await CallbackJob.findOneAndUpdate(
      { status: "pending", nextAttemptAt: { $lte: new Date() } },
      { $set: { nextAttemptAt: new Date(Date.now() + 2 * TIMEOUT_MS) }, $inc: { attempts: 1 } },
      { sort: { nextAttemptAt: 1 }, new: true }
    );
    if (!job) return;

    try {
      await deliver(job);
      await CallbackJob.updateOne({ _id: job._id }, { status: "done", lastError: "" });
      await logEvent("callback", "success", { orderId: job.orderId, attempts: job.attempts });
    } catch (err) {
      const exhausted = job.attempts >= MAX_ATTEMPTS;
      await CallbackJob.updateOne(
        { _id: job._id },
        {
          status: exhausted ? "failed" : "pending",
          lastError: err.message,
          nextAttemptAt: new Date(Date.now() + backoffMs(job.attempts)),
        }
      );
      await logEvent("callback", "failed", {
        orderId: job.orderId,
        attempts: job.attempts,
        error: err.message,
        gaveUp: exhausted,
      });
    }
  }
};

let timer = null;
let running = false;

export const startCallbackWorker = () => {
  if (timer) return;
  timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await processDueJobs();
    } catch (err) {
      console.error("Callback worker error:", err.message);
    } finally {
      running = false;
    }
  }, POLL_INTERVAL_MS);
  timer.unref();
};

export const stopCallbackWorker = () => {
  clearInterval(timer);
  timer = null;
};
