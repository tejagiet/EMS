import { verifyPortalAccess } from "@/lib/auth/session";
import {
  getTodayAttendanceStatus,
  getEmployeeAttendanceHistory,
  getAssignableColleagues,
  getAssignedSubstituteDuties,
  getMyDelegatedDuties,
} from "@/lib/data/attendance";
import { getEmployeeLeaveBalances, getEmployeeLeaveRequests } from "@/lib/data/leave";
import { EmployeeSelfClient } from "@/components/attendance/EmployeeSelfClient";
import { MetricCard } from "@/components/ui/MetricCard";
import { Clock, Calendar, CheckCircle2, AlertCircle } from "lucide-react";

export const metadata = {
  title: "My Attendance & Shifts | Employee Portal",
};

export default async function EmployeeAttendancePage() {
  const context = await verifyPortalAccess("employee");
  const orgId = context.activeOrganization?.id ?? "";
  const linkedEmployee = context.linkedEmployee;

  const [
    clockStatus,
    attendanceHistory,
    balances,
    leaveRequests,
    colleagues,
    assignedDuties,
    myDelegatedDuties,
  ] = await Promise.all([
    linkedEmployee
      ? getTodayAttendanceStatus(orgId, linkedEmployee.id)
      : { hasOpenSession: false, activeRecord: null, assignedShift: null },
    linkedEmployee ? getEmployeeAttendanceHistory(orgId, linkedEmployee.id, 30) : [],
    linkedEmployee ? getEmployeeLeaveBalances(orgId, linkedEmployee.id) : [],
    linkedEmployee ? getEmployeeLeaveRequests(orgId, linkedEmployee.id) : [],
    getAssignableColleagues(orgId, linkedEmployee?.id),
    linkedEmployee ? getAssignedSubstituteDuties(orgId, linkedEmployee.id) : [],
    linkedEmployee ? getMyDelegatedDuties(orgId, linkedEmployee.id) : [],
  ]);

  const presentDays = attendanceHistory.filter((r) => r.status === "present" || r.isLate).length;
  const latePunches = attendanceHistory.filter((r) => r.isLate).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          My Attendance & Shift Punches
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Live clock-in and clock-out timestamps, assigned working shifts, and punch correction requests.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Shift Status"
          value={clockStatus.assignedShift?.name ?? "Standard Shift"}
          subtitle={`${clockStatus.assignedShift?.startTime ?? "09:00"} — ${clockStatus.assignedShift?.endTime ?? "17:00"}`}
          icon={<Clock size={20} />}
        />
        <MetricCard
          label="Days Present"
          value={presentDays}
          subtitle="Recent 30 working days"
          icon={<CheckCircle2 size={20} color="#10b981" />}
        />
        <MetricCard
          label="Late Marks"
          value={latePunches}
          subtitle="Punch after grace period"
          icon={<AlertCircle size={20} color={latePunches > 0 ? "#f59e0b" : "#10b981"} />}
        />
        <MetricCard
          label="Active Punch Session"
          value={clockStatus.hasOpenSession ? "Clocked In" : "Off Duty"}
          subtitle={clockStatus.hasOpenSession ? `Since ${clockStatus.activeRecord?.clockIn ?? ""}` : "Ready to punch"}
          icon={<Calendar size={20} color={clockStatus.hasOpenSession ? "#10b981" : "#64748b"} />}
        />
      </div>

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
