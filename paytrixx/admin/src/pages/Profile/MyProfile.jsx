import React, { useState } from "react";
import { Box, Button, Card, TextField, Typography } from "@mui/material";
import { toast } from "react-toastify";
import api from "../../services/api";
import PageHeader from "../../components/common/PageHeader";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import { logout } from "../../features/auth/authSlice";

// PUT /api/admin/change-password { currentPassword, newPassword }
const MyProfile = () => {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  const mismatch = form.confirm && form.newPassword !== form.confirm;
  const valid =
    form.currentPassword && form.newPassword.length >= 6 && form.newPassword === form.confirm;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/api/admin/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success("Password changed. Please sign in again.");
      dispatch(logout());
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change password");
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Box sx={{ p: { xs: "15px", md: "25px" } }}>
      <PageHeader title="My Profile" subtitle="Your admin account" />

      <Card className="rmui-card" sx={{ boxShadow: "none", borderRadius: "7px", p: "24px", maxWidth: 520, mb: 3 }}>
        <Typography className="text-black" sx={{ fontWeight: 600, fontSize: 18 }}>{user?.name || "Admin"}</Typography>
        <Typography sx={{ fontSize: 13 }}>{user?.email}</Typography>
        <Typography sx={{ fontSize: 13, textTransform: "capitalize" }}>Role: {user?.role || "admin"}</Typography>
      </Card>

      <Card
        component="form"
        onSubmit={submit}
        className="rmui-card"
        sx={{ boxShadow: "none", borderRadius: "7px", p: "24px", maxWidth: 520, display: "flex", flexDirection: "column", gap: 2 }}
      >
        <Typography className="text-black" sx={{ fontWeight: 600, fontSize: 16 }}>Change password</Typography>
        <TextField size="small" type="password" label="Current password" value={form.currentPassword} onChange={set("currentPassword")} />
        <TextField size="small" type="password" label="New password" helperText="At least 6 characters" value={form.newPassword} onChange={set("newPassword")} />
        <TextField size="small" type="password" label="Confirm new password" error={Boolean(mismatch)} helperText={mismatch ? "Passwords do not match" : ""} value={form.confirm} onChange={set("confirm")} />
        <Button type="submit" variant="contained" disabled={!valid || saving} sx={{ textTransform: "none", alignSelf: "flex-start" }}>
          {saving ? "Saving…" : "Update password"}
        </Button>
      </Card>
    </Box>
  );
};

export default MyProfile;
