"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClockInOutWidget } from "./ClockInOutWidget";
import { AttendanceCorrectionModal } from "./AttendanceCorrectionModal";
import { ApplyLeaveModal } from "../leave/ApplyLeaveModal";
import { LeaveBalancesGrid } from "../leave/LeaveBalancesGrid";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { acknowledgeDutyDelegationAction } from "@/lib/data/attendance-actions";
import {
  extractHandoverFromReason,
  type AssignableColleague,
  type DelegatedDutyItem,
} from "@/lib/data/work-handover";
import type { ClockStatusResult } from "@/lib/data/attendance";
import type { AttendanceRecord, LeaveBalanceSummary, LeaveRequest } from "@ems/types";
import { Calendar, Plus, Users, UserCheck, CheckCircle2, Clock, FileText, ArrowRight } from "lucide-react";

interface EmployeeSelfClientProps {
  initialClockStatus: ClockStatusResult;
  employeeName: string;
  balances: LeaveBalanceSummary[];
  attendanceHistory: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  colleagues?: AssignableColleague[];
  assignedDuties?: DelegatedDutyItem[];
  myDelegatedDuties?: DelegatedDutyItem[];
}

export function EmployeeSelfClient({
  initialClockStatus,
  employeeName,
  balances,
  attendanceHistory,
  leaveRequests,
  colleagues = [],
  assignedDuties = [],
  myDelegatedDuties = [],
}: EmployeeSelfClientProps) {
  const router = useRouter();
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [activeHandoverTab, setActiveHandoverTab] = useState<"assigned_to_me" | "delegated_by_me">("assigned_to_me");
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAcknowledgeDuty = (duty: DelegatedDutyItem) => {
    setAcknowledgingId(duty.id);
    startTransition(async () => {
      await acknowledgeDutyDelegationAction(duty.id, duty.sourceType);
      setAcknowledgingId(null);
      router.refresh();
    });
  };

  const historyColumns: DataTableColumn<AttendanceRecord>[] = [
    {
      key: "workDate",
      header: "Date",
      render: (row) => <strong>{new Date(row.workDate).toLocaleDateString()}</strong>,
    },
    {
      key: "clockIn",
      header: "Clock In",
      render: (row) => (
        <span>{row.clockIn ? new Date(row.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
      ),
    },
    {
      key: "clockOut",
      header: "Clock Out",
      render: (row) => (
        <span>{row.clockOut ? new Date(row.clockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
      ),
    },
    {
      key: "durationMinutes",
      header: "Worked",
      render: (row) => {
        const h = Math.floor(row.durationMinutes / 60);
        const m = row.durationMinutes % 60;
        return <span>{h}h {m}m</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge
          label={row.isLate ? "LATE" : row.status.toUpperCase()}
          variant={row.status === "present" ? "success" : row.isLate ? "warning" : "neutral"}
          size="sm"
        />
      ),
    },
    {
      key: "notes",
      header: "Audit / Notes",
      render: (row) => (
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {row.isCorrected ? "Adjusted by Manager" : row.notes || "—"}
        </span>
      ),
    },
  ];

  const leaveColumns: DataTableColumn<LeaveRequest>[] = [
    {
      key: "leaveTypeName",
      header: "Type",
      render: (row) => <strong>{row.leaveTypeName}</strong>,
    },
    {
      key: "startDate",
      header: "Dates",
      render: (row) => (
        <span>{new Date(row.startDate).toLocaleDateString()} – {new Date(row.endDate).toLocaleDateString()}</span>
      ),
    },
    {
      key: "totalDays",
      header: "Days",
      render: (row) => <span>{row.totalDays}d</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge
          label={row.status.toUpperCase()}
          variant={row.status === "approved" ? "success" : row.status === "rejected" ? "danger" : "warning"}
          size="sm"
        />
      ),
    },
    {
      key: "reason",
      header: "Reason & Handover",
      render: (row) => {
        const { handover, cleanReason } = extractHandoverFromReason(row.reason);
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 260 }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-color, #1e293b)" }}>{cleanReason}</span>
            {handover && (
              <div
                style={{
                  fontSize: "0.74rem",
                  padding: "4px 8px",
                  borderRadius: 4,
                  background: "rgba(37, 99, 235, 0.08)",
                  border: "1px solid rgba(37, 99, 235, 0.2)",
                  color: "var(--primary, #2563eb)",
                }}
              >
                <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <UserCheck size={12} /> Substitute: {handover.substituteName}
                </div>
                <div style={{ color: "var(--text-muted)", marginTop: 2 }}>{handover.tasks}</div>
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* 1. Interactive Clock Widget */}
      <ClockInOutWidget
        initialStatus={initialClockStatus}
        employeeName={employeeName}
        onOpenCorrectionModal={() => setIsCorrectionOpen(true)}
      />

      {/* 2. Duty Handover & Substitute Coverage Section */}
      {(assignedDuties.length > 0 || myDelegatedDuties.length > 0) && (
        <Card>
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: 10 }}>
              <div>
                <CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Users size={18} color="var(--primary)" />
                  Work Handover & Duty Delegation
                </CardTitle>
                <CardDescription>
                  Manage tasks and lecture duties assigned to you during colleague absences or delegated by you.
                </CardDescription>
              </div>
              <div style={{ display: "flex", gap: 6, background: "var(--background-muted, #f1f5f9)", padding: 4, borderRadius: 8 }}>
                <button
                  type="button"
                  onClick={() => setActiveHandoverTab("assigned_to_me")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: activeHandoverTab === "assigned_to_me" ? "var(--background, #ffffff)" : "transparent",
                    color: activeHandoverTab === "assigned_to_me" ? "var(--primary, #2563eb)" : "var(--text-muted, #64748b)",
                    boxShadow: activeHandoverTab === "assigned_to_me" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  Duties Assigned to You ({assignedDuties.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHandoverTab("delegated_by_me")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: activeHandoverTab === "delegated_by_me" ? "var(--background, #ffffff)" : "transparent",
                    color: activeHandoverTab === "delegated_by_me" ? "var(--primary, #2563eb)" : "var(--text-muted, #64748b)",
                    boxShadow: activeHandoverTab === "delegated_by_me" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  Duties You Delegated ({myDelegatedDuties.length})
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeHandoverTab === "assigned_to_me" ? (
              assignedDuties.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)" }}>
                  <p style={{ margin: 0, fontSize: "0.9rem" }}>No substitute duties assigned to you at this time.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
                  {assignedDuties.map((duty) => {
                    const isAcknowledged = duty.handover.status === "acknowledged";
                    return (
                      <div
                        key={duty.id}
                        style={{
                          border: "1px solid var(--border-color, #e2e8f0)",
                          borderRadius: 8,
                          padding: 16,
                          background: isAcknowledged ? "rgba(16, 185, 129, 0.03)" : "rgba(245, 158, 11, 0.03)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                            <div>
                              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--foreground)" }}>
                                Covering for: {duty.absentEmployeeName}
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                {duty.absentEmployeeCode} • {duty.dateOrPeriod}
                              </div>
                            </div>
                            <Badge
                              label={isAcknowledged ? "ACKNOWLEDGED" : "PENDING ACCEPTANCE"}
                              variant={isAcknowledged ? "success" : "warning"}
                              size="sm"
                            />
                          </div>

                          <div
                            style={{
                              marginTop: 10,
                              padding: "10px 12px",
                              borderRadius: 6,
                              background: "var(--background, #ffffff)",
                              border: "1px solid var(--border-color, #e2e8f0)",
                            }}
                          >
                            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
                              ASSIGNED TASKS / CLASSES
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-color, #1e293b)", whiteSpace: "pre-wrap" }}>
                              {duty.handover.tasks}
                            </div>
                            {duty.handover.notes && (
                              <div style={{ marginTop: 8, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                <strong>Instructions:</strong> {duty.handover.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, paddingTop: 4 }}>
                          {!isAcknowledged ? (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleAcknowledgeDuty(duty)}
                              isLoading={isPending && acknowledgingId === duty.id}
                            >
                              <CheckCircle2 size={14} style={{ marginRight: 6 }} /> Acknowledge & Accept Duty
                            </Button>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                              <CheckCircle2 size={14} /> Duty Acknowledged
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              myDelegatedDuties.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)" }}>
                  <p style={{ margin: 0, fontSize: "0.9rem" }}>You have not delegated any duties to colleagues.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
                  {myDelegatedDuties.map((duty) => (
                    <div
                      key={duty.id}
                      style={{
                        border: "1px solid var(--border-color, #e2e8f0)",
                        borderRadius: 8,
                        padding: 16,
                        background: "var(--background, #ffffff)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--foreground)" }}>
                            Assigned to: {duty.handover.substituteName}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {duty.handover.substituteCode ? `${duty.handover.substituteCode} • ` : ""}{duty.dateOrPeriod}
                          </div>
                        </div>
                        <Badge
                          label={duty.handover.status === "acknowledged" ? "COLLEAGUE ACCEPTED" : "AWAITING ACCEPTANCE"}
                          variant={duty.handover.status === "acknowledged" ? "success" : "neutral"}
                          size="sm"
                        />
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-color, #1e293b)", background: "var(--background-muted, #f8fafc)", padding: "8px 12px", borderRadius: 6 }}>
                        <strong>Tasks:</strong> {duty.handover.tasks}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* 3. Leave Balances Section */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--foreground)" }}>
              My Leave Quota & Balances
            </h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Real-time authoritative ledger balances computed from approved credits and deductions.
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsApplyLeaveOpen(true)}>
            <Plus size={15} style={{ marginRight: 6 }} /> Apply for Leave
          </Button>
        </div>

        <LeaveBalancesGrid balances={balances} />
      </div>

      {/* 4. Recent Attendance History & Leave Applications */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }}>
        <Card>
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <div>
                <CardTitle>Attendance History (Recent Days)</CardTitle>
                <CardDescription>Verified daily clocking punches and durations</CardDescription>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setIsCorrectionOpen(true)}>
                <Clock size={14} style={{ marginRight: 4 }} /> Request Adjustment
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={attendanceHistory}
              columns={historyColumns}
              keyExtractor={(row) => row.id}
              emptyTitle="No attendance records"
              emptyDescription="You haven't clocked in yet."
              pageSize={5}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <div>
                <CardTitle>My Leave Applications</CardTitle>
                <CardDescription>Track status of submitted leave requests</CardDescription>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setIsApplyLeaveOpen(true)}>
                <Calendar size={14} style={{ marginRight: 4 }} /> New Request
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={leaveRequests}
              columns={leaveColumns}
              keyExtractor={(row) => row.id}
              emptyTitle="No leave applications"
              emptyDescription="You have not submitted any leave requests."
              pageSize={5}
            />
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {isApplyLeaveOpen && (
        <ApplyLeaveModal
          isOpen={isApplyLeaveOpen}
          onClose={() => setIsApplyLeaveOpen(false)}
          balances={balances}
          colleagues={colleagues}
        />
      )}

      {isCorrectionOpen && (
        <AttendanceCorrectionModal
          isOpen={isCorrectionOpen}
          onClose={() => setIsCorrectionOpen(false)}
          colleagues={colleagues}
        />
      )}
    </div>
  );
}
