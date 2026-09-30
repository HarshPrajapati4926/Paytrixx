import { Link, Navigate, useParams } from "react-router-dom";
import {
  PiRocketLaunchDuotone, PiKeyDuotone, PiCreditCardDuotone, PiWebhooksLogoDuotone, PiBookOpenDuotone,
  PiListChecksDuotone, PiCodeDuotone, PiRepeatDuotone, PiUserCircleDuotone,
} from "react-icons/pi";
import CodeTabs from "../../components/CodeTabs.jsx";
import {
  createOrderSamples, verifySamples, callbackPayload, createResponse, statusResponse,
} from "../../lib/samples.js";
import { GUIDES, findGuide } from "../../lib/guides.js";

const Code = ({ children }) => <div className="code" style={{ marginBottom: 16 }}><pre>{children}</pre></div>;
const C = ({ children }) => <code className="inline">{children}</code>;

const Params = ({ rows }) => (
  <div className="table-wrap">
    <table className="t">
      <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
      <tbody>
        {rows.map(([f, t, d]) => <tr key={f}><td><C>{f}</C></td><td>{t}</td><td>{d}</td></tr>)}
      </tbody>
    </table>
  </div>
);

const Flow = ({ steps }) => (
  <div className="steps-flow">
    {steps.map(([t, d]) => <div className="sf" key={t}><div><strong>{t}</strong><span>{d}</span></div></div>)}
  </div>
);

/* ── Start here ─────────────────────────────────────────────────────────── */

const CARDS = [
  ["/docs/quickstart", PiRocketLaunchDuotone, "Quickstart", "Your first payment in a few minutes."],
  ["/docs/accept-a-payment", PiCreditCardDuotone, "Accept a payment", "Create an order and send the customer to pay."],
  ["/docs/guides", PiCodeDuotone, "Setup guides", "Copy-paste code for 8 server stacks."],
  ["/docs/api-reference", PiBookOpenDuotone, "API reference", "Every endpoint, field and error."],
];

export const Introduction = () => (
  <>
    <h1>Accept payments with Paytrixx</h1>
    <p>Paytrixx lets your website or app take online payments with a small JSON API. You create an order, send the customer to a secure payment page, and we tell your server when they have paid.</p>

    <h3>How a payment works</h3>
    <Flow steps={[
      ["Customer checks out", "They click Pay on your site or app."],
      ["Your server creates an order", "One call to POST /api/payment/create with the amount. You get back a payment URL."],
      ["Customer pays", "You redirect them to the payment URL and they complete the payment on a secure page."],
      ["We verify the result", "We confirm the payment and check the amount before marking the order paid."],
      ["You receive a signed callback", "We POST the result to your server. You mark the order paid and ship."],
    ]} />

    <h3>Three words to know</h3>
    <ul>
      <li><strong>Order</strong> — what you create for each checkout. It has an <C>orderId</C> and an amount.</li>
      <li><strong>Payment URL</strong> — where you send the customer so they can pay for that order.</li>
      <li><strong>Callback</strong> — the signed message we send to your server when the order is paid or fails.</li>
    </ul>

    <h3>Where to go next</h3>
    <div className="doc-cards">
      {CARDS.map(([to, Icon, t, d]) => (
        <Link className="doc-card" key={to} to={to}>
          <div className="icon"><Icon size={22} /></div>
          <h3>{t}</h3><p>{d}</p>
        </Link>
      ))}
    </div>

    <h3>Before you start</h3>
    <ul>
      <li>A Paytrixx account — <Link to="/register" className="inline-link">register here</Link>. Approval is required before you can take payments.</li>
      <li>A server you control (payments are created from your server, never from a browser or mobile app).</li>
      <li>An HTTPS endpoint on that server to receive callbacks.</li>
    </ul>
  </>
);

export const Quickstart = () => (
  <>
    <h1>Quickstart</h1>
    <p>Take your first payment in four steps.</p>
    <Flow steps={[
      ["Create an account", "Register, verify your email, and submit your business details. We review and approve your account."],
      ["Generate your API key", "Sign in, open Settings, and generate your API key. Copy it somewhere safe — it is shown once."],
      ["Set your callback URL", "In Settings, add the HTTPS URL on your server that should receive payment results."],
      ["Create an order", "Call the API from your server (below) and redirect the customer to the returned paymentUrl."],
    ]} />
    <h3>Create an order</h3>
    <CodeTabs samples={createOrderSamples} />
    <div className="callout"><strong>Never</strong> call this API from a browser or mobile app. Your API key would be visible to anyone. Always call it from your server.</div>
    <p>Then handle the callback — see <Link to="/docs/confirm-payment" className="inline-link">Confirm you were paid</Link>.</p>
  </>
);

