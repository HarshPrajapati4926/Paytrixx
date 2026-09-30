import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Box, Button, Card, Checkbox, FormControlLabel, TextField, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import { loginUser } from "../../features/auth/authSlice";
import Logo from "../../components/common/Logo";

const SignIn = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token, loading, error } = useAppSelector((s) => s.auth);
  const [form, setForm] = useState({ email: "", password: "", remember: false });

  useEffect(() => {
    if (token) navigate("/", { replace: true });
  }, [token, navigate]);

  if (token) return <Navigate to="/" replace />;

  const submit = (e) => {
    e.preventDefault();
    dispatch(loginUser(form));
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#F6F7F9",
        p: 2,
      }}
    >
      <Card
        component="form"
        onSubmit={submit}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: { xs: 3, sm: 4 },
          borderRadius: "12px",
          boxShadow: "0 4px 45px #0000001a",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
          <Logo size={28} />
        </Box>
        <Box sx={{ textAlign: "center", mb: 1 }}>
          <Typography variant="h3" className="text-black" sx={{ fontSize: 22, fontWeight: 800 }}>
            Admin Sign In
          </Typography>
          <Typography sx={{ fontSize: 13 }}>Access the Paytrixx control panel</Typography>
        </Box>

        <TextField
          label="Email" type="email" size="small" required autoFocus fullWidth
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <TextField
          label="Password" type="password" size="small" required fullWidth
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <FormControlLabel
          control={
            <Checkbox
              size="small" checked={form.remember}
              onChange={(e) => setForm({ ...form, remember: e.target.checked })}
            />
          }
          label={<Typography sx={{ fontSize: 13 }}>Keep me signed in</Typography>}
        />

        {error && <Typography color="error" sx={{ fontSize: 13 }}>{error}</Typography>}

        <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ textTransform: "none", fontWeight: 600 }}>
          {loading ? "Signing in…" : "Sign In"}
        </Button>
      </Card>
    </Box>
  );
};

export default SignIn;
