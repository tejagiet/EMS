"use client";

import { useState } from "react";
import { DataTable, type DataTableColumn } from "../ui/DataTable";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { PayslipViewModal } from "./PayslipViewModal";
import {
  createPayrollRunAction,
  processPayrollDecisionAction,
  exportPayrollRunCsvAction,
  getPayrollRunDetailsAction,
} from "@/lib/data/payroll-actions";
import type { PayrollRun, PayrollRecord, PayrollApprovalHistoryItem } from "@ems/types";
import {
  Plus,
  CheckCircle2,
  XCircle,
  Unlock,
  AlertCircle,
  Eye,
  Send,
  Download,
} from "lucide-react";

interface PayrollRunsClientProps {
  runs: PayrollRun[];
}

export function PayrollRunsClient({ runs }: PayrollRunsClientProps) {
  // Run creation modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState("October 2026 Monthly Payroll");
  const [periodStart, setPeriodStart] = useState("2026-10-01");
  const [periodEnd, setPeriodEnd] = useState("2026-10-31");
  const [paymentDate, setPaymentDate] = useState("2026-10-31");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Run Inspector
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [history, setHistory] = useState<PayrollApprovalHistoryItem[]>([]);

  // Payslip detail view
  const [activePayslip, setActivePayslip] = useState<PayrollRecord | null>(null);

  // Decision state
  const [decisionAction, setDecisionAction] = useState<"submit" | "approve" | "reject" | "correct" | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [processingDecision, setProcessingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState("");

  const openCreate = () => {
    setTitle(`Payroll Cycle ${new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}`);
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    setPeriodStart(`${y}-${m}-01`);
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
    setPeriodEnd(`${y}-${m}-${lastDay}`);
    setPaymentDate(`${y}-${m}-${lastDay}`);
    setCreateError("");
    setCreateModalOpen(true);
  };

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("periodStart", periodStart);
    formData.append("periodEnd", periodEnd);
    formData.append("paymentDate", paymentDate);

    const res = await createPayrollRunAction(formData);
    setCreating(false);

    if (!res.success) {
      setCreateError(res.error ?? "Failed to create payroll run.");
    } else {
      setCreateModalOpen(false);
    }
  };

  const handleInspect = async (run: PayrollRun) => {
    setSelectedRun(run);
    setInspectModalOpen(true);
    setDecisionError("");

    try {
      const details = await getPayrollRunDetailsAction(run.id);
      setRecords(details.records);
      setHistory(details.history);
      if (details.run) setSelectedRun(details.run);
    } catch {
      setRecords([]);
      setHistory([]);
    }
  };

  const handleExecuteDecision = async () => {
    if (!selectedRun || !decisionAction) return;
    setProcessingDecision(true);
    setDecisionError("");

    const formData = new FormData();
    formData.append("runId", selectedRun.id);
    formData.append("decision", decisionAction);
    if (decisionNotes) formData.append("notes", decisionNotes);

    const res = await processPayrollDecisionAction(formData);
    setProcessingDecision(false);

    if (!res.success) {
      setDecisionError(res.error ?? "Failed to process decision.");
    } else {
      setDecisionAction(null);
      setDecisionNotes("");
      // Refresh details
      const details = await getPayrollRunDetailsAction(selectedRun.id);
      if (details.run) setSelectedRun(details.run);
      setRecords(details.records);
      setHistory(details.history);
    }
  };

  const handleExportCsv = async (runId: string) => {
    try {
      const csv = await exportPayrollRunCsvAction(runId);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `payroll_run_${runId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert("Failed to export payroll report.");
    }
  };

  const statusVariant = (status: PayrollRun["status"]) => {
    switch (status) {
      case "approved":
        return "success";
      case "pending_approval":
        return "warning";
      case "rejected":
        return "danger";
      case "draft":
        return "secondary";
      default:
        return "neutral";
    }
  };

  const columns: DataTableColumn<PayrollRun>[] = [
    {
      key: "title",
      header: "Payroll Run Title",
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.title}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            {row.periodStart} to {row.periodEnd}
          </div>
        </div>
      ),
    },
    {
      key: "employeeCount",
      header: "Staff Count",
      sortable: true,
      render: (row) => <span>{row.employeeCount} staff</span>,
    },
    {
      key: "totalGross",
      header: "Gross Total",
      sortable: true,
      render: (row) => <span>₹{row.totalGross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>,
    },
    {
      key: "totalDeductions",
      header: "Total Deductions",
      sortable: true,
      render: (row) => (
        <span style={{ color: "#ef4444" }}>
          -₹{row.totalDeductions.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "totalNet",
      header: "Net Disbursement",
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 700, color: "#10b981" }}>
          ₹{row.totalNet.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge
          label={row.isLocked ? `${row.status.toUpperCase()} (LOCKED)` : row.status.toUpperCase()}
          variant={statusVariant(row.status)}
          size="sm"
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => { void handleInspect(row); }}
            leftIcon={<Eye size={14} />}
          >
            Review Details
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { void handleExportCsv(row.id); }}
            leftIcon={<Download size={14} />}
          >
            CSV
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>Payroll Cycles & Runs</h3>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
            Monthly payroll calculation batches, multi-level approvals, and immutable locking.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate} leftIcon={<Plus size={16} />}>
          Initiate Payroll Run
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={runs}
        keyExtractor={(item) => item.id}
        emptyTitle="No Payroll Runs Created"
        emptyDescription="Click 'Initiate Payroll Run' to calculate compensation for eligible active employees."
      />

      {/* Create Run Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => { setCreateModalOpen(false); }}
        title="Initiate New Payroll Run"
        maxWidth="540px"
      >
        <form onSubmit={handleCreateRun} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {createError && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 6,
                background: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertCircle size={16} /> {createError}
            </div>
          )}

          <Input
            label="Payroll Run Title"
            value={title}
            onChange={(e) => { setTitle(e.target.value); }}
            required
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input
              label="Period Start Date"
              type="date"
              value={periodStart}
              onChange={(e) => { setPeriodStart(e.target.value); }}
              required
            />
            <Input
              label="Period End Date"
              type="date"
              value={periodEnd}
              onChange={(e) => { setPeriodEnd(e.target.value); }}
              required
            />
          </div>

          <Input
            label="Scheduled Payment Date"
            type="date"
            value={paymentDate}
            onChange={(e) => { setPaymentDate(e.target.value); }}
            required
          />

          <div
            style={{
              padding: "10px 14px",
              background: "var(--surface)",
              border: "1px dashed var(--border)",
              borderRadius: 6,
              fontSize: "0.82rem",
              color: "var(--text-muted)",
            }}
          >
            System will automatically fetch active salary structures for eligible staff, apply configured allowances/deductions, and prevent duplicate runs for the same period.
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <Button variant="ghost" type="button" onClick={() => { setCreateModalOpen(false); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={creating}>
              Calculate & Create Run
            </Button>
          </div>
        </form>
      </Modal>

      {/* Inspect Run Modal */}
      {selectedRun && (
        <Modal
          isOpen={inspectModalOpen}
          onClose={() => { setInspectModalOpen(false); }}
          title={`Review Run: ${selectedRun.title}`}
          maxWidth="860px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {decisionError && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 6,
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertCircle size={16} /> {decisionError}
              </div>
            )}

            {/* Run Header Metrics */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
                padding: 16,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
            >
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Cycle Status</span>
                <div>
                  <Badge
                    label={selectedRun.isLocked ? `${selectedRun.status.toUpperCase()} (LOCKED)` : selectedRun.status.toUpperCase()}
                    variant={statusVariant(selectedRun.status)}
                    size="sm"
                  />
                </div>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Eligible Staff</span>
                <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{selectedRun.employeeCount}</div>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Total Gross</span>
                <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                  ₹{selectedRun.totalGross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Total Deductions</span>
                <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#ef4444" }}>
                  -₹{selectedRun.totalDeductions.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Net Disbursement</span>
                <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "#10b981" }}>
                  ₹{selectedRun.totalNet.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Rejection notice if present */}
            {selectedRun.rejectionReason && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 6,
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  fontSize: "0.85rem",
                  color: "#ef4444",
                }}
              >
                <strong>Rejection Justification:</strong> {selectedRun.rejectionReason}
              </div>
            )}

            {/* Workflow Action Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                {selectedRun.isLocked
                  ? "Run is locked. Approved figures cannot be edited."
                  : selectedRun.status === "pending_approval"
                  ? "Awaiting supervisory approval."
                  : "Draft mode: Submit for approval once reviewed."}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {selectedRun.status === "draft" && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => { setDecisionAction("submit"); }}
                    leftIcon={<Send size={14} />}
                  >
                    Submit for Approval
                  </Button>
                )}

                {selectedRun.status === "pending_approval" && (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => { setDecisionAction("approve"); }}
                      leftIcon={<CheckCircle2 size={14} />}
                    >
                      Approve & Lock Run
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => { setDecisionAction("reject"); }}
                      leftIcon={<XCircle size={14} />}
                    >
                      Reject Run
                    </Button>
                  </>
                )}

                {selectedRun.status === "approved" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => { setDecisionAction("correct"); }}
                    leftIcon={<Unlock size={14} />}
                  >
                    Initiate Audited Correction
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { void handleExportCsv(selectedRun.id); }}
                  leftIcon={<Download size={14} />}
                >
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Employee Records Table */}
            <div>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 8 }}>
                Employee Payslip Line Items ({records.length})
              </h4>
              <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 6 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>Payslip #</th>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>Employee</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Basic</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Gross</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Deductions</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Net Pay</th>
                      <th style={{ padding: "8px 12px", textAlign: "center" }}>View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((rec) => (
                      <tr key={rec.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "8px 12px" }}>
                          <code>{rec.payslipNumber}</code>
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <span style={{ fontWeight: 600 }}>{rec.employeeName}</span> ({rec.employeeCode})
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right" }}>
                          ₹{rec.baseSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right" }}>
                          ₹{rec.grossSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: "#ef4444" }}>
                          -₹{rec.totalDeductions.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#10b981" }}>
                          ₹{rec.netSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "center" }}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setActivePayslip(rec); }}
                            leftIcon={<Eye size={12} />}
                          >
                            Slip
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Approval History Trail */}
            {history.length > 0 && (
              <div>
                <h4 style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: 8, color: "var(--text-muted)" }}>
                  Audit Trail
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.8rem" }}>
                  {history.map((h) => (
                    <div
                      key={h.id}
                      style={{
                        padding: "6px 12px",
                        background: "var(--surface)",
                        borderRadius: 4,
                        border: "1px solid var(--border)",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>
                        <strong>{h.actorName ?? "System"}</strong>: {h.action.toUpperCase()}
                        {h.comments && <span style={{ color: "var(--text-muted)" }}> — {h.comments}</span>}
                      </span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                        {new Date(h.createdAt).toLocaleString("en-GB")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Decision Confirmation Dialog */}
      {decisionAction && (
        <ConfirmDialog
          isOpen={Boolean(decisionAction)}
          title={`Confirm Action: ${decisionAction.toUpperCase()}`}
          description={
            decisionAction === "approve"
              ? "Approving this payroll run will lock all records and publish authoritative payslips to all eligible employees. Continue?"
              : decisionAction === "correct"
              ? "Initiating an audited correction will unlock the run for adjustments. A mandatory audit explanation is required."
              : `Are you sure you want to ${decisionAction} this payroll run?`
          }
          confirmLabel={decisionAction === "reject" ? "Reject Run" : "Confirm"}
          variant={decisionAction === "reject" ? "danger" : "primary"}
          isLoading={processingDecision}
          onConfirm={() => { void handleExecuteDecision(); }}
          onCancel={() => {
            setDecisionAction(null);
            setDecisionNotes("");
          }}
        />
      )}

      {/* Payslip View Modal */}
      <PayslipViewModal
        payslip={activePayslip}
        isOpen={Boolean(activePayslip)}
        onClose={() => { setActivePayslip(null); }}
      />
    </div>
  );
}
