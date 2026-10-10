"use client";

import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import type { DeptMemberItem } from "@/lib/data/analytics";

interface DeptHeadMembersTableProps {
  data: DeptMemberItem[];
}

export function DeptHeadMembersTable({ data }: DeptHeadMembersTableProps) {
  const deptColumns: DataTableColumn<DeptMemberItem>[] = [
    {
      key: "employeeCode",
      header: "Code",
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
      key: "fullName",
      header: "Department Staff",
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.fullName}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {row.email ?? "No assigned email"}
          </div>
        </div>
      ),
    },
    {
      key: "designation",
      header: "Designation",
      sortable: true,
      render: (row) => <span style={{ fontSize: "0.82rem" }}>{row.designation}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge
          label={row.status.toUpperCase()}
          variant={row.status === "active" ? "success" : "neutral"}
          size="sm"
        />
      ),
    },
    {
      key: "joiningDate",
      header: "Date Joined",
      render: (row) => (
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {new Date(row.joiningDate).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={data}
      columns={deptColumns}
      keyExtractor={(row) => row.id}
      pageSize={8}
      emptyTitle="No staff members in department"
      emptyDescription="No employees are currently allocated to this department."
    />
  );
}
