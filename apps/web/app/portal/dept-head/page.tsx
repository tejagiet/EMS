import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { SchemaDependencyNotice } from "@/components/ui/SchemaDependencyNotice";
import { verifyPortalAccess } from "@/lib/auth/session";
import { getDeptHeadAnalytics, type DeptMemberItem } from "@/lib/data/analytics";
import { Users } from "lucide-react";

export const metadata = {
  title: "Department Head Overview | EMS",
};

export default async function DeptHeadDashboard() {
  const context = await verifyPortalAccess("dept_head");
  const orgId = context.activeOrganization?.id ?? "";
  const deptId = context.linkedEmployee?.departmentId ?? null;

  const data = await getDeptHeadAnalytics(orgId, deptId);

  const deptColumns: DataTableColumn<DeptMemberItem>[] = [
    {
      key: "employeeCode",
      header: "Code",
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
      key: "fullName",
      header: "Department Staff",
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.fullName}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {row.email ?? "No assigned email"}
          </div>
        </div>
      ),
    },
    {
      key: "designation",
      header: "Designation",
      sortable: true,
      render: (row) => <span style={{ fontSize: "0.82rem" }}>{row.designation}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge
          label={row.status.toUpperCase()}
          variant={row.status === "active" ? "success" : "neutral"}
          size="sm"
        />
      ),
    },
    {
      key: "joiningDate",
      header: "Date Joined",
      render: (row) => (
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {new Date(row.joiningDate).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Department Head Console
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Departmental headcount overview, staff designations, and strategic capacity management.
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
          label="Department Headcount"
          value={data.departmentHeadcount}
          subtitle="Staff enrolled in department"
          icon={<Users size={20} />}
        />
        <MetricCard
          label="Department Attendance Rate"
          isUnavailable
          requiredPhase={5}
          unavailableReason="Awaiting Phase 5 Attendance records."
        />
        <MetricCard
          label="Annual Reviews Completed"
          isUnavailable
          requiredPhase={8}
          unavailableReason="Awaiting Phase 8 Performance Appraisal cycles."
        />
        <MetricCard
          label="Department Requisitions"
          isUnavailable
          requiredPhase={7}
          unavailableReason="Awaiting Phase 7 Talent Acquisition schema."
        />
      </div>

      {/* Dependency Notices */}
      <SchemaDependencyNotice
        moduleName="Departmental Attendance Summaries"
        requiredPhase={5}
        description="Aggregated departmental presence, late arrivals, and shift patterns will display here once Phase 5 is deployed."
        plannedSchema={["attendance_records", "work_shifts"]}
      />

      {/* Department Staff Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Department Personnel Roster</CardTitle>
            <CardDescription>
              Registered employees belonging to this functional department
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={data.departmentMembers}
            columns={deptColumns}
            keyExtractor={(row) => row.id}
            pageSize={6}
            emptyTitle="No staff members in department"
            emptyDescription={
              deptId
                ? "There are currently 0 employees enrolled in your department."
                : "Your profile is not currently linked to a specific department."
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
