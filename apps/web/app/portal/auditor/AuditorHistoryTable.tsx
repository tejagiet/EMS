"use client";

import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";

interface AuditorHistoryTableProps {
  data: Record<string, unknown>[];
}

export function AuditorHistoryTable({ data }: AuditorHistoryTableProps) {
  const auditColumns: DataTableColumn<Record<string, unknown>>[] = [
    {
      key: "employeeCode",
      header: "Employee Code",
      sortable: true,
      render: (row) => (
        <code
          style={{
            fontSize: "0.8rem",
            padding: "2px 6px",
            borderRadius: 4,
            background: "var(--background)",
          }}
        >
          {String(row.employeeCode)}
        </code>
      ),
    },
    {
      key: "fieldName",
      header: "Audited Entity Field",
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{String(row.fieldName)}</span>
      ),
    },
    {
      key: "oldValue",
      header: "Prior State",
      render: (row) => (
        <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
          {typeof row.oldValue === "string" ? row.oldValue : "—"}
        </span>
      ),
    },
    {
      key: "newValue",
      header: "Post State",
      render: (row) => (
        <span style={{ fontWeight: 600, color: "var(--primary)" }}>
          {typeof row.newValue === "string" ? row.newValue : "—"}
        </span>
      ),
    },
    {
      key: "changeReason",
      header: "Justification",
      render: (row) => (
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {typeof row.changeReason === "string" ? row.changeReason : "Standard lifecycle"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Recorded Timestamp",
      sortable: true,
      render: (row) => (
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
          {new Date(String(row.createdAt)).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={data}
      columns={auditColumns}
      keyExtractor={(row) => String(row.id)}
      pageSize={8}
      emptyTitle="No audit records found"
      emptyDescription="There are currently no logged personnel change records for this tenant."
    />
  );
}
