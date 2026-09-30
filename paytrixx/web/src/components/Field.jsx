import { useId, useState } from "react";
import { PiEyeDuotone, PiEyeSlashDuotone } from "react-icons/pi";

// Label + input + hint + error, wired together for screen readers.
const Field = ({ label, error, hint, className = "", as = "input", children, prefix, ...props }) => {
  const id = useId();
  const Tag = as;
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>{label}{props.required ? <span aria-hidden="true" style={{ color: "var(--danger)" }}> *</span> : null}</label>
      {prefix ? (
        <div className="phone-row">
          <input className="input" value={prefix} readOnly tabIndex={-1} aria-label="Country code" />
          <Tag id={id} className={`input ${error ? "invalid" : ""}`} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined} {...props}>{children}</Tag>
        </div>
      ) : (
        <Tag id={id} className={`input ${error ? "invalid" : ""}`} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined} {...props}>{children}</Tag>
      )}
      {error ? <span id={`${id}-e`} className="field-error" role="alert">{error}</span> : hint ? <span id={`${id}-h`} className="hint">{hint}</span> : null}
    </div>
  );
};

export const PasswordField = ({ label = "Password", ...props }) => {
  const [show, setShow] = useState(false);
  const id = useId();
  const { error, hint, ...rest } = props;
  return (
    <div className="field">
      <label htmlFor={id}>{label}{rest.required ? <span aria-hidden="true" style={{ color: "var(--danger)" }}> *</span> : null}</label>
      <div style={{ position: "relative" }}>
        <input id={id} className={`input ${error ? "invalid" : ""}`} style={{ paddingRight: 42 }} type={show ? "text" : "password"} aria-invalid={Boolean(error)} {...rest} />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? "Hide password" : "Show password"}
          style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 6, display: "grid" }}
        >
          {show ? <PiEyeSlashDuotone size={20} /> : <PiEyeDuotone size={20} />}
        </button>
      </div>
      {error ? <span className="field-error" role="alert">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
};

export default Field;
