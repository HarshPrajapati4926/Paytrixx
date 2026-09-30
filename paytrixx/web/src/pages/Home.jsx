import { useState } from "react";
import { Link } from "react-router-dom";
import {
  PiChartBarDuotone, PiBellRingingDuotone, PiLockKeyDuotone, PiReceiptDuotone, PiArrowsClockwiseDuotone,
  PiKeyDuotone, PiLightningDuotone, PiSignatureDuotone, PiRepeatDuotone, PiMagnifyingGlassDuotone,
  PiFlaskDuotone, PiPackageDuotone, PiCheckBold, PiShieldCheckDuotone,
} from "react-icons/pi";
import CodeTabs from "../components/CodeTabs.jsx";
import { createOrderSamples, verifySamples } from "../lib/samples.js";

const FEATURES = {
  business: [
    { Icon: PiChartBarDuotone, t: "Every payment in one dashboard", d: "Orders, transactions and their status across your store, filterable by status and date." },
    { Icon: PiBellRingingDuotone, t: "Know the moment you're paid", d: "Your server is notified automatically the second a payment completes or fails." },
    { Icon: PiLockKeyDuotone, t: "Secure hosted payment page", d: "Customers pay on a secure page. Card and UPI details never touch your site." },
    { Icon: PiReceiptDuotone, t: "Clear payment history", d: "Amounts, transaction IDs and timestamps for every attempt, including failed ones." },
    { Icon: PiArrowsClockwiseDuotone, t: "Nothing gets lost", d: "If your server is down when a payment completes, we keep retrying until you've been told." },
    { Icon: PiKeyDuotone, t: "Keys you control", d: "Generate or rotate your API key yourself, any time, from the dashboard." },
  ],
  developers: [
    { Icon: PiLightningDuotone, t: "One call to take a payment", d: "Create an order, redirect the customer, done. Check status whenever you need." },
    { Icon: PiSignatureDuotone, t: "Signed callbacks", d: "Every callback carries an HMAC-SHA256 signature so you can prove it came from us." },
    { Icon: PiRepeatDuotone, t: "Safe retries", d: "Send an Idempotency-Key and a retried request never creates a second order." },
    { Icon: PiMagnifyingGlassDuotone, t: "Status API", d: "Poll GET /api/payment/status/:orderId as a fallback to callbacks." },
    { Icon: PiFlaskDuotone, t: "Test before you go live", d: "Build against our test environment, then switch to live by changing credentials." },
    { Icon: PiPackageDuotone, t: "Plain JSON over HTTPS", d: "No SDK to install. Works from any language that can make an HTTP request." },
  ],
};

const STEPS = [
  { t: "Create your account", d: "Register, verify your email and complete your business details. We review and activate your account." },
  { t: "Get your API key", d: "Open the dashboard and generate your API key and webhook secret." },
  { t: "Create an order", d: "From your server, call POST /api/payment/create and redirect the customer to the payment URL." },
  { t: "Get paid and get notified", d: "When the customer pays, we send a signed callback to your server and update your dashboard." },
];

const SECURITY = [
  { t: "Every payment confirmation is verified", d: "An order is only marked paid after the payment is cryptographically verified and the amount matches." },
  { t: "Forged requests are rejected", d: "Fake payment notifications fail signature checks, leave the order untouched, and are logged." },
  { t: "Signed callbacks to you", d: "HMAC-SHA256 with a per-merchant secret, so you can reject anything that didn't come from us." },
  { t: "API keys stored hashed", d: "We keep only a hash of your key. The full key is shown once when you create or rotate it." },
  { t: "Every event is logged", d: "Webhooks, callbacks and errors are recorded so a disputed payment can be traced end to end." },
];

const FAQ = [
  ["How do customers pay?", "You redirect them to the payment URL we return. They complete the payment on a secure hosted page, then we notify your server and send them back to your site."],
  ["How do I know a payment succeeded?", "You receive a signed callback at your callback URL once the payment is confirmed. You can also call the status endpoint at any time."],
  ["What if my server is down when the callback is sent?", "We retry with increasing delays for several attempts. Delivery attempts and errors are visible under Callbacks in your dashboard."],
  ["Can the same callback arrive twice?", "It can, so make your handler idempotent: key on orderId and ignore an order you've already marked paid."],
  ["How long does registration take?", "Registration has seven short steps and your progress is saved as you go. After you submit, we review your details and activate your account."],
  ["Which currencies are supported?", "INR only."],
  ["I think my API key leaked. What do I do?", "Open Settings in your dashboard and regenerate the key. The old key stops working immediately."],
];

// Static illustration of a hosted payment page + the event your server receives.
const Demo = () => (
  <div className="demo" aria-label="Example payment page and callback">
    <div className="demo-card">
      <div className="demo-bar"><span /><span /><span /></div>
      <div className="demo-body">
        <div className="muted" style={{ fontSize: 12 }}>Order ORD_LXK2F9A1B2C3D4</div>
        <div style={{ fontSize: 30, fontWeight: 800, margin: "4px 0 14px" }}>₹499.50</div>
        <div className="row" style={{ gap: 8, marginBottom: 14 }}>
          {["UPI", "Cards", "Net banking", "Wallets"].map((m) => <span key={m} className="chip">{m}</span>)}
        </div>
        <div className="btn btn-primary" style={{ width: "100%", pointerEvents: "none" }}>Pay ₹499.50</div>
        <div className="muted center" style={{ fontSize: 12, marginTop: 10, display: "flex", gap: 6, justifyContent: "center", alignItems: "center" }}><PiShieldCheckDuotone size={15} /> Secure payment</div>
      </div>
    </div>
    <div className="demo-arrow" aria-hidden="true">→</div>
    <div className="code demo-code">
      <div className="code-tabs"><span className="code-tab active">POST your-callback-url</span></div>
      <pre>{`X-Paytrixx-Signature: 9f2c…e1

{
  "orderId": "ORD_LXK2F9A1B2C3D4",
  "status": "success",
  "amount": 499.5
}`}</pre>
    </div>
  </div>
);

