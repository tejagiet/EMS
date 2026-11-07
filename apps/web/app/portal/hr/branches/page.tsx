import { verifyPortalAccess } from "@/lib/auth/session";
import { getBranchesList } from "@/lib/data/employees";
import { BranchesClient } from "@/components/organization/BranchesClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Branch Locations | EMS",
};

export default async function BranchesPage() {
  const context = await verifyPortalAccess("hr_manager", {
    permission: "organization.read",
  });
  if (!context || !context.activeOrganization) {
    redirect("/login");
  }

  const canWrite = context.permissions.includes("organization.write");
  const branches = await getBranchesList(context.activeOrganization.id);

  return (
    <BranchesClient
      initialBranches={branches}
      canWrite={canWrite}
    />
  );
}
