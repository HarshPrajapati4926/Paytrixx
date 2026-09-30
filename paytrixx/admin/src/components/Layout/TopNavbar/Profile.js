"use client";

import React, { useState } from "react";
import {
  IconButton, Typography, Box, Tooltip, Avatar,
  Menu, MenuItem, Divider,
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Logout            from "@mui/icons-material/Logout";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import SettingsIcon      from "@mui/icons-material/Settings";
import LockResetIcon     from "@mui/icons-material/LockReset";
import { useAppSelector, useAppDispatch } from "../../../hooks/reduxHooks";
import { logout }        from "../../../features/auth/authSlice";

const getAvatarColor = (name = "") => {
  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];
  return colors[(name.charCodeAt(0) || 0) % colors.length];
};

const getInitials = (name = "") =>
  name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

const Profile = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const user     = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/sign-in");
  };

  return (
    <>
      <Tooltip title="Account settings">
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          size="small"
          sx={{ p: 0, borderRadius: "5px" }}
          aria-controls={open ? "account-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
        >
          <Avatar
            src={user?.profilePhoto || undefined}
            alt={user?.name || "Admin"}
            sx={{
              width: { xs: "35px", sm: "42px" },
              height: { xs: "35px", sm: "42px" },
              border: "2px solid #C2CDFF",
              bgcolor: user?.profilePhoto ? "transparent" : getAvatarColor(user?.name),
              fontSize: 15,
              fontWeight: 700,
            }}
            className="mr-8"
          >
            {!user?.profilePhoto && getInitials(user?.name)}
          </Avatar>

          <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "left" }}>
            <Typography variant="h3" sx={{ fontWeight: 600, fontSize: "13px", lineHeight: 1.3 }} className="text-black">
              {user?.name || "Admin"}
            </Typography>
            {user?.designation && (
              <Typography sx={{ fontSize: "11px", color: "text.secondary", lineHeight: 1 }}>
                {user.designation}
              </Typography>
            )}
          </Box>

          <KeyboardArrowDownIcon sx={{ fontSize: "15px", ml: 0.5 }} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={() => setAnchorEl(null)}
        onClick={() => setAnchorEl(null)}
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: "7px",
            boxShadow: "0 4px 45px #0000001a",
            overflow: "visible",
            minWidth: 210,
            mt: 1.5,
            "&:before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: "background.paper",
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        className="for-dark-top-navList"
      >
        {/* User card */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5 }}>
          <Avatar
            src={user?.profilePhoto || undefined}
            alt={user?.name || "Admin"}
            sx={{
              width: 40, height: 40,
              border: "2px solid #C2CDFF",
              bgcolor: user?.profilePhoto ? "transparent" : getAvatarColor(user?.name),
              fontSize: 14, fontWeight: 700, flexShrink: 0,
            }}
          >
            {!user?.profilePhoto && getInitials(user?.name)}
          </Avatar>
          <Box>
            <Typography sx={{ fontSize: "13px", fontWeight: 600 }} className="text-black">
              {user?.name || "Admin"}
            </Typography>
            <Typography sx={{ fontSize: "11px", color: "text.secondary", textTransform: "capitalize" }}>
              {user?.designation || user?.role || ""}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: "#F6F7F9" }} />

        <MenuItem
          component={Link}
          to="/my-profile"
          sx={{ padding: "8px 20px", fontSize: 13, gap: 1.5, color: pathname === "/my-profile" ? "primary.main" : "text.primary" }}
        >
          <AccountCircleIcon sx={{ fontSize: "18px" }} />
          My Profile
        </MenuItem>

        <MenuItem
          component={Link}
          to="/my-profile"
          sx={{ padding: "8px 20px", fontSize: 13, gap: 1.5, color: "text.primary" }}
        >
          <LockResetIcon sx={{ fontSize: "18px" }} />
          Change Password
        </MenuItem>

        <MenuItem
          component={Link}
          to="/my-profile"
          sx={{ padding: "8px 20px", fontSize: 13, gap: 1.5, color: "text.primary" }}
        >
          <SettingsIcon sx={{ fontSize: "18px" }} />
          Settings
        </MenuItem>

        <Divider sx={{ borderColor: "#F6F7F9" }} />

        <MenuItem
          onClick={handleLogout}
          sx={{ padding: "8px 20px", fontSize: 13, gap: 1.5, color: "#ef4444" }}
        >
          <Logout sx={{ fontSize: "18px" }} />
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};

export default Profile;
