import { verifyPortalAccess } from "@/lib/auth/session";
import { getEmployeeSelfDetails } from "@/lib/data/analytics";
import { getTodayAttendanceStatus, getEmployeeAttendanceHistory } from "@/lib/data/attendance";
import { getEmployeeLeaveBalances, getEmployeeLeaveRequests } from "@/lib/data/leave";
import { getEmployeePayslips } from "@/lib/data/payroll";
import { EmployeeSelfClient } from "@/components/attendance/EmployeeSelfClient";
import { EmployeePayslipsClient } from "@/components/payroll/EmployeePayslipsClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { User, Briefcase, Building2, MapPin, Calendar, Mail, Clock, ShieldCheck, CheckCircle2, FileText } from "lucide-react";

export const metadata = {
  title: "Employee Self-Service Portal | EMS",
};

export default async function EmployeeDashboard() {
  const context = await verifyPortalAccess("employee");
  const orgId = context.activeOrganization?.id ?? "";
  const linkedEmployee = context.linkedEmployee;

  const [empDetails, clockStatus, balances, attendanceHistory, leaveRequests, payslips] = await Promise.all([
    linkedEmployee ? getEmployeeSelfDetails(linkedEmployee.id) : null,
    linkedEmployee
      ? getTodayAttendanceStatus(orgId, linkedEmployee.id)
      : { hasOpenSession: false, activeRecord: null, assignedShift: null },
    linkedEmployee ? getEmployeeLeaveBalances(orgId, linkedEmployee.id) : [],
    linkedEmployee ? getEmployeeAttendanceHistory(orgId, linkedEmployee.id, 10) : [],
    linkedEmployee ? getEmployeeLeaveRequests(orgId, linkedEmployee.id) : [],
    linkedEmployee ? getEmployeePayslips(linkedEmployee.id) : [],
  ]);

  const totalAvailableLeave = balances.reduce((acc, b) => acc + b.availableDays, 0);
  const pendingRequestsCount = leaveRequests.filter((r) => r.status === "pending").length;
  const latestPayslip = payslips[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Employee Self-Service Workspace
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Personal job profile, real-time attendance punching, leave applications, and digital payslips.
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
          label="Today's Status"
          value={
            clockStatus.hasOpenSession
              ? "Clocked In"
              : clockStatus.activeRecord?.clockOut
              ? "Completed"
              : "Not Clocked In"
          }
          subtitle={
            clockStatus.assignedShift
              ? `Shift: ${clockStatus.assignedShift.name} (${clockStatus.assignedShift.startTime.slice(0, 5)} - ${clockStatus.assignedShift.endTime.slice(0, 5)})`
              : "No shift assigned today"
          }
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
          label="Latest Verified Payslip"
          value={latestPayslip ? `₹${latestPayslip.netSalary.toLocaleString("en-IN", { minimumFractionDigits: 0 })}` : "None Issued"}
          subtitle={latestPayslip ? (latestPayslip.periodTitle ?? latestPayslip.payslipNumber) : "Awaiting monthly cycle"}
          icon={<FileText size={20} />}
        />
      </div>

      {/* Primary Self-Service Component */}
      {linkedEmployee && (
        <EmployeeSelfClient
          initialClockStatus={clockStatus}
          employeeName={context.profile?.fullName ?? "Staff Member"}
          balances={balances}
          attendanceHistory={attendanceHistory}
          leaveRequests={leaveRequests}
        />
      )}

      {/* My Digital Payslips Section */}
      <Card id="payslips">
        <CardHeader>
          <div>
            <CardTitle>My Issued Payslips & Tax Ledgers</CardTitle>
            <CardDescription>
              Authoritative monthly salary slips containing earnings, statutory deductions, and printable receipts.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <EmployeePayslipsClient payslips={payslips} />
        </CardContent>
      </Card>

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
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span
                    style={{
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <User size={15} /> Full Name
                  </span>
                  <span style={{ fontWeight: 600 }}>{empDetails.fullName}</span>
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
                    <Briefcase size={15} /> Designation
                  </span>
                  <span style={{ fontWeight: 600 }}>{empDetails.designationName ?? "Faculty"}</span>
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
                    <Building2 size={15} /> Department
                  </span>
                  <span>{empDetails.departmentName ?? "AI Department"}</span>
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
                    <MapPin size={15} /> Branch
                  </span>
                  <span>{empDetails.branchName ?? "Main Campus"}</span>
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
                    <Calendar size={15} /> Joining Date
                  </span>
                  <span>{empDetails.dateOfJoining}</span>
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
            Payslips are digitally locked and cryptographically tamper-resistant upon supervisory approval.
          </div>
        </div>
      </div>
    </div>
  );
}
