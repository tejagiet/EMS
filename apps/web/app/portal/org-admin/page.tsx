import { BarChart } from "@/components/charts/BarChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { SchemaDependencyNotice } from "@/components/ui/SchemaDependencyNotice";
import { verifyPortalAccess } from "@/lib/auth/session";
import { getOrgAdminAnalytics, type AuditHistoryItem } from "@/lib/data/analytics";
import { Briefcase, Building2, GitFork, History, Users } from "lucide-react";

export const metadata = {
  title: "Organization Admin Dashboard | EMS",
};

export default async function OrgAdminDashboard() {
  const context = await verifyPortalAccess("org_admin");
  const orgId = context.activeOrganization?.id ?? "";
  const data = await getOrgAdminAnalytics(orgId);

  const deptChartData = data.departmentDistribution.map((d) => ({
    label: d.category,
    value: d.count,
  }));

  const historyColumns: DataTableColumn<AuditHistoryItem>[] = [
    {
      key: "employeeCode",
      header: "Employee",
      sortable: true,
      render: (row) => (
        <code
          style={{
            fontSize: "0.8rem",
            padding: "2px 6px",
            borderRadius: 4,
            background: "var(--background)",
          }}
        >
          {row.employeeCode}
        </code>
      ),
    },
    {
      key: "fieldName",
      header: "Field Changed",
      sortable: true,
      render: (row) => <span style={{ fontWeight: 600 }}>{row.fieldName}</span>,
    },
    {
      key: "oldValue",
      header: "Previous Value",
      render: (row) => (
        <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
          {row.oldValue ?? "—"}
        </span>
      ),
    },
    {
      key: "newValue",
      header: "New Value",
      render: (row) => (
        <span style={{ fontWeight: 600, color: "var(--primary)" }}>{row.newValue ?? "—"}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Timestamp",
      sortable: true,
      render: (row) => (
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Title & Context Header */}
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Organization Admin Dashboard
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Tenant: <strong>{context.activeOrganization?.name ?? "Main Organization"}</strong> ·
          Headcount, structures, and institutional governance.
        </p>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 16,
        }}
      >
        <MetricCard
          label="Total Headcount"
          value={data.totalEmployees}
          subtitle="Staff across all branches"
          icon={<Users size={20} />}
        />
        <MetricCard
          label="Active Staff"
          value={data.activeEmployees}
          subtitle="Regular active contracts"
          icon={<Users size={20} />}
          trend={{ direction: "neutral", value: "Verified Active", isPositive: true }}
        />
        <MetricCard
          label="Departments"
          value={data.totalDepartments}
          subtitle="Functional divisions"
          icon={<Building2 size={20} />}
        />
        <MetricCard
          label="Branches"
          value={data.totalBranches}
          subtitle="Operational campuses"
          icon={<GitFork size={20} />}
        />
        <MetricCard
          label="Designations"
          value={data.totalDesignations}
          subtitle="Hierarchy role titles"
          icon={<Briefcase size={20} />}
        />
      </div>

      {/* Charts & Structure Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 20,
        }}
      >
        <BarChart
          title="Department-wise Headcount"
          description="Distribution of registered employees across organizational units"
          data={deptChartData}
          xAxisLabel="Department"
          yAxisLabel="Employees"
        />

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Tenant Approval Pipeline</CardTitle>
              <CardDescription>Cross-module pending administrative actions</CardDescription>
            </div>
          </CardHeader>
          <CardContent style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SchemaDependencyNotice
              moduleName="Leave Approval Approvals"
              requiredPhase={5}
              description="Awaiting Phase 5 Leave Requests ledger schema. Currently 0 active request bottlenecks."
              compact
            />
            <SchemaDependencyNotice
              moduleName="Monthly Payroll Approvals"
              requiredPhase={6}
              description="Awaiting Phase 6 Payroll Run batch schema. Financial disbursements locked pending Phase 6."
              compact
            />
            <div
              style={{
                marginTop: 8,
                fontSize: "0.82rem",
                color: "var(--text-muted)",
                lineHeight: 1.5,
              }}
            >
              Institutional Structure Status: All <strong>{data.totalDepartments}</strong>{" "}
              departments and <strong>{data.totalBranches}</strong> branches are active and
              enforcing cross-organization isolation boundaries.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log / Change History */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <History size={18} /> Recent Personnel Change History
            </CardTitle>
            <CardDescription>
              Audit record of employment and designation updates (`employee_history`)
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={data.recentHistory}
            columns={historyColumns}
            keyExtractor={(row) => row.id}
            pageSize={5}
            emptyTitle="No recent change logs"
            emptyDescription="No field modifications have been recorded for employees in this organization."
          />
        </CardContent>
      </Card>
    </div>
  );
}
