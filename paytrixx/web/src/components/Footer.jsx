import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";

const Footer = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer-grid">
        <div>
          <Logo />
          <p className="muted" style={{ marginTop: 12, maxWidth: 280, fontSize: 14.5 }}>
            Payments for Indian businesses. Accept online payments with a simple API and track everything from one dashboard.
          </p>
        </div>
        <div>
          <h4>Product</h4>
          <ul>
            <li><a href="/#features">Features</a></li>
            <li><a href="/#how-it-works">How it works</a></li>
            <li><a href="/#security">Security</a></li>
          </ul>
        </div>
        <div>
          <h4>Developers</h4>
          <ul>
            <li><Link to="/docs/quickstart">Quickstart</Link></li>
            <li><Link to="/docs/api-reference">API reference</Link></li>
            <li><Link to="/docs/guides">Setup guides</Link></li>
            <li><Link to="/docs/testing">Go-live checklist</Link></li>
          </ul>
        </div>
        <div>
          <h4>Account</h4>
          <ul>
            <li><Link to="/register">Create account</Link></li>
            <li><Link to="/login">Sign in</Link></li>
            <li><Link to="/onboarding">Continue registration</Link></li>
          </ul>
        </div>
        <div>
          <h4>Support</h4>
          <ul>
            <li><Link to="/contact">Contact us</Link></li>
            <li><a href="/#faq">FAQ</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Paytrixx. All rights reserved.</span>
        <span>Payments for Indian businesses</span>
      </div>
    </div>
  </footer>
);

export default Footer;
