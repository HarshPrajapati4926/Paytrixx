import { Link } from "react-router-dom";

// Two images swapped by CSS on [data-theme]: the dark one has the "Pay" lettering in white.
const Logo = ({ large = false, to = "/" }) => (
  <Link to={to} className={`logo ${large ? "lg" : ""}`} aria-label="Paytrixx home">
    <img className="logo-light" src="/logo.png" alt="Paytrixx" width="129" height="34" />
    <img className="logo-dark" src="/logo-dark.png" alt="" width="129" height="34" aria-hidden="true" />
  </Link>
);

export default Logo;