export const ApiKeys = () => (
  <>
    <h1>Account &amp; API keys</h1>
    <h3>Registration</h3>
    <p>Registration has seven steps: Account, Business, Owners, Address, Bank, Documents and Review. Your progress is saved as you go, so you can sign in later and continue where you left off. After you submit, our team reviews your application and emails you the result. If something needs fixing we tell you what, and you can edit and resubmit.</p>
    <h3>API key</h3>
    <p>Once approved, sign in and open <strong>Settings</strong> to generate your API key. It looks like <C>pk_live_…</C>. We store only a hash of it, so the full key is shown once — copy it straight into your server's environment variables.</p>
    <p>Send it in the <C>x-api-key</C> header on every API request. If a key is ever exposed, regenerate it from Settings: the old key stops working immediately.</p>
    <h3>Webhook secret</h3>
    <p>Separately, your account has a <strong>webhook secret</strong> used to sign the callbacks we send you. You can reveal it from Settings at any time. Never expose it in a browser or mobile app.</p>
    <div className="callout"><strong>Keep both secrets on your server.</strong> Anyone with your API key can create orders in your name; anyone with your webhook secret can forge callbacks.</div>
  </>
);

/* ── Take payments ─────────────────────────────────────────────────────── */

export const AcceptPayment = () => (
  <>
    <h1>Accept a payment</h1>
    <p>Every checkout is three moves on your side: create the order, save its ID, send the customer to pay.</p>
    <Flow steps={[
      ["Create the order on your server", "POST /api/payment/create with the amount and your API key."],
      ["Save the orderId", "Store it against your own order so you can match the callback later."],
      ["Redirect the customer to paymentUrl", "They pay there. Optionally pass a returnUrl to bring them back to your site."],
    ]} />
    <CodeTabs samples={createOrderSamples} />
    <h3>Response</h3>
    <Code>{createResponse}</Code>
    <p>The order starts as <C>pending</C>. It only becomes <C>paid</C> after we have verified the payment — never because the customer returned to your site.</p>
    <h3>Amounts</h3>
    <p>Send <C>amount</C> in rupees (for example <C>499.5</C>), at least 1. It is rounded to two decimals. Only <C>INR</C> is supported.</p>
  </>
);

export const PaymentPage = () => (
  <>
    <h1>The payment page</h1>
    <p>When you redirect the customer to <C>paymentUrl</C>, they land on a secure, hosted page where they complete the payment. You never handle card, UPI or bank details.</p>
    <h3>Coming back to your site</h3>
    <p>If you passed a <C>returnUrl</C>, the customer's browser is sent there after paying, with your order ID appended: <C>https://yourshop.com/thank-you?orderId=ORD_…</C>.</p>
    <div className="callout"><strong>The return is not proof of payment.</strong> A customer can close the tab before being sent back, or visit your return URL by hand. Mark an order paid only when the signed callback arrives (or when the status API says <C>paid</C>).</div>
    <h3>Expired or used links</h3>
    <p>A payment link works only while its order is <C>pending</C>. Once an order is paid or failed the link shows a message instead of the payment page. To let the customer try again, create a new order.</p>
  </>
);

export const ConfirmPayment = () => (
  <>
    <h1>Confirm you were paid</h1>
    <p>When a payment reaches a final state we <C>POST</C> JSON to your callback URL:</p>
    <Code>{callbackPayload}</Code>
    <p><C>status</C> is <C>success</C> or <C>failed</C>. The request carries an <C>X-Paytrixx-Signature</C> header: the hex HMAC-SHA256 of the <strong>raw request body</strong>, using your webhook secret.</p>
    <h3>Verify the signature</h3>
    <CodeTabs samples={verifySamples} />
    <h3>Delivery and retries</h3>
    <ul>
      <li>Reply with any <C>2xx</C> within 8 seconds. Anything else counts as a failure.</li>
      <li>Failures are retried with growing delays (30 seconds, 1 minute, 2 minutes … up to an hour apart) for up to 8 attempts.</li>
      <li>The <strong>Callbacks</strong> page in your dashboard shows attempts and the last error for each order.</li>
      <li>If a confirmation is delayed, we also check on orders that stay pending for more than a few minutes, so a payment is not missed.</li>
    </ul>
    <h3>Handle duplicates</h3>
    <p>The same callback can arrive more than once. Make your handler <strong>idempotent</strong>: look the order up by <C>orderId</C>, and do nothing if you have already marked it paid. Also compare <C>amount</C> with what you expected before fulfilling the order.</p>
    <h3>Fallback: poll the status</h3>
    <p>If a callback seems late, ask directly:</p>
    <div className="endpoint"><span className="method get">GET</span><code>/api/payment/status/:orderId</code></div>
    <Code>{statusResponse}</Code>
  </>
);

