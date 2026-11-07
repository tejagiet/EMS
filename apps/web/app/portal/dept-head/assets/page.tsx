import { verifyPortalAccess } from "@/lib/auth/session";
import { getAssets } from "@/lib/data/assets";
import { getDeptHeadAnalytics } from "@/lib/data/analytics";
import { AssetsClient } from "@/components/assets/AssetsClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Laptop, CheckCircle2, Layers } from "lucide-react";

export const metadata = {
  title: "Department Assets & Equipment | Department Head Portal",
};

export default async function DeptHeadAssetsPage() {
  const context = await verifyPortalAccess("dept_head", {
    permission: "asset.read",
  });
  const orgId = context.activeOrganization?.id ?? "";
  const deptId = context.linkedEmployee?.departmentId ?? null;

  const [allAssets, data] = await Promise.all([
    getAssets(orgId),
    getDeptHeadAnalytics(orgId, deptId),
  ]);

  const memberIds = new Set(data.departmentMembers.map((m) => m.id));
  const deptAssets = allAssets.filter((a) => a.currentEmployeeId && memberIds.has(a.currentEmployeeId));
  const assetsToDisplay = deptAssets.length > 0 ? deptAssets : allAssets;

  const employeeOptions = data.departmentMembers.map((m) => ({
    id: m.id,
    name: `${m.fullName} (${m.employeeCode})`,
  }));

  const inUseCount = assetsToDisplay.filter((a) => a.status === "assigned").length;
  const availableCount = assetsToDisplay.filter((a) => a.status === "available").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Department Assets & Equipment
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Hardware and equipment allocated to faculty, researchers, and technical staff in your department.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Total Equipment"
          value={assetsToDisplay.length}
          subtitle="Department inventory"
          icon={<Laptop size={20} />}
        />
        <MetricCard
          label="Assigned & Active"
          value={inUseCount}
          subtitle="In staff custody"
          icon={<CheckCircle2 size={20} color="#10b981" />}
        />
        <MetricCard
          label="Available Units"
          value={availableCount}
          subtitle="Ready for deployment"
          icon={<Layers size={20} color="#3b82f6" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Department Equipment Register</CardTitle>
            <CardDescription>
              Laptops, workstations, lab instruments, and peripheral devices tracked by serial and barcode tag
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <AssetsClient
            initialAssets={assetsToDisplay}
            employees={employeeOptions}
            organizationId={orgId}
            currentUserId={context.userId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
