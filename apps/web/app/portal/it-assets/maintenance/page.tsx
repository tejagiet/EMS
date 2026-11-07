import { verifyPortalAccess } from "@/lib/auth/session";
import { getAssets } from "@/lib/data/assets";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { Wrench, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Maintenance & Repairs | IT & Assets Portal",
};

export default async function ItAssetsMaintenancePage() {
  const context = await verifyPortalAccess("it_assets_manager", {
    permission: "asset.manage",
  });
  const orgId = context.activeOrganization?.id ?? "";

  const assets = await getAssets(orgId);
  const maintenanceAssets = assets.filter((a) => a.status === "under_maintenance" || a.condition === "poor");
  const disposedAssets = assets.filter((a) => a.status === "retired");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Hardware Maintenance & Service Records
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Track repair tickets, warranty expirations, diagnostic servicing, and hardware decommissioning.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Under Maintenance"
          value={maintenanceAssets.length}
          subtitle="Active repair work orders"
          icon={<Wrench size={20} color="#f59e0b" />}
        />
        <MetricCard
          label="Decommissioned / Disposed"
          value={disposedAssets.length}
          subtitle="Retired from service"
          icon={<AlertTriangle size={20} color="#ef4444" />}
        />
        <MetricCard
          label="Fleet Health"
          value={assets.length > 0 ? `${Math.round(((assets.length - maintenanceAssets.length) / assets.length) * 100)}%` : "100%"}
          subtitle="Operational uptime readiness"
          icon={<ShieldCheck size={20} color="#10b981" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Equipment Requiring Servicing or Replacement</CardTitle>
            <CardDescription>
              Hardware flagged for diagnostics, physical repairs, battery servicing, or vendor warranty RMA
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {maintenanceAssets.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)" }}>
              <CheckCircle2 size={40} color="#10b981" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--foreground)", margin: "0 0 4px" }}>
                All Equipment Fully Operational
              </h3>
              <p style={{ fontSize: "0.875rem", margin: 0 }}>
                No hardware units are currently reported damaged or under vendor repair.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {maintenanceAssets.map((asset) => (
                <div
                  key={asset.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 16,
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{asset.name}</span>
                      <Badge variant="neutral"><code>{asset.assetTag}</code></Badge>
                      <Badge variant="warning">{asset.condition.toUpperCase()}</Badge>
                    </div>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                      Category: {asset.category} | Model: {asset.model ?? "N/A"} | Serial: {asset.serialNumber ?? "N/A"}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Status: <strong>{asset.status.replace("_", " ")}</strong>
                    </span>
                    <button
                      type="button"
                      disabled
                      title="Service log updates are not available yet."
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "1px solid var(--border)",
                        background: "var(--background)",
                        cursor: "not-allowed",
                        opacity: 0.6,
                        fontSize: "0.8rem",
                      }}
                    >
                      Update Service Log
                    </button>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Service log updates unavailable</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
