import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { formatINR, formatDateTime } from "../../lib/format.js";
import { Badge } from "../../components/DataTable.jsx";

const Stat = ({ label, value, hint, loading }) => (
  <div className="stat">
    <div className="l">{label}</div>
    <div className="v">{loading ? <div className="skeleton" style={{ height: 28, width: 100 }} /> : value}</div>
    {hint && <div className="h">{hint}</div>}
  </div>
);

const Overview = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/merchant/stats").then((r) => setData(r.data)).catch((e) => setError(e.message));
  }, []);

  const t = data?.totals;
  const max = Math.max(1, ...(data?.daily || []).map((d) => d.amount));

  return (
    <>
      <div className="page-head"><h1>Overview</h1></div>
      {error && <div className="error">{error}</div>}

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <Stat loading={!data} label="Paid volume" value={formatINR(t?.successAmount)} />
        <Stat loading={!data} label="Transactions" value={t?.transactions ?? 0} hint={`${t?.pending ?? 0} pending · ${t?.failed ?? 0} failed`} />
        <Stat loading={!data} label="Success rate" value={`${t?.successRate ?? 0}%`} hint="Of completed payments" />
        <Stat loading={!data} label="Pending" value={t?.pending ?? 0} hint="Awaiting Paytm confirmation" />
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head"><h2>Paid volume · last 14 days</h2></div>
        <div className="panel-body">
          {!data ? <div className="skeleton" style={{ height: 170 }} /> : (
            <div className="chart" role="img" aria-label="Bar chart of paid volume for the last 14 days">
              {data.daily.map((d) => (
                <div className="bar-col" key={d.date} title={`${d.date}: ${formatINR(d.amount)} (${d.count} payments)`}>
                  <div className={`bar ${d.amount ? "" : "zero"}`} style={{ height: `${Math.max(2, (d.amount / max) * 100)}%` }} />
                  <span className="lbl">{d.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Recent transactions</h2></div>
        <div className="table-wrap" style={{ border: "none", borderRadius: 0, marginBottom: 0 }}>
          <table className="t">
            <thead><tr><th>Order</th><th>Amount</th><th>Status</th><th>Time</th></tr></thead>
            <tbody>
              {(data?.recent || []).map((r) => (
                <tr key={r._id}>
                  <td className="mono">{r.orderId}</td>
                  <td>{formatINR(r.amount)}</td>
                  <td><Badge status={r.status} /></td>
                  <td>{formatDateTime(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && data.recent.length === 0 && <div className="empty">No transactions yet. Create your first order with the API.</div>}
        </div>
      </div>
    </>
  );
};

export default Overview;
