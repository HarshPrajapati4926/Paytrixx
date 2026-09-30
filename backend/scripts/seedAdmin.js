import mongoose from "mongoose";
import config, { assertRequiredEnv } from "../config/env.js";
import Admin from "../models/Admin.js";

assertRequiredEnv();

const name = process.env.SEED_ADMIN_NAME || "Super Admin";
const email = (process.env.SEED_ADMIN_EMAIL || "").toLowerCase().trim();
const password = process.env.SEED_ADMIN_PASSWORD || "";

if (!email || password.length < 8) {
  console.error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (min 8 chars) in .env first.");
  process.exit(1);
}

await mongoose.connect(config.mongoUri);

if (await Admin.findOne({ email })) {
  console.log(`Admin already exists: ${email}`);
} else {
  await Admin.create({ name, email, password, role: "superadmin" });
  console.log(`Superadmin created: ${email}`);
}

await mongoose.disconnect();
