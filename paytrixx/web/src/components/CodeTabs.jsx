import { useState } from "react";

// samples: [{ label, code }]
const CodeTabs = ({ samples }) => {
  const [i, setI] = useState(0);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(samples[i].code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — user can still select the text */
    }
  };

  return (
    <div className="code">
      <div className="code-tabs" role="tablist">
        {samples.map((s, idx) => (
          <button key={s.label} role="tab" aria-selected={idx === i} className={`code-tab ${idx === i ? "active" : ""}`} onClick={() => setI(idx)}>
            {s.label}
          </button>
        ))}
      </div>
      <button className="code-copy" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
      <pre><code>{samples[i].code}</code></pre>
    </div>
  );
};

export default CodeTabs;
