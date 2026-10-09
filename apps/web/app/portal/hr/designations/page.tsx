import { getActiveSessionContext } from "@/lib/auth/session";
import { getDesignationsList, getOrganizationMetadataOptions } from "@/lib/data/employees";
import { DesignationsClient } from "@/components/organization/DesignationsClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Designation Management | EMS",
};

export default async function DesignationsPage() {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    redirect("/login");
  }

  const canRead = context.permissions.includes("organization.read") || context.activeRole === "super_admin";
  if (!canRead) {
    redirect("/unauthorized");
  }

  const canWrite = context.permissions.includes("organization.write") || context.activeRole === "super_admin";

  const [designations, metadata] = await Promise.all([
    getDesignationsList(context.activeOrganization.id),
    getOrganizationMetadataOptions(context.activeOrganization.id),
  ]);

  return (
    <DesignationsClient
      initialDesignations={designations}
      departments={metadata.departments}
      canWrite={canWrite}
    />
  );
}
