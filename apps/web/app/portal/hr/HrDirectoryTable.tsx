"use client";

import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { SearchFilterBar } from "@/components/ui/SearchFilterBar";
import type { EmployeeDirectoryItem } from "@/lib/data/analytics";
import React, { useMemo, useState } from "react";

export function HrDirectoryTable({ employees }: { employees: EmployeeDirectoryItem[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      set.add(e.departmentName);
    });
    return Array.from(set).sort();
  }, [employees]);

  const filteredData = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        searchQuery === "" ||
        emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        Boolean(emp.workEmail?.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDept = departmentFilter === "" || emp.departmentName === departmentFilter;
      const matchesStatus = statusFilter === "" || emp.employmentStatus === statusFilter;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchQuery, departmentFilter, statusFilter]);

  const columns = [
    {
      key: "employeeCode",
      header: "Employee Code",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <code
          style={{
            fontSize: "0.8rem",
            padding: "2px 6px",
            borderRadius: 4,
            background: "var(--background)",
          }}
        >
          {String(row.employeeCode)}
        </code>
      ),
    },
    {
      key: "fullName",
      header: "Full Name",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <div>
          <div style={{ fontWeight: 600 }}>{String(row.fullName)}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {typeof row.workEmail === "string" ? row.workEmail : "No email assigned"}
          </div>
        </div>
      ),
    },
    {
      key: "departmentName",
      header: "Department",
      sortable: true,
      render: (row: Record<string, unknown>) => <span>{String(row.departmentName)}</span>,
    },
    {
      key: "designationName",
      header: "Designation",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
          {String(row.designationName)}
        </span>
      ),
    },
    {
      key: "employmentType",
      header: "Type",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span
          style={{
            fontSize: "0.75rem",
            padding: "2px 6px",
            borderRadius: 4,
            backgroundColor: "var(--table-hover)",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {String(row.employmentType).replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "employmentStatus",
      header: "Status",
      sortable: true,
      render: (row: Record<string, unknown>) => {
        const status = String(row.employmentStatus);
        const variant =
          status === "active"
            ? "success"
            : status === "on_leave"
              ? "warning"
              : status === "probation"
                ? "secondary"
                : "danger";
        return <Badge label={status.toUpperCase()} variant={variant} size="sm" />;
      },
    },
    {
      key: "dateOfJoining",
      header: "Joining Date",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {new Date(String(row.dateOfJoining)).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const filterGroups = [
    {
      id: "department",
      label: "Dept",
      value: departmentFilter,
      options: [
        { label: "All Departments", value: "" },
        ...departments.map((d) => ({ label: d, value: d })),
      ],
      onChange: (val: string) => {
        setDepartmentFilter(val);
      },
    },
    {
      id: "status",
      label: "Status",
      value: statusFilter,
      options: [
        { label: "All Statuses", value: "" },
        { label: "Active", value: "active" },
        { label: "On Leave", value: "on_leave" },
        { label: "Probation", value: "probation" },
        { label: "Terminated", value: "terminated" },
      ],
      onChange: (val: string) => {
        setStatusFilter(val);
      },
    },
  ];

  const hasActiveFilters = searchQuery !== "" || departmentFilter !== "" || statusFilter !== "";

  return (
    <div>
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterGroups={filterGroups}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={() => {
          setSearchQuery("");
          setDepartmentFilter("");
          setStatusFilter("");
        }}
      />

      <DataTable
        data={filteredData as unknown as Record<string, unknown>[]}
        columns={columns}
        keyExtractor={(row) => String(row.id)}
        pageSize={8}
        emptyTitle="No employees match criteria"
        emptyDescription="Adjust your search terms or filter selections to view registered employees."
      />
    </div>
  );
}
