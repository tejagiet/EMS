import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { verifyPortalAccess } from "@/lib/auth/session";
import { getAuditorAnalytics } from "@/lib/data/analytics";
import { Eye, FileSearch, History, Lock, Shield, Users } from "lucide-react";

export const metadata = {
  title: "Statutory Compliance & Audit Log | EMS",
};

export default async function AuditorDashboard() {
  const context = await verifyPortalAccess("auditor");
  const orgId = context.activeOrganization?.id ?? "";
  const data = await getAuditorAnalytics(orgId);

  const auditColumns = [
    {
      key: "employeeCode",
      header: "Employee Code",
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
          {String(row.employeeCode)}
        </code>
      ),
    },
    {
      key: "fieldName",
      header: "Audited Entity Field",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span style={{ fontWeight: 600 }}>{String(row.fieldName)}</span>
      ),
    },
    {
      key: "oldValue",
      header: "Prior State",
      render: (row: Record<string, unknown>) => (
        <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
          {typeof row.oldValue === "string" ? row.oldValue : "—"}
        </span>
      ),
    },
    {
      key: "newValue",
      header: "Post State",
      render: (row: Record<string, unknown>) => (
        <span style={{ fontWeight: 600, color: "var(--primary)" }}>
          {typeof row.newValue === "string" ? row.newValue : "—"}
        </span>
      ),
    },
    {
      key: "changeReason",
      header: "Justification",
      render: (row: Record<string, unknown>) => (
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {typeof row.changeReason === "string" ? row.changeReason : "Standard lifecycle"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Recorded Timestamp",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
          {new Date(String(row.createdAt)).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
            Audit & Compliance Log
          </h1>
          <Badge label="STRICTLY READ-ONLY" variant="neutral" size="sm" />
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Statutory verification trail, immutable personnel change logs, and organizational
          compliance records.
        </p>
      </div>

      {/* Security Boundary Warning */}
      <div
        className="alert alert-warning"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: 0,
          fontSize: "0.85rem",
        }}
      >
        <Lock size={18} style={{ flexShrink: 0 }} />
        <span>
          <strong>Auditor Least-Privilege Policy:</strong> In accordance with institutional
          standards, this portal is strictly read-only. All mutation, approval, and administrative
          write actions are disabled at both the API and database levels.
        </span>
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
          label="Logged Change Entries"
          value={data.totalAuditRecords}
          subtitle="Audit records in database"
          icon={<History size={20} />}
        />
        <MetricCard
          label="Tracked Workforce"
          value={data.totalEmployeesTracked}
          subtitle="Personnel under compliance"
          icon={<Users size={20} />}
        />
        <MetricCard
          label="Audited Departments"
          value={data.departmentsCount}
          subtitle="Operational divisions"
          icon={<FileSearch size={20} />}
        />
        <MetricCard
          label="Access Roles"
          value={data.rolesCount}
          subtitle="Configured permissions"
          icon={<Shield size={20} />}
        />
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Eye size={18} /> Immutable Personnel Change Audit Trail
            </CardTitle>
            <CardDescription>
              Chronological log of verified field modifications from `public.employee_history`
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={data.auditTrail as unknown as Record<string, unknown>[]}
            columns={auditColumns}
            keyExtractor={(row) => String(row.id)}
            pageSize={8}
            emptyTitle="No audit records found"
            emptyDescription="There are currently no logged personnel change records for this tenant."
          />
        </CardContent>
      </Card>
    </div>
  );
}
