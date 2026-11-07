import { verifyPortalAccess } from "@/lib/auth/session";
import { getEmployeesDirectory, getOrganizationMetadataOptions } from "@/lib/data/employees";
import { EmployeeDirectoryClient } from "@/components/employees/EmployeeDirectoryClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Members & Staff Directory | EMS",
};

interface MembersPageProps {
  searchParams: Promise<{
    search?: string;
    departmentId?: string;
    branchId?: string;
    designationId?: string;
    status?: string;
    joiningFrom?: string;
    joiningTo?: string;
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }>;
}

export default async function OrgAdminMembersPage({ searchParams }: MembersPageProps) {
  const context = await verifyPortalAccess("org_admin", {
    permission: "employee.read",
  });
  if (!context || !context.activeOrganization) {
    redirect("/login");
  }

  const canWrite = context.permissions.includes("employee.write");

  const resolvedParams = await searchParams;
  const page = resolvedParams.page ? Number(resolvedParams.page) : 1;
  const pageSize = resolvedParams.pageSize ? Number(resolvedParams.pageSize) : 10;

  const [directoryData, metadataOptions] = await Promise.all([
    getEmployeesDirectory(context.activeOrganization.id, {
      search: resolvedParams.search,
      departmentId: resolvedParams.departmentId,
      branchId: resolvedParams.branchId,
      designationId: resolvedParams.designationId,
      status: resolvedParams.status,
      joiningFrom: resolvedParams.joiningFrom,
      joiningTo: resolvedParams.joiningTo,
      page,
      pageSize,
      sortBy: resolvedParams.sortBy,
      sortOrder: resolvedParams.sortOrder,
    }),
    getOrganizationMetadataOptions(context.activeOrganization.id),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Organization Members & Staff
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Tenant: <strong>{context.activeOrganization.name}</strong> · Registered personnel, designations, and assignments.
        </p>
      </div>

      <EmployeeDirectoryClient
        initialEmployees={directoryData.employees}
        totalCount={directoryData.totalCount}
        currentPage={directoryData.page}
        pageSize={directoryData.pageSize}
        totalPages={directoryData.totalPages}
        departments={metadataOptions.departments}
        branches={metadataOptions.branches}
        designations={metadataOptions.designations}
        canWrite={canWrite}
        canImport={false}
      />
    </div>
  );
}
