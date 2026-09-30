import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import Logo from "./Logo.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import { PiListBold, PiXBold } from "react-icons/pi";
import { useAuth } from "../lib/auth.jsx";

// Hash links only work on the home page, so route them there from elsewhere.
const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { token, role } = useAuth();
  const { pathname } = useLocation();
  const home = pathname === "/" ? "" : "/";
  const close = () => setOpen(false);
  const dest = role === "applicant" ? "/onboarding" : "/dashboard";

  return (
    <header className={`nav ${open ? "open" : ""}`}>
      <div className="container nav-inner">
        <Logo />
        <button className="nav-toggle" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <PiXBold size={20} /> : <PiListBold size={20} />}
        </button>
        <nav className="nav-links" aria-label="Main">
          <a href={`${home}#features`} onClick={close}>Features</a>
          <a href={`${home}#how-it-works`} onClick={close}>How it works</a>
          <a href={`${home}#developers`} onClick={close}>Developers</a>
          <a href={`${home}#security`} onClick={close}>Security</a>
          <a href={`${home}#faq`} onClick={close}>FAQ</a>
          <NavLink to="/docs" onClick={close}>Docs</NavLink>
          <NavLink to="/contact" onClick={close}>Contact</NavLink>
        </nav>
        <div className="nav-cta">
          <ThemeToggle />
          {token ? (
            <Link className="btn btn-primary btn-sm" to={dest} onClick={close}>
              {role === "applicant" ? "Continue setup" : "Dashboard"}
            </Link>
          ) : (
            <>
              <Link className="btn btn-ghost btn-sm" to="/login" onClick={close}>Sign in</Link>
              <Link className="btn btn-primary btn-sm" to="/register" onClick={close}>Get started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
