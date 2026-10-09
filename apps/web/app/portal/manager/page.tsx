import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { SchemaDependencyNotice } from "@/components/ui/SchemaDependencyNotice";
import { verifyPortalAccess } from "@/lib/auth/session";
import { getManagerAnalytics, type TeamMemberItem } from "@/lib/data/analytics";
import { Users } from "lucide-react";

export const metadata = {
  title: "Reporting Manager Dashboard | EMS",
};

export default async function ManagerDashboard() {
  const context = await verifyPortalAccess("manager");
  const orgId = context.activeOrganization?.id ?? "";
  const managerEmployeeId = context.linkedEmployee?.id ?? null;

  const data = await getManagerAnalytics(orgId, managerEmployeeId);

  const teamColumns: DataTableColumn<TeamMemberItem>[] = [
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
      header: "Team Member",
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.fullName}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {row.email ?? "No direct email"}
          </div>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (row) => <span>{row.department}</span>,
    },
    {
      key: "designation",
      header: "Designation",
      render: (row) => (
        <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{row.designation}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => (
        <Badge
          label={row.status.toUpperCase()}
          variant={row.status === "active" ? "success" : "warning"}
          size="sm"
        />
      ),
    },
    {
      key: "joiningDate",
      header: "Joined On",
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
          Reporting Manager Workspace
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Supervisory roster, team performance reviews, and operational approval workflows.
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
          label="Direct Reports"
          value={data.directReportsCount}
          subtitle="Team members under supervision"
          icon={<Users size={20} />}
        />
        <MetricCard
          label="Today's Team Attendance"
          isUnavailable
          requiredPhase={5}
          unavailableReason="Awaiting Phase 5 Daily Shift log migrations."
        />
        <MetricCard
          label="Pending Team Leave Approvals"
          isUnavailable
          requiredPhase={5}
          unavailableReason="Awaiting Phase 5 Leave Requests ledger."
        />
        <MetricCard
          label="Appraisal Reviews Due"
          isUnavailable
          requiredPhase={8}
          unavailableReason="Awaiting Phase 8 Performance Review cycle."
        />
      </div>

      {/* Schema Notice */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        <SchemaDependencyNotice
          moduleName="Team Shift & Attendance Logs"
          requiredPhase={5}
          description="Supervisors will be able to monitor real-time clock-in stamps and approve attendance corrections once Phase 5 is active."
          plannedSchema={["attendance_records", "attendance_exceptions"]}
        />
        <SchemaDependencyNotice
          moduleName="Manager Leave Decision Engine"
          requiredPhase={5}
          description="Approve, reject, or request information on employee paid leave requests with one click in Phase 5."
          plannedSchema={["leave_requests", "approval_history"]}
        />
      </div>

      {/* Direct Reports Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Direct Reports Roster</CardTitle>
            <CardDescription>
              Employees assigned to your supervision via reporting_manager_id relationship
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={data.teamMembers}
            columns={teamColumns}
            keyExtractor={(row) => row.id}
            pageSize={6}
            emptyTitle="No direct reports assigned"
            emptyDescription={
              managerEmployeeId
                ? "You currently have 0 direct reports linked in the database."
                : "Your profile is not currently linked to an employee manager record."
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
