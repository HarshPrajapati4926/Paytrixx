import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="container center" style={{ padding: "100px 0" }}>
    <h1 style={{ fontSize: 48, fontWeight: 800 }}>404</h1>
    <p className="muted" style={{ margin: "10px 0 24px" }}>That page doesn't exist.</p>
    <Link className="btn btn-primary" to="/">Back to home</Link>
  </div>
);

export default NotFound;
