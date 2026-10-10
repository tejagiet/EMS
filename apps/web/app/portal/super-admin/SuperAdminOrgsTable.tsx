"use client";

import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";

interface SuperAdminOrgsTableProps {
  data: Record<string, unknown>[];
}

export function SuperAdminOrgsTable({ data }: SuperAdminOrgsTableProps) {
  const orgColumns: DataTableColumn<Record<string, unknown>>[] = [
    {
      key: "name",
      header: "Organization Name",
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{String(row.name)}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Slug: <code>{String(row.slug)}</code>
          </div>
        </div>
      ),
    },
    {
      key: "code",
      header: "Tenant Code",
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
          {String(row.code)}
        </code>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      render: (row) => (
        <Badge
          label={row.is_active ? "ACTIVE" : "INACTIVE"}
          variant={row.is_active ? "success" : "danger"}
          size="sm"
        />
      ),
    },
    {
      key: "created_at",
      header: "Onboarded Date",
      sortable: true,
      render: (row) => (
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {new Date(String(row.created_at)).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={data}
      columns={orgColumns}
      keyExtractor={(row) => String(row.id)}
      pageSize={5}
      emptyTitle="No organizations found"
      emptyDescription="No institutional organizations are configured in the platform."
    />
  );
}
