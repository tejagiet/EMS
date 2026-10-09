import {
  filterNavigationByPermissions,
  PORTAL_CONFIGS,
  PORTAL_ROLE_DEFINITIONS,
} from "@ems/config";
import type { AuthenticatedUserContext, PortalRole } from "@ems/types";

interface PortalModuleSection {
  title: string;
  phase: number;
  description: string;
  statusText?: string;
}

interface PortalShellViewProps {
  context: AuthenticatedUserContext;
  role: PortalRole;
  modules: PortalModuleSection[];
}

export function PortalShellView({ context, role, modules }: PortalShellViewProps) {
  const config = PORTAL_CONFIGS[role];
  const roleDef = PORTAL_ROLE_DEFINITIONS[role];
  const navigation = filterNavigationByPermissions(config.navigation, context.permissions);

  return (
    <div className="portal-layout">
      {/* Role-Aware Sidebar Navigation */}
      <aside className="portal-sidebar">
        <div
          style={{
            padding: "0 8px 12px",
            borderBottom: "1px solid var(--border)",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              fontWeight: 700,
            }}
          >
            {roleDef.name} Navigation
          </div>
        </div>

        {navigation.map((item) => (
          <a key={item.id} href={item.path} className="nav-link">
            {item.label}
          </a>
        ))}
      </aside>

      {/* Main Portal Content */}
      <main className="portal-content">
        {/* Portal Header */}
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: "1.75rem",
              color: "var(--primary)",
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            {config.displayName}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>{config.description}</p>
        </div>

        {/* Security & Access Context Summary */}
        <div className="portal-card" style={{ borderLeft: "4px solid var(--secondary)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h3 style={{ fontSize: "1rem", marginBottom: 4 }}>
                Security Context & Active Tenant
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Organization:{" "}
                <strong>{context.activeOrganization?.name ?? "Global Platform"}</strong> | Code:{" "}
                <code>{context.activeOrganization?.code ?? "GLOBAL"}</code>
              </p>
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                background: "var(--background)",
                padding: "6px 12px",
                borderRadius: 6,
              }}
            >
              Granted Permissions: <strong>{context.permissions.length}</strong>
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {context.permissions.map((p) => (
              <span
                key={p}
                style={{
                  padding: "2px 8px",
                  background: "#f1f5f9",
                  borderRadius: 4,
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  color: "var(--text-muted)",
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Feature Modules & Future Phase Shells */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 20,
          }}
        >
          {modules.map((m, idx) => (
            <div key={idx} className="portal-card" style={{ marginBottom: 0 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <h3 style={{ fontSize: "1.05rem", margin: 0 }}>{m.title}</h3>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 9999,
                    backgroundColor:
                      m.phase === 3 ? "rgba(16, 185, 129, 0.15)" : "rgba(2, 132, 199, 0.15)",
                    color: m.phase === 3 ? "var(--success)" : "var(--secondary)",
                  }}
                >
                  Phase {m.phase.toString()}
                </span>
              </div>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: 12 }}>
                {m.description}
              </p>

              <div className="placeholder-box">
                {m.statusText ??
                  `Module foundation ready. Business logic implemented in Phase ${m.phase.toString()}.`}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
