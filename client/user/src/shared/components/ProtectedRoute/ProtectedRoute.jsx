import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, requiredRole }) {
  const authState = useSelector((state) => state.auth || {});
  const isAuthenticated = authState.isAuthenticated || !!authState.token;
  const { role, token } = authState;
  const location = useLocation();

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const isAdminRole = (r) => r?.toLowerCase().includes("admin");
    const isOwnerRole = (r) =>
      r?.toLowerCase().includes("venu_owners") ||
      r?.toLowerCase().includes("venue");

    const checkRole = (req) => {
      const targetRole = req.toLowerCase();
      const currentRole = role?.toLowerCase();

      if (targetRole === "admin") return isAdminRole(role);
      if (targetRole === "venu_owners" || targetRole === "owner")
        return isOwnerRole(role);

      // Generic check for limited versions (e.g. 'limited_umpire' matches 'umpire')
      return (
        currentRole === targetRole || currentRole === `limited_${targetRole}`
      );
    };

    let isMatchingRole = false;
    if (Array.isArray(requiredRole)) {
      isMatchingRole = requiredRole.some((r) => checkRole(r));
    } else {
      isMatchingRole = checkRole(requiredRole);
    }

    if (!isMatchingRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