export const SafeRetries = () => (
  <>
    <h1>Safe retries</h1>
    <p>Networks fail. If your request to create an order times out, you will not know whether it reached us. Retrying blindly could create two orders for one checkout.</p>
    <h3>Use an Idempotency-Key</h3>
    <p>Send a unique <C>Idempotency-Key</C> header (for example your own cart or order ID). If the same key is used again for the same merchant, we return the original order instead of creating a new one.</p>
    <Code>{`curl -X POST ${"https://api.yourdomain.com"}/api/payment/create \\
  -H "x-api-key: $PAYTRIXX_API_KEY" \\
  -H "Idempotency-Key: cart-991" \\
  -H "Content-Type: application/json" \\
  -d '{ "amount": 250 }'`}</Code>
    <div className="table-wrap">
      <table className="t">
        <thead><tr><th>Situation</th><th>Result</th></tr></thead>
        <tbody>
          <tr><td>First request with a key</td><td><C>201</C> — new order created</td></tr>
          <tr><td>Retry with the same key and same amount</td><td><C>200</C> — the original order (same orderId and paymentUrl)</td></tr>
          <tr><td>Same key, different amount or currency</td><td><C>422</C> — rejected, nothing created</td></tr>
          <tr><td>Malformed key</td><td><C>400</C> — 1–100 characters: letters, digits, <C>_ - : .</C></td></tr>
        </tbody>
      </table>
    </div>
    <p>Two requests that arrive at the same moment with the same key also collapse to a single order.</p>
    <h3>Retry callbacks safely too</h3>
    <p>We retry callbacks when your server does not answer 2xx, so the same callback can arrive more than once. See <Link to="/docs/confirm-payment" className="inline-link">Confirm you were paid</Link>.</p>
  </>
);

/* ── Guides ─────────────────────────────────────────────────────────────── */

export const GuidesIndex = () => (
  <>
    <h1>Setup guides</h1>
    <p>Pick your server stack. Each guide has copy-paste code to create an order and to verify the callback.</p>
    <div className="lang-grid">
      {GUIDES.map((g) => (
        <Link className="doc-card" key={g.slug} to={`/docs/guides/${g.slug}`}>
          <div className="icon"><PiCodeDuotone size={22} /></div>
          <h3>{g.name}</h3>
        </Link>
      ))}
    </div>
    <p style={{ marginTop: 18 }}>Don't see your stack? The API is plain JSON over HTTPS — follow the <Link to="/docs/api-reference" className="inline-link">API reference</Link> from any language.</p>
  </>
);

export const Guide = () => {
  const { slug } = useParams();
  const g = findGuide(slug);
  if (!g) return <Navigate to="/docs/guides" replace />;
  return (
    <>
      <h1>{g.name}</h1>
      <p>{g.setup}</p>
      <h3>1. Create an order and send the customer to pay</h3>
      <Code>{g.create}</Code>
      <h3>2. Verify the callback</h3>
      <p>Verify the signature against the <strong>raw</strong> request body before you trust anything in it.</p>
      <Code>{g.verify}</Code>
      <div className="callout"><strong>Make it idempotent.</strong> The same callback can arrive more than once — only mark an order paid if it is still pending, and compare the amount.</div>
    </>
  );
};

/* ── Reference ─────────────────────────────────────────────────────────── */

