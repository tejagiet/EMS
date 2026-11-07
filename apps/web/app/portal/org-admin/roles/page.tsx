import { verifyPortalAccess } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Shield } from "lucide-react";
import { PORTAL_ROLE_DEFINITIONS, ROLE_PERMISSIONS_MATRIX } from "@ems/config";
import type { PortalRole } from "@ems/types";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Roles & Permissions Governance | EMS",
};

interface UserRoleRow {
  id: string;
  role_id: string;
  is_active: boolean;
  profiles?: {
    id: string;
    full_name: string | null;
  } | null;
  roles?: {
    id: string;
    code: string;
    name: string;
    is_system: boolean;
  } | null;
}

export default async function OrgAdminRolesPage() {
  const context = await verifyPortalAccess("org_admin", {
    permission: "role.manage",
  });
  if (!context || !context.activeOrganization) {
    redirect("/login");
  }

  const supabase = await createClient();

  // Fetch active user-role assignments for this organization
  const { data: userRolesData } = await supabase
    .from("user_roles")
    .select("id, role_id, is_active, profiles:profile_id(id, full_name), roles:role_id(id, code, name, is_system)")
    .eq("organization_id", context.activeOrganization.id)
    .eq("is_active", true);

  const assignments = (userRolesData ?? []) as unknown as UserRoleRow[];

  const standardRoles: PortalRole[] = [
    "org_admin",
    "hr_manager",
    "manager",
    "dept_head",
    "finance_payroll_manager",
    "recruitment_manager",
    "employee",
    "auditor",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Roles & Permissions Matrix
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Tenant: <strong>{context.activeOrganization.name}</strong> · Role definitions, granular permission bindings, and authorized assignments.
        </p>
      </div>

      {/* Role Definitions & Permissions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }}>
        {standardRoles.map((roleKey) => {
          const roleDef = PORTAL_ROLE_DEFINITIONS[roleKey];
          const perms = ROLE_PERMISSIONS_MATRIX[roleKey] ?? [];
          const usersWithRole = assignments.filter((a) => a.roles?.code === roleKey);

          return (
            <Card key={roleKey}>
              <CardHeader>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Shield size={18} /> {roleDef.name}
                    </CardTitle>
                    <CardDescription>{roleDef.description}</CardDescription>
                  </div>
                  <Badge label={roleKey} variant="secondary" size="sm" />
                </div>
              </CardHeader>
              <CardContent style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>
                    Assigned Personnel ({usersWithRole.length}):
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {usersWithRole.length > 0 ? (
                      usersWithRole.map((u) => (
                        <span
                          key={u.id}
                          style={{
                            fontSize: "0.78rem",
                            background: "var(--background)",
                            padding: "2px 8px",
                            borderRadius: 4,
                            border: "1px solid var(--border)",
                          }}
                        >
                          {u.profiles?.full_name ?? "User"}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        No members assigned yet
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>
                    Granted Permissions ({perms.length}):
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {perms.map((p) => (
                      <span
                        key={p}
                        style={{
                          fontSize: "0.72rem",
                          fontFamily: "monospace",
                          background: "#f0fdf4",
                          color: "#166534",
                          padding: "1px 6px",
                          borderRadius: 3,
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
