import { verifyPortalAccess } from "@/lib/auth/session";
import { getBranchesList } from "@/lib/data/employees";
import { BranchesClient } from "@/components/organization/BranchesClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Branch & Campus Management | EMS",
};

export default async function OrgAdminBranchesPage() {
  const context = await verifyPortalAccess("org_admin", {
    permission: "organization.read",
  });
  if (!context || !context.activeOrganization) {
    redirect("/login");
  }

  const canWrite = context.permissions.includes("organization.write");

  const branches = await getBranchesList(context.activeOrganization.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Branch Locations & Campuses
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Tenant: <strong>{context.activeOrganization.name}</strong> · Physical locations and operational units.
        </p>
      </div>

      <BranchesClient
        initialBranches={branches}
        canWrite={canWrite}
      />
    </div>
  );
}
