import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <p className="font-mono text-sm text-muted">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}

export function AdminOnlyRoute({ children }) {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 py-24 text-center">
        <p className="font-display text-lg font-semibold text-ink">Admins only</p>
        <p className="max-w-sm text-sm text-muted">
          User management is restricted to accounts with the admin role. Ask an admin to make
          changes here.
        </p>
      </div>
    );
  }

  return children;
}
