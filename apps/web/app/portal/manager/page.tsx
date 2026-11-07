import { verifyPortalAccess } from "@/lib/auth/session";
import { getManagerAnalytics } from "@/lib/data/analytics";
import { getTeamAttendanceRoster, getAttendanceCorrectionsList } from "@/lib/data/attendance";
import { getTeamLeaveRequests } from "@/lib/data/leave";
import { AttendanceRosterClient } from "@/components/attendance/AttendanceRosterClient";
import { LeaveRequestsQueueClient } from "@/components/leave/LeaveRequestsQueueClient";
import { CorrectionsQueueClient } from "@/components/attendance/CorrectionsQueueClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { Users, CheckCircle2, Clock, Calendar, AlertTriangle } from "lucide-react";
import { ManagerTeamTable } from "./ManagerTeamTable";

export const metadata = {
  title: "Reporting Manager Dashboard | EMS",
};

export default async function ManagerDashboard() {
  const context = await verifyPortalAccess("manager");
  const orgId = context.activeOrganization?.id ?? "";

  const isGlobalApprover =
    context.activeRole === "org_admin" ||
    context.activeRole === "hr_manager" ||
    context.activeRole === "super_admin";

  const managerEmployeeId = isGlobalApprover ? null : (context.linkedEmployee?.id ?? null);
  const today = new Date().toISOString().split("T")[0]!;

  const [data, roster, pendingLeaves, pendingCorrections] = await Promise.all([
    getManagerAnalytics(orgId, managerEmployeeId),
    getTeamAttendanceRoster(orgId, managerEmployeeId, today),
    getTeamLeaveRequests(orgId, managerEmployeeId, "pending"),
    getAttendanceCorrectionsList(orgId, managerEmployeeId, "pending"),
  ]);

  const presentCount = roster.filter((r) => r.status === "present" || r.isLate).length;
  const lateCount = roster.filter((r) => r.isLate).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Reporting Manager Workspace
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Supervisory attendance monitoring, team leave requests authorization, and timesheet adjustments.
        </p>
      </div>

      {/* KPI Cards — Real PostgreSQL Metrics */}
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
          label="Today's Present Staff"
          value={`${presentCount} / ${roster.length}`}
          subtitle={lateCount > 0 ? `${lateCount} marked as late arrival` : "All on-time arrivals"}
          icon={<Clock size={20} />}
        />
        <MetricCard
          label="Pending Leave Approvals"
          value={pendingLeaves.length}
          subtitle="Applications awaiting your decision"
          icon={<Calendar size={20} />}
        />
        <MetricCard
          label="Pending Time Corrections"
          value={pendingCorrections.length}
          subtitle="Timesheet correction tickets"
          icon={<AlertTriangle size={20} />}
        />
      </div>

      {/* Approvals Section: Pending Leaves & Corrections */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 20 }}>
        <Card id="approvals">
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <div>
                <CardTitle>Pending Leave Requests Queue</CardTitle>
                <CardDescription>Direct reports applications awaiting authorization</CardDescription>
              </div>
              <Badge label={`${pendingLeaves.length} PENDING`} variant={pendingLeaves.length > 0 ? "warning" : "neutral"} size="sm" />
            </div>
          </CardHeader>
          <CardContent>
            <LeaveRequestsQueueClient initialRequests={pendingLeaves} isManager />
          </CardContent>
        </Card>

        <Card id="corrections">
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <div>
                <CardTitle>Attendance Corrections Queue</CardTitle>
                <CardDescription>Staff punch adjustments and missed clock-in tickets</CardDescription>
              </div>
              <Badge label={`${pendingCorrections.length} PENDING`} variant={pendingCorrections.length > 0 ? "warning" : "neutral"} size="sm" />
            </div>
          </CardHeader>
          <CardContent>
            <CorrectionsQueueClient initialCorrections={pendingCorrections} />
          </CardContent>
        </Card>
      </div>

      {/* Team Attendance Roster */}
      <Card id="attendance">
        <CardHeader>
          <CardTitle>Today&apos;s Team Attendance Roster</CardTitle>
          <CardDescription>Live daily punches, shift assignments, and work duration tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceRosterClient initialRoster={roster} currentDate={today} />
        </CardContent>
      </Card>

      {/* Direct Reports Table */}
      <Card id="team">
        <CardHeader>
          <CardTitle>Direct Reports Directory</CardTitle>
          <CardDescription>Employees assigned to your supervision via reporting_manager_id relationship</CardDescription>
        </CardHeader>
        <CardContent>
          <ManagerTeamTable data={data.teamMembers} />
        </CardContent>
      </Card>

      {/* Security Statement */}
      <div
        className="alert alert-info"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: 0,
          fontSize: "0.85rem",
        }}
      >
        <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
        <span>
          Managerial authorization scope is strictly isolated to your reporting line via PostgreSQL Row Level Security
          and the <code>public.is_manager_of_employee()</code> security-definer function.
        </span>
      </div>
    </div>
  );
}
