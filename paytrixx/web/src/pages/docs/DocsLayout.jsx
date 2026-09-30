import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { PiArrowLeftBold, PiArrowRightBold } from "react-icons/pi";
import { GUIDES } from "../../lib/guides.js";

// Sidebar structure; also defines the prev/next order.
export const DOC_NAV = [
  { group: "Start here", items: [
    ["/docs", "Introduction", true],
    ["/docs/quickstart", "Quickstart"],
    ["/docs/api-keys", "Account & API keys"],
  ] },
  { group: "Take payments", items: [
    ["/docs/accept-a-payment", "Accept a payment"],
    ["/docs/payment-page", "The payment page"],
    ["/docs/confirm-payment", "Confirm you were paid"],
    ["/docs/safe-retries", "Safe retries"],
  ] },
  { group: "Setup guides", items: [
    ["/docs/guides", "All setup guides", true],
    ...GUIDES.map((g) => [`/docs/guides/${g.slug}`, g.name]),
  ] },
  { group: "Reference", items: [
    ["/docs/api-reference", "API reference"],
    ["/docs/statuses", "Payment statuses"],
    ["/docs/errors", "Errors"],
    ["/docs/testing", "Testing & going live"],
  ] },
];

const FLAT = DOC_NAV.flatMap((g) => g.items);

export const PrevNext = () => {
  const { pathname } = useLocation();
  const i = FLAT.findIndex(([to]) => to === pathname);
  if (i === -1) return null;
  const prev = FLAT[i - 1];
  const next = FLAT[i + 1];
  return (
    <div className="pager-links">
      {prev ? <Link to={prev[0]}><PiArrowLeftBold size={14} aria-hidden="true" style={{ verticalAlign: "-2px" }} /> {prev[1]}</Link> : <span />}
      {next ? <Link to={next[0]}>{next[1]} <PiArrowRightBold size={14} aria-hidden="true" style={{ verticalAlign: "-2px" }} /></Link> : <span />}
    </div>
  );
};

const DocsLayout = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="container docs">
      <aside className="docs-side" aria-label="Docs navigation">
        {DOC_NAV.map((g) => (
          <div key={g.group} style={{ display: "contents" }}>
            <div className="group">{g.group}</div>
            {g.items.map(([to, label, end]) => (
              <NavLink key={to} to={to} end={Boolean(end)} className={({ isActive }) => (isActive ? "active" : "")}>{label}</NavLink>
            ))}
          </div>
        ))}
      </aside>
      <article className="docs-body">
        <Outlet />
        <PrevNext />
      </article>
    </div>
  );
};

export default DocsLayout;
