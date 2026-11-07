import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { RealtimeProvider } from "../context/RealtimeContext";
import { AppShell } from "@/components/shell/AppShell";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";

export function PortalLayout() {
  const { context, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--background, #f8fafc)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: "4px solid rgba(30, 58, 138, 0.2)",
              borderTopColor: "var(--primary, #1e3a8a)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px auto",
            }}
          />
          <p style={{ color: "var(--text-muted, #64748b)", fontSize: "0.95rem" }}>
            Authenticating EMS session...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!context) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirectTo=${redirectTo}`} replace />;
  }

  if (context.memberships.length === 0) {
    return <Navigate to="/login?error=access_pending" replace />;
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <RealtimeProvider orgId={context.activeOrganization?.id}>
          <AppShell context={context}>
            <Outlet />
          </AppShell>
        </RealtimeProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
