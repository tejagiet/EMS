"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { reviewLeaveRequestAction, exportLeaveReportCsvAction } from "@/lib/data/leave-actions";
import { extractHandoverFromReason, type WorkHandover } from "@/lib/data/work-handover";
import type { LeaveRequest } from "@ems/types";
import { Check, X, Download, Filter, UserCheck, ShieldCheck } from "lucide-react";
import { useRealtime } from "@/src/context/RealtimeContext";

interface LeaveRequestsQueueClientProps {
  initialRequests: LeaveRequest[];
  isManager?: boolean;
}

export function LeaveRequestsQueueClient({
  initialRequests,
  isManager = false,
}: LeaveRequestsQueueClientProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<LeaveRequest[]>(initialRequests);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeDecision, setActiveDecision] = useState<{
    id: string;
    decision: "approved" | "rejected";
    empName: string;
    handover?: WorkHandover | null;
    cleanReason?: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);

  const { broadcastChange, isConnected } = useRealtime({
    table: "leave_requests",
    onUpdate: () => {
      router.refresh();
    },
  });

  const filteredRequests = requests.filter((r) => {
    if (filterStatus === "all") return true;
    return r.status === filterStatus;
  });

  const handleProcessDecision = () => {
    if (!activeDecision) return;
    setActionError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("requestId", activeDecision.id);
      formData.set("decision", activeDecision.decision);
      if (rejectionReason.trim()) formData.set("rejectionReason", rejectionReason.trim());

      const res = await reviewLeaveRequestAction(null, formData);
      if (!res.success) {
        setActionError(res.error ?? "Failed to process leave decision.");
        return;
      }

      await broadcastChange({
        table: "leave_requests",
        eventType: "UPDATE",
        message: `Leave request for ${activeDecision.empName} marked ${activeDecision.decision}.`,
      });
      setActiveDecision(null);
      setRejectionReason("");
      setActionError(null);
      router.refresh();
    });
  };

  const handleExportCsv = async () => {
    setExportLoading(true);
    try {
      const res = await exportLeaveReportCsvAction();
      if (res.success && res.csvContent) {
        const blob = new Blob([res.csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `leave_report_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } finally {
      setExportLoading(false);
    }
  };

  const getStatusBadge = (status: LeaveRequest["status"]) => {
    switch (status) {
      case "approved":
        return <Badge label="APPROVED" variant="success" size="sm" />;
      case "rejected":
        return <Badge label="REJECTED" variant="danger" size="sm" />;
      case "cancelled":
        return <Badge label="CANCELLED" variant="neutral" size="sm" />;
      default:
        return <Badge label="PENDING REVIEW" variant="warning" size="sm" />;
    }
  };

  const columns: DataTableColumn<LeaveRequest>[] = [
    {
      key: "employeeCode",
      header: "Employee",
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.employeeName ?? "Self Application"}</div>
          <code style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{row.employeeCode}</code>
        </div>
      ),
    },
    {
      key: "leaveTypeName",
      header: "Leave Category",
      render: (row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.leaveTypeName}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{row.leaveTypeCode}</span>
        </div>
      ),
    },
    {
      key: "startDate",
      header: "Duration",
      render: (row) => (
        <div>
          <div>{new Date(row.startDate).toLocaleDateString()} – {new Date(row.endDate).toLocaleDateString()}</div>
          <strong style={{ fontSize: "0.75rem", color: "var(--primary)" }}>{row.totalDays} day(s)</strong>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Reason & Duty Delegation",
      render: (row) => {
        const { handover, cleanReason } = extractHandoverFromReason(row.reason);
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 280 }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-color, #1e293b)" }}>
              {cleanReason}
            </span>
            {handover && (
              <div
                style={{
                  fontSize: "0.75rem",
                  padding: "6px 8px",
                  borderRadius: 6,
                  background: "rgba(37, 99, 235, 0.06)",
                  border: "1px solid rgba(37, 99, 235, 0.2)",
                  color: "var(--primary, #2563eb)",
                }}
              >
                <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <UserCheck size={12} /> Substitute: {handover.substituteName}
                  {handover.substituteCode ? ` (${handover.substituteCode})` : ""}
                </div>
                <div style={{ color: "var(--text-muted)", marginTop: 2 }}>
                  <strong>Tasks:</strong> {handover.tasks}
                </div>
                <div style={{ marginTop: 2 }}>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: handover.status === "acknowledged" ? "#10b981" : "#f59e0b",
                    }}
                  >
                    {handover.status === "acknowledged" ? "● Substitute Acknowledged" : "○ Awaiting Acceptance"}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: "id",
      header: "Actions",
      align: "right",
      render: (row) => {
        if (row.status !== "pending") {
          return (
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {row.reviewedByName ? `By ${row.reviewedByName}` : "Completed"}
            </span>
          );
        }

        const { handover, cleanReason } = extractHandoverFromReason(row.reason);

        return (
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <Button
              size="sm"
              variant="primary"
              title="Approve Request"
              onClick={() =>
                setActiveDecision({
                  id: row.id,
                  decision: "approved",
                  empName: row.employeeName ?? "Employee",
                  handover,
                  cleanReason,
                })
              }
            >
              <Check size={14} style={{ marginRight: 4 }} /> Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              title="Reject Request"
              onClick={() =>
                setActiveDecision({
                  id: row.id,
                  decision: "rejected",
                  empName: row.employeeName ?? "Employee",
                  handover,
                  cleanReason,
                })
              }
            >
              <X size={14} style={{ marginRight: 4 }} /> Reject
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Top filter toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Filter size={16} style={{ color: "var(--text-muted)" }} />
          {["all", "pending", "approved", "rejected"].map((s) => (
            <Button
              key={s}
              size="sm"
              variant={filterStatus === s ? "primary" : "secondary"}
              onClick={() => setFilterStatus(s)}
            >
              {s.toUpperCase()}
            </Button>
          ))}
        </div>

        <Button size="sm" variant="secondary" onClick={handleExportCsv} isLoading={exportLoading}>
          <Download size={14} style={{ marginRight: 6 }} /> Export CSV
        </Button>
      </div>

      <DataTable
        data={filteredRequests}
        columns={columns}
        keyExtractor={(row) => row.id}
        emptyTitle="No leave requests found"
        emptyDescription={
          isManager
            ? "Your direct reports currently have no pending leave applications."
            : "No leave requests match the selected status filter."
        }
        pageSize={10}
      />

      {/* Decision confirmation modal */}
      {activeDecision && (
        <Modal
          isOpen={Boolean(activeDecision)}
          onClose={() => setActiveDecision(null)}
          title={activeDecision.decision === "approved" ? "Approve Leave Request" : "Reject Leave Request"}
          description={`Confirm authorization decision for ${activeDecision.empName}.`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {actionError && (
              <div style={{ color: "var(--danger)", fontSize: "0.85rem", padding: "8px 12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: 6 }}>
                {actionError}
              </div>
            )}

            {activeDecision.cleanReason && (
              <div style={{ fontSize: "0.85rem", padding: "8px 12px", background: "var(--background-muted, #f8fafc)", borderRadius: 6 }}>
                <strong>Reason:</strong> {activeDecision.cleanReason}
              </div>
            )}

            {activeDecision.handover && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 6,
                  background: "rgba(37, 99, 235, 0.05)",
                  border: "1px solid rgba(37, 99, 235, 0.2)",
                  fontSize: "0.85rem",
                }}
              >
                <div style={{ fontWeight: 700, color: "var(--primary, #2563eb)", display: "flex", alignItems: "center", gap: 6 }}>
                  <ShieldCheck size={16} /> Work Handover / Duty Delegation
                </div>
                <div style={{ marginTop: 6 }}>
                  <strong>Substitute Colleague:</strong> {activeDecision.handover.substituteName}{" "}
                  {activeDecision.handover.substituteCode ? `(${activeDecision.handover.substituteCode})` : ""}
                </div>
                <div style={{ marginTop: 4 }}>
                  <strong>Assigned Duties:</strong> {activeDecision.handover.tasks}
                </div>
                {activeDecision.handover.notes && (
                  <div style={{ marginTop: 4, color: "var(--text-muted)" }}>
                    <strong>Instructions:</strong> {activeDecision.handover.notes}
                  </div>
                )}
                <div style={{ marginTop: 6, fontSize: "0.78rem" }}>
                  <strong>Substitute Status:</strong>{" "}
                  <span style={{ color: activeDecision.handover.status === "acknowledged" ? "#10b981" : "#f59e0b", fontWeight: 600 }}>
                    {activeDecision.handover.status === "acknowledged" ? "Accepted by Colleague" : "Pending Colleague Acceptance"}
                  </span>
                </div>
              </div>
            )}

            {activeDecision.decision === "rejected" ? (
              <div>
                <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
                  Rejection Rationale
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="State the reason why this application cannot be granted (e.g. Critical project sprint deadline, staffing coverage)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box" }}
                  required
                />
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Approving this request will automatically deduct the requested days from the employee&apos;s authoritative leave ledger and mark their calendar as On Leave.
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <Button variant="secondary" onClick={() => setActiveDecision(null)} disabled={isPending}>
                Cancel
              </Button>
              <Button
                variant={activeDecision.decision === "approved" ? "primary" : "danger"}
                onClick={handleProcessDecision}
                isLoading={isPending}
              >
                {activeDecision.decision === "approved" ? "Confirm Approval" : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
