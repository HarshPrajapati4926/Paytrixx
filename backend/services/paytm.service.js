import PaytmChecksum from "paytmchecksum";
import config, { paytmConfigured } from "../config/env.js";
import { HttpError } from "../utils/asyncHandler.js";

const TIMEOUT_MS = 15_000;

const post = async (url, body) => {
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err.name === "TimeoutError" || err.name === "AbortError";
    throw new HttpError(504, timedOut ? "Paytm request timed out" : "Could not reach Paytm");
  }
  try {
    return await res.json();
  } catch {
    throw new HttpError(502, "Invalid response from Paytm");
  }
};

const assertConfigured = () => {
  if (!paytmConfigured()) throw new HttpError(503, "Paytm is not configured on the server");
};

/** Create a Paytm transaction. Returns the txnToken needed to open the payment page. */
export const initiateTransaction = async ({ orderId, amount, currency, customerId }) => {
  assertConfigured();
  const { mid, key, website, host } = config.paytm;

  const body = {
    requestType: "Payment",
    mid,
    websiteName: website,
    orderId,
    callbackUrl: `${config.baseUrl}/api/webhook/paytm`,
    txnAmount: { value: Number(amount).toFixed(2), currency },
    userInfo: { custId: customerId },
  };
  const signature = await PaytmChecksum.generateSignature(JSON.stringify(body), key);

  const data = await post(
    `${host}/theia/api/v1/initiateTransaction?mid=${encodeURIComponent(mid)}&orderId=${encodeURIComponent(orderId)}`,
    { body, head: { signature } }
  );

  const info = data?.body?.resultInfo;
  if (info?.resultStatus !== "S" || !data.body.txnToken) {
    throw new HttpError(502, `Paytm rejected the order: ${info?.resultMsg || "unknown error"}`);
  }
  return data.body.txnToken;
};

/** Verify the CHECKSUMHASH on a Paytm webhook / browser-callback payload. */
export const verifyCallbackSignature = async (payload) => {
  if (!paytmConfigured()) return false;
  const { CHECKSUMHASH, ...params } = payload || {};
  if (!CHECKSUMHASH) return false;
  try {
    return await PaytmChecksum.verifySignature(params, config.paytm.key, CHECKSUMHASH);
  } catch {
    return false;
  }
};

/** Ask Paytm for the authoritative status of an order (used for polling/reconciliation). */
export const fetchTransactionStatus = async (orderId) => {
  assertConfigured();
  const { mid, key, host } = config.paytm;

  const body = { mid, orderId };
  const signature = await PaytmChecksum.generateSignature(JSON.stringify(body), key);
  const data = await post(`${host}/v3/order/status`, { body, head: { signature } });

  // Only trust the response if Paytm signed it.
  const sig = data?.head?.signature;
  const ok = sig && (await PaytmChecksum.verifySignature(JSON.stringify(data.body), key, sig));
  if (!ok) throw new HttpError(502, "Paytm status response failed signature verification");

  return data.body;
};
