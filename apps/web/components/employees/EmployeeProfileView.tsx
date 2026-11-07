"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SchemaDependencyNotice } from "@/components/ui/SchemaDependencyNotice";
import type { EmployeeProfileDetail } from "@/lib/data/employees";
import {
  Briefcase,
  MapPin,
  Edit,
  ArrowLeft,
  Building,
  Clock,
  Calendar,
  Lock,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";
import {
  extractEmployeePassword,
  setEmployeePasswordAction,
} from "@/lib/data/credentials";

interface EmployeeProfileViewProps {
  employee: EmployeeProfileDetail;
  canWrite: boolean;
  isAuditor: boolean;
  attendanceHistory?: any[];
  leaveBalances?: any[];
}

export function EmployeeProfileView({
  employee,
  canWrite,
  isAuditor,
  attendanceHistory = [],
  leaveBalances = [],
}: EmployeeProfileViewProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const initialPassword = extractEmployeePassword(employee.notes) || "Welcome@EMS2026";
  const [currentPassword, setCurrentPassword] = useState<string>(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [credMessage, setCredMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const initials = `${employee.firstName?.[0] ?? ""}${employee.lastName?.[0] ?? ""}`.toUpperCase() || "EM";

  const getStatusBadge = () => {
    switch (employee.employmentStatus) {
      case "active":
        return <Badge label="ACTIVE" variant="success" />;
      case "inactive":
        return <Badge label="INACTIVE" variant="neutral" />;
      case "suspended":
        return <Badge label="SUSPENDED" variant="warning" />;
      case "terminated":
        return <Badge label="TERMINATED" variant="danger" />;
      case "resigned":
        return <Badge label="RESIGNED" variant="neutral" />;
      case "on_leave":
        return <Badge label="ON LEAVE" variant="neutral" />;
      default:
        return <Badge label={String(employee.employmentStatus).toUpperCase()} variant="neutral" />;
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "personal", label: "Personal Information" },
    { id: "employment", label: "Employment Details" },
    { id: "structure", label: "Hierarchy & Direct Reports" },
    { id: "history", label: "Audit & Employment History" },
    { id: "attendance", label: "Attendance Logs" },
    { id: "leave", label: "Leave Balances" },
    { id: "security", label: "Portal Access & Password" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Back button and profile header banner */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <Link href="/portal/hr/employees" style={{ textDecoration: "none" }}>
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} style={{ marginRight: 6 }} /> Back to Employee Directory
          </Button>
        </Link>

        {canWrite && !isAuditor && (
          <Link href={`/portal/hr/employees/${employee.id}/edit`}>
            <Button variant="primary" size="sm">
              <Edit size={16} style={{ marginRight: 6 }} /> Edit Employee Profile
            </Button>
          </Link>
        )}
      </div>

      {/* Main Profile Summary Card */}
      <Card>
        <CardContent style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "var(--primary)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              >
                {initials}
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "var(--text)" }}>
                    {employee.fullName}
                  </h2>
                  {getStatusBadge()}
                  <code
                    style={{
                      background: "var(--background)",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: "0.85rem",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {employee.employeeCode}
                  </code>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8, flexWrap: "wrap", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Briefcase size={15} /> {employee.designationName}
                  </div>
                  <span>•</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Building size={15} /> {employee.departmentName}
                  </div>
                  <span>•</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <MapPin size={15} /> {employee.branchName}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: "right" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Date of Joining
              </span>
              <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text)" }}>
                {new Date(employee.dateOfJoining).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Sections Navigation */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 18px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.9rem",
              color: activeTab === tab.id ? "var(--primary)" : "var(--text-muted)",
              borderBottom: activeTab === tab.id ? "2px solid var(--primary)" : "2px solid transparent",
              transition: "all 0.15s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          <Card>
            <CardHeader>
              <CardTitle>Direct Contact Coordinates</CardTitle>
              <CardDescription>Official communication and reachability</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: "0.875rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Work Email:</span>
                  <span style={{ fontWeight: 500 }}>{employee.workEmail ?? "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Contact Number:</span>
                  <span style={{ fontWeight: 500 }}>{employee.contactNumber ?? "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Extension Phone:</span>
                  <span style={{ fontWeight: 500 }}>{employee.workPhone ?? "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Work Location:</span>
                  <span style={{ fontWeight: 500 }}>{employee.workLocation ?? "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supervisory Line</CardTitle>
              <CardDescription>Direct reporting hierarchy</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: "0.875rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Reporting Manager:</span>
                  <span style={{ fontWeight: 600, color: "var(--primary)" }}>
                    {employee.reportingManagerName ? `${employee.reportingManagerName} (${employee.reportingManagerCode})` : "Direct Self-Reporting"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Direct Reports:</span>
                  <span style={{ fontWeight: 600 }}>{employee.directReports.length} Team Members</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Notice Period:</span>
                  <span style={{ fontWeight: 500 }}>{employee.noticePeriodDays} Days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Personal Information */}
      {activeTab === "personal" && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Identification & Emergency Information</CardTitle>
            <CardDescription>Confidential personnel coordinates and next-of-kin details</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              <div>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 12, color: "var(--text)" }}>
                  Emergency Contact
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "0.875rem" }}>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Name: </span>
                    <strong>{employee.emergencyContactName ?? "Not recorded"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Relationship: </span>
                    <span>{employee.emergencyContactRelationship ?? "Not recorded"}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Phone: </span>
                    <span>{employee.emergencyContactPhone ?? "Not recorded"}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 12, color: "var(--text)" }}>
                  Residential Address
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.875rem" }}>
                  <div>{employee.addressLine1 ?? "No street address recorded"}</div>
                  {employee.addressLine2 && <div>{employee.addressLine2}</div>}
                  <div>
                    {[employee.city, employee.state, employee.postalCode].filter(Boolean).join(", ")}
                  </div>
                  <div>{employee.country ?? "India"}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Employment Details */}
      {activeTab === "employment" && (
        <Card>
          <CardHeader>
            <CardTitle>Contract & Service Specifications</CardTitle>
            <CardDescription>Organizational lifecycle, classification, and contractual milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, fontSize: "0.875rem" }}>
              <div style={{ padding: 12, borderRadius: 8, background: "var(--background)", border: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "block" }}>Employment Type</span>
                <strong style={{ textTransform: "capitalize", fontSize: "0.95rem" }}>{employee.employmentType.replace("_", " ")}</strong>
              </div>

              <div style={{ padding: 12, borderRadius: 8, background: "var(--background)", border: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "block" }}>Confirmation Date</span>
                <strong style={{ fontSize: "0.95rem" }}>{employee.dateOfConfirmation ? new Date(employee.dateOfConfirmation).toLocaleDateString() : "Pending Confirmation"}</strong>
              </div>

              <div style={{ padding: 12, borderRadius: 8, background: "var(--background)", border: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "block" }}>Notice Period Requirement</span>
                <strong style={{ fontSize: "0.95rem" }}>{employee.noticePeriodDays} Days</strong>
              </div>

              <div style={{ padding: 12, borderRadius: 8, background: "var(--background)", border: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "block" }}>Separation / Exit Date</span>
                <strong style={{ fontSize: "0.95rem" }}>
                  {employee.dateOfTermination
                    ? `Terminated: ${new Date(employee.dateOfTermination).toLocaleDateString()}`
                    : employee.dateOfResignation
                    ? `Resigned: ${new Date(employee.dateOfResignation).toLocaleDateString()}`
                    : "Active in Good Standing"}
                </strong>
              </div>
            </div>

            {employee.notes && (
              <div style={{ marginTop: 20 }}>
                <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
                  Administrative Notes (Restricted)
                </h4>
                <div style={{ padding: 12, borderRadius: 8, background: "var(--background)", border: "1px solid var(--border)", fontSize: "0.875rem" }}>
                  {employee.notes}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Hierarchy & Direct Reports */}
      {activeTab === "structure" && (
        <Card>
          <CardHeader>
            <CardTitle>Direct Reporting Team</CardTitle>
            <CardDescription>Personnel who report directly to this employee</CardDescription>
          </CardHeader>
          <CardContent>
            {employee.directReports.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                This employee currently has 0 direct reports assigned.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                {employee.directReports.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--background)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{r.fullName}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {r.employeeCode} • {r.designation}
                      </div>
                    </div>
                    <Link href={`/portal/hr/employees/${r.id}`}>
                      <Button size="sm" variant="ghost">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 5: History & Audit Log */}
      {activeTab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle>Audit Trail & Employment History</CardTitle>
            <CardDescription>Immutable record of promotions, department transfers, and status changes</CardDescription>
          </CardHeader>
          <CardContent>
            {employee.history.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                No historical revisions have been recorded for this employee.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {employee.history.map((h) => (
                  <div
                    key={h.id}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--background)",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 16,
                      fontSize: "0.875rem",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text)" }}>
                        Field Updated: <code style={{ color: "var(--primary)" }}>{h.fieldName}</code>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>
                        {h.oldValue ? `From: ${h.oldValue}` : "Initial value"} ➔ <strong>To: {h.newValue ?? "—"}</strong>
                      </div>
                      {h.changeReason && (
                        <div style={{ fontSize: "0.78rem", color: "var(--text)", marginTop: 4, fontStyle: "italic" }}>
                          Reason: {h.changeReason}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {new Date(h.createdAt).toLocaleDateString()} {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text)", marginTop: 2 }}>
                        By: {h.changedByName ?? "System"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 6: Attendance Logs */}
      {activeTab === "attendance" && (
        <Card>
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <CardTitle>Attendance & Biometric Logs</CardTitle>
                <CardDescription>Recent clock-in events, shift allocations, and workday duration.</CardDescription>
              </div>
              <Badge label={`${attendanceHistory.length} Logged Record${attendanceHistory.length === 1 ? "" : "s"}`} variant="neutral" />
            </div>
          </CardHeader>
          <CardContent>
            {attendanceHistory.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)" }}>
                <Clock size={36} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: 500 }}>No attendance records logged yet.</p>
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
                  Clock-in events, shift assignments, and daily hours will automatically record here.
                </p>
              </div>
            ) : (
              <div className="table-container" style={{ overflowX: "auto" }}>
                <table className="table" style={{ width: "100%", fontSize: "0.875rem" }}>
                  <thead>
                    <tr>
                      <th>Work Date</th>
                      <th>Shift</th>
                      <th>Clock In</th>
                      <th>Clock Out</th>
                      <th>Duration</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceHistory.map((rec: any) => (
                      <tr key={rec.id}>
                        <td style={{ fontWeight: 600 }}>{rec.workDate}</td>
                        <td>{rec.shiftName || "Standard General Shift"}</td>
                        <td>{rec.clockIn ? new Date(rec.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                        <td>{rec.clockOut ? new Date(rec.clockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "In Progress"}</td>
                        <td>{rec.durationMinutes ? `${Math.floor(rec.durationMinutes / 60)}h ${rec.durationMinutes % 60}m` : "—"}</td>
                        <td>
                          <Badge
                            label={String(rec.status).toUpperCase()}
                            variant={rec.status === "present" ? "success" : rec.status === "late" ? "warning" : "neutral"}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 7: Leave Balances & Quotas */}
      {activeTab === "leave" && (
        <Card>
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <CardTitle>Leave Quotas & Entitlements</CardTitle>
                <CardDescription>Accrued annual leave, medical credits, and available balance ledger.</CardDescription>
              </div>
              <Badge label="Current Year 2026" variant="neutral" />
            </div>
          </CardHeader>
          <CardContent>
            {leaveBalances.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)" }}>
                <Calendar size={36} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: 500 }}>Standard annual leave quota applies.</p>
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
                  Institutional entitlement: 12 days Casual Leave, 12 days Paid Leave, 10 days Sick Leave per calendar year.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                {leaveBalances.map((lb: any) => (
                  <div
                    key={lb.leaveTypeId}
                    style={{
                      padding: 16,
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{lb.leaveTypeName}</span>
                      <Badge label={lb.isPaid ? "Paid" : "Unpaid"} variant={lb.isPaid ? "success" : "neutral"} />
                    </div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", marginBottom: 4 }}>
                      {lb.availableDays ?? lb.daysPerYear ?? 12}{" "}
                      <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-muted)" }}>days available</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 8 }}>
                      <span>Accrued: {lb.accruedDays ?? lb.daysPerYear ?? 12}</span>
                      <span>Used: {lb.usedDays ?? 0}</span>
                      <span>Pending: {lb.pendingDays ?? 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 8: Portal Access & Credentials (Visible to Admins) */}
      {activeTab === "security" && (
        <Card>
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ShieldCheck size={20} style={{ color: "var(--primary)" }} /> Portal Access Credentials
                </CardTitle>
                <CardDescription>
                  Institutional staff login credentials and password governance.
                </CardDescription>
              </div>
              <Badge label="Administrator Visible" variant="warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div
                style={{
                  padding: 16,
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--table-stripe, #f8fafc)",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                      Portal Login Email / Username
                    </label>
                    <code style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--primary)" }}>
                      {employee.workEmail || "No work email assigned"}
                    </code>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                      Current Provisioned / Setup Password
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <code
                        style={{
                          fontSize: "1rem",
                          fontWeight: 700,
                          padding: "6px 12px",
                          borderRadius: 6,
                          backgroundColor: "var(--card-bg, #ffffff)",
                          border: "1px solid var(--border)",
                          letterSpacing: showPassword ? "normal" : "0.2em",
                        }}
                      >
                        {showPassword ? currentPassword : "••••••••••••"}
                      </code>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(currentPassword);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        title="Copy password to clipboard"
                      >
                        {copied ? <Check size={15} style={{ color: "var(--success)" }} /> : <Copy size={15} />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px dashed var(--border)", fontSize: "0.82rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Lock size={14} />
                  <span>
                    As per institutional security configuration, this password is set up and visible to administrators for employee onboarding and verification.
                  </span>
                </div>
              </div>

              {/* Set / Change Password Form */}
              <div
                style={{
                  padding: 16,
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                }}
              >
                <h4 style={{ margin: "0 0 6px 0", fontSize: "0.95rem", fontWeight: 600 }}>
                  Update or Reset Portal Password
                </h4>
                <p style={{ margin: "0 0 14px 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Assign a new password for this staff member. This immediately updates their login authentication and is saved to the administrative directory.
                </p>

                {credMessage && (
                  <div
                    className={`alert alert-${credMessage.type === "success" ? "success" : "error"}`}
                    style={{ marginBottom: 14 }}
                  >
                    {credMessage.text}
                  </div>
                )}

                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
                  <input
                    type="text"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new portal password"
                    className="form-input"
                    style={{ maxWidth: 300, height: 38 }}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const randomPass = `GIET@${Math.floor(1000 + Math.random() * 9000)}`;
                      setNewPasswordInput(randomPass);
                    }}
                  >
                    <Key size={14} style={{ marginRight: 4 }} /> Generate Password
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={isUpdatingPassword || !newPasswordInput.trim()}
                    onClick={async () => {
                      setIsUpdatingPassword(true);
                      setCredMessage(null);
                      try {
                        const res = await setEmployeePasswordAction(employee.id, newPasswordInput.trim());
                        if (res.success && res.password) {
                          setCurrentPassword(res.password);
                          setNewPasswordInput("");
                          setCredMessage({ type: "success", text: "Password updated successfully in authentication and admin directory." });
                        } else {
                          setCredMessage({ type: "error", text: res.error || "Failed to update password." });
                        }
                      } catch (err: any) {
                        setCredMessage({ type: "error", text: err.message || "An error occurred." });
                      } finally {
                        setIsUpdatingPassword(false);
                      }
                    }}
                  >
                    {isUpdatingPassword ? "Updating..." : "Save New Password"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
