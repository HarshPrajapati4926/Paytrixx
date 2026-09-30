// In-memory rate limiter (no Redis dependency)
const store = new Map();

const getIp = (req) =>
  (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.ip || "unknown";

export const createRateLimiter = ({ windowMs, max, keyPrefix, message }) =>
  (req, res, next) => {
    const ip  = getIp(req);
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    let entry = store.get(key);
    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime: now + windowMs };
    }

    entry.count++;
    store.set(key, entry);

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.set("Retry-After", Math.max(1, retryAfter));
      return res.status(429).json({
        success: false,
        message: message || "Too many requests. Please try again later.",
        retryAfter: Math.max(1, retryAfter),
      });
    }

    res.set("X-RateLimit-Remaining", Math.max(0, max - entry.count));
    next();
  };

// 5 login attempts per 15 minutes per IP
export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: "login",
  message: "Too many login attempts. Please wait 15 minutes before trying again.",
});

// 5 OTP verifications per 5 minutes per IP
export const otpLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 5,
  keyPrefix: "otp",
  message: "Too many OTP attempts. Please wait 5 minutes.",
});

// 3 forgot-password requests per hour per IP
export const forgotPasswordLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyPrefix: "forgotpw",
  message: "Too many password reset requests. Please try again in 1 hour.",
});

// General API — 500 requests per minute per IP
export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 500,
  keyPrefix: "api",
  message: "Too many requests. Please slow down.",
});

// Public write forms (comments, contact) — 5 submissions per 10 minutes per IP
export const publicFormLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyPrefix: "publicform",
  message: "Too many submissions. Please try again later.",
});

// Honeypot check for public forms: a hidden "website" field that's invisible
// to real users but bots/scrapers tend to fill in. Reject silently as if it
// succeeded, so bots get no signal their submission was dropped.
export const honeypot = (fieldName = "website") => (req, res, next) => {
  if (req.body?.[fieldName]) {
    return res.status(201).json({ success: true, message: "Submitted." });
  }
  next();
};
