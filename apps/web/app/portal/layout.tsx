import { signOutAction, switchOrganizationAction, switchRoleAction } from "@/lib/auth/actions";
import { getCurrentUserContext } from "@/lib/auth/session";
import { PORTAL_ROLE_DEFINITIONS } from "@ems/config";
import { getInitials } from "@ems/shared";
import { redirect } from "next/navigation";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/login");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Portal Navigation Bar */}
      <header className="portal-header">
        <div className="portal-brand">
          <a href="/portal" style={{ textDecoration: "none", color: "inherit" }}>
            <h2>EMS Portal</h2>
          </a>
          <span className="role-pill">{PORTAL_ROLE_DEFINITIONS[context.activeRole].name}</span>
        </div>

        <div className="portal-actions">
          {/* Organization Switcher (if member of multiple orgs) */}
          {context.memberships.length > 1 ? (
            <form
              action={switchOrganizationAction}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Org:</span>
              <select
                name="organizationId"
                defaultValue={context.activeOrganization?.id}
                className="switcher-select"
              >
                {context.memberships.map((m) => (
                  <option key={m.organizationId} value={m.organizationId}>
                    {m.organizationName}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="btn btn-secondary"
                style={{ padding: "4px 8px", fontSize: "0.75rem", width: "auto" }}
              >
                Switch
              </button>
            </form>
          ) : (
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
              🏢 {context.activeOrganization?.name ?? "Global"}
            </div>
          )}

          {/* Role Switcher (if user holds multiple roles) */}
          {context.availableRoles.length > 1 && (
            <form
              action={switchRoleAction}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Role:</span>
              <select name="roleCode" defaultValue={context.activeRole} className="switcher-select">
                {context.availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {PORTAL_ROLE_DEFINITIONS[role].name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="btn btn-secondary"
                style={{ padding: "4px 8px", fontSize: "0.75rem", width: "auto" }}
              >
                Switch
              </button>
            </form>
          )}

          {/* User Profile Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "var(--primary)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.85rem",
                fontWeight: 700,
              }}
            >
              {getInitials(context.profile.fullName)}
            </div>
            <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              {context.profile.fullName}
            </span>
          </div>

          {/* Sign Out Form */}
          <form action={signOutAction}>
            <button
              type="submit"
              className="btn btn-secondary"
              style={{ padding: "6px 12px", fontSize: "0.8rem", width: "auto" }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main Portal View */}
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
