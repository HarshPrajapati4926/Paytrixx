import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { PiPlusBold, PiTrashDuotone, PiCheckCircleDuotone, PiClockDuotone, PiEnvelopeSimpleDuotone } from "react-icons/pi";
import Field from "../components/Field.jsx";
import Stepper from "../components/Stepper.jsx";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

const KEYS = ["business", "owners", "address", "bank", "documents"]; // wizard steps 1..5

const FORM_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh",
  "Lakshadweep", "Puducherry",
];

const BUSINESS_TYPES = ["Sole proprietorship", "Partnership", "LLP", "Private limited", "Public limited", "Trust / NGO", "Other"];

/* ── Shared step shell ─────────────────────────────────────────────────── */

const StepForm = ({ stepNo, title, intro, onSubmit, onBack, busy, error, children, submitLabel = "Save and continue" }) => (
  <form className="form-card" onSubmit={onSubmit} noValidate>
    <p className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Step {stepNo} of 7</p>
    <h1>{title}</h1>
    {intro && <p className="muted" style={{ marginBottom: 6 }}>{intro}</p>}
    <div style={{ marginTop: 10 }}>{children}</div>
    {error && <div className="error" role="alert">{error}</div>}
    <div className="form-actions">
      {onBack ? <button type="button" className="btn btn-ghost" onClick={onBack}>Back</button> : <span />}
      <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : submitLabel}</button>
    </div>
  </form>
);

/* ── 0. Verify email ───────────────────────────────────────────────────── */

const VerifyEmail = ({ application, onVerified }) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const verify = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await api("/api/auth/verify-email", { method: "POST", body: { code: code.trim() } });
      onVerified(r.application);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError("");
    setNote("");
    try {
      const r = await api("/api/auth/resend-code", { method: "POST" });
      setNote(r.message);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="form-card" onSubmit={verify} noValidate>
      <p className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Step 1 of 7</p>
      <h1>Verify your email</h1>
      <p className="muted" style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <PiEnvelopeSimpleDuotone size={20} aria-hidden="true" /> We sent a 6-digit code to <strong style={{ color: "var(--text)" }}>{application.email}</strong>
      </p>
      <Field label="Verification code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required autoFocus
        value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="123456" />
      {error && <div className="error" role="alert">{error}</div>}
      {note && <div className="ok" role="status">{note}</div>}
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={resend}>Send a new code</button>
        <button className="btn btn-primary" disabled={busy || code.length !== 6}>{busy ? "Verifying…" : "Verify email"}</button>
      </div>
    </form>
  );
};

/* ── 1. Business ───────────────────────────────────────────────────────── */

const useStep = (keyName, application, setApplication, goNext) => {
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (payload) => {
    setError("");
    setErrors({});
    setBusy(true);
    try {
      const r = await api(`/api/onboarding/steps/${keyName}`, { method: "PUT", body: payload });
      setApplication(r.application);
      goNext();
    } catch (err) {
      setErrors(err.fields || {});
      if (!err.fields || !Object.keys(err.fields).length) setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return { errors, error, busy, save, clear: (k) => setErrors((e) => ({ ...e, [k]: "" })) };
};

const BusinessStep = ({ application, setApplication, goNext, goBack }) => {
  const b = application.business || {};
  const [f, setF] = useState({ name: b.name || "", type: b.type || "", website: b.website || "", description: b.description || "" });
  const s = useStep("business", application, setApplication, goNext);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); s.clear(k); };

  return (
    <StepForm stepNo={2} title="About your business" intro="Tell us what you are accepting payments for." busy={s.busy} error={s.error}
      onBack={goBack} onSubmit={(e) => { e.preventDefault(); s.save(f); }}>
      <div className="form-grid">
        <Field className="full" label="Registered business name" required value={f.name} onChange={set("name")} error={s.errors.name} autoFocus />
        <Field as="select" label="Business type" required value={f.type} onChange={set("type")} error={s.errors.type}>
          <option value="">Select…</option>
          {BUSINESS_TYPES.map((t) => <option key={t}>{t}</option>)}
        </Field>
        <Field label="Website" type="url" placeholder="https://yourshop.com" value={f.website} onChange={set("website")} error={s.errors.website} />
        <Field className="full" as="textarea" label="What do you sell?" maxLength={500} value={f.description} onChange={set("description")} error={s.errors.description}
          hint="A sentence or two is enough." />
      </div>
    </StepForm>
  );
};

