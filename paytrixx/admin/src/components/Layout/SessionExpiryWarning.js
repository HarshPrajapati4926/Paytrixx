import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, CircularProgress, LinearProgress,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import api from "../../services/api";

const WARN_BEFORE_SEC = 5 * 60; // show warning 5 minutes before expiry

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

const getToken = () =>
  sessionStorage.getItem("adminToken") || localStorage.getItem("adminToken");

const fmt = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

export default function SessionExpiryWarning() {
  const [open, setOpen]           = useState(false);
  const [secondsLeft, setSec]     = useState(WARN_BEFORE_SEC);
  const [extending, setExtending] = useState(false);

  const warnTimer     = useRef(null);
  const countdownRef  = useRef(null);
  const secondsRef    = useRef(WARN_BEFORE_SEC);

  const forceLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = "/sign-in";
  };

  const stopCountdown = () => clearInterval(countdownRef.current);

  const startCountdown = (initialSec) => {
    stopCountdown();
    secondsRef.current = initialSec;
    setSec(initialSec);
    countdownRef.current = setInterval(() => {
      secondsRef.current -= 1;
      setSec(secondsRef.current);
      if (secondsRef.current <= 0) {
        stopCountdown();
        forceLogout();
      }
    }, 1000);
  };

  const scheduleWarning = useCallback(() => {
    clearTimeout(warnTimer.current);
    stopCountdown();
    setOpen(false);

    const token = getToken();
    if (!token) return;

    const payload = parseJwt(token);
    if (!payload?.exp) return;

    const expiresAt  = payload.exp * 1000;
    const now        = Date.now();
    const remaining  = Math.floor((expiresAt - now) / 1000); // seconds until expiry

    if (remaining <= 0) { forceLogout(); return; }

    if (remaining <= WARN_BEFORE_SEC) {
      // Already inside the warning window — show immediately
      setOpen(true);
      startCountdown(remaining);
    } else {
      // Schedule warning for (remaining - WARN_BEFORE_SEC) seconds from now
      const delay = (remaining - WARN_BEFORE_SEC) * 1000;
      warnTimer.current = setTimeout(() => {
        setOpen(true);
        startCountdown(WARN_BEFORE_SEC);
      }, delay);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scheduleWarning();
    return () => {
      clearTimeout(warnTimer.current);
      stopCountdown();
    };
  }, [scheduleWarning]);

  const handleExtend = async () => {
    setExtending(true);
    try {
      const { data } = await api.post("/api/admin/refresh-token");
      if (data.token) {
        // Store in whichever storage the current token lives in
        if (sessionStorage.getItem("adminToken")) {
          sessionStorage.setItem("adminToken", data.token);
        } else {
          localStorage.setItem("adminToken", data.token);
        }
        stopCountdown();
        setOpen(false);
        scheduleWarning(); // reschedule for the new token
      }
    } catch {
      // If extend fails fall through — countdown continues
    } finally {
      setExtending(false);
    }
  };

  const pct = Math.min(100, (secondsLeft / WARN_BEFORE_SEC) * 100);
  const isUrgent = secondsLeft <= 60;

  return (
    <Dialog open={open} maxWidth="xs" fullWidth disableEscapeKeyDown>
      {/* Countdown bar */}
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 4,
          borderRadius: 0,
          bgcolor: "#e2e8f0",
          "& .MuiLinearProgress-bar": {
            bgcolor: isUrgent ? "#dc2626" : "#f59e0b",
            transition: "none",
          },
        }}
      />

      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{
            width: 38, height: 38, borderRadius: "10px",
            bgcolor: isUrgent ? "#fee2e2" : "#fef3c7",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <AccessTimeIcon sx={{ fontSize: 20, color: isUrgent ? "#dc2626" : "#d97706" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
              Session Expiring Soon
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#64748b" }}>
              Your session will expire in
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 0, pb: 2.5 }}>
        {/* Big countdown */}
        <Box sx={{
          textAlign: "center", py: 2.5, my: 1,
          bgcolor: isUrgent ? "#fef2f2" : "#fffbeb",
          borderRadius: "10px",
          border: `1px solid ${isUrgent ? "#fecaca" : "#fde68a"}`,
        }}>
          <Typography sx={{
            fontSize: 44, fontWeight: 800, fontFamily: "monospace",
            color: isUrgent ? "#dc2626" : "#d97706",
            lineHeight: 1,
          }}>
            {fmt(secondsLeft)}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "#94a3b8", mt: 0.75 }}>
            minutes : seconds
          </Typography>
        </Box>

        <Typography sx={{ fontSize: 13, color: "#64748b", textAlign: "center", mt: 1.5, lineHeight: 1.7 }}>
          Click <strong>Extend Session</strong> to stay signed in,
          or you'll be automatically signed out when the timer reaches zero.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={forceLogout}
          sx={{
            textTransform: "none", borderRadius: "8px", fontSize: 13,
            borderColor: "#e2e8f0", color: "#64748b",
            "&:hover": { borderColor: "#cbd5e1" },
          }}
        >
          Sign Out Now
        </Button>
        <Button
          variant="contained"
          onClick={handleExtend}
          disabled={extending}
          startIcon={extending ? <CircularProgress size={14} color="inherit" /> : null}
          sx={{
            textTransform: "none", borderRadius: "8px", fontSize: 13, flex: 1,
            bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" },
          }}
        >
          {extending ? "Extending…" : "Extend Session"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
