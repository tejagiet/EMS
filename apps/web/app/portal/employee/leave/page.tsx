import { verifyPortalAccess } from "@/lib/auth/session";
import { getEmployeeLeaveBalances, getEmployeeLeaveRequests } from "@/lib/data/leave";
import {
  getTodayAttendanceStatus,
  getEmployeeAttendanceHistory,
  getAssignableColleagues,
  getAssignedSubstituteDuties,
  getMyDelegatedDuties,
} from "@/lib/data/attendance";
import { EmployeeSelfClient } from "@/components/attendance/EmployeeSelfClient";
import { LeaveBalancesGrid } from "@/components/leave/LeaveBalancesGrid";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Calendar, CheckCircle2, Clock } from "lucide-react";

export const metadata = {
  title: "My Leaves & Applications | Employee Portal",
};

export default async function EmployeeLeavePage() {
  const context = await verifyPortalAccess("employee");
  const orgId = context.activeOrganization?.id ?? "";
  const linkedEmployee = context.linkedEmployee;

  const [
    balances,
    leaveRequests,
    clockStatus,
    attendanceHistory,
    colleagues,
    assignedDuties,
    myDelegatedDuties,
  ] = await Promise.all([
    linkedEmployee ? getEmployeeLeaveBalances(orgId, linkedEmployee.id) : [],
    linkedEmployee ? getEmployeeLeaveRequests(orgId, linkedEmployee.id) : [],
    linkedEmployee
      ? getTodayAttendanceStatus(orgId, linkedEmployee.id)
      : { hasOpenSession: false, activeRecord: null, assignedShift: null },
    linkedEmployee ? getEmployeeAttendanceHistory(orgId, linkedEmployee.id, 10) : [],
    getAssignableColleagues(orgId, linkedEmployee?.id),
    linkedEmployee ? getAssignedSubstituteDuties(orgId, linkedEmployee.id) : [],
    linkedEmployee ? getMyDelegatedDuties(orgId, linkedEmployee.id) : [],
  ]);

  const totalAvailable = balances.reduce((sum, b) => sum + b.availableDays, 0);
  const pendingRequests = leaveRequests.filter((r) => r.status === "pending").length;
  const approvedRequests = leaveRequests.filter((r) => r.status === "approved").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          My Leaves & Time-Off Quotas
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Apply for casual, sick, or earned privilege leave, view statutory allowances, and monitor approval states.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Remaining Leave Balance"
          value={`${totalAvailable} Days`}
          subtitle="Combined across all categories"
          icon={<Calendar size={20} color="#10b981" />}
        />
        <MetricCard
          label="Pending Applications"
          value={pendingRequests}
          subtitle="Awaiting manager authorization"
          icon={<Clock size={20} color="#f59e0b" />}
        />
        <MetricCard
          label="Approved Leaves"
          value={approvedRequests}
          subtitle="Authorized this calendar year"
          icon={<CheckCircle2 size={20} color="#3b82f6" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Entitled Leave Quotas</CardTitle>
            <CardDescription>
              Annual statutory quotas, consumed days, and remaining balances per policy rule
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <LeaveBalancesGrid balances={balances} />
        </CardContent>
      </Card>

      <EmployeeSelfClient
        initialClockStatus={clockStatus}
        employeeName={context.profile.fullName ?? "Employee"}
        balances={balances}
        attendanceHistory={attendanceHistory}
        leaveRequests={leaveRequests}
        colleagues={colleagues}
        assignedDuties={assignedDuties}
        myDelegatedDuties={myDelegatedDuties}
      />
    </div>
  );
}
