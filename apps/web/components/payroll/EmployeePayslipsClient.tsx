"use client";

import { useState } from "react";
import { DataTable, type DataTableColumn } from "../ui/DataTable";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { PayslipViewModal } from "./PayslipViewModal";
import type { PayrollRecord } from "@ems/types";
import { FileText } from "lucide-react";

interface EmployeePayslipsClientProps {
  payslips: PayrollRecord[];
}

export function EmployeePayslipsClient({
  payslips,
}: EmployeePayslipsClientProps) {
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);

  const columns: DataTableColumn<PayrollRecord>[] = [
    {
      key: "payslipNumber",
      header: "Payslip Number",
      sortable: true,
      render: (row) => (
        <code
          style={{
            fontSize: "0.82rem",
            padding: "2px 6px",
            borderRadius: 4,
            background: "var(--background)",
            fontWeight: 600,
          }}
        >
          {row.payslipNumber}
        </code>
      ),
    },
    {
      key: "periodTitle",
      header: "Payroll Period",
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{row.periodTitle ?? "Monthly Cycle"}</span>
      ),
    },
    {
      key: "grossSalary",
      header: "Gross Earnings",
      sortable: true,
      render: (row) => (
        <span>₹{row.grossSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
      ),
    },
    {
      key: "totalDeductions",
      header: "Deductions",
      sortable: true,
      render: (row) => (
        <span style={{ color: "#ef4444" }}>
          -₹{row.totalDeductions.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "netSalary",
      header: "Net Take-Home",
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 700, color: "#10b981" }}>
          ₹{row.netSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "paymentStatus",
      header: "Status",
      render: (row) => (
        <Badge
          label={row.paymentStatus.toUpperCase()}
          variant={row.paymentStatus === "paid" ? "success" : "neutral"}
          size="sm"
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => { setSelectedPayslip(row); }}
          leftIcon={<FileText size={14} />}
        >
          View Payslip
        </Button>
      ),
    },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={payslips}
        keyExtractor={(item) => item.id}
        emptyTitle="No Payslips Issued Yet"
        emptyDescription="Once monthly payroll runs are processed and approved by the finance team, your verified payslips will appear here."
      />

      <PayslipViewModal
        payslip={selectedPayslip}
        isOpen={Boolean(selectedPayslip)}
        onClose={() => { setSelectedPayslip(null); }}
      />
    </div>
  );
}
