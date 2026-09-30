import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";

import LeftSidebarMenu from "../components/Layout/LeftSidebarMenu";
import Footer from "../components/Layout/Footer";
import TopNavbar from "../components/Layout/TopNavbar";
import ScrollToTop from "../components/Layout/ScrollToTop";
import SessionExpiryWarning from "../components/Layout/SessionExpiryWarning";

const MainLayout = () => {
  const [active, setActive] = useState(false);

  return (
    <div className={`main-wrapper-content ${active ? "active" : ""}`}>
      <TopNavbar toggleActive={() => setActive(!active)} />
      <LeftSidebarMenu toggleActive={() => setActive(!active)} />

      {/* Mobile overlay — tap outside sidebar to close it */}
      {active && (
        <Box
          onClick={() => setActive(false)}
          sx={{
            display: { xs: "block", md: "none" },
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            zIndex: 488,
          }}
        />
      )}

      <div
        className="main-content"
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <ScrollToTop />
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
        <Footer />
      </div>

      <SessionExpiryWarning />
    </div>
  );
};

export default MainLayout;
