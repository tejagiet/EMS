import { verifyPortalAccess } from "@/lib/auth/session";
import { getAssets } from "@/lib/data/assets";
import { AssetsClient } from "@/components/assets/AssetsClient";
import { MetricCard } from "@/components/ui/MetricCard";
import { createClient } from "@/lib/supabase/server";
import { Laptop, CheckCircle2, AlertTriangle, Layers } from "lucide-react";

export const metadata = {
  title: "Asset Inventory | IT & Assets Portal",
};

export default async function ItAssetsInventoryPage() {
  const context = await verifyPortalAccess("it_assets_manager");
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

  const totalAssets = assets.length;
  const assignedAssets = assets.filter((a) => a.status === "assigned").length;
  const availableAssets = assets.filter((a) => a.status === "available").length;
  const maintenanceAssets = assets.filter((a) => a.status === "under_maintenance").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          IT Hardware & Asset Inventory
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Comprehensive inventory catalog of laptops, desktop workstations, networking gear, and lab peripherals.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Total Hardware"
          value={totalAssets}
          subtitle="Registered devices in tenant"
          icon={<Laptop size={20} />}
        />
        <MetricCard
          label="Assigned to Staff"
          value={assignedAssets}
          subtitle="In active deployment"
          icon={<CheckCircle2 size={20} color="#10b981" />}
        />
        <MetricCard
          label="Available in Store"
          value={availableAssets}
          subtitle="Ready for provisioning"
          icon={<Layers size={20} color="#3b82f6" />}
        />
        <MetricCard
          label="Under Maintenance"
          value={maintenanceAssets}
          subtitle="Repair & servicing active"
          icon={<AlertTriangle size={20} color="#f59e0b" />}
        />
      </div>

      <AssetsClient
        initialAssets={assets}
        employees={employeeOptions}
        organizationId={orgId}
        currentUserId={context.userId}
      />
    </div>
  );
}
