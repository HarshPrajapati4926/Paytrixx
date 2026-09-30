import { useEffect, useState } from "react";
import { PiCopyDuotone, PiCheckCircleDuotone } from "react-icons/pi";
import { api } from "../../lib/api.js";
import { useAuth } from "../../lib/auth.jsx";
import { formatDateTime } from "../../lib/format.js";

const CopyField = ({ value, label }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked — the field is selectable */ }
  };
  return (
    <div className="row">
      <input className="input mono" style={{ flex: 1, minWidth: 240 }} readOnly value={value} aria-label={label} onFocus={(e) => e.target.select()} />
      <button type="button" className="btn btn-primary btn-sm" onClick={copy}>
        {copied ? <PiCheckCircleDuotone size={17} aria-hidden="true" /> : <PiCopyDuotone size={17} aria-hidden="true" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
};

const Settings = () => {
  const { merchant, setMerchant } = useAuth();
  const [callbackUrl, setCallbackUrl] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [secret, setSecret] = useState("");

  useEffect(() => {
    if (merchant) setCallbackUrl(merchant.callbackUrl || "");
  }, [merchant]);

  const hasKey = Boolean(merchant?.apiKeyPreview);

  const saveUrl = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      const r = await api("/api/merchant/settings", { method: "PATCH", body: { callbackUrl: callbackUrl.trim() } });
      setMerchant({ ...merchant, ...r.data });
      setMsg({ type: "ok", text: "Callback URL saved." });
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const generate = async () => {
    if (hasKey && !window.confirm("Regenerate your API key? The current key stops working immediately, so update your server right after.")) return;
    setMsg({ type: "", text: "" });
    try {
      const r = await api("/api/merchant/regenerate-key", { method: "POST" });
      setMerchant({ ...merchant, ...r.data });
      setNewKey(r.apiKey);
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const toggleSecret = async () => {
    if (secret) return setSecret("");
    try {
      const r = await api("/api/merchant/webhook-secret");
      setSecret(r.webhookSecret);
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  };

  return (
    <>
      <div className="page-head"><h1>Settings</h1></div>
      {msg.text && <div className={msg.type} role="status">{msg.text}</div>}

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head"><h2>Account</h2></div>
        <div className="panel-body">
          <dl className="kv" style={{ margin: 0 }}>
            <dt>Business name</dt><dd>{merchant?.name || "—"}</dd>
            {merchant?.email && (<><dt>Login email</dt><dd>{merchant.email}</dd></>)}
            <dt>Member since</dt><dd>{formatDateTime(merchant?.createdAt)}</dd>
          </dl>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head"><h2>API key</h2></div>
        <div className="panel-body">
          <dl className="kv" style={{ margin: "0 0 16px" }}>
            <dt>Current key</dt><dd className="mono">{hasKey ? merchant.apiKeyPreview : "Not generated yet"}</dd>
          </dl>
          <p className="muted" style={{ fontSize: 14.5, marginBottom: 14 }}>
            {hasKey
              ? "For security only a preview is kept. If the key is lost or exposed, generate a new one — the old key stops working immediately."
              : "Generate your API key to start creating orders from your server. It is shown once, so copy it straight into your server's environment variables."}
          </p>
          <button className={`btn ${hasKey ? "btn-ghost" : "btn-primary"}`} onClick={generate}>{hasKey ? "Regenerate API key" : "Generate API key"}</button>

          {newKey && (
            <div className="callout" style={{ marginTop: 18 }}>
              <strong>Your new API key</strong> — copy it now, it won't be shown again.
              <div style={{ marginTop: 10 }}><CopyField value={newKey} label="New API key" /></div>
            </div>
          )}
        </div>
      </div>

      <form className="panel" style={{ marginBottom: 20 }} onSubmit={saveUrl}>
        <div className="panel-head"><h2>Callback URL</h2></div>
        <div className="panel-body">
          <p className="muted" style={{ marginBottom: 12, fontSize: 14.5 }}>
            We POST the signed payment result here. Must be a public http(s) endpoint on your server.
          </p>
          <div className="row">
            <input className="input" style={{ flex: 1, minWidth: 240 }} type="url" placeholder="https://yourshop.com/payment/callback"
              aria-label="Callback URL" value={callbackUrl} onChange={(e) => setCallbackUrl(e.target.value)} />
            <button className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      </form>

      <div className="panel">
        <div className="panel-head"><h2>Webhook secret</h2></div>
        <div className="panel-body">
          <p className="muted" style={{ fontSize: 14.5, marginBottom: 14 }}>
            Use this to verify the <span className="mono">X-Paytrixx-Signature</span> header on callbacks. Keep it on your server.
          </p>
          <button className="btn btn-ghost" onClick={toggleSecret}>{secret ? "Hide webhook secret" : "Reveal webhook secret"}</button>
          {secret && <div style={{ marginTop: 14 }}><CopyField value={secret} label="Webhook secret" /></div>}
        </div>
      </div>
    </>
  );
};

export default Settings;
