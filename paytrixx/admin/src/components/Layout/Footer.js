"use client";

import * as React from "react";
import { Box, Typography } from "@mui/material";

const Footer = () => (
  <Box
    className="footer-area"
    sx={{
      textAlign: "center",
      bgcolor: "#fff",
      borderRadius: "7px 7px 0 0",
      padding: "20px 25px",
      mt: "auto",
    }}
  >
    <Typography>
      © <span className="text-purple">Paytrixx</span> — Payment Router &amp; Tracking Platform
    </Typography>
  </Box>
);

export default Footer;
