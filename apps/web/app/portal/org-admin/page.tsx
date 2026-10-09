import { verifyPortalAccess } from "@/lib/auth/session";
import { PortalShellView } from "../PortalShellView";

export default async function OrgAdminPortalPage() {
  const context = await verifyPortalAccess("org_admin");

  return (
    <PortalShellView
      context={context}
      role="org_admin"
      modules={[
        {
          title: "Branches & Departments Management",
          phase: 3,
          description:
            "Establish and configure campuses, branch offices, and organizational sub-departments.",
          statusText: "Active: Organization boundary triggers enforced.",
        },
        {
          title: "Tenant Member Provisioning",
          phase: 3,
          description: "Authorize new employee profiles and assign tenant-scoped portal roles.",
          statusText: "Active: Privileged membership flow enabled.",
        },
        {
          title: "Organization Policy & Settings",
          phase: 3,
          description:
            "Configure working hours, regional calendar rules, and institutional formats.",
          statusText: "Active: Settings key-value store connected.",
        },
        {
          title: "Tenant Compliance Ledger",
          phase: 3,
          description:
            "Review localized audit records and security modifications within this organization.",
          statusText: "Active: Scoped to current tenant.",
        },
      ]}
    />
  );
}
