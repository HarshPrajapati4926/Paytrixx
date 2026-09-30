import React from "react";
import { Box, Typography } from "@mui/material";

const PageHeader = ({ title, subtitle, action }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: { xs: "flex-start", sm: "center" },
      justifyContent: "space-between",
      flexDirection: { xs: "column", sm: "row" },
      gap: 1.5,
      mb: "20px",
    }}
  >
    <Box>
      <Typography
        variant="h3"
        className="text-black"
        sx={{ fontSize: { xs: "20px", md: "26px" }, fontWeight: 800, mb: 0.5 }}
      >
        {title}
      </Typography>
      {subtitle && <Typography sx={{ fontSize: 13 }}>{subtitle}</Typography>}
    </Box>
    {action}
  </Box>
);

export default PageHeader;
