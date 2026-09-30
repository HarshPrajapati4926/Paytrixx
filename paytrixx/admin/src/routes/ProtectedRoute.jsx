import { Navigate } from "react-router-dom";
import { useAppSelector } from "../hooks/reduxHooks";

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAppSelector((state) => state.auth);

 
  if (loading) return null;

 
  if (!token) {
    return <Navigate to="/sign-in" replace />;
  }

  // ✅ logged in
  return children;
};

export default ProtectedRoute;