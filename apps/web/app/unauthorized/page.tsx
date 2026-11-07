import { signOutAction } from "@/lib/auth/actions";
import { getCurrentUserContext } from "@/lib/auth/session";
import { PORTAL_ROLE_DEFINITIONS, PORTAL_ROUTES } from "@ems/config";

interface UnauthorizedPageProps {
  searchParams: Promise<{
    reason?: string;
    target?: string;
  }>;
}

export default async function UnauthorizedPage({ searchParams }: UnauthorizedPageProps): Promise<React.JSX.Element> {
  const params = await searchParams;
  const context = await getCurrentUserContext();

  let message = "You do not have the required role or permissions to access this portal.";
  let targetName = "Requested Portal";
  if (params.target && params.target in PORTAL_ROLE_DEFINITIONS) {
    const key = params.target as keyof typeof PORTAL_ROLE_DEFINITIONS;
    targetName = PORTAL_ROLE_DEFINITIONS[key].name;
  } else if (params.target) {
    targetName = params.target;
  }

  if (params.reason === "inactive_account") {
    message =
      "Your employee account has been deactivated. Please contact your organization administrator.";
  } else if (params.reason === "insufficient_role") {
    message = `Access restricted: The ${targetName} portal requires explicit administrative authorization.`;
  }

  return (
    <main className="auth-container">
      <div className="auth-card" style={{ maxWidth: 540 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: "3rem", marginBottom: 8 }}>🛡️</div>
          <h1 style={{ fontSize: "1.5rem", color: "var(--danger)", marginBottom: 6 }}>
            Access Denied
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Security Boundary Enforcement
          </p>
        </div>

        <div className="alert alert-error" role="alert" style={{ marginBottom: 24 }}>
          {message}
        </div>

        {context && (
          <div
            style={{
              background: "var(--background)",
              padding: 16,
              borderRadius: 8,
              marginBottom: 24,
              fontSize: "0.875rem",
            }}
          >
            <p>
              <strong>Signed in as:</strong> {context.email}
            </p>
            <p>
              <strong>Active Role:</strong> {PORTAL_ROLE_DEFINITIONS[context.activeRole].name}
            </p>
            {context.availableRoles.length > 1 && (
              <div style={{ marginTop: 10 }}>
                <p style={{ fontWeight: 600, marginBottom: 6 }}>Your Authorized Portals:</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {context.availableRoles.map((role) => (
                    <a
                      key={role}
                      href={PORTAL_ROUTES[role]}
                      style={{
                        padding: "4px 10px",
                        background: "#ffffff",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        fontSize: "0.8rem",
                        textDecoration: "none",
                      }}
                    >
                      {PORTAL_ROLE_DEFINITIONS[role].name} →
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <a
            href={context ? PORTAL_ROUTES[context.activeRole] : "/login"}
            className="btn btn-primary"
            style={{ textDecoration: "none" }}
          >
            Go to Permitted Portal
          </a>

          <form action={signOutAction} style={{ width: "100%" }}>
            <button type="submit" className="btn btn-secondary">
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
