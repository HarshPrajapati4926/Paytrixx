import jwt from "jsonwebtoken";
import config from "../config/env.js";
import Admin from "../models/Admin.js";

// Admin JWT auth. Re-checks the admin still exists and is active on every request.
export const adminAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided. Access denied." });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const admin = await Admin.findById(decoded.id).lean();
    if (!admin || admin.status !== "active") {
      return res.status(401).json({ success: false, message: "Account not found or inactive." });
    }
    req.admin = { id: String(admin._id), email: admin.email, role: admin.role, name: admin.name };
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

// Role-based access: requireRole("superadmin")
export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  };
