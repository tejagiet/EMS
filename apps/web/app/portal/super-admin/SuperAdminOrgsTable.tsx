"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Edit2, Trash2, Plus } from "lucide-react";

interface SuperAdminOrgsTableProps {
  data: Record<string, unknown>[];
  onEdit?: (org: Record<string, unknown>) => void;
  onDelete?: (org: Record<string, unknown>) => void;
  onAdd?: () => void;
}

export function SuperAdminOrgsTable({
  data,
  onEdit,
  onDelete,
  onAdd,
}: SuperAdminOrgsTableProps) {
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
            fontWeight: 600,
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
      render: (row) => {
        const active = Boolean(row.isActive ?? row.is_active);
        return (
          <Badge
            label={active ? "ACTIVE" : "INACTIVE"}
            variant={active ? "success" : "danger"}
            size="sm"
          />
        );
      },
    },
    {
      key: "created_at",
      header: "Onboarded Date",
      sortable: true,
      render: (row) => {
        const rawDate = row.createdAt ?? row.created_at;
        const parsed = rawDate ? new Date(String(rawDate)) : null;
        const valid = parsed && !isNaN(parsed.getTime());
        return (
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {valid ? parsed.toLocaleDateString() : "Active (Direct)"}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
          {onEdit && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(row)}
              title="Edit tenant configuration"
              leftIcon={<Edit2 size={13} />}
              style={{ fontSize: "0.8rem", padding: "4px 8px" }}
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(row)}
              title="Delete tenant instance"
              leftIcon={<Trash2 size={13} style={{ color: "#ef4444" }} />}
              style={{
                fontSize: "0.8rem",
                padding: "4px 8px",
                color: "#ef4444",
              }}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <DataTable
        data={data}
        columns={orgColumns}
        keyExtractor={(row) => String(row.id)}
        pageSize={5}
        emptyTitle="No organizations found"
        emptyDescription="No institutional organizations are configured in the platform."
      />
      {data.length === 0 && onAdd && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <Button variant="primary" size="sm" onClick={onAdd} leftIcon={<Plus size={14} />}>
            Add First Tenant
          </Button>
        </div>
      )}
    </div>
  );
}
