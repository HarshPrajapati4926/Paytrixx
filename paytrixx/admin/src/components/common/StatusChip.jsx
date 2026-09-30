import React from "react";
import { Chip } from "@mui/material";

const COLORS = {
  success: { bg: "#EEFFE5", fg: "#1e8308" },
  paid: { bg: "#EEFFE5", fg: "#1e8308" },
  active: { bg: "#EEFFE5", fg: "#1e8308" },
  ok: { bg: "#EEFFE5", fg: "#1e8308" },
  pending: { bg: "#fff8e1", fg: "#b38300" },
  warning: { bg: "#fff8e1", fg: "#b38300" },
  failed: { bg: "#ffe1dd", fg: "#c62d14" },
  error: { bg: "#ffe1dd", fg: "#c62d14" },
  inactive: { bg: "#ffe1dd", fg: "#c62d14" },
  approved: { bg: "#EEFFE5", fg: "#1e8308" },
  resolved: { bg: "#EEFFE5", fg: "#1e8308" },
  done: { bg: "#EEFFE5", fg: "#1e8308" },
  submitted: { bg: "#fff8e1", fg: "#b38300" },
  new: { bg: "#ECF0FF", fg: "#3e2ad8" },
  draft: { bg: "#f1f5f9", fg: "#64748B" },
  rejected: { bg: "#ffe1dd", fg: "#c62d14" },
  callback: { bg: "#DAEBFF", fg: "#1f64f1" },
  webhook: { bg: "#ECF0FF", fg: "#3e2ad8" },
  api: { bg: "#DAEBFF", fg: "#1f64f1" },
};

const StatusChip = ({ status }) => {
  const key = String(status || "").toLowerCase();
  const c = COLORS[key] || { bg: "#f1f5f9", fg: "#64748B" };
  return (
    <Chip
      size="small"
      label={status || "—"}
      sx={{
        bgcolor: c.bg,
        color: c.fg,
        fontWeight: 600,
        fontSize: 12,
        textTransform: "capitalize",
      }}
    />
  );
};

export default StatusChip;
