"use client";

import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import type { TeamMemberItem } from "@/lib/data/analytics";

interface ManagerTeamTableProps {
  data: TeamMemberItem[];
}

export function ManagerTeamTable({ data }: ManagerTeamTableProps) {
  const teamColumns: DataTableColumn<TeamMemberItem>[] = [
    {
      key: "employeeCode",
      header: "Code",
      render: (row) => <code>{row.employeeCode}</code>,
    },
    {
      key: "fullName",
      header: "Team Member",
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.fullName}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{row.email ?? "No email"}</div>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (row) => <span>{row.department}</span>,
    },
    {
      key: "designation",
      header: "Designation",
      render: (row) => <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{row.designation}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge
          label={row.status.toUpperCase()}
          variant={row.status === "active" ? "success" : "warning"}
          size="sm"
        />
      ),
    },
  ];

  return (
    <DataTable
      data={data}
      columns={teamColumns}
      keyExtractor={(row) => row.id}
      pageSize={6}
      emptyTitle="No direct reports assigned"
      emptyDescription="Your profile currently has no staff members assigned to your supervision line."
    />
  );
}
