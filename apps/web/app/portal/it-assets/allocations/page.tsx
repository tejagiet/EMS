import { verifyPortalAccess } from "@/lib/auth/session";
import { getAssets } from "@/lib/data/assets";
import { AssetsClient } from "@/components/assets/AssetsClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { createClient } from "@/lib/supabase/server";
import { UserCheck, Laptop, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Equipment Allocations | IT & Assets Portal",
};

export default async function ItAssetsAllocationsPage() {
  const context = await verifyPortalAccess("it_assets_manager", {
    permission: "asset.manage",
  });
  const orgId = context.activeOrganization?.id ?? "";

  const supabase = await createClient();
  const [assets, empRes, profRes] = await Promise.all([
    getAssets(orgId),
    supabase.from("employees").select("id, employee_code, profile_id").eq("organization_id", orgId),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const profMap = new Map((profRes.data ?? []).map((p) => [p.id, p.full_name]));
  const employeeOptions = (empRes.data ?? []).map((e) => ({
    id: e.id,
    name: `${e.profile_id ? profMap.get(e.profile_id) ?? "Employee" : "Employee"} (${e.employee_code})`,
  }));

  const allocatedAssets = assets.filter((a) => a.status === "assigned");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Equipment Allocation & Custody
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Monitor active device custody, check-out agreements, and staff assignment histories.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Active Deployments"
          value={allocatedAssets.length}
          subtitle="Devices currently deployed"
          icon={<UserCheck size={20} color="#10b981" />}
        />
        <MetricCard
          label="Custody Ratio"
          value={assets.length > 0 ? `${Math.round((allocatedAssets.length / assets.length) * 100)}%` : "0%"}
          subtitle="Of total hardware pool"
          icon={<Laptop size={20} color="#3b82f6" />}
        />
        <MetricCard
          label="Staff Hand-offs"
          value={allocatedAssets.length}
          subtitle="Custody agreements on file"
          icon={<CheckCircle2 size={20} />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Active Staff Hardware Deployments</CardTitle>
            <CardDescription>
              Assign hardware, record condition upon release, and process return check-ins
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <AssetsClient
            initialAssets={allocatedAssets}
            employees={employeeOptions}
            organizationId={orgId}
            currentUserId={context.userId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
