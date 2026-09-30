import { useState } from "react";
import { Link } from "react-router-dom";
import { PiEnvelopeSimpleDuotone, PiChatCircleDotsDuotone, PiCheckCircleDuotone, PiWarningCircleDuotone } from "react-icons/pi";
import Field from "../components/Field.jsx";
import { api } from "../lib/api.js";

const TOPICS = [
  "Before signing up",
  "Help with registration",
  "API and integration",
  "A payment to my business",
  "I paid a business",
  "My account",
  "Something else",
];

const blank = { topic: "", name: "", email: "", phone: "", business: "", subject: "", message: "", website: "" };

const NEXT = [
  ["You send us the details", "The more specific you are, the faster we can help."],
  ["We look into it", "Someone on our team reads your message and checks your account or payment."],
  ["We reply by email", "You will hear back at the email address you gave us."],
];

const Contact = () => {
  const [f, setF] = useState(blank);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value });
    if (errors[k]) setErrors({ ...errors, [k]: "" });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setErrors({});
    setBusy(true);
    try {
      await api("/api/contact", { method: "POST", body: f });
      setSent(true);
    } catch (err) {
      setErrors(err.fields || {});
      if (!err.fields || !Object.keys(err.fields).length) setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="auth">
        <div className="auth-card center">
          <div style={{ color: "var(--success)" }}><PiCheckCircleDuotone size={54} /></div>
          <h1 style={{ marginTop: 10 }}>Message sent</h1>
          <p className="muted" style={{ margin: "8px 0 20px" }}>Thanks, we will reply to <strong style={{ color: "var(--text)" }}>{f.email}</strong>.</p>
          <Link className="btn btn-primary" to="/">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "50px 20px 20px" }}>
      <div className="section-head" style={{ marginBottom: 32 }}>
        <h2>Contact support</h2>
        <p>Questions before you sign up, help with integration, or a payment that needs a look.</p>
      </div>

      <div className="contact-grid">
        <form className="form-card" onSubmit={submit} noValidate>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Send us a message</h2>
          <p className="hint" style={{ margin: "6px 0 10px", display: "flex", gap: 6, alignItems: "flex-start" }}>
            <PiWarningCircleDuotone size={16} style={{ flex: "0 0 16px", marginTop: 2 }} aria-hidden="true" />
            Never send passwords, OTPs, API keys or full card or bank numbers.
          </p>

          {/* Honeypot: hidden from people, tempting to bots. */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
            <label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} /></label>
          </div>

          <div className="form-grid">
            <Field className="full" as="select" label="What is it about?" required value={f.topic} onChange={set("topic")} error={errors.topic}>
              <option value="">Select…</option>
              {TOPICS.map((t) => <option key={t}>{t}</option>)}
            </Field>
            <Field label="Your name" required value={f.name} onChange={set("name")} error={errors.name} autoComplete="name" />
            <Field label="Email" type="email" required value={f.email} onChange={set("email")} error={errors.email} autoComplete="email" hint="We reply to this address" />
            <Field label="Phone" type="tel" value={f.phone} onChange={set("phone")} error={errors.phone} hint="Only if you would like a call back" />
            <Field label="Your business name" value={f.business} onChange={set("business")} />
            <Field className="full" label="Subject" required value={f.subject} onChange={set("subject")} error={errors.subject} />
            <Field className="full" as="textarea" label="How can we help?" required value={f.message} onChange={set("message")} error={errors.message} hint="At least 20 characters" />
          </div>

          {error && <div className="error" role="alert">{error}</div>}
          <button className="btn btn-primary" disabled={busy}>{busy ? "Sending…" : "Send message"}</button>
        </form>

        <aside>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 14 }}>What happens next</h3>
            <ol className="next-list">
              {NEXT.map(([t, d]) => (
                <li key={t}><strong>{t}</strong><span className="muted">{d}</span></li>
              ))}
            </ol>
          </div>
          <div className="card feature">
            <div className="icon"><PiChatCircleDotsDuotone size={24} /></div>
            <h3>Quick answers</h3>
            <p>Most questions about registration, callbacks and going live are covered in the <Link to="/docs" className="inline-link">docs</Link> and the <a href="/#faq" className="inline-link">FAQ</a>.</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Contact;
