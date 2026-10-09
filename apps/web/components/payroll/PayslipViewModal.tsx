"use client";

import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import type { PayrollRecord } from "@ems/types";
import { Printer, ShieldCheck } from "lucide-react";

interface PayslipViewModalProps {
  payslip: PayrollRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PayslipViewModal({
  payslip,
  isOpen,
  onClose,
}: PayslipViewModalProps) {
  if (!payslip) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Payslip: ${payslip.payslipNumber}`}
      maxWidth="720px"
    >
      <div id="printable-payslip" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Institutional Header */}
        <div
          style={{
            padding: "16px 20px",
            background: "linear-gradient(135deg, rgba(30, 58, 138, 0.08), rgba(59, 130, 246, 0.04))",
            border: "1px solid var(--border)",
            borderRadius: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--foreground)" }}>
              GIET Polytechnic College
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
              Artificial Intelligence Department · Batch 2024–2027 · Team T-1
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Publisher: GIETP-AI-IT-EMS-T1-2026
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 8px",
                borderRadius: 4,
                fontSize: "0.75rem",
                fontWeight: 600,
                background: "rgba(16, 185, 129, 0.12)",
                color: "#10b981",
              }}
            >
              <ShieldCheck size={14} /> Authoritative
            </span>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, marginTop: 4 }}>
              {payslip.periodTitle ?? "Monthly Payroll"}
            </div>
          </div>
        </div>

        {/* Employee & Pay Period Details */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            padding: 16,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: "0.85rem",
          }}
        >
          <div>
            <span style={{ color: "var(--text-muted)", display: "block" }}>Employee Name</span>
            <span style={{ fontWeight: 600 }}>{payslip.employeeName ?? "Staff Member"}</span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)", display: "block" }}>Employee Code</span>
            <span style={{ fontWeight: 600 }}>{payslip.employeeCode ?? "—"}</span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)", display: "block" }}>Department</span>
            <span style={{ fontWeight: 600 }}>{payslip.departmentName ?? "Standard"}</span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)", display: "block" }}>Designation</span>
            <span style={{ fontWeight: 600 }}>{payslip.designationName ?? "Standard"}</span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)", display: "block" }}>Payment Method</span>
            <span style={{ fontWeight: 600, textTransform: "capitalize" }}>
              {payslip.paymentMethod.replace("_", " ")}
            </span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)", display: "block" }}>Payment Status</span>
            <span style={{ fontWeight: 600, textTransform: "capitalize", color: "#10b981" }}>
              {payslip.paymentStatus}
            </span>
          </div>
        </div>

        {/* Earnings & Deductions Breakdown Columns */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Earnings */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(16, 185, 129, 0.08)",
                fontWeight: 600,
                fontSize: "0.85rem",
                color: "#10b981",
                borderBottom: "1px solid var(--border)",
              }}
            >
              Earnings (INR)
            </div>
            <div style={{ padding: "8px 14px", display: "flex", flexDirection: "column", gap: 8, fontSize: "0.82rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Basic Salary</span>
                <span style={{ fontWeight: 600 }}>₹{payslip.baseSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              {payslip.allowancesBreakdown.map((a, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                  <span>{a.name}</span>
                  <span style={{ fontWeight: 500, color: "var(--foreground)" }}>
                    ₹{Number(a.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: 8,
                  borderTop: "1px dashed var(--border)",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                }}
              >
                <span>Gross Earnings</span>
                <span>₹{payslip.grossSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(239, 68, 68, 0.08)",
                fontWeight: 600,
                fontSize: "0.85rem",
                color: "#ef4444",
                borderBottom: "1px solid var(--border)",
              }}
            >
              Deductions (INR)
            </div>
            <div style={{ padding: "8px 14px", display: "flex", flexDirection: "column", gap: 8, fontSize: "0.82rem" }}>
              {payslip.deductionsBreakdown.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No statutory deductions applied</div>
              ) : (
                payslip.deductionsBreakdown.map((d, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                    <span>{d.name}</span>
                    <span style={{ fontWeight: 500, color: "var(--foreground)" }}>
                      ₹{Number(d.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: 8,
                  borderTop: "1px dashed var(--border)",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                }}
              >
                <span>Total Deductions</span>
                <span>₹{payslip.totalDeductions.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Salary Highlight */}
        <div
          style={{
            padding: "14px 20px",
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.04))",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Net Salary Disbursed</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Calculated as Gross Salary − Total Deductions
            </div>
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#10b981" }}>
            ₹{payslip.netSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
          <Button variant="secondary" onClick={handlePrint} leftIcon={<Printer size={16} />}>
            Print / Save as PDF
          </Button>
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
