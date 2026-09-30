import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import {
  PiSquaresFourDuotone, PiArrowsLeftRightDuotone, PiReceiptDuotone, PiBellRingingDuotone, PiGearDuotone, PiSignOutDuotone,
} from "react-icons/pi";
import { useAuth } from "../../lib/auth.jsx";

const LINKS = [
  ["/dashboard", "Overview", PiSquaresFourDuotone, true],
  ["/dashboard/transactions", "Transactions", PiArrowsLeftRightDuotone],
  ["/dashboard/orders", "Orders", PiReceiptDuotone],
  ["/dashboard/callbacks", "Callbacks", PiBellRingingDuotone],
  ["/dashboard/settings", "Settings", PiGearDuotone],
];

const DashboardLayout = () => {
  const { token, role, merchant, logout } = useAuth();
  const navigate = useNavigate();

  if (!token) return <Navigate to="/login" replace />;
  // Still registering: the dashboard opens only after approval.
  if (role === "applicant") return <Navigate to="/onboarding" replace />;

  return (
    <div className="dash">
      <nav className="dash-side" aria-label="Dashboard">
        {merchant && (
          <div style={{ padding: "4px 12px 14px" }} className="dash-merchant">
            <div className="muted" style={{ fontSize: 12 }}>Signed in as</div>
            <strong>{merchant.name}</strong>
          </div>
        )}
        {LINKS.map(([to, label, Icon, end]) => (
          <NavLink key={to} to={to} end={end}><Icon size={19} aria-hidden="true" />{label}</NavLink>
        ))}
        <div className="spacer" />
        <button className="link" onClick={() => { logout(); navigate("/login"); }}>
          <PiSignOutDuotone size={19} aria-hidden="true" />Sign out
        </button>
      </nav>
      <div className="dash-main"><Outlet /></div>
    </div>
  );
};

export default DashboardLayout;
