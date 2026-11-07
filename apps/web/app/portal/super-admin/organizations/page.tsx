import { verifyPortalAccess } from "@/lib/auth/session";
import { getSuperAdminAnalytics } from "@/lib/data/analytics";
import { SuperAdminOrganizationsClient } from "./SuperAdminOrganizationsClient";

export default async function SuperAdminOrganizationsPage() {
  if (typeof document !== "undefined") {
    document.title = "Tenants & Organizations | Super Admin Console";
  }
  await verifyPortalAccess("super_admin");
  const data = await getSuperAdminAnalytics();

  return <SuperAdminOrganizationsClient initialData={data} />;
}
