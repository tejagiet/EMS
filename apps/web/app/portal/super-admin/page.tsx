import { verifyPortalAccess } from "@/lib/auth/session";
import { PortalShellView } from "../PortalShellView";

export default async function SuperAdminPortalPage() {
  const context = await verifyPortalAccess("super_admin");

  return (
    <PortalShellView
      context={context}
      role="super_admin"
      modules={[
        {
          title: "Tenant & Organization Registry",
          phase: 3,
          description:
            "Global provisioning and configuration of institutional organizations and subsidiaries.",
          statusText: "Active: GIET Polytechnic College and Apex Solutions provisioned.",
        },
        {
          title: "System RBAC & Role Management",
          phase: 3,
          description:
            "Define global permissions, grant portal roles, and inspect security assignments.",
          statusText: "Active: 10 Portal Roles and 22 granular permissions enforced.",
        },
        {
          title: "Global Security Audit Trail",
          phase: 3,
          description:
            "Inspect immutable audit ledgers, login timestamps, and critical operational events.",
          statusText: "Active: RLS policies and audit logs connected.",
        },
        {
          title: "Platform Telemetry & System Health",
          phase: 5,
          description:
            "Monitor database connection poolers, edge runtime latencies, and server health.",
        },
      ]}
    />
  );
}