/* ── 2. Owners ─────────────────────────────────────────────────────────── */

const blankOwner = { name: "", email: "", phone: "", designation: "" };

const OwnersStep = ({ application, setApplication, goNext, goBack }) => {
  const [owners, setOwners] = useState(application.owners?.length ? application.owners : [{ ...blankOwner }]);
  const s = useStep("owners", application, setApplication, goNext);
  const edit = (i, k) => (e) => { setOwners(owners.map((o, idx) => (idx === i ? { ...o, [k]: e.target.value } : o))); s.clear(`owners.${i}.${k}`); };

  return (
    <StepForm stepNo={3} title="Owners and directors" intro="Add everyone who owns or directs the business." busy={s.busy} error={s.error || s.errors.owners}
      onBack={goBack} onSubmit={(e) => { e.preventDefault(); s.save({ owners }); }}>
      {owners.map((o, i) => (
        <div className="owner-card" key={i}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <strong>Owner {i + 1}</strong>
            {owners.length > 1 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOwners(owners.filter((_, idx) => idx !== i))}>
                <PiTrashDuotone size={16} aria-hidden="true" /> Remove
              </button>
            )}
          </div>
          <div className="form-grid">
            <Field label="Full name" required value={o.name} onChange={edit(i, "name")} error={s.errors[`owners.${i}.name`]} />
            <Field label="Designation" placeholder="Director, Partner…" value={o.designation} onChange={edit(i, "designation")} />
            <Field label="Email" type="email" value={o.email} onChange={edit(i, "email")} error={s.errors[`owners.${i}.email`]} />
            <Field label="Mobile number" prefix="+91" inputMode="numeric" maxLength={13} value={o.phone} onChange={edit(i, "phone")} error={s.errors[`owners.${i}.phone`]} />
          </div>
        </div>
      ))}
      {owners.length < 10 && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOwners([...owners, { ...blankOwner }])} style={{ marginBottom: 14 }}>
          <PiPlusBold size={14} aria-hidden="true" /> Add another owner
        </button>
      )}
    </StepForm>
  );
};

/* ── 3. Address ────────────────────────────────────────────────────────── */

const AddressStep = ({ application, setApplication, goNext, goBack }) => {
  const a = application.address || {};
  const [f, setF] = useState({ line1: a.line1 || "", line2: a.line2 || "", city: a.city || "", state: a.state || "", pincode: a.pincode || "" });
  const s = useStep("address", application, setApplication, goNext);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); s.clear(k); };

  return (
    <StepForm stepNo={4} title="Business address" intro="The registered address of your business in India." busy={s.busy} error={s.error}
      onBack={goBack} onSubmit={(e) => { e.preventDefault(); s.save(f); }}>
      <div className="form-grid">
        <Field className="full" label="Address line 1" required value={f.line1} onChange={set("line1")} error={s.errors.line1} autoFocus />
        <Field className="full" label="Address line 2" value={f.line2} onChange={set("line2")} />
        <Field label="City" required value={f.city} onChange={set("city")} error={s.errors.city} />
        <Field as="select" label="State" required value={f.state} onChange={set("state")} error={s.errors.state}>
          <option value="">Select…</option>
          {FORM_STATES.map((st) => <option key={st}>{st}</option>)}
        </Field>
        <Field label="PIN code" required inputMode="numeric" maxLength={6} value={f.pincode} onChange={set("pincode")} error={s.errors.pincode} />
      </div>
    </StepForm>
  );
};

/* ── 4. Bank ───────────────────────────────────────────────────────────── */

