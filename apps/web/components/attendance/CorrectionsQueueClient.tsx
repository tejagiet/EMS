"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { reviewAttendanceCorrectionAction } from "@/lib/data/attendance-actions";
import type { AttendanceCorrection } from "@ems/types";
import { Check, X } from "lucide-react";

interface CorrectionsQueueClientProps {
  initialCorrections: AttendanceCorrection[];
}

export function CorrectionsQueueClient({ initialCorrections }: CorrectionsQueueClientProps) {
  const router = useRouter();
  const [activeDecision, setActiveDecision] = useState<{ id: string; decision: "approved" | "rejected"; empName: string } | null>(null);
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
      header: "Justification",
      render: (row) => (
        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: 220, display: "inline-block" }}>
          {row.reason}
        </span>
      ),
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

        return (
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setActiveDecision({ id: row.id, decision: "approved", empName: row.employeeName ?? "Employee" })}
            >
              <Check size={14} style={{ marginRight: 4 }} /> Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setActiveDecision({ id: row.id, decision: "rejected", empName: row.employeeName ?? "Employee" })}
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
          title={activeDecision.decision === "approved" ? "Approve Attendance Correction" : "Reject Attendance Correction"}
          description={`Confirm review for ${activeDecision.empName}.`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
                Approving this ticket will update the employee&apos;s timesheet punch record with the requested timestamps and recompute worked hours.
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
