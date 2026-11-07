"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { manageDepartmentAction, deleteDepartmentAction } from "@/lib/data/employee-actions";
import type { DepartmentDetail } from "@ems/types";
import { Plus, Edit, Trash2, Users } from "lucide-react";

interface DepartmentsClientProps {
  initialDepartments: DepartmentDetail[];
  branches: Array<{ id: string; name: string }>;
  employees: Array<{ id: string; name: string; code: string }>;
  canWrite: boolean;
}

export function DepartmentsClient({
  initialDepartments,
  branches,
  employees,
  canWrite,
}: DepartmentsClientProps) {
  const router = useRouter();
  const [departments, setDepartments] = useState<DepartmentDetail[]>(initialDepartments);
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentDetail | null>(null);
  const [deletingDept, setDeletingDept] = useState<DepartmentDetail | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filteredDepts = departments.filter((d) =>
    searchQuery === "" ||
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingDept(null);
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (dept: DepartmentDetail) => {
    setEditingDept(dept);
    setError(null);
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDept) return;
    setIsDeleting(true);
    try {
      const res = await deleteDepartmentAction(deletingDept.id);
      if (!res.success) {
        setError(res.error ?? "Failed to delete department.");
      } else {
        setDepartments((prev) => prev.filter((d) => d.id !== deletingDept.id));
        setDeletingDept(null);
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete department.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    if (editingDept) {
      formData.set("id", editingDept.id);
    }

    startTransition(async () => {
      const res = await manageDepartmentAction(null, formData);
      if (!res.success) {
        setError(res.error ?? "Failed to save department.");
      } else {
        setModalOpen(false);
        router.refresh();
      }
    });
  };

  const columns: DataTableColumn<DepartmentDetail>[] = [
    {
      key: "code",
      header: "Code",
      sortable: true,
      render: (row) => (
        <code style={{ fontSize: "0.82rem", fontWeight: 600, background: "var(--background)", padding: "2px 6px", borderRadius: 4 }}>
          {row.code}
        </code>
      ),
    },
    {
      key: "name",
      header: "Department Name",
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.name}</div>
          {row.description && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{row.description}</div>}
        </div>
      ),
    },
    {
      key: "branchName",
      header: "Branch",
      sortable: true,
      render: (row) => (
        <span style={{ fontSize: "0.85rem", color: "var(--text)" }}>{row.branchName}</span>
      ),
    },
    {
      key: "headOfDepartmentName",
      header: "Department Head",
      render: (row) => (
        <span style={{ fontSize: "0.85rem", color: row.headOfDepartmentName ? "var(--text)" : "var(--text-muted)" }}>
          {row.headOfDepartmentName ?? "Unassigned"}
        </span>
      ),
    },
    {
      key: "employeeCount",
      header: "Staff Count",
      sortable: true,
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
          <Users size={14} style={{ color: "var(--primary)" }} /> {row.employeeCount ?? 0}
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (row) => (
        <Badge
          label={row.isActive ? "ACTIVE" : "INACTIVE"}
          variant={row.isActive ? "success" : "neutral"}
          size="sm"
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) =>
        canWrite ? (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
            <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(row)}>
              <Edit size={14} style={{ marginRight: 4 }} /> Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDeletingDept(row)}
              style={{ color: "#ef4444" }}
            >
              <Trash2 size={14} style={{ marginRight: 4 }} /> Delete
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, color: "var(--primary)" }}>
            Department Management
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "4px 0 0" }}>
            Operational units, department heads, and functional staff assignments.
          </p>
        </div>

        {canWrite && (
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            <Plus size={15} style={{ marginRight: 6 }} /> Add Department
          </Button>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Input
          placeholder="Search by code or department name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      <div style={{ background: "var(--card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <DataTable
          data={filteredDepts}
          columns={columns}
          keyExtractor={(row) => row.id}
          pageSize={10}
          emptyTitle="No departments found"
          emptyDescription="There are currently no departments configured for this organization."
        />
      </div>

      {/* Department Modal */}
      <Modal
        isOpen={modalOpen}
        title={editingDept ? `Edit Department: ${editingDept.name}` : "Create New Department"}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div style={{ padding: "8px 12px", borderRadius: 6, background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          <Input
            label="Department Name *"
            name="name"
            defaultValue={editingDept?.name ?? ""}
            placeholder="e.g. Artificial Intelligence & Computing"
            required
          />

          <Input
            label="Department Code *"
            name="code"
            defaultValue={editingDept?.code ?? ""}
            placeholder="e.g. AI-DEPT"
            required
          />

          <Select
            label="Branch Location"
            name="branchId"
            defaultValue={editingDept?.branchId ?? ""}
            options={[
              { value: "", label: "— Organization-Wide (All Branches) —" },
              ...branches.map((b) => ({ value: b.id, label: b.name })),
            ]}
          />

          <Select
            label="Head of Department"
            name="headOfDepartmentId"
            defaultValue={editingDept?.headOfDepartmentId ?? ""}
            options={[
              { value: "", label: "— Unassigned —" },
              ...employees.map((e) => ({ value: e.id, label: `${e.name} (${e.code})` })),
            ]}
          />

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 4 }}>
              Description
            </label>
            <textarea
              name="description"
              defaultValue={editingDept?.description ?? ""}
              placeholder="Scope and purpose of this department..."
              rows={3}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                background: "var(--background)",
                color: "var(--text)",
                fontSize: "0.875rem",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isPending}>
              {editingDept ? "Save Changes" : "Create Department"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingDept)}
        title="Delete Department"
        description={`Are you sure you want to delete department "${deletingDept?.name}" (${deletingDept?.code})? Staff members and designations under this department will have their department assignment cleared.`}
        confirmLabel="Delete Department"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (!isDeleting) setDeletingDept(null);
        }}
      />
    </div>
  );
}
