import { signOutAction, switchRoleAction } from "@/lib/auth/actions";
import { getCurrentUserContext } from "@/lib/auth/session";
import { PORTAL_ROLE_DEFINITIONS, PORTAL_ROUTES } from "@ems/config";
import { redirect } from "next/navigation";

export default async function PortalLandingPage() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/login");
  }

  if (!context.isAccountActive) {
    redirect("/unauthorized?reason=inactive_account");
  }

  // If user only has one role or already has active role, redirect to it directly
  if (context.availableRoles.length <= 1) {
    const targetRole = context.availableRoles[0] ?? "employee";
    redirect(PORTAL_ROUTES[targetRole]);
  }

  // If multiple roles exist and one is already active, direct to active portal
  if (context.availableRoles.includes(context.activeRole)) {
    redirect(PORTAL_ROUTES[context.activeRole]);
  }

  // Otherwise, render explicit role selection UI
  return (
    <main className="container" style={{ maxWidth: 800, marginTop: 40 }}>
      <div className="portal-card" style={{ textAlign: "center", padding: 32 }}>
        <h1 style={{ fontSize: "1.75rem", color: "var(--primary)", marginBottom: 8 }}>
          Select Authorized Portal
        </h1>
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
          Welcome, <strong>{context.profile.fullName}</strong>. You hold multiple active roles in{" "}
          <strong>{context.activeOrganization?.name ?? "EMS"}</strong>.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {context.availableRoles.map((role) => {
            const def = PORTAL_ROLE_DEFINITIONS[role];
            return (
              <form key={role} action={switchRoleAction}>
                <input type="hidden" name="roleCode" value={role} />
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: 20,
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    background: "#ffffff",
                    textAlign: "left",
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      color: "var(--primary)",
                      marginBottom: 4,
                    }}
                  >
                    {def.name}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {def.description}
                  </div>
                </button>
              </form>
            );
          })}
        </div>

        <div style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
          <form action={signOutAction}>
            <button
              type="submit"
              className="btn btn-secondary"
              style={{ width: "auto", minWidth: 160 }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