const BankStep = ({ application, setApplication, goNext, goBack }) => {
  const b = application.bank || {};
  const saved = Boolean(b.accountLast4);
  const [f, setF] = useState({ accountHolder: b.accountHolder || "", bankName: b.bankName || "", ifsc: b.ifsc || "", accountNumber: "", confirmAccountNumber: "" });
  const s = useStep("bank", application, setApplication, goNext);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); s.clear(k); };

  // For security the saved account number is never sent back, so a returning user
  // can keep it by leaving both number fields empty.
  const keepSaved = saved && !f.accountNumber && !f.confirmAccountNumber;

  return (
    <StepForm stepNo={5} title="Bank account" intro="The account your business uses." busy={s.busy} error={s.error}
      onBack={goBack} onSubmit={(e) => { e.preventDefault(); keepSaved ? goNext() : s.save(f); }}>
      <div className="form-grid">
        <Field className="full" label="Account holder name" required value={f.accountHolder} onChange={set("accountHolder")} error={s.errors.accountHolder} autoFocus />
        <Field label="Bank name" required value={f.bankName} onChange={set("bankName")} error={s.errors.bankName} />
        <Field label="IFSC code" required maxLength={11} placeholder="HDFC0001234" value={f.ifsc} onChange={(e) => set("ifsc")({ target: { value: e.target.value.toUpperCase() } })} error={s.errors.ifsc} />
        <Field label="Account number" inputMode="numeric" autoComplete="off" required={!saved} value={f.accountNumber} onChange={set("accountNumber")} error={s.errors.accountNumber}
          hint={saved ? `Saved ending ${b.accountLast4}. Leave blank to keep it.` : undefined} />
        <Field label="Confirm account number" inputMode="numeric" autoComplete="off" required={!saved} value={f.confirmAccountNumber} onChange={set("confirmAccountNumber")} error={s.errors.confirmAccountNumber} />
      </div>
    </StepForm>
  );
};

/* ── 5. Documents ──────────────────────────────────────────────────────── */

const DocumentsStep = ({ application, setApplication, goNext, goBack }) => {
  const d = application.documents || {};
  const [f, setF] = useState({ pan: "", gst: "" });
  const s = useStep("documents", application, setApplication, goNext);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value.toUpperCase() }); s.clear(k); };
  const keepSaved = Boolean(d.panLast4) && !f.pan && !f.gst;

  return (
    <StepForm stepNo={6} title="Business documents" intro="Identifiers we use to verify your business. Stored encrypted." busy={s.busy} error={s.error}
      onBack={goBack} onSubmit={(e) => { e.preventDefault(); keepSaved ? goNext() : s.save(f); }}>
      <div className="form-grid">
        <Field label="PAN" required={!d.panLast4} maxLength={10} placeholder="ABCDE1234F" autoComplete="off" value={f.pan} onChange={set("pan")} error={s.errors.pan}
          hint={d.panLast4 ? `Saved ending ${d.panLast4}. Leave blank to keep it.` : "Business or owner PAN"} autoFocus />
        <Field label="GSTIN (optional)" maxLength={15} autoComplete="off" value={f.gst} onChange={set("gst")} error={s.errors.gst}
          hint={d.gstLast4 ? `Saved ending ${d.gstLast4}.` : "If you are GST registered"} />
      </div>
    </StepForm>
  );
};

/* ── 6. Review ─────────────────────────────────────────────────────────── */

const Section = ({ title, onEdit, children }) => (
  <div>
    <div className="row" style={{ justifyContent: "space-between" }}>
      <h3>{title}</h3>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onEdit}>Edit</button>
    </div>
    <div style={{ fontSize: 14.5 }}>{children}</div>
  </div>
);

const ReviewStep = ({ application, setApplication, goTo, goBack }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const a = application;

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      const r = await api("/api/onboarding/submit", { method: "POST" });
      setApplication(r.application);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-card">
      <p className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Step 7 of 7</p>
      <h1>Review and submit</h1>
      <p className="muted" style={{ marginBottom: 18 }}>Check your details. After you submit, our team reviews your application.</p>

      {a.status === "rejected" && (
        <div className="error" role="alert"><strong>Changes needed:</strong> {a.reviewNote}</div>
      )}

      <div className="review-list">
        <Section title="Business" onEdit={() => goTo(1)}>
          {a.business.name} · {a.business.type}{a.business.website ? ` · ${a.business.website}` : ""}
        </Section>
        <Section title="Owners" onEdit={() => goTo(2)}>
          {a.owners.map((o, i) => <div key={i}>{o.name}{o.designation ? `, ${o.designation}` : ""}</div>)}
        </Section>
        <Section title="Address" onEdit={() => goTo(3)}>
          {a.address.line1}{a.address.line2 ? `, ${a.address.line2}` : ""}, {a.address.city}, {a.address.state} {a.address.pincode}
        </Section>
        <Section title="Bank account" onEdit={() => goTo(4)}>
          {a.bank.accountHolder} · {a.bank.bankName} · •••• {a.bank.accountLast4} · {a.bank.ifsc}
        </Section>
        <Section title="Documents" onEdit={() => goTo(5)}>
          PAN •••• {a.documents.panLast4}{a.documents.gstLast4 ? ` · GSTIN •••• ${a.documents.gstLast4}` : ""}
        </Section>
      </div>

      {error && <div className="error" role="alert" style={{ marginTop: 14 }}>{error}</div>}
      <div className="form-actions" style={{ marginTop: 22 }}>
        <button type="button" className="btn btn-ghost" onClick={goBack}>Back</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? "Submitting…" : a.status === "rejected" ? "Resubmit application" : "Submit application"}</button>
      </div>
    </div>
  );
};

