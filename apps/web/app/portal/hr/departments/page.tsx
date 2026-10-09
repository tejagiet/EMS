import { getActiveSessionContext } from "@/lib/auth/session";
import { getDepartmentsList, getOrganizationMetadataOptions } from "@/lib/data/employees";
import { DepartmentsClient } from "@/components/organization/DepartmentsClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Department Management | EMS",
};

export default async function DepartmentsPage() {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    redirect("/login");
  }

  const canRead = context.permissions.includes("organization.read") || context.activeRole === "super_admin";
  if (!canRead) {
    redirect("/unauthorized");
  }

  const canWrite = context.permissions.includes("organization.write") || context.activeRole === "super_admin";

  const [departments, metadata] = await Promise.all([
    getDepartmentsList(context.activeOrganization.id),
    getOrganizationMetadataOptions(context.activeOrganization.id),
  ]);

  return (
    <DepartmentsClient
      initialDepartments={departments}
      branches={metadata.branches}
      employees={metadata.managers}
      canWrite={canWrite}
    />
  );
}
