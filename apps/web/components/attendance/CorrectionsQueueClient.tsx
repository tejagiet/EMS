"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { reviewAttendanceCorrectionAction } from "@/lib/data/attendance-actions";
import { extractHandoverFromReason, type WorkHandover } from "@/lib/data/work-handover";
import type { AttendanceCorrection } from "@ems/types";
import { Check, X, UserCheck, AlertCircle, ShieldCheck } from "lucide-react";

interface CorrectionsQueueClientProps {
  initialCorrections: AttendanceCorrection[];
}

export function CorrectionsQueueClient({ initialCorrections }: CorrectionsQueueClientProps) {
  const router = useRouter();
  const [activeDecision, setActiveDecision] = useState<{
    id: string;
    decision: "approved" | "rejected";
    empName: string;
    handover?: WorkHandover | null;
    cleanReason?: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleProcessDecision = () => {
    if (!activeDecision) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("correctionId", activeDecision.id);
      formData.set("decision", activeDecision.decision);
      if (rejectionReason.trim()) formData.set("rejectionReason", rejectionReason.trim());

      await reviewAttendanceCorrectionAction(null, formData);
      setActiveDecision(null);
      setRejectionReason("");
      router.refresh();
    });
  };

  const columns: DataTableColumn<AttendanceCorrection>[] = [
    {
      key: "employeeCode",
      header: "Employee",
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.employeeName ?? "Staff Member"}</div>
          <code style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{row.employeeCode}</code>
        </div>
      ),
    },
    {
      key: "requestedClockIn",
      header: "Requested Clock-In",
      render: (row) => (
        <span>{new Date(row.requestedClockIn).toLocaleString()}</span>
      ),
    },
    {
      key: "requestedClockOut",
      header: "Requested Clock-Out",
      render: (row) => (
        <span>{new Date(row.requestedClockOut).toLocaleString()}</span>
      ),
    },
    {
      key: "reason",
      header: "Justification & Duty Delegation",
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
      render: (row) => (
        <Badge
          label={row.status.toUpperCase()}
          variant={row.status === "approved" ? "success" : row.status === "rejected" ? "danger" : "warning"}
          size="sm"
        />
      ),
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
    <div>
      <DataTable
        data={initialCorrections}
        columns={columns}
        keyExtractor={(row) => row.id}
        emptyTitle="No correction requests"
        emptyDescription="There are currently no pending attendance adjustment tickets."
        pageSize={8}
      />

      {activeDecision && (
        <Modal
          isOpen={Boolean(activeDecision)}
          onClose={() => setActiveDecision(null)}
          title={activeDecision.decision === "approved" ? "Approve Attendance Adjustment" : "Reject Attendance Adjustment"}
          description={`Confirm review decision for ${activeDecision.empName}.`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {activeDecision.cleanReason && (
              <div style={{ fontSize: "0.85rem", padding: "8px 12px", background: "var(--background-muted, #f8fafc)", borderRadius: 6 }}>
                <strong>Employee Reason:</strong> {activeDecision.cleanReason}
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
                  <ShieldCheck size={16} /> Work Handover / Duty Coverage
                </div>
                <div style={{ marginTop: 6 }}>
                  <strong>Substitute Colleague:</strong> {activeDecision.handover.substituteName}{" "}
                  {activeDecision.handover.substituteCode ? `(${activeDecision.handover.substituteCode})` : ""}
                </div>
                <div style={{ marginTop: 4 }}>
                  <strong>Assigned Tasks:</strong> {activeDecision.handover.tasks}
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
                  Rejection Reason
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="State reason for rejecting this correction request..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box" }}
                  required
                />
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Approving this ticket will verify the attendance adjustment and authorize the work handover.
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
                Confirm Decision
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
