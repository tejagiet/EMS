import { verifyPortalAccess } from "@/lib/auth/session";
import { getDesignationsList, getOrganizationMetadataOptions } from "@/lib/data/employees";
import { DesignationsClient } from "@/components/organization/DesignationsClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Designation Management | EMS",
};

export default async function DesignationsPage() {
  const context = await verifyPortalAccess("hr_manager", {
    permission: "organization.read",
  });
  if (!context || !context.activeOrganization) {
    redirect("/login");
  }

  const canWrite = context.permissions.includes("organization.write");

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
