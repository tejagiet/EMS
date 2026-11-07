import { verifyPortalAccess } from "@/lib/auth/session";
import { getEmployeeSelfDetails } from "@/lib/data/analytics";
import { getTodayAttendanceStatus, getEmployeeAttendanceHistory } from "@/lib/data/attendance";
import { getEmployeeLeaveBalances, getEmployeeLeaveRequests } from "@/lib/data/leave";
import { getEmployeePayslips } from "@/lib/data/payroll";
import { getEmployeeTasks } from "@/lib/data/tasks";
import { getAnnouncements } from "@/lib/data/announcements";
import { getAssets } from "@/lib/data/assets";
import { EmployeeSelfClient } from "@/components/attendance/EmployeeSelfClient";
import { EmployeePayslipsClient } from "@/components/payroll/EmployeePayslipsClient";
import { EmployeeSecurityCard } from "@/components/employees/EmployeeSecurityCard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import {
  User,
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  Mail,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Laptop,
  Megaphone,
} from "lucide-react";

export const metadata = {
  title: "Employee Self-Service Portal | EMS",
};

export default async function EmployeeDashboard() {
  const context = await verifyPortalAccess("employee");
  const orgId = context.activeOrganization?.id ?? "";
  const linkedEmployee = context.linkedEmployee;

  const [
    empDetails,
    clockStatus,
    balances,
    attendanceHistory,
    leaveRequests,
    payslips,
    tasks,
    announcements,
    assets,
  ] = await Promise.all([
    linkedEmployee ? getEmployeeSelfDetails(linkedEmployee.id) : null,
    linkedEmployee
      ? getTodayAttendanceStatus(orgId, linkedEmployee.id)
      : { hasOpenSession: false, activeRecord: null, assignedShift: null },
    linkedEmployee ? getEmployeeLeaveBalances(orgId, linkedEmployee.id) : [],
    linkedEmployee ? getEmployeeAttendanceHistory(orgId, linkedEmployee.id, 10) : [],
    linkedEmployee ? getEmployeeLeaveRequests(orgId, linkedEmployee.id) : [],
    linkedEmployee ? getEmployeePayslips(linkedEmployee.id) : [],
    linkedEmployee ? getEmployeeTasks(orgId, linkedEmployee.id) : [],
    getAnnouncements(orgId, context.userId),
    getAssets(orgId),
  ]);

  const totalAvailableLeave = balances.reduce((acc, b) => acc + b.availableDays, 0);
  const pendingRequestsCount = leaveRequests.filter((r) => r.status === "pending").length;
  const myAssets = assets.filter((a) => a.currentEmployeeId === linkedEmployee?.id);
  const pendingTasksCount = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Employee Self-Service Workspace
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Personal job profile, real-time attendance punching, leave applications, digital payslips, and operational assets.
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
          label="My Assigned Hardware"
          value={`${myAssets.length} Devices`}
          subtitle="Physical workstations under custody"
          icon={<Laptop size={20} />}
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

      {/* Announcements Broadcast Card */}
      <Card id="announcements">
        <CardHeader>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Megaphone size={18} className="text-indigo-600" />
            <div>
              <CardTitle>Institutional Notices & Announcements</CardTitle>
              <CardDescription>
                Campus-wide bulletins and departmental operational memos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <p className="text-sm text-slate-500 py-3">No active announcements posted.</p>
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 3).map((a) => (
                <div key={a.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-slate-900">{a.title}</span>
                    <Badge variant={a.priority === "urgent" ? "danger" : "neutral"} size="sm">
                      {a.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{a.body}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phase 8 Modules: Assigned Hardware & Tasks */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 20,
        }}
      >
        {/* Assigned IT Equipment */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>My IT Assets & Devices</CardTitle>
              <CardDescription>Custody of enterprise equipment and devices</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {myAssets.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No IT assets assigned to your profile.</p>
            ) : (
              <div className="space-y-3">
                {myAssets.map((asset) => (
                  <div key={asset.id} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{asset.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{asset.assetTag} • {asset.model ?? "Standard"}</p>
                    </div>
                    <Badge variant="success" size="sm">
                      {asset.condition.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assigned Tasks */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>My Tasks ({pendingTasksCount} Pending)</CardTitle>
              <CardDescription>Day-to-day operational assignments</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No tasks currently assigned to you.</p>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 4).map((t) => (
                  <div key={t.id} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${t.status === "completed" ? "line-through text-slate-400" : "text-slate-900"}`}>
                        {t.title}
                      </p>
                      {t.dueDate && <p className="text-xs text-slate-500">Due: {t.dueDate}</p>}
                    </div>
                    <Badge variant={t.status === "completed" ? "success" : "neutral"} size="sm">
                      {t.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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

        {/* Portal Password & Credential Setup */}
        <EmployeeSecurityCard workEmail={empDetails?.workEmail ?? context.email} />

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
