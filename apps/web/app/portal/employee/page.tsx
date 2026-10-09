import { verifyPortalAccess } from "@/lib/auth/session";
import { getEmployeeSelfDetails } from "@/lib/data/analytics";
import { getTodayAttendanceStatus, getEmployeeAttendanceHistory } from "@/lib/data/attendance";
import { getEmployeeLeaveBalances, getEmployeeLeaveRequests } from "@/lib/data/leave";
import { EmployeeSelfClient } from "@/components/attendance/EmployeeSelfClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { User, Briefcase, Building2, MapPin, Calendar, Mail, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Employee Self-Service Portal | EMS",
};

export default async function EmployeeDashboard() {
  const context = await verifyPortalAccess("employee");
  const orgId = context.activeOrganization?.id ?? "";
  const linkedEmployee = context.linkedEmployee;

  const [empDetails, clockStatus, balances, attendanceHistory, leaveRequests] = await Promise.all([
    linkedEmployee ? getEmployeeSelfDetails(linkedEmployee.id) : null,
    linkedEmployee
      ? getTodayAttendanceStatus(orgId, linkedEmployee.id)
      : { hasOpenSession: false, activeRecord: null, assignedShift: null },
    linkedEmployee ? getEmployeeLeaveBalances(orgId, linkedEmployee.id) : [],
    linkedEmployee ? getEmployeeAttendanceHistory(orgId, linkedEmployee.id, 10) : [],
    linkedEmployee ? getEmployeeLeaveRequests(orgId, linkedEmployee.id) : [],
  ]);

  const totalAvailableLeave = balances.reduce((acc, b) => acc + b.availableDays, 0);
  const pendingRequestsCount = leaveRequests.filter((r) => r.status === "pending").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Employee Self-Service Workspace
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Personal job profile, real-time attendance punching, leave applications, and timesheet logs.
        </p>
      </div>

      {/* KPI Cards — Fully Connected Live Metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 16,
        }}
      >
        <MetricCard
          label="Today's Clock-In"
          value={
            clockStatus.activeRecord?.clockIn
              ? new Date(clockStatus.activeRecord.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "Not Stamped"
          }
          subtitle={clockStatus.hasOpenSession ? "Session Currently Active" : "No active session"}
          icon={<Clock size={20} />}
        />
        <MetricCard
          label="Available Leave Quota"
          value={`${totalAvailableLeave} Days`}
          subtitle="Total available across all types"
          icon={<Calendar size={20} />}
        />
        <MetricCard
          label="Pending Applications"
          value={pendingRequestsCount}
          subtitle="Leave requests awaiting supervisor review"
          icon={<ShieldCheck size={20} />}
        />
        <MetricCard
          label="Latest Digital Payslip"
          isUnavailable
          requiredPhase={7}
          unavailableReason="Awaiting Phase 7 Payroll & Compensation cycle."
        />
      </div>

      {/* Primary Self-Service Component */}
      {linkedEmployee && (
        <EmployeeSelfClient
          initialClockStatus={clockStatus}
          employeeName={context.profile.fullName ?? "Staff Member"}
          balances={balances}
          attendanceHistory={attendanceHistory}
          leaveRequests={leaveRequests}
        />
      )}

      {/* Profile Overview Card */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 20,
        }}
      >
        <Card>
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <div>
                <CardTitle>My Employment Record</CardTitle>
                <CardDescription>Official institutional personnel data</CardDescription>
              </div>
              {empDetails && (
                <Badge
                  label={empDetails.employmentStatus.toUpperCase()}
                  variant={empDetails.employmentStatus === "active" ? "success" : "neutral"}
                  size="sm"
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {empDetails ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: "0.88rem" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: 8,
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <User size={15} /> Employee Code
                  </span>
                  <code style={{ fontWeight: 700 }}>{empDetails.employeeCode}</code>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: 8,
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Briefcase size={15} /> Designation
                  </span>
                  <strong>{empDetails.designationName}</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: 8,
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Building2 size={15} /> Department
                  </span>
                  <span>{empDetails.departmentName}</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: 8,
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <MapPin size={15} /> Branch / Campus
                  </span>
                  <span>{empDetails.branchName}</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: 8,
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Calendar size={15} /> Date of Joining
                  </span>
                  <span>{new Date(empDetails.dateOfJoining).toLocaleDateString()}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span
                    style={{
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Mail size={15} /> Work Email
                  </span>
                  <span>{empDetails.workEmail ?? context.email}</span>
                </div>
              </div>
            ) : (
              <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)" }}>
                No active employee record linked to your current authenticated account.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security & Access Statement */}
        <div
          className="alert alert-info"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            margin: 0,
            fontSize: "0.85rem",
            height: "fit-content",
          }}
        >
          <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Institutional Security Enforcement</div>
            All attendance clock-ins use trusted PostgreSQL database timestamps to prevent local machine clock tampering.
            Leave deductions and quota reserves are enforced transactionally against the authoritative leave ledger.
          </div>
        </div>
      </div>
    </div>
  );
}
