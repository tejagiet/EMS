import { UnavailableChartCard } from "@/components/charts/UnavailableChartCard";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { SchemaDependencyNotice } from "@/components/ui/SchemaDependencyNotice";
import { verifyPortalAccess } from "@/lib/auth/session";
import { getItAssetsAnalytics, type SettingItem } from "@/lib/data/analytics";
import { Building2, Settings, Users } from "lucide-react";

export const metadata = {
  title: "IT & Infrastructure Assets | EMS",
};

export default async function ItAssetsDashboard() {
  const context = await verifyPortalAccess("it_assets_manager");
  const orgId = context.activeOrganization?.id ?? "";
  const data = await getItAssetsAnalytics(orgId);

  const settingColumns: DataTableColumn<SettingItem>[] = [
    {
      key: "key",
      header: "Configuration Parameter",
      sortable: true,
      render: (row) => <code style={{ fontSize: "0.82rem", fontWeight: 600 }}>{row.key}</code>,
    },
    {
      key: "value",
      header: "Configured Value",
      render: (row) => (
        <pre
          style={{
            fontSize: "0.78rem",
            background: "var(--background)",
            padding: "4px 8px",
            borderRadius: 4,
            margin: 0,
            overflowX: "auto",
          }}
        >
          {JSON.stringify(row.value)}
        </pre>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          IT & Hardware Asset Management
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Workstation inventory, hardware lifecycle tracking, and device asset assignments.
        </p>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 16,
        }}
      >
        <MetricCard
          label="Active User Accounts"
          value={data.activeProfilesCount}
          subtitle="Users eligible for IT provisioning"
          icon={<Users size={20} />}
        />
        <MetricCard
          label="Provisioned Campuses"
          value={data.provisioningBranches}
          subtitle="Branches with network presence"
          icon={<Building2 size={20} />}
        />
        <MetricCard
          label="Total Hardware Assets"
          isUnavailable
          requiredPhase={8}
          unavailableReason="Awaiting Phase 8 Asset inventory tables."
        />
        <MetricCard
          label="Pending Device Requests"
          isUnavailable
          requiredPhase={8}
          unavailableReason="Awaiting Phase 8 Asset assignment ledger."
        />
      </div>

      {/* Chart & Dependency Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 20,
        }}
      >
        <UnavailableChartCard
          title="Hardware Asset Allocation by Category"
          description="Distribution of physical laptops, workstations, monitors, and mobile peripherals across divisions"
          requiredPhase={8}
          domainModule="Hardware Assets & Device Inventory"
          targetTables={["assets", "asset_categories", "asset_assignments", "asset_maintenance"]}
        />

        <Card>
          <CardHeader>
            <div>
              <CardTitle>IT Provisioning Infrastructure</CardTitle>
              <CardDescription>Enterprise deployment endpoints</CardDescription>
            </div>
          </CardHeader>
          <CardContent
            style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: "0.85rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--border)",
                paddingBottom: 8,
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>Active Tenant</span>
              <strong>{context.activeOrganization?.name ?? "Main Organization"}</strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--border)",
                paddingBottom: 8,
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>Departments Requiring Workstations</span>
              <span style={{ fontWeight: 600 }}>{data.provisioningDepartments} Departments</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--border)",
                paddingBottom: 8,
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>Campus Locations</span>
              <span style={{ fontWeight: 600 }}>{data.provisioningBranches} Branches</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Asset Tracking Schema</span>
              <Badge label="PHASE 8 TARGET" variant="warning" size="sm" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schema Dependency Notice */}
      <SchemaDependencyNotice
        moduleName="IT Asset & Device Lifecycle Engine"
        requiredPhase={8}
        description="Serial number tracking, manufacturer warranties, laptop check-in/check-out signatures, and disposal records deploy in Phase 8."
        plannedSchema={["assets", "asset_assignments", "asset_requests", "maintenance_logs"]}
      />

      {/* IT Configurations Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Settings size={18} /> Organization IT Configurations
            </CardTitle>
            <CardDescription>
              Technical settings and parameters defined for this tenant (`settings` table)
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={data.itSettings}
            columns={settingColumns}
            keyExtractor={(row) => (typeof row.id === "string" ? row.id : "")}
            pageSize={5}
            emptyTitle="No custom IT settings defined"
            emptyDescription="Organization is utilizing standard default IT infrastructure parameters."
          />
        </CardContent>
      </Card>
    </div>
  );
}
