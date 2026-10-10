import { verifyPortalAccess } from "@/lib/auth/session";
import { getSuperAdminAnalytics } from "@/lib/data/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Building2, Plus, CheckCircle2, XCircle } from "lucide-react";
import { SuperAdminOrgsTable } from "../SuperAdminOrgsTable";

export const metadata = {
  title: "Tenants & Organizations | Super Admin Console",
};

export default async function SuperAdminOrganizationsPage() {
  await verifyPortalAccess("super_admin");
  const data = await getSuperAdminAnalytics();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
            Institutions & Tenants
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
            Provisioned institutions, educational departments, and enterprise tenant boundaries.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8, fontSize: "0.875rem" }}
        >
          <Plus size={16} />
          Provision New Tenant
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Total Tenants"
          value={data.totalOrgs}
          subtitle="Provisioned in database"
          icon={<Building2 size={20} />}
        />
        <MetricCard
          label="Active Tenants"
          value={data.activeOrgs}
          subtitle="Operational instances"
          icon={<CheckCircle2 size={20} color="#10b981" />}
        />
        <MetricCard
          label="Inactive / Suspended"
          value={data.inactiveOrgs}
          subtitle="Awaiting authorization"
          icon={<XCircle size={20} color="#ef4444" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Platform Organization Directory</CardTitle>
            <CardDescription>
              Registered educational institutions and corporate multi-tenant entities
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <SuperAdminOrgsTable data={data.organizations as unknown as Record<string, unknown>[]} />
        </CardContent>
      </Card>
    </div>
  );
}
