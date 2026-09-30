import { Routes, Route, Outlet, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Contact from "./pages/Contact.jsx";
import NotFound from "./pages/NotFound.jsx";
import DocsLayout from "./pages/docs/DocsLayout.jsx";
import {
  Introduction, Quickstart, ApiKeys, AcceptPayment, PaymentPage, ConfirmPayment, SafeRetries,
  GuidesIndex, Guide, ApiReference, Statuses, Errors, Testing,
} from "./pages/docs/DocsPages.jsx";
import DashboardLayout from "./pages/dashboard/DashboardLayout.jsx";
import Overview from "./pages/dashboard/Overview.jsx";
import { Transactions, Orders } from "./pages/dashboard/Payments.jsx";
import Callbacks from "./pages/dashboard/Callbacks.jsx";
import Settings from "./pages/dashboard/Settings.jsx";

// The big marketing footer would just get in the way inside the dashboard and the sign-up wizard.
const Shell = () => {
  const { pathname } = useLocation();
  const bare = pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding") || pathname === "/register" || pathname === "/login";
  return (
    <>
      <Navbar />
      <Outlet />
      {!bare && <Footer />}
    </>
  );
};

const App = () => (
  <Routes>
    <Route element={<Shell />}>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/contact" element={<Contact />} />

      <Route path="/docs" element={<DocsLayout />}>
        <Route index element={<Introduction />} />
        <Route path="quickstart" element={<Quickstart />} />
        <Route path="api-keys" element={<ApiKeys />} />
        <Route path="accept-a-payment" element={<AcceptPayment />} />
        <Route path="payment-page" element={<PaymentPage />} />
        <Route path="confirm-payment" element={<ConfirmPayment />} />
        <Route path="safe-retries" element={<SafeRetries />} />
        <Route path="guides" element={<GuidesIndex />} />
        <Route path="guides/:slug" element={<Guide />} />
        <Route path="api-reference" element={<ApiReference />} />
        <Route path="statuses" element={<Statuses />} />
        <Route path="errors" element={<Errors />} />
        <Route path="testing" element={<Testing />} />
      </Route>

      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Overview />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="orders" element={<Orders />} />
        <Route path="callbacks" element={<Callbacks />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
);

export default App;
