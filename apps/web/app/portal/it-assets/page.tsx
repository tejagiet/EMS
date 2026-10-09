import { verifyPortalAccess } from "@/lib/auth/session";
import { getAssets } from "@/lib/data/assets";
import { AssetsClient } from "@/components/assets/AssetsClient";
import { MetricCard } from "@/components/ui/MetricCard";
import { createClient } from "@/lib/supabase/server";
import { Laptop, CheckCircle2, RotateCcw, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "IT Assets & Hardware Inventory | EMS",
};

export default async function ItAssetsDashboard() {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">IT & Hardware Asset Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Hardware workstation tracking, check-outs, return condition inspections, and maintenance.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Hardware"
          value={totalAssets}
          subtitle="Registered devices in tenant"
          icon={<Laptop className="w-5 h-5" />}
        />
        <MetricCard
          label="Assigned to Staff"
          value={assignedAssets}
          subtitle="In active deployment"
          icon={<CheckCircle2 className="w-5 h-5 text-indigo-600" />}
        />
        <MetricCard
          label="Available in Store"
          value={availableAssets}
          subtitle="Ready for provisioning"
          icon={<RotateCcw className="w-5 h-5 text-emerald-600" />}
        />
        <MetricCard
          label="Under Maintenance"
          value={maintenanceAssets}
          subtitle="Repairs and diagnostics"
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Live Assets Component */}
      <AssetsClient
        initialAssets={assets}
        employees={employeeOptions}
        organizationId={orgId}
        currentUserId={context.userId}
      />
    </div>
  );
}
