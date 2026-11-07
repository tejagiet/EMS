"use client";

import { useTransition, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { changeEmployeeStatusAction, exportEmployeesCsvAction } from "@/lib/data/employee-actions";
import type { Employee, EmploymentStatus } from "@ems/types";
import { useRealtime } from "@/src/context/RealtimeContext";
import {
  Filter,
  Plus,
  Download,
  Upload,
  Eye,
  Edit,
  UserX,
  UserCheck,
} from "lucide-react";

interface EmployeeDirectoryClientProps {
  initialEmployees: Employee[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  departments: Array<{ id: string; name: string }>;
  branches: Array<{ id: string; name: string }>;
  designations: Array<{ id: string; name: string }>;
  canWrite: boolean;
  canImport: boolean;
}

export function EmployeeDirectoryClient({
  initialEmployees,
  totalCount,
  currentPage: _currentPage,
  pageSize,
  totalPages: _totalPages,
  departments,
  branches,
  designations,
  canWrite,
  canImport,
}: EmployeeDirectoryClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPath = pathname ?? "/portal/hr/employees";
  const [isPending, startTransition] = useTransition();

  const { broadcastChange, isConnected } = useRealtime({
    table: "employees",
    onUpdate: () => {
      router.refresh();
    },
  });

  // Search and filter state
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [departmentId, setDepartmentId] = useState(searchParams.get("departmentId") ?? "");
  const [branchId, setBranchId] = useState(searchParams.get("branchId") ?? "");
  const [designationId, setDesignationId] = useState(searchParams.get("designationId") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [joiningFrom, setJoiningFrom] = useState(searchParams.get("joiningFrom") ?? "");
  const [joiningTo, setJoiningTo] = useState(searchParams.get("joiningTo") ?? "");

  // Status Change Dialog State
  const [statusDialogTarget, setStatusDialogTarget] = useState<{ id: string; name: string; currentStatus: EmploymentStatus } | null>(null);
  const [statusDialogAction, setStatusDialogAction] = useState<"deactivate" | "reactivate" | null>(null);

  const applyFilters = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    params.set("page", "1"); // Reset to page 1 on filter change
    startTransition(() => {
      router.push(`${currentPath}?${params.toString()}`);
    });
  };

  const handleClearFilters = () => {
    setSearch("");
    setDepartmentId("");
    setBranchId("");
    setDesignationId("");
    setStatus("");
    setJoiningFrom("");
    setJoiningTo("");
    startTransition(() => {
      router.push(currentPath);
    });
  };

  const handleExportCsv = async () => {
    const filters: Record<string, string> = {};
    if (search) filters.search = search;
    if (departmentId) filters.departmentId = departmentId;
    if (branchId) filters.branchId = branchId;
    if (designationId) filters.designationId = designationId;
    if (status) filters.status = status;
    if (joiningFrom) filters.joiningFrom = joiningFrom;
    if (joiningTo) filters.joiningTo = joiningTo;

    const res = await exportEmployeesCsvAction(filters);
    if (res.success && res.data?.csvContent) {
      const blob = new Blob([res.data.csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `employees_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!statusDialogTarget || !statusDialogAction) return;
    const targetStatus = statusDialogAction === "deactivate" ? "inactive" : "active";
    await changeEmployeeStatusAction(
      statusDialogTarget.id,
      targetStatus,
      statusDialogAction === "deactivate" ? "Administrative deactivation" : "Reactivated to active status"
    );
    await broadcastChange({
      table: "employees",
      eventType: "UPDATE",
      message: `Employee ${statusDialogTarget.name} status updated to ${targetStatus.toUpperCase()}.`,
    });
    setStatusDialogTarget(null);
    setStatusDialogAction(null);
    router.refresh();
  };

  const getStatusBadge = (empStatus: EmploymentStatus) => {
    switch (empStatus) {
      case "active":
        return <Badge label="ACTIVE" variant="success" size="sm" />;
      case "inactive":
        return <Badge label="INACTIVE" variant="neutral" size="sm" />;
      case "suspended":
        return <Badge label="SUSPENDED" variant="warning" size="sm" />;
      case "terminated":
        return <Badge label="TERMINATED" variant="danger" size="sm" />;
      case "resigned":
        return <Badge label="RESIGNED" variant="neutral" size="sm" />;
      default:
        return <Badge label={empStatus.toUpperCase()} variant="neutral" size="sm" />;
    }
  };

  const columns: DataTableColumn<Employee>[] = [
    {
      key: "employeeCode",
      header: "Employee ID",
      sortable: true,
      render: (row) => (
        <code style={{ fontSize: "0.8rem", padding: "2px 6px", borderRadius: 4, background: "var(--background)", fontWeight: 600 }}>
          {row.employeeCode}
        </code>
      ),
    },
    {
      key: "fullName",
      header: "Employee Details",
      sortable: true,
      render: (row) => {
        const initials = `${row.firstName?.[0] ?? ""}${row.lastName?.[0] ?? ""}`.toUpperCase() || "EM";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--primary)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8rem",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "var(--text)" }}>{row.fullName}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {row.workEmail ?? "No assigned email"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "departmentName",
      header: "Department & Branch",
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: "0.85rem" }}>{row.departmentName ?? "Unassigned"}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{row.branchName ?? "Main"}</div>
        </div>
      ),
    },
    {
      key: "designationName",
      header: "Designation & Manager",
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: "0.85rem" }}>{row.designationName ?? "Staff"}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {row.reportingManagerName ? `Reports to: ${row.reportingManagerName}` : "Direct Lead"}
          </div>
        </div>
      ),
    },
    {
      key: "dateOfJoining",
      header: "Joining Date",
      sortable: true,
      render: (row) => (
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {new Date(row.dateOfJoining).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "employmentStatus",
      header: "Status",
      sortable: true,
      render: (row) => getStatusBadge(row.employmentStatus),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
          <Link
            href={`/portal/hr/employees/${row.id}`}
            className="btn btn-ghost btn-sm"
            title="View Profile"
            aria-label={`View ${row.fullName}`}
          >
            <Eye size={15} />
          </Link>
          {canWrite && (
            <>
              <Link
                href={`/portal/hr/employees/${row.id}/edit`}
                className="btn btn-ghost btn-sm"
                title="Edit Employee"
                aria-label={`Edit ${row.fullName}`}
              >
                <Edit size={15} />
              </Link>
              {row.employmentStatus === "active" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  title="Deactivate Employee"
                  onClick={() => {
                    setStatusDialogTarget({ id: row.id, name: row.fullName, currentStatus: row.employmentStatus });
                    setStatusDialogAction("deactivate");
                  }}
                >
                  <UserX size={15} style={{ color: "var(--danger)" }} />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  title="Reactivate Employee"
                  onClick={() => {
                    setStatusDialogTarget({ id: row.id, name: row.fullName, currentStatus: row.employmentStatus });
                    setStatusDialogAction("reactivate");
                  }}
                >
                  <UserCheck size={15} style={{ color: "var(--success)" }} />
                </Button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Action Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, color: "var(--primary)" }}>
            Employee Directory
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "4px 0 0" }}>
            Total workforce records: <strong>{totalCount}</strong> active/archived members
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download size={15} style={{ marginRight: 6 }} /> Export CSV
          </Button>

          {canWrite && (
            <>
              {canImport && (
                <Link href="/portal/hr/import-export" className="btn btn-outline btn-sm">
                  <Upload size={15} style={{ marginRight: 6 }} /> Import CSV
                </Link>
              )}
              <Link href="/portal/hr/employees/new" className="btn btn-primary btn-sm">
                <Plus size={15} style={{ marginRight: 6 }} /> Add Employee
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          padding: 16,
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div style={{ position: "relative" }}>
          <Input
            placeholder="Search code, name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters({ search });
            }}
          />
        </div>

        <Select
          options={[
            { value: "", label: "All Departments" },
            ...departments.map((d) => ({ value: d.id, label: d.name })),
          ]}
          value={departmentId}
          onChange={(e) => {
            const val = e.target.value;
            setDepartmentId(val);
            applyFilters({ departmentId: val });
          }}
        />

        <Select
          options={[
            { value: "", label: "All Branches" },
            ...branches.map((b) => ({ value: b.id, label: b.name })),
          ]}
          value={branchId}
          onChange={(e) => {
            const val = e.target.value;
            setBranchId(val);
            applyFilters({ branchId: val });
          }}
        />

        <Select
          options={[
            { value: "", label: "All Designations" },
            ...designations.map((d) => ({ value: d.id, label: d.name })),
          ]}
          value={designationId}
          onChange={(e) => {
            const val = e.target.value;
            setDesignationId(val);
            applyFilters({ designationId: val });
          }}
        />

        <Select
          options={[
            { value: "", label: "All Statuses" },
            { value: "active", label: "Active" },
            { value: "probation", label: "Probation" },
            { value: "inactive", label: "Inactive" },
            { value: "terminated", label: "Terminated" },
            { value: "resigned", label: "Resigned" },
          ]}
          value={status}
          onChange={(e) => {
            const val = e.target.value;
            setStatus(val);
            applyFilters({ status: val });
          }}
        />

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button
            variant="secondary"
            size="sm"
            style={{ flex: 1 }}
            onClick={() => applyFilters({ search, departmentId, branchId, designationId, status, joiningFrom, joiningTo })}
            disabled={isPending}
          >
            <Filter size={14} style={{ marginRight: 6 }} /> Apply
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            disabled={isPending}
            title="Reset filters"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Main Employee Data Table */}
      <div style={{ background: "var(--card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <DataTable
          data={initialEmployees}
          columns={columns}
          keyExtractor={(row) => row.id}
          isLoading={isPending}
          emptyTitle="No employees found"
          emptyDescription="There are no employee records matching your current filter parameters."
          pageSize={pageSize}
        />
      </div>

      {/* Confirmation Dialog for Status Change */}
      <ConfirmDialog
        isOpen={Boolean(statusDialogTarget)}
        title={statusDialogAction === "deactivate" ? "Deactivate Employee Account" : "Reactivate Employee Account"}
        description={
          statusDialogAction === "deactivate"
            ? `Are you sure you want to deactivate ${statusDialogTarget?.name}? Their access will be suspended and an audit entry will be recorded.`
            : `Are you sure you want to restore active status for ${statusDialogTarget?.name}?`
        }
        confirmLabel={statusDialogAction === "deactivate" ? "Deactivate Account" : "Reactivate Account"}
        variant={statusDialogAction === "deactivate" ? "danger" : "primary"}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => {
          setStatusDialogTarget(null);
          setStatusDialogAction(null);
        }}
      />
    </div>
  );
}
