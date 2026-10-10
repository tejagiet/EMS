import { verifyPortalAccess } from "@/lib/auth/session";
import { getTeamLeaveRequests } from "@/lib/data/leave";
import { LeaveRequestsQueueClient } from "@/components/leave/LeaveRequestsQueueClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Calendar, CheckCircle2, Clock } from "lucide-react";

export const metadata = {
  title: "Department Leave Approvals | Department Head Portal",
};

export default async function DeptHeadLeavePage() {
  const context = await verifyPortalAccess("dept_head");
  const orgId = context.activeOrganization?.id ?? "";

  const pendingLeaves = await getTeamLeaveRequests(orgId, null, "pending");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Department Leave Approvals
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Review and approve faculty and staff leave requests while ensuring minimum departmental staffing thresholds.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Pending Approvals"
          value={pendingLeaves.length}
          subtitle="Awaiting HOD sign-off"
          icon={<Clock size={20} color="#f59e0b" />}
        />
        <MetricCard
          label="Coverage Threshold"
          value="75% Min Staff"
          subtitle="Department operational quota"
          icon={<CheckCircle2 size={20} color="#10b981" />}
        />
        <MetricCard
          label="Leave Balance Protection"
          value="Automated Deduction"
          subtitle="Strict quota limits"
          icon={<Calendar size={20} color="#3b82f6" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Departmental Leave Applications Queue</CardTitle>
            <CardDescription>
              Evaluate duration, substitution arrangements, and authorize time-off applications
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <LeaveRequestsQueueClient
            initialRequests={pendingLeaves}
          />
        </CardContent>
      </Card>
    </div>
  );
}
