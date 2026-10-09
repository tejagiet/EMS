"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { manageDesignationAction } from "@/lib/data/employee-actions";
import type { DesignationDetail } from "@ems/types";
import { Plus, Edit, Users } from "lucide-react";

interface DesignationsClientProps {
  initialDesignations: DesignationDetail[];
  departments: Array<{ id: string; name: string }>;
  canWrite: boolean;
}

export function DesignationsClient({ initialDesignations, departments, canWrite }: DesignationsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDesig, setEditingDesig] = useState<DesignationDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filteredDesigs = initialDesignations.filter((d) =>
    searchQuery === "" ||
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingDesig(null);
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (desig: DesignationDetail) => {
    setEditingDesig(desig);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    if (editingDesig) formData.set("id", editingDesig.id);

    startTransition(async () => {
      const res = await manageDesignationAction(null, formData);
      if (!res.success) {
        setError(res.error ?? "Failed to save designation.");
      } else {
        setModalOpen(false);
        router.refresh();
      }
    });
  };

  const columns: DataTableColumn<DesignationDetail>[] = [
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
      header: "Job Title",
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{row.name}</span>
      ),
    },
    {
      key: "departmentName",
      header: "Department",
      sortable: true,
      render: (row) => (
        <span style={{ fontSize: "0.85rem", color: "var(--text)" }}>{row.departmentName ?? "General"}</span>
      ),
    },
    {
      key: "grade",
      header: "Salary Grade",
      render: (row) => (
        <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{row.grade ?? "Standard"}</span>
      ),
    },
    {
      key: "level",
      header: "Level",
      sortable: true,
      render: (row) => (
        <span style={{ fontSize: "0.82rem" }}>{row.level ? `L${row.level}` : "—"}</span>
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
          <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(row)}>
            <Edit size={14} style={{ marginRight: 4 }} /> Edit
          </Button>
        ) : null,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, color: "var(--primary)" }}>
            Job Designations & Roles
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "4px 0 0" }}>
            Organizational hierarchy levels, job specifications, and compensation grades.
          </p>
        </div>

        {canWrite && (
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            <Plus size={15} style={{ marginRight: 6 }} /> Add Designation
          </Button>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Input
          placeholder="Search by code or designation name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      <div style={{ background: "var(--card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <DataTable
          data={filteredDesigs}
          columns={columns}
          keyExtractor={(row) => row.id}
          pageSize={10}
          emptyTitle="No designations found"
          emptyDescription="There are currently no job titles defined for this organization."
        />
      </div>

      <Modal
        isOpen={modalOpen}
        title={editingDesig ? `Edit Designation: ${editingDesig.name}` : "Create New Designation"}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div style={{ padding: "8px 12px", borderRadius: 6, background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          <Input
            label="Designation Title *"
            name="name"
            defaultValue={editingDesig?.name ?? ""}
            placeholder="e.g. Associate Professor"
            required
          />

          <Input
            label="Designation Code *"
            name="code"
            defaultValue={editingDesig?.code ?? ""}
            placeholder="e.g. ASSOC-PROF"
            required
          />

          <Select
            label="Department"
            name="departmentId"
            defaultValue={editingDesig?.departmentId ?? ""}
            options={[
              { value: "", label: "— General (All Departments) —" },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input
              label="Salary Grade"
              name="grade"
              defaultValue={editingDesig?.grade ?? ""}
              placeholder="e.g. Grade A-1"
            />

            <Input
              label="Hierarchy Level (1-20)"
              name="level"
              type="number"
              defaultValue={String(editingDesig?.level ?? 1)}
              min={1}
              max={20}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isPending}>
              {editingDesig ? "Save Changes" : "Create Designation"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
