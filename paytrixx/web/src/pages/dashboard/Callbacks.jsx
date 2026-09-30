import { useState } from "react";
import DataTable, { Badge } from "../../components/DataTable.jsx";
import { formatDateTime } from "../../lib/format.js";

// Delivery log of the callbacks Paytrixx sent to the merchant's callback URL.
const Callbacks = () => {
  const [status, setStatus] = useState("");

  const columns = [
    { key: "orderId", label: "Order ID", render: (r) => <span className="mono">{r.orderId}</span> },
    { key: "payload", label: "Result", render: (r) => <Badge status={r.payload?.status} /> },
    { key: "status", label: "Delivery", render: (r) => <Badge status={r.status} /> },
    { key: "attempts", label: "Attempts" },
    { key: "url", label: "URL", render: (r) => <span className="mono">{r.url}</span> },
    { key: "lastError", label: "Last error", render: (r) => r.lastError || "—" },
    { key: "updatedAt", label: "Updated", render: (r) => formatDateTime(r.updatedAt) },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Callbacks</h1>
          <p className="muted">Delivery status of payment results sent to your callback URL. Failed deliveries are retried automatically.</p>
        </div>
      </div>
      <DataTable
        path="/api/merchant/callbacks"
        columns={columns}
        filters={{ status }}
        empty="No callbacks yet. They appear after a payment completes."
        toolbar={
          <select className="input" aria-label="Delivery status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All deliveries</option>
            <option value="pending">Pending / retrying</option>
            <option value="done">Delivered</option>
            <option value="failed">Gave up</option>
          </select>
        }
      />
    </>
  );
};

export default Callbacks;
