import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// The template toggles an html.dark-theme class; the dark logo has the "Pay" lettering in white.
const useIsDark = () => {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark-theme"));
  useEffect(() => {
    const html = document.documentElement;
    const obs = new MutationObserver(() => setDark(html.classList.contains("dark-theme")));
    obs.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
};

const Logo = ({ size = 22 }) => {
  const dark = useIsDark();
  return (
    <Link to="/" style={{ display: "inline-flex", alignItems: "center" }} aria-label="Paytrixx admin home">
      <img
        src={dark ? "/logo-dark.png" : "/logo.png"}
        alt="Paytrixx"
        style={{ height: size + 12, width: "auto", display: "block" }}
      />
    </Link>
  );
};

export default Logo;
