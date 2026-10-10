"use client";

import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";

interface DesignationPayBandsTableProps {
  data: Record<string, unknown>[];
}

export function DesignationPayBandsTable({ data }: DesignationPayBandsTableProps) {
  const gradeColumns: DataTableColumn<Record<string, unknown>>[] = [
    {
      key: "name",
      header: "Designation Title",
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{String(row.name)}</span>
      ),
    },
    {
      key: "grade",
      header: "Compensation Grade",
      sortable: true,
      render: (row) => (
        <Badge
          label={typeof row.grade === "string" ? row.grade.toUpperCase() : "UNGRADED"}
          variant={typeof row.grade === "string" ? "secondary" : "neutral"}
          size="sm"
        />
      ),
    },
    {
      key: "level",
      header: "Salary Band Level",
      sortable: true,
      render: (row) => (
        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
          {typeof row.level === "number" ? `Level ${row.level.toString()}` : "Standard"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={data}
      columns={gradeColumns}
      keyExtractor={(row) => String(row.id)}
      pageSize={5}
    />
  );
}
