import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

/**
 * PublicRoute - blocks authenticated users from accessing login/signup pages.
 * Redirects them to their role-specific dashboard instead of always going to "/".
 */
export default function PublicRoute({ children }) {
  const authState = useSelector((state) => state.auth || {});
  const isAuthenticated = authState.isAuthenticated || !!authState.token;
  const { token, role } = authState;

  if (isAuthenticated && token) {
    const normalizedRole = role?.toLowerCase();

    // Route to role-specific dashboards
    if (normalizedRole?.includes("admin"))
      return <Navigate to="/admin" replace />;
    if (normalizedRole?.includes("owner") || normalizedRole?.includes("venue"))
      return <Navigate to="/venue-owner" replace />;
    if (normalizedRole === "coach")
      return <Navigate to="/professional/coach" replace />;
    if (normalizedRole === "umpire") return <Navigate to="/umpire" replace />;

    return <Navigate to="/" replace />;
  }

  return children;
}
