import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/context/useAuthStore";

/** Redirects unauthenticated users to /sign-in */
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

/** Redirects already-authenticated users away from auth pages */
export function PublicRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
