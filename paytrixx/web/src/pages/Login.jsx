import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Field, { PasswordField } from "../components/Field.jsx";
import { useAuth } from "../lib/auth.jsx";

const Login = () => {
  const { token, role, login, loginWithKey } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("password"); // "password" | "key"
  const [form, setForm] = useState({ email: "", password: "", apiKey: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (token) return <Navigate to={role === "applicant" ? "/onboarding" : "/dashboard"} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = mode === "password" ? await login(form.email.trim(), form.password) : await loginWithKey(form.apiKey.trim());
      navigate(r === "applicant" ? "/onboarding" : "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit}>
        <h1>Sign in</h1>
        <p className="muted">Sign in to your dashboard, or pick up your registration where you left off.</p>

        <div className="tabs" role="tablist" style={{ margin: "18px 0 0" }}>
          <button type="button" role="tab" aria-selected={mode === "password"} className={`tab ${mode === "password" ? "active" : ""}`} onClick={() => { setMode("password"); setError(""); }}>Email and password</button>
          <button type="button" role="tab" aria-selected={mode === "key"} className={`tab ${mode === "key" ? "active" : ""}`} onClick={() => { setMode("key"); setError(""); }}>API key</button>
        </div>

        {mode === "password" ? (
          <>
            <Field label="Work email" type="email" autoComplete="email" required autoFocus value={form.email} onChange={set("email")} />
            <PasswordField label="Password" autoComplete="current-password" required value={form.password} onChange={set("password")} />
          </>
        ) : (
          <>
            <Field label="API key" type="password" className="mono" autoComplete="off" required autoFocus placeholder="pk_live_…"
              value={form.apiKey} onChange={set("apiKey")}
              hint="Used once to start an 8-hour session. It is not stored in your browser." />
          </>
        )}

        {error && <div className="error" role="alert">{error}</div>}

        <button className="btn btn-primary" style={{ width: "100%" }} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <p className="muted center" style={{ marginTop: 16, fontSize: 14 }}>
          New to Paytrixx? <Link to="/register" className="inline-link">Create an account</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
