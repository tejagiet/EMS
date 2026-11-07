import { verifyPortalAccess } from "@/lib/auth/session";
import { getDepartmentsList, getOrganizationMetadataOptions } from "@/lib/data/employees";
import { DepartmentsClient } from "@/components/organization/DepartmentsClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Department Management | EMS",
};

export default async function DepartmentsPage() {
  const context = await verifyPortalAccess("hr_manager", {
    permission: "organization.read",
  });
  if (!context || !context.activeOrganization) {
    redirect("/login");
  }

  const canWrite = context.permissions.includes("organization.write");

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
