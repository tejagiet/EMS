import { verifyPortalAccess } from "@/lib/auth/session";
import { getDepartmentsList, getOrganizationMetadataOptions } from "@/lib/data/employees";
import { DepartmentsClient } from "@/components/organization/DepartmentsClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Organization Departments | EMS",
};

export default async function OrgAdminDepartmentsPage() {
  const context = await verifyPortalAccess("org_admin", {
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Department Management
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Tenant: <strong>{context.activeOrganization.name}</strong> · Academic & operational divisions.
        </p>
      </div>

      <DepartmentsClient
        initialDepartments={departments}
        branches={metadata.branches}
        employees={metadata.managers}
        canWrite={canWrite}
      />
    </div>
  );
}
