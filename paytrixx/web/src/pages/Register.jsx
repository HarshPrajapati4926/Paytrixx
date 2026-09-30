import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { PiCheckBold, PiCircleDuotone } from "react-icons/pi";
import Field, { PasswordField } from "../components/Field.jsx";
import Stepper from "../components/Stepper.jsx";
import { useAuth } from "../lib/auth.jsx";

const RULES = [
  ["8+ characters", (p) => p.length >= 8],
  ["Uppercase letter", (p) => /[A-Z]/.test(p)],
  ["Lowercase letter", (p) => /[a-z]/.test(p)],
  ["A digit", (p) => /\d/.test(p)],
  ["A symbol", (p) => /[^A-Za-z0-9]/.test(p)],
];

// Step 1 of 7. Email verification and the remaining steps happen in /onboarding.
const Register = () => {
  const { token, role, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", phone: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (token) return <Navigate to={role === "applicant" ? "/onboarding" : "/dashboard"} replace />;

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    if (errors[k]) setErrors({ ...errors, [k]: "" });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setErrors({});
    if (form.password !== form.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }
    setBusy(true);
    try {
      await register(form);
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setErrors(err.fields || {});
      if (!err.fields || !Object.keys(err.fields).length) setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wizard">
      <Stepper current={0} />
      <form className="form-card" onSubmit={submit} noValidate>
        <p className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Step 1 of 7</p>
        <h1>Create your account</h1>
        <p className="muted" style={{ marginBottom: 6 }}>Your progress is saved as you go. Sign in anytime to continue.</p>

        <div className="form-grid" style={{ marginTop: 10 }}>
          <Field className="full" label="Work email" type="email" autoComplete="email" required autoFocus
            value={form.email} onChange={set("email")} error={errors.email}
            hint="We will email you a code to confirm it is yours." />
          <Field className="full" label="Mobile number" type="tel" inputMode="numeric" autoComplete="tel-national" required
            prefix="+91" maxLength={13} value={form.phone} onChange={set("phone")} error={errors.phone} placeholder="98765 43210" />
          <div className="full">
            <PasswordField label="Password" autoComplete="new-password" required
              value={form.password} onChange={set("password")} error={errors.password} />
            <div className="pw-rules hint" aria-live="polite">
              {RULES.map(([label, test]) => (
                <span key={label} className={form.password && test(form.password) ? "ok-r" : ""} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {form.password && test(form.password) ? <PiCheckBold size={12} /> : <PiCircleDuotone size={12} />} {label}
                </span>
              ))}
            </div>
          </div>
          <div className="full">
            <PasswordField label="Confirm password" autoComplete="new-password" required
              value={form.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword} />
          </div>
        </div>

        {error && <div className="error" role="alert">{error}</div>}

        <button className="btn btn-primary" style={{ width: "100%", marginTop: 8 }} disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>
        <p className="muted center" style={{ marginTop: 16, fontSize: 14 }}>
          Already started? <Link to="/login" className="inline-link">Sign in to continue</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
