"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { manageBranchAction, deleteBranchAction } from "@/lib/data/employee-actions";
import type { BranchDetail } from "@ems/types";
import { Plus, Edit, Trash2, Users } from "lucide-react";

interface BranchesClientProps {
  initialBranches: BranchDetail[];
  canWrite: boolean;
}

export function BranchesClient({ initialBranches, canWrite }: BranchesClientProps) {
  const router = useRouter();
  const [branches, setBranches] = useState<BranchDetail[]>(initialBranches);
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchDetail | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<BranchDetail | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filteredBranches = branches.filter((b) =>
    searchQuery === "" ||
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingBranch(null);
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (branch: BranchDetail) => {
    setEditingBranch(branch);
    setError(null);
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBranch) return;
    setIsDeleting(true);
    try {
      const res = await deleteBranchAction(deletingBranch.id);
      if (!res.success) {
        setError(res.error ?? "Failed to delete branch.");
      } else {
        setBranches((prev) => prev.filter((b) => b.id !== deletingBranch.id));
        setDeletingBranch(null);
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete branch.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    if (editingBranch) formData.set("id", editingBranch.id);

    startTransition(async () => {
      const res = await manageBranchAction(null, formData);
      if (!res.success) {
        setError(res.error ?? "Failed to save branch.");
      } else {
        setModalOpen(false);
        router.refresh();
      }
    });
  };

  const columns: DataTableColumn<BranchDetail>[] = [
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
      header: "Branch Location",
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.name}</div>
          {row.address && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{row.address}</div>}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Contact Details",
      render: (row) => (
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {row.phone && <div>📞 {row.phone}</div>}
          {row.email && <div>✉️ {row.email}</div>}
          {!row.phone && !row.email && "—"}
        </div>
      ),
    },
    {
      key: "employeeCount",
      header: "Staff Stationed",
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
          label={row.isActive ? "OPERATIONAL" : "INACTIVE"}
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
              onClick={() => setDeletingBranch(row)}
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
            Branch & Office Locations
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "4px 0 0" }}>
            Geographical campus facilities, branches, and regional operational centers.
          </p>
        </div>

        {canWrite && (
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            <Plus size={15} style={{ marginRight: 6 }} /> Add Branch
          </Button>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Input
          placeholder="Search by code or location name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      <div style={{ background: "var(--card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <DataTable
          data={filteredBranches}
          columns={columns}
          keyExtractor={(row) => row.id}
          pageSize={10}
          emptyTitle="No branches found"
          emptyDescription="There are currently no branches registered in this organization."
        />
      </div>

      <Modal
        isOpen={modalOpen}
        title={editingBranch ? `Edit Branch: ${editingBranch.name}` : "Create New Branch"}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div style={{ padding: "8px 12px", borderRadius: 6, background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          <Input
            label="Branch Name *"
            name="name"
            defaultValue={editingBranch?.name ?? ""}
            placeholder="e.g. GIET Main Campus"
            required
          />

          <Input
            label="Branch Code *"
            name="code"
            defaultValue={editingBranch?.code ?? ""}
            placeholder="e.g. GIET-MAIN"
            required
          />

          <Input
            label="Address"
            name="address"
            defaultValue={editingBranch?.address ?? ""}
            placeholder="NH-16, Chaitanya Knowledge City, Rajahmundry"
          />

          <Input
            label="Contact Phone"
            name="phone"
            defaultValue={editingBranch?.phone ?? ""}
            placeholder="+918832484444"
          />

          <Input
            label="Contact Email"
            name="email"
            type="email"
            defaultValue={editingBranch?.email ?? ""}
            placeholder="campus@giet.ac.in"
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isPending}>
              {editingBranch ? "Save Changes" : "Create Branch"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingBranch)}
        title="Delete Branch Location"
        description={`Are you sure you want to delete branch "${deletingBranch?.name}" (${deletingBranch?.code})? Staff members and departments stationed at this branch will have their branch assignment cleared.`}
        confirmLabel="Delete Branch"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (!isDeleting) setDeletingBranch(null);
        }}
      />
    </div>
  );
}
