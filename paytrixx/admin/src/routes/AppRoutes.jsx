import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../layouts/MainLayout";
import SignIn from "../pages/authentication/SignIn";
import PageNotFound from "../pages/PageNotFound/PageNotFound";

const PageLoader = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
    <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#605DFF", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard"));
const Applications = lazy(() => import("../pages/Applications/Applications"));
const ContactMessages = lazy(() => import("../pages/Contact/ContactMessages"));
const Merchants = lazy(() => import("../pages/Merchants/Merchants"));
const Transactions = lazy(() => import("../pages/Transactions/Transactions"));
const Orders = lazy(() => import("../pages/Orders/Orders"));
const WebhookLogs = lazy(() => import("../pages/Logs/Logs").then((m) => ({ default: m.WebhookLogs })));
const SystemLogs = lazy(() => import("../pages/Logs/Logs").then((m) => ({ default: m.SystemLogs })));
const SystemHealth = lazy(() => import("../pages/SystemHealth/SystemHealth"));
const MyProfile = lazy(() => import("../pages/Profile/MyProfile.jsx"));

const page = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

const AppRoutes = () => (
  <Routes>
    <Route path="/sign-in" element={<SignIn />} />

    <Route
      element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/" element={page(Dashboard)} />
      <Route path="/merchants" element={page(Merchants)} />
      <Route path="/applications" element={page(Applications)} />
      <Route path="/support-messages" element={page(ContactMessages)} />
      <Route path="/transactions" element={page(Transactions)} />
      <Route path="/orders" element={page(Orders)} />
      <Route path="/logs/webhooks" element={page(WebhookLogs)} />
      <Route path="/logs/system" element={page(SystemLogs)} />
      <Route path="/system-health" element={page(SystemHealth)} />
      <Route path="/my-profile" element={page(MyProfile)} />
    </Route>

    <Route path="*" element={<PageNotFound />} />
  </Routes>
);

export default AppRoutes;
