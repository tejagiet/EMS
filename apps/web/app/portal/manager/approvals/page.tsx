import { verifyPortalAccess } from "@/lib/auth/session";
import { getTeamLeaveRequests } from "@/lib/data/leave";
import { getAttendanceCorrectionsList } from "@/lib/data/attendance";
import { LeaveRequestsQueueClient } from "@/components/leave/LeaveRequestsQueueClient";
import { CorrectionsQueueClient } from "@/components/attendance/CorrectionsQueueClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { CheckSquare, Calendar, Clock } from "lucide-react";

export const metadata = {
  title: "Pending Approvals | Manager Portal",
};

export default async function ManagerApprovalsPage() {
  const context = await verifyPortalAccess("manager");
  const orgId = context.activeOrganization?.id ?? "";
  const managerEmployeeId = context.linkedEmployee?.id ?? null;

  const [pendingLeaves, pendingCorrections] = await Promise.all([
    getTeamLeaveRequests(orgId, managerEmployeeId, "pending"),
    getAttendanceCorrectionsList(orgId, managerEmployeeId, "pending"),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Supervisory Approvals Queue
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Action pending leave applications and clock-in/out timesheet corrections submitted by your reporting staff.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Leave Requests Pending"
          value={pendingLeaves.length}
          subtitle="Casual, Sick, & Privilege leaves"
          icon={<Calendar size={20} color="#f59e0b" />}
        />
        <MetricCard
          label="Timesheet Corrections"
          value={pendingCorrections.length}
          subtitle="Missed punch adjustments"
          icon={<Clock size={20} color="#3b82f6" />}
        />
        <MetricCard
          label="Total Action Items"
          value={pendingLeaves.length + pendingCorrections.length}
          subtitle="Awaiting manager sign-off"
          icon={<CheckSquare size={20} color="#10b981" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Team Leave Applications</CardTitle>
            <CardDescription>
              Review leave quota impacts, requested dates, and approve or reject team leave submissions
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <LeaveRequestsQueueClient
            initialRequests={pendingLeaves}
            isManager={true}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Attendance Timesheet Adjustments</CardTitle>
            <CardDescription>
              Authorize employee clock-in and clock-out correction requests with reason audits
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <CorrectionsQueueClient
            initialCorrections={pendingCorrections}
          />
        </CardContent>
      </Card>
    </div>
  );
}
