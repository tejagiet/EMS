import { getActiveSessionContext } from "@/lib/auth/session";
import { getEmployeesDirectory, getOrganizationMetadataOptions } from "@/lib/data/employees";
import { EmployeeDirectoryClient } from "@/components/employees/EmployeeDirectoryClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Employee Directory | EMS",
};

interface EmployeesPageProps {
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

export default async function EmployeesPage({ searchParams }: EmployeesPageProps) {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    redirect("/login");
  }

  const canRead = context.permissions.includes("employee.read") || context.activeRole === "super_admin";
  if (!canRead) {
    redirect("/unauthorized");
  }

  const canWrite = context.permissions.includes("employee.write") || context.activeRole === "super_admin";

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
    />
  );
}