/* ── Status screen (after submit) ──────────────────────────────────────── */

const StatusScreen = ({ application }) => (
  <div className="form-card center" style={{ padding: "44px 30px" }}>
    <div style={{ color: "var(--primary)", marginBottom: 14 }}>
      {application.status === "approved" ? <PiCheckCircleDuotone size={56} /> : <PiClockDuotone size={56} />}
    </div>
    <h1>Application submitted</h1>
    <p className="muted" style={{ margin: "10px auto 22px", maxWidth: 420 }}>
      Thanks! Our team is reviewing your details. We will email <strong style={{ color: "var(--text)" }}>{application.email}</strong> as soon as there is an update.
      You can sign in again any time to check the status.
    </p>
    <span className="badge pending">In review</span>
    <p style={{ marginTop: 22 }}><Link className="btn btn-ghost" to="/contact">Contact support</Link></p>
  </div>
);

/* ── Wizard ────────────────────────────────────────────────────────────── */

const Onboarding = () => {
  const { token, role, application, setApplication, logout } = useAuth();
  const [step, setStep] = useState(null);

  // Start on the first incomplete step once the application has loaded.
  const done = useMemo(() => {
    const set = new Set();
    if (application?.emailVerified) set.add(0);
    KEYS.forEach((k, i) => application?.progress?.[k] && set.add(i + 1));
    return set;
  }, [application]);

  useEffect(() => {
    if (!application || step !== null) return;
    if (!application.emailVerified) return setStep(0);
    const first = KEYS.findIndex((k) => !application.progress[k]);
    setStep(first === -1 ? 6 : first + 1);
  }, [application, step]);

  if (!token) return <Navigate to="/login" replace />;
  if (role === "merchant") return <Navigate to="/dashboard" replace />;
  if (!application || step === null) return <div className="wizard"><div className="skeleton" style={{ height: 300, gridColumn: "1 / -1" }} /></div>;

  const locked = application.status === "submitted" || application.status === "approved";
  const next = () => setStep((s) => Math.min(6, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const common = { application, setApplication, goNext: next, goBack: back };

  let body;
  if (locked) body = <StatusScreen application={application} />;
  else if (step === 0 || !application.emailVerified) {
    body = <VerifyEmail application={application} onVerified={(a) => { setApplication(a); setStep(1); }} />;
  } else if (step === 1) body = <BusinessStep {...common} goBack={() => setStep(0)} />;
  else if (step === 2) body = <OwnersStep {...common} />;
  else if (step === 3) body = <AddressStep {...common} />;
  else if (step === 4) body = <BankStep {...common} />;
  else if (step === 5) body = <DocumentsStep {...common} />;
  else body = <ReviewStep application={application} setApplication={setApplication} goTo={setStep} goBack={back} />;

  return (
    <div className="wizard">
      <div>
        <Stepper current={locked ? 6 : step} done={locked ? new Set([0, 1, 2, 3, 4, 5, 6]) : done} onSelect={locked ? undefined : setStep} />
        <p className="muted" style={{ fontSize: 13, margin: "18px 12px 0" }}>
          Signed in as {application.email}<br />
          <button type="button" onClick={logout} className="inline-link" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit" }}>Sign out</button>
        </p>
      </div>
      {body}
    </div>
  );
};

export default Onboarding;
