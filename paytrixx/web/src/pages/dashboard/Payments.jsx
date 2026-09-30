import { useState } from "react";
import DataTable, { Badge } from "../../components/DataTable.jsx";
import { formatINR, formatDateTime } from "../../lib/format.js";

// One component for both lists; only the endpoint, statuses and ID column differ.
const Payments = ({ title, path, statuses, idKey, idLabel }) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const columns = [
    { key: idKey, label: idLabel, render: (r) => <span className="mono">{r[idKey]}</span> },
    ...(idKey !== "orderId" ? [{ key: "orderId", label: "Order ID", render: (r) => <span className="mono">{r.orderId}</span> }] : []),
    { key: "amount", label: "Amount", render: (r) => formatINR(r.amount) },
    { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
    { key: "paytmTxnId", label: "Paytm Txn ID", render: (r) => <span className="mono">{r.paytmTxnId || "—"}</span> },
    { key: "createdAt", label: "Created", render: (r) => formatDateTime(r.createdAt) },
  ];

  return (
    <>
      <div className="page-head"><h1>{title}</h1></div>
      <DataTable
        path={path}
        columns={columns}
        filters={{ search, status, from, to }}
        empty={`No ${title.toLowerCase()} match these filters.`}
        toolbar={
          <>
            <input className="input" placeholder="Search order / Paytm ID" aria-label="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="input" aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input className="input" type="date" aria-label="From date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input className="input" type="date" aria-label="To date" value={to} onChange={(e) => setTo(e.target.value)} />
          </>
        }
      />
    </>
  );
};

export const Transactions = () => (
  <Payments title="Transactions" path="/api/merchant/transactions" statuses={["pending", "success", "failed"]} idKey="transactionId" idLabel="Transaction ID" />
);

export const Orders = () => (
  <Payments title="Orders" path="/api/merchant/orders" statuses={["pending", "paid", "failed"]} idKey="orderId" idLabel="Order ID" />
);
