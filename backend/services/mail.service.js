import nodemailer from "nodemailer";
import { HttpError } from "../utils/asyncHandler.js";

// SMTP is optional in dev: without SMTP_HOST the message is printed to the console
// (and kept in `outbox` for tests). In production a missing SMTP config is an error —
// we'd rather fail registration loudly than silently never deliver the code.
export const outbox = [];

let transport;
const getTransport = () => {
  if (transport !== undefined) return transport;
  transport = process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      })
    : null;
  return transport;
};

export const sendMail = async ({ to, subject, text }) => {
  const t = getTransport();
  if (t) {
    await t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text });
    return;
  }
  if (process.env.NODE_ENV === "production") {
    throw new HttpError(503, "Email delivery is not configured on the server");
  }
  outbox.push({ to, subject, text });
  if (process.env.NODE_ENV !== "test") console.log(`\n[mail → ${to}] ${subject}\n${text}\n`);
};
