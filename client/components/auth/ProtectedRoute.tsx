// client/components/auth/ProtectedRoute.tsx
import { ReactNode } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth"; // ✅ useAuth (not useFirebaseAuth)

interface ProtectedRouteProps {
  children: ReactNode;
  requiredUserTypes?: ("buyer" | "seller" | "agent" | "admin" | "staff")[];
  fallbackPath?: string;
  requireAuth?: boolean;
}

export default function ProtectedRoute({
  children,
  requiredUserTypes = [],
  fallbackPath = "/auth",
  requireAuth = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname + location.search;

  // 1) Loading phase: no setState / no navigate
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // 2) Need auth but not logged in → single Navigate (no effects)
  if (requireAuth && !isAuthenticated) {
    return (
      <Navigate
        to={`${fallbackPath}?redirect=${encodeURIComponent(currentPath)}`}
        replace
      />
    );
  }

  // 3) Role check
  if (isAuthenticated && user && requiredUserTypes.length > 0) {
    if (!user.userType) {
      return <Navigate to={fallbackPath} replace />;
    }

    if (!requiredUserTypes.includes(user.userType)) {
      const dashboardRoutes: Record<string, string> = {
        seller: "/seller-dashboard",
        buyer: "/buyer-dashboard",
        agent: "/agent-dashboard",
        admin: "/admin",
        staff: "/staff-dashboard",
      };
      const userDashboard = dashboardRoutes[user.userType] || "/";
      if (location.pathname !== userDashboard) {
        return <Navigate to={userDashboard} replace />;
      }
    }
  }

  return <>{children}</>;
}

// Shortcuts
export const SellerProtectedRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredUserTypes={["seller"]}>{children}</ProtectedRoute>
);
export const BuyerProtectedRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredUserTypes={["buyer"]}>{children}</ProtectedRoute>
);
export const AgentProtectedRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredUserTypes={["agent"]}>{children}</ProtectedRoute>
);
export const AdminProtectedRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredUserTypes={["admin"]}>{children}</ProtectedRoute>
);
export const StaffProtectedRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredUserTypes={["staff"]}>{children}</ProtectedRoute>
);

// Public-only pages (login/signup)
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    const dashboardRoutes: Record<string, string> = {
      seller: "/seller-dashboard",
      buyer: "/buyer-dashboard",
      agent: "/agent-dashboard",
      admin: "/admin",
      staff: "/staff-dashboard",
    };
    const userDashboard = dashboardRoutes[user.userType] || "/";
    if (location.pathname !== userDashboard) {
      return <Navigate to={userDashboard} replace />;
    }
  }
  return <>{children}</>;
}
