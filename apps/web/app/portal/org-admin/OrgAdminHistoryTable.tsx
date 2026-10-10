"use client";

import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import type { AuditHistoryItem } from "@/lib/data/analytics";

interface OrgAdminHistoryTableProps {
  data: AuditHistoryItem[];
}

export function OrgAdminHistoryTable({ data }: OrgAdminHistoryTableProps) {
  const historyColumns: DataTableColumn<AuditHistoryItem>[] = [
    {
      key: "employeeCode",
      header: "Employee",
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
          {row.employeeCode}
        </code>
      ),
    },
    {
      key: "fieldName",
      header: "Field Changed",
      sortable: true,
      render: (row) => <span style={{ fontWeight: 600 }}>{row.fieldName}</span>,
    },
    {
      key: "oldValue",
      header: "Previous Value",
      render: (row) => (
        <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
          {row.oldValue ?? "—"}
        </span>
      ),
    },
    {
      key: "newValue",
      header: "New Value",
      render: (row) => (
        <span style={{ fontWeight: 600, color: "var(--primary)" }}>{row.newValue ?? "—"}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Timestamp",
      sortable: true,
      render: (row) => (
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={data}
      columns={historyColumns}
      keyExtractor={(row) => row.id}
      pageSize={5}
      emptyTitle="No recent change logs"
      emptyDescription="No field modifications have been recorded for employees in this organization."
    />
  );
}
