import React from "react";
import { Box, Card, Skeleton, Typography } from "@mui/material";

const StatCard = ({ label, value, icon, color = "#605DFF", loading, hint }) => (
  <Card className="rmui-card" sx={{ boxShadow: "none", borderRadius: "7px" }}>
    <Box className="card-body bg-white p-4 rounded-2" sx={{ padding: "24px", borderRadius: "7px" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography sx={{ fontSize: 13 }}>{label}</Typography>
          {loading ? (
            <Skeleton width={90} height={38} />
          ) : (
            <Typography
              variant="h3"
              className="text-black"
              sx={{ fontSize: 26, fontWeight: 800, mt: 0.5 }}
            >
              {value}
            </Typography>
          )}
          {hint && <Typography sx={{ fontSize: 12, mt: 0.5 }}>{hint}</Typography>}
        </Box>
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: "12px",
            bgcolor: `${color}1A`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span className="material-symbols-outlined" style={{ color, fontSize: 24 }}>
            {icon}
          </span>
        </Box>
      </Box>
    </Box>
  </Card>
);

export default StatCard;
