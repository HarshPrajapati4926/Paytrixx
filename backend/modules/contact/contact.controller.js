import ContactMessage from "../../models/ContactMessage.js";
import { asyncHandler, HttpError } from "../../utils/asyncHandler.js";

export const TOPICS = [
  "Before signing up",
  "Help with registration",
  "API and integration",
  "A payment to my business",
  "I paid a business",
  "My account",
  "Something else",
];

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const s = (v) => (typeof v === "string" ? v.trim() : "");

// POST /api/contact  (public, rate-limited)
export const create = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const data = {
    topic: s(b.topic),
    name: s(b.name),
    email: s(b.email).toLowerCase(),
    phone: s(b.phone),
    business: s(b.business),
    subject: s(b.subject),
    message: s(b.message),
  };

  const errors = {};
  if (!TOPICS.includes(data.topic)) errors.topic = "Choose what this is about";
  if (data.name.length < 2) errors.name = "Enter your name";
  if (!EMAIL_RX.test(data.email)) errors.email = "Enter a valid email";
  if (data.phone && !/^[0-9+\-\s]{7,15}$/.test(data.phone)) errors.phone = "Enter a valid phone number";
  if (data.subject.length < 3) errors.subject = "Add a subject";
  if (data.message.length < 20) errors.message = "Tell us a bit more (at least 20 characters)";
  if (data.message.length > 4000) errors.message = "Keep this under 4000 characters";
  if (Object.keys(errors).length) throw new HttpError(400, "Please fix the highlighted fields", errors);

  await ContactMessage.create(data);
  res.status(201).json({ success: true, message: "Thanks, we will reply to your email." });
});
