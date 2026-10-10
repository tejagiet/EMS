import { verifyPortalAccess } from "@/lib/auth/session";
import { getSuperAdminAnalytics } from "@/lib/data/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { Shield, Key, Lock } from "lucide-react";
import { PORTAL_ROLE_DEFINITIONS, ROLE_PERMISSIONS_MATRIX } from "@ems/config";
import type { PortalRole } from "@ems/types";

export const metadata = {
  title: "Global Roles & Security Governance | Super Admin Console",
};

export default async function SuperAdminRolesPage() {
  await verifyPortalAccess("super_admin");
  const data = await getSuperAdminAnalytics();

  const portalRolesList = Object.keys(PORTAL_ROLE_DEFINITIONS) as PortalRole[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Global Roles & Security Governance
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Platform RBAC permission models, system roles, and multi-tenant security boundaries.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <MetricCard
          label="System Roles"
          value={data.totalSystemRoles}
          subtitle="Pre-configured roles"
          icon={<Key size={20} />}
        />
        <MetricCard
          label="Portal Roles"
          value={portalRolesList.length}
          subtitle="Governed portals"
          icon={<Shield size={20} />}
        />
        <MetricCard
          label="Enforcement Mode"
          value="RLS + RBAC"
          subtitle="Database policy level"
          icon={<Lock size={20} />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Platform Role Definitions & Permission Matrix</CardTitle>
            <CardDescription>
              Architectural role definitions and permission capabilities across all 8 institutional portals
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {portalRolesList.map((roleKey) => {
              const roleDef = PORTAL_ROLE_DEFINITIONS[roleKey];
              const permissions = ROLE_PERMISSIONS_MATRIX[roleKey] || [];
              return (
                <div
                  key={roleKey}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: 16,
                    backgroundColor: "var(--bg-subtle, rgba(0,0,0,0.01))",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: "1rem" }}>{roleDef.name}</span>
                      <Badge variant="neutral" size="sm">
                        <code>{roleKey}</code>
                      </Badge>
                      <Badge variant="primary" size="sm">
                        System Role
                      </Badge>
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Base Path: <code>{roleDef.defaultPortalPath}</code>
                    </span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 12 }}>
                    {roleDef.description}
                  </p>
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                      Assigned Permissions ({permissions.length})
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {permissions.map((perm) => (
                        <Badge key={perm} variant="secondary" size="sm">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
