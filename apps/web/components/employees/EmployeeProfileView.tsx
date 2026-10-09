"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SchemaDependencyNotice } from "@/components/ui/SchemaDependencyNotice";
import type { EmployeeProfileDetail } from "@/lib/data/employees";
import { Briefcase, MapPin, Edit, ArrowLeft, Building } from "lucide-react";

interface EmployeeProfileViewProps {
  employee: EmployeeProfileDetail;
  canWrite: boolean;
  isAuditor: boolean;
}

export function EmployeeProfileView({ employee, canWrite, isAuditor }: EmployeeProfileViewProps) {
  const [activeTab, setActiveTab] = useState("overview");

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
    { id: "attendance", label: "Attendance (Phase 5)" },
    { id: "leave", label: "Leave Balance (Phase 5)" },
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

      {/* Tab 6: Attendance Summary (Phase 5) */}
      {activeTab === "attendance" && (
        <SchemaDependencyNotice
          moduleName="Attendance Clock-In & Shifts"
          requiredPhase={5}
          description="Detailed biometric clock logs, daily work hours, and punch-in timestamps will appear here once the attendance schema is deployed."
          plannedSchema={["attendance_records", "shift_allocations"]}
        />
      )}

      {/* Tab 7: Leave Balance (Phase 5) */}
      {activeTab === "leave" && (
        <SchemaDependencyNotice
          moduleName="Leave Ledger & Balances"
          requiredPhase={5}
          description="Accrued annual leave, medical leave credits, and pending time-off requests will appear here once the leave ledger migration is deployed."
          plannedSchema={["leave_ledger", "leave_requests", "leave_types"]}
        />
      )}
    </div>
  );
}
