"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { reviewLeaveRequestAction, exportLeaveReportCsvAction } from "@/lib/data/leave-actions";
import type { LeaveRequest } from "@ems/types";
import { Check, X, Download, Filter } from "lucide-react";

interface LeaveRequestsQueueClientProps {
  initialRequests: LeaveRequest[];
  isManager?: boolean;
}

export function LeaveRequestsQueueClient({
  initialRequests,
  isManager = false,
}: LeaveRequestsQueueClientProps) {
  const router = useRouter();
  const [requests] = useState<LeaveRequest[]>(initialRequests);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeDecision, setActiveDecision] = useState<{ id: string; decision: "approved" | "rejected"; empName: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [exportLoading, setExportLoading] = useState(false);

  const filteredRequests = requests.filter((r) => {
    if (filterStatus === "all") return true;
    return r.status === filterStatus;
  });

  const handleProcessDecision = () => {
    if (!activeDecision) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("requestId", activeDecision.id);
      formData.set("decision", activeDecision.decision);
      if (rejectionReason.trim()) formData.set("rejectionReason", rejectionReason.trim());

      await reviewLeaveRequestAction(null, formData);
      setActiveDecision(null);
      setRejectionReason("");
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
      header: "Reason",
      render: (row) => (
        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: 240, display: "inline-block" }}>
          {row.reason}
        </span>
      ),
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

        return (
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <Button
              size="sm"
              variant="primary"
              title="Approve Request"
              onClick={() => setActiveDecision({ id: row.id, decision: "approved", empName: row.employeeName ?? "Employee" })}
            >
              <Check size={14} style={{ marginRight: 4 }} /> Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              title="Reject Request"
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