export const ApiReference = () => (
  <>
    <h1>API reference</h1>
    <p>Base URL: <C>https://api.yourdomain.com</C>. Requests and responses are JSON. Authenticate with the <C>x-api-key</C> header.</p>

    <h3>Create payment</h3>
    <div className="endpoint"><span className="method post">POST</span><code>/api/payment/create</code></div>
    <Params rows={[
      ["amount", "number", "Amount in rupees, minimum 1. Rounded to 2 decimals."],
      ["currency", "string", "Optional. Only \"INR\" is supported (default)."],
      ["customerDetails", "object", "Optional. Free-form, e.g. name, email, phone."],
      ["returnUrl", "string", "Optional. http(s) URL the customer is sent to after paying. We append ?orderId=…"],
    ]} />
    <p>Optional header: <C>Idempotency-Key</C> (see <Link to="/docs/safe-retries" className="inline-link">Safe retries</Link>).</p>
    <p><strong>Response</strong> <C>201</C> (or <C>200</C> on an idempotent replay)</p>
    <Code>{createResponse}</Code>

    <h3>Get payment status</h3>
    <div className="endpoint"><span className="method get">GET</span><code>/api/payment/status/:orderId</code></div>
    <p>Returns the state of one of your orders. Orders that belong to other merchants return <C>404</C>.</p>
    <Code>{statusResponse}</Code>

    <h3>List orders and transactions</h3>
    <div className="endpoint"><span className="method get">GET</span><code>/api/merchant/orders</code></div>
    <div className="endpoint"><span className="method get">GET</span><code>/api/merchant/transactions</code></div>
    <Params rows={[
      ["page, limit", "number", "Pagination. limit max 100, default 10."],
      ["status", "string", "Filter by status."],
      ["search", "string", "Match on order ID or transaction ID."],
      ["from, to", "YYYY-MM-DD", "Created-at date range (UTC)."],
    ]} />

    <h3>Callback (sent to you)</h3>
    <div className="endpoint"><span className="method post">POST</span><code>your callback URL</code></div>
    <Code>{callbackPayload}</Code>
    <p>Headers: <C>Content-Type: application/json</C>, <C>X-Paytrixx-Signature</C> (hex HMAC-SHA256 of the raw body). See <Link to="/docs/confirm-payment" className="inline-link">Confirm you were paid</Link>.</p>
  </>
);

export const Statuses = () => (
  <>
    <h1>Payment statuses</h1>
    <div className="table-wrap">
      <table className="t">
        <thead><tr><th>Object</th><th>Values</th></tr></thead>
        <tbody>
          <tr><td>Order</td><td><C>pending</C> · <C>paid</C> · <C>failed</C></td></tr>
          <tr><td>Transaction</td><td><C>pending</C> · <C>success</C> · <C>failed</C></td></tr>
          <tr><td>Callback payload</td><td><C>success</C> · <C>failed</C></td></tr>
          <tr><td>Callback delivery (dashboard)</td><td><C>pending</C> (retrying) · <C>done</C> · <C>failed</C> (gave up)</td></tr>
        </tbody>
      </table>
    </div>
    <p>An order leaves <C>pending</C> exactly once. A late or duplicate notification can never change a finished order — a paid order stays paid.</p>
  </>
);

export const Errors = () => (
  <>
    <h1>Errors</h1>
    <p>Errors use standard HTTP status codes and a JSON body: <C>{`{ "success": false, "message": "…" }`}</C>. Validation errors may also include a <C>fields</C> object.</p>
    <div className="table-wrap">
      <table className="t">
        <thead><tr><th>HTTP</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td>400</td><td>Invalid input — e.g. amount below 1, unsupported currency, malformed Idempotency-Key.</td></tr>
          <tr><td>401</td><td>Missing or invalid API key.</td></tr>
          <tr><td>403</td><td>Your merchant account is inactive.</td></tr>
          <tr><td>404</td><td>Order not found.</td></tr>
          <tr><td>422</td><td>The Idempotency-Key was already used with different parameters.</td></tr>
          <tr><td>429</td><td>Rate limit exceeded — slow down and retry.</td></tr>
          <tr><td>502 / 504</td><td>The payment provider rejected the request or timed out. The order is closed as failed — create a new one.</td></tr>
        </tbody>
      </table>
    </div>
  </>
);

export const Testing = () => (
  <>
    <h1>Testing &amp; going live</h1>
    <h3>Go-live checklist</h3>
    <ul>
      <li>Orders are created on your server; the API key lives in an environment variable, never in code, a web page or a mobile app.</li>
      <li>Your callback endpoint is HTTPS, verifies <C>X-Paytrixx-Signature</C> on the <strong>raw</strong> body, and returns 2xx quickly.</li>
      <li>The callback handler is idempotent and checks <C>amount</C>.</li>
      <li>You fulfil orders only after the callback (or a status check says <C>paid</C>) — not because the customer reached your return URL.</li>
      <li>You send an <C>Idempotency-Key</C> when creating orders, so a retry can't double-create.</li>
      <li>You have tested a successful payment, a failed or abandoned payment, and a callback your server initially rejects (to watch a retry happen).</li>
      <li>You know where to regenerate the API key if it leaks (Settings).</li>
    </ul>
    <h3>Things to try before launch</h3>
    <ul>
      <li>Open the payment page and close it without paying — the order should stay <C>pending</C>.</li>
      <li>Return a <C>500</C> from your callback once — check the Callbacks page shows a retry, then a delivery.</li>
      <li>Send a callback with a wrong signature to your own endpoint — it must be rejected.</li>
    </ul>
    <p>Stuck? <Link to="/contact" className="inline-link">Contact support</Link>.</p>
  </>
);
