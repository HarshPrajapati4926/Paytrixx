import { useNavigate } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function PageNotFound() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
        px: 3,
        textAlign: "center",
        userSelect: "none",
      }}
    >
      {/* Illustration */}
      <Box sx={{ width: "100%", maxWidth: 480, mb: 4 }}>
        <svg
          width="100%"
          viewBox="0 0 480 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ground shadow */}
          <ellipse cx="240" cy="298" rx="160" ry="12" fill="#e2e8f0" />

          {/* Floating platform */}
          <rect x="120" y="230" width="240" height="22" rx="4" fill="#cbd5e1" />
          <rect x="130" y="238" width="220" height="14" rx="3" fill="#94a3b8" />

          {/* Left "4" */}
          <g>
            {/* Vertical stroke */}
            <rect x="58" y="80" width="28" height="120" rx="6" fill="#6366f1" />
            {/* Horizontal stroke */}
            <rect x="38" y="148" width="88" height="28" rx="6" fill="#6366f1" />
            {/* Diagonal stroke */}
            <rect
              x="82"
              y="68"
              width="28"
              height="88"
              rx="6"
              fill="#6366f1"
              transform="rotate(-38 96 112)"
            />
          </g>

          {/* Right "4" */}
          <g>
            {/* Vertical stroke */}
            <rect x="394" y="80" width="28" height="120" rx="6" fill="#6366f1" />
            {/* Horizontal stroke */}
            <rect x="374" y="148" width="88" height="28" rx="6" fill="#6366f1" />
            {/* Diagonal stroke */}
            <rect
              x="374"
              y="68"
              width="28"
              height="88"
              rx="6"
              fill="#6366f1"
              transform="rotate(-38 388 112)"
            />
          </g>

          {/* Center "0" - circle with hole */}
          <circle cx="240" cy="140" r="72" fill="#818cf8" />
          <circle cx="240" cy="140" r="42" fill="#f8fafc" />

          {/* Sad face inside the 0 */}
          {/* Eyes */}
          <circle cx="225" cy="128" r="5" fill="#6366f1" />
          <circle cx="255" cy="128" r="5" fill="#6366f1" />
          {/* Sad mouth */}
          <path
            d="M225 152 Q240 144 255 152"
            stroke="#6366f1"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Floating sparkles */}
          <circle cx="108" cy="62" r="5" fill="#a5b4fc" opacity="0.7" />
          <circle cx="372" cy="54" r="4" fill="#a5b4fc" opacity="0.6" />
          <circle cx="148" cy="196" r="3" fill="#c7d2fe" opacity="0.8" />
          <circle cx="338" cy="188" r="3.5" fill="#c7d2fe" opacity="0.7" />
          <circle cx="80" cy="178" r="2.5" fill="#818cf8" opacity="0.5" />
          <circle cx="404" cy="160" r="2.5" fill="#818cf8" opacity="0.5" />

          {/* Dotted line under 404 */}
          <line
            x1="80"
            y1="220"
            x2="400"
            y2="220"
            stroke="#c7d2fe"
            strokeWidth="2"
            strokeDasharray="6 5"
            strokeLinecap="round"
          />
        </svg>
      </Box>

      {/* Text content */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          fontSize: { xs: "1.5rem", sm: "1.875rem" },
          color: "#0f172a",
          mb: 1.5,
          letterSpacing: "-0.02em",
        }}
      >
        Page not found
      </Typography>

      <Typography
        sx={{
          fontSize: { xs: "14px", sm: "15px" },
          color: "#64748b",
          maxWidth: 380,
          lineHeight: 1.7,
          mb: 4,
        }}
      >
        The page you're looking for doesn't exist or has been moved.
        Double-check the URL or head back to the dashboard.
      </Typography>

      {/* Action buttons */}
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "center" }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon sx={{ fontSize: 17 }} />}
          onClick={() => navigate(-1)}
          sx={{
            textTransform: "capitalize",
            borderRadius: "8px",
            fontWeight: 500,
            fontSize: "14px",
            px: 3,
            py: 1.1,
            borderColor: "#cbd5e1",
            color: "#475569",
            "&:hover": {
              borderColor: "#94a3b8",
              backgroundColor: "#f1f5f9",
            },
          }}
        >
          Go back
        </Button>

        <Button
          variant="contained"
          startIcon={<HomeIcon sx={{ fontSize: 17 }} />}
          onClick={() => navigate("/")}
          sx={{
            textTransform: "capitalize",
            borderRadius: "8px",
            fontWeight: 500,
            fontSize: "14px",
            px: 3,
            py: 1.1,
            backgroundColor: "#6366f1",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#4f46e5",
              boxShadow: "none",
            },
          }}
        >
          Back to dashboard
        </Button>
      </Box>

      {/* Error code hint */}
      <Typography
        sx={{
          mt: 5,
          fontSize: "12px",
          color: "#94a3b8",
          letterSpacing: "0.05em",
        }}
      >
        ERROR CODE · 404
      </Typography>
    </Box>
  );
}