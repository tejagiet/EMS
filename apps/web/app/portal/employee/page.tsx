import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { SchemaDependencyNotice } from "@/components/ui/SchemaDependencyNotice";
import { verifyPortalAccess } from "@/lib/auth/session";
import { getEmployeeSelfDetails } from "@/lib/data/analytics";
import { Briefcase, Building2, Calendar, CheckCircle2, Mail, MapPin, User } from "lucide-react";

export const metadata = {
  title: "Employee Self-Service Portal | EMS",
};

export default async function EmployeeDashboard() {
  const context = await verifyPortalAccess("employee");
  const linkedEmployee = context.linkedEmployee;

  const empDetails = linkedEmployee ? await getEmployeeSelfDetails(linkedEmployee.id) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Employee Self-Service Workspace
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Personal job profile, leave requests, attendance logs, and compensation documents.
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
          label="Today's Clock-In"
          isUnavailable
          requiredPhase={5}
          unavailableReason="Awaiting Phase 5 Biometric/Web Clock-In engine."
        />
        <MetricCard
          label="Available Leave Balance"
          isUnavailable
          requiredPhase={5}
          unavailableReason="Awaiting Phase 5 Leave Ledger accruals."
        />
        <MetricCard
          label="Pending Leave Applications"
          isUnavailable
          requiredPhase={5}
          unavailableReason="Awaiting Phase 5 Leave Requests ledger."
        />
        <MetricCard
          label="Latest Digital Payslip"
          isUnavailable
          requiredPhase={6}
          unavailableReason="Awaiting Phase 6 Payslip generator."
        />
      </div>

      {/* Profile Overview Card & Quick Details */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 20,
        }}
      >
        <Card>
          <CardHeader>
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

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Self-Service Shortcuts & Upcoming Features</CardTitle>
              <CardDescription>Future self-service operational modules</CardDescription>
            </div>
          </CardHeader>
          <CardContent style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SchemaDependencyNotice
              moduleName="Web Clock-In & Timesheet"
              requiredPhase={5}
              description="One-click daily attendance marking, break tracking, and remote punch-in."
              compact
            />
            <SchemaDependencyNotice
              moduleName="Leave Application Portal"
              requiredPhase={5}
              description="Submit casual, sick, and earned leave requests directly to your supervisor."
              compact
            />
            <SchemaDependencyNotice
              moduleName="Digital Payslip Vault"
              requiredPhase={6}
              description="Download password-protected monthly salary statements and tax computation sheets."
              compact
            />
          </CardContent>
        </Card>
      </div>

      {/* Institutional Security Notice */}
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
          Your account is secured under Role-Based Access Control. You have self-service access to
          your personal employment profile and attendance records.
        </span>
      </div>
    </div>
  );
}
