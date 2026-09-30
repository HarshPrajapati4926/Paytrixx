import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export const Badge = ({ status }) => <span className={`badge ${String(status).toLowerCase()}`}>{status || "—"}</span>;

/**
 * Server-paginated table. `filters` is an object of query params; changing it resets to page 1.
 * columns: [{ key, label, render?(row) }]
 */
const DataTable = ({ path, columns, filters = {}, toolbar, empty = "Nothing here yet." }) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [state, setState] = useState({ rows: [], total: 0, loading: true, error: "" });
  const filterKey = JSON.stringify(filters);

  useEffect(() => setPage(1), [filterKey]);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: "" }));
    api(path, { params: { page, limit, ...filters } })
      .then((r) => !cancelled && setState({ rows: r.data, total: r.total, loading: false, error: "" }))
      .catch((e) => !cancelled && setState((s) => ({ ...s, loading: false, error: e.message })));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, page, limit, filterKey]);

  const pages = Math.max(1, Math.ceil(state.total / limit));

  return (
    <div className="panel">
      {toolbar && <div className="panel-head"><div className="toolbar">{toolbar}</div></div>}
      <div className="table-wrap" style={{ border: "none", borderRadius: 0, marginBottom: 0 }}>
        <table className="t">
          <thead><tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
          <tbody>
            {state.loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{columns.map((c) => <td key={c.key}><div className="skeleton" /></td>)}</tr>
              ))}
            {!state.loading && state.rows.map((r, i) => (
              <tr key={r._id || i}>
                {columns.map((c) => <td key={c.key}>{c.render ? c.render(r) : r[c.key] ?? "—"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {!state.loading && state.error && <div className="error" style={{ margin: 16 }}>{state.error}</div>}
        {!state.loading && !state.error && state.rows.length === 0 && <div className="empty">{empty}</div>}
      </div>
      <div className="pager">
        <span>{state.total} result{state.total === 1 ? "" : "s"}</span>
        <div className="row">
          <select className="input" style={{ width: "auto", padding: "5px 8px" }} value={limit} aria-label="Rows per page"
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
            {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {pages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
