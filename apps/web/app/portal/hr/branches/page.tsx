import { getActiveSessionContext } from "@/lib/auth/session";
import { getBranchesList } from "@/lib/data/employees";
import { BranchesClient } from "@/components/organization/BranchesClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Branch Locations | EMS",
};

export default async function BranchesPage() {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    redirect("/login");
  }

  const canRead = context.permissions.includes("organization.read") || context.activeRole === "super_admin";
  if (!canRead) {
    redirect("/unauthorized");
  }

  const canWrite = context.permissions.includes("organization.write") || context.activeRole === "super_admin";
  const branches = await getBranchesList(context.activeOrganization.id);

  return (
    <BranchesClient
      initialBranches={branches}
      canWrite={canWrite}
    />
  );
}
