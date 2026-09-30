import jwt from "jsonwebtoken";
import config from "../config/env.js";

// Session for someone mid-registration (token type "applicant"). Sets req.applicantId.
export const applicantAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Not authenticated" });
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (decoded.type !== "applicant") return res.status(401).json({ success: false, message: "Invalid token" });
    req.applicantId = decoded.sub;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired session" });
  }
};