const Home = () => {
  const [tab, setTab] = useState("business");

  return (
    <main>
      <section className="hero">
        <div className="container">
          <span className="eyebrow">Payment gateway for Indian businesses</span>
          <h1>Accept online payments with a simple API</h1>
          <p className="lead">
            Create an order, send your customer to a secure payment page, and get a signed callback the moment they pay.
            Track every transaction from one dashboard.
          </p>
          <div className="hero-cta">
            <Link className="btn btn-primary" to="/register">Start registration</Link>
            <Link className="btn btn-ghost" to="/docs">Read the docs</Link>
          </div>
          <p className="hero-note">
            Started registering already? <Link to="/onboarding" style={{ color: "var(--primary)", fontWeight: 600 }}>Continue where you left off</Link>
          </p>
          <Demo />
        </div>
      </section>

      <section className="section" id="features">
        <div className="container">
          <div className="section-head">
            <h2>Everything you need to get paid</h2>
            <p>For the people running the business and the people wiring it up.</p>
          </div>
          <div className="center">
            <div className="tabs" role="tablist">
              <button role="tab" aria-selected={tab === "business"} className={`tab ${tab === "business" ? "active" : ""}`} onClick={() => setTab("business")}>For business owners</button>
              <button role="tab" aria-selected={tab === "developers"} className={`tab ${tab === "developers" ? "active" : ""}`} onClick={() => setTab("developers")}>For developers</button>
            </div>
          </div>
          <div className="grid grid-3">
            {FEATURES[tab].map((f) => (
              <div className="card feature" key={f.t}>
                <div className="icon" aria-hidden="true"><f.Icon size={24} /></div>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section soft" id="how-it-works">
        <div className="container">
          <div className="section-head">
            <h2>How it works</h2>
            <p>From sign-up to your first payment in four steps.</p>
          </div>
          <div className="steps">
            {STEPS.map((s) => (
              <div className="step" key={s.t}>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
          <p className="center" style={{ marginTop: 28 }}>
            <Link className="btn btn-primary" to="/register">Start registration</Link>
          </p>
        </div>
      </section>

      <section className="section" id="developers">
        <div className="container">
          <div className="section-head">
            <h2>A small API. Two calls.</h2>
            <p>Create an order, then optionally check its status. Results arrive by callback.</p>
          </div>
          <div className="grid grid-2" style={{ alignItems: "start" }}>
            <div>
              <h3 style={{ marginBottom: 12 }}>1. Create an order</h3>
              <CodeTabs samples={createOrderSamples} />
            </div>
            <div>
              <h3 style={{ marginBottom: 12 }}>2. Verify the callback</h3>
              <CodeTabs samples={verifySamples} />
            </div>
          </div>
          <p className="center muted" style={{ marginTop: 24 }}>
            Plain JSON over HTTPS — works from any language. <Link to="/docs/guides" style={{ color: "var(--primary)", fontWeight: 600 }}>Pick your language →</Link>
          </p>
        </div>
      </section>

      <section className="section soft" id="security">
        <div className="container split">
          <div>
            <h2 style={{ fontSize: "clamp(26px,4vw,36px)", fontWeight: 800, marginBottom: 12 }}>Built so a fake payment can't get through</h2>
            <p className="muted" style={{ marginBottom: 26, fontSize: 17 }}>
              We're strict about what counts as paid, so you don't have to be.
            </p>
            <ul className="check-list">
              {SECURITY.map((s) => (
                <li key={s.t}>
                  <span className="tick" aria-hidden="true"><PiCheckBold size={13} /></span>
                  <div><strong>{s.t}</strong><span className="d">{s.d}</span></div>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 6 }}>Try to fake a payment</h3>
            <p className="muted" style={{ fontSize: 15, marginBottom: 14 }}>
              Anyone can send a request to a public URL. This is what an attacker would send us:
            </p>
            <div className="code">
              <pre>{`POST /payment-notification
orderId=ORD_LXK2F9A1B2C3D4
status=SUCCESS
amount=499.50
signature=made-up-by-attacker`}</pre>
            </div>
            <p style={{ marginTop: 14, fontSize: 15 }}>
              <span className="badge failed">400 Invalid signature</span>{" "}
              <span className="muted">— the order stays pending and the attempt is logged.</span>
            </p>
          </div>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="container">
          <div className="section-head"><h2>Frequently asked questions</h2></div>
          <div className="faq">
            {FAQ.map(([q, a]) => (
              <details key={q}><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
          <p className="center muted" style={{ marginTop: 24 }}>
            Still have questions? <Link to="/contact" style={{ color: "var(--primary)", fontWeight: 600 }}>Contact support</Link>
          </p>
        </div>
      </section>

      <section className="container" style={{ marginTop: 20 }}>
        <div className="cta">
          <h2>Ready to start accepting payments?</h2>
          <p>Create your account in minutes — your progress is saved as you go.</p>
          <div className="hero-cta">
            <Link className="btn btn-primary" to="/register">Start registration</Link>
            <Link className="btn btn-ghost" to="/login">Sign in</Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
