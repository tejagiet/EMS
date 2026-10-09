import { DonutChart } from "@/components/charts/DonutChart";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { verifyPortalAccess } from "@/lib/auth/session";
import { getSuperAdminAnalytics } from "@/lib/data/analytics";
import { Building2, Shield, Users } from "lucide-react";

export const metadata = {
  title: "Super Admin Dashboard | EMS",
};

export default async function SuperAdminDashboard() {
  const context = await verifyPortalAccess("super_admin");
  const data = await getSuperAdminAnalytics();

  const orgColumns = [
    {
      key: "name",
      header: "Organization Name",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <div>
          <div style={{ fontWeight: 600 }}>{String(row.name)}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Slug: <code>{String(row.slug)}</code>
          </div>
        </div>
      ),
    },
    {
      key: "code",
      header: "Tenant Code",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <code
          style={{
            fontSize: "0.8rem",
            padding: "2px 6px",
            borderRadius: 4,
            background: "var(--background)",
          }}
        >
          {String(row.code)}
        </code>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <Badge
          label={row.is_active ? "ACTIVE" : "INACTIVE"}
          variant={row.is_active ? "success" : "danger"}
          size="sm"
        />
      ),
    },
    {
      key: "created_at",
      header: "Onboarded Date",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {new Date(String(row.created_at)).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const orgStatusDistribution = [
    { label: "Active Organizations", value: data.activeOrgs, color: "#10b981" },
    { label: "Inactive Organizations", value: data.inactiveOrgs, color: "#ef4444" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page Title & Context Header */}
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Super Admin Console
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Platform-level tenant orchestration, operational status, and global governance.
        </p>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        <MetricCard
          label="Total Tenants"
          value={data.totalOrgs}
          subtitle="Registered organizations"
          icon={<Building2 size={20} />}
        />
        <MetricCard
          label="Active Tenants"
          value={data.activeOrgs}
          subtitle="Operational institutions"
          icon={<Building2 size={20} />}
          trend={{ direction: "neutral", value: "100%", isPositive: true }}
        />
        <MetricCard
          label="Global Users"
          value={data.totalUsers}
          subtitle="Profiles across platform"
          icon={<Users size={20} />}
        />
        <MetricCard
          label="System Roles"
          value={data.totalSystemRoles}
          subtitle="Global RBAC definitions"
          icon={<Shield size={20} />}
        />
      </div>

      {/* Chart & Platform Distribution */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20,
        }}
      >
        <DonutChart
          title="Tenant Operational Status"
          description="Distribution of active vs suspended organizations on the platform"
          data={orgStatusDistribution}
          centerLabel="Tenants"
        />

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Platform Operational Summary</CardTitle>
              <CardDescription>Security boundary and runtime environment</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: "0.85rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: 8,
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>Current Session ID</span>
                <code>{context.userId.slice(0, 16)}...</code>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: 8,
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>Platform Role</span>
                <Badge label="SUPER ADMIN" variant="primary" size="sm" />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: 8,
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>Granted Permissions</span>
                <span style={{ fontWeight: 600 }}>
                  {context.permissions.length} Global Privileges
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Data Isolation Mode</span>
                <span style={{ fontWeight: 600, color: "var(--success)" }}>
                  Multi-Tenant Row-Level Security
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Directory Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Registered Organizations</CardTitle>
            <CardDescription>All provisioned client tenants and institutions</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={data.organizations as unknown as Record<string, unknown>[]}
            columns={orgColumns}
            keyExtractor={(row) => String(row.id)}
            pageSize={5}
            emptyTitle="No organizations found"
            emptyDescription="No institutional organizations are configured in the platform."
          />
        </CardContent>
      </Card>
    </div>
  );
}
