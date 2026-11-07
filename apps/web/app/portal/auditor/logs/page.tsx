import { verifyPortalAccess } from "@/lib/auth/session";
import { getAuditorAnalytics } from "@/lib/data/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { History, Shield, Lock } from "lucide-react";
import { AuditorHistoryTable } from "../AuditorHistoryTable";

export const metadata = {
  title: "Activity Audit Logs | Auditor Portal",
};

export default async function AuditorLogsPage() {
  const context = await verifyPortalAccess("auditor", {
    permission: "audit.read",
  });
  const orgId = context.activeOrganization?.id ?? "";
  const data = await getAuditorAnalytics(orgId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
              Activity Audit Logs & Ledger
            </h1>
            <Badge label="READ-ONLY" variant="neutral" size="sm" />
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
            Immutable chronological record of field changes, administrative actions, and security events.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Total Ledger Records"
          value={data.totalAuditRecords}
          subtitle="Immutable change rows"
          icon={<History size={20} />}
        />
        <MetricCard
          label="Employees Tracked"
          value={data.totalEmployeesTracked}
          subtitle="Monitored in audit log"
          icon={<Shield size={20} color="#10b981" />}
        />
        <MetricCard
          label="Access Level"
          value="Read-Only Auditor"
          subtitle="Zero-mutation guarantee"
          icon={<Lock size={20} color="#3b82f6" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Organization Event Trail</CardTitle>
            <CardDescription>
              Every field mutation on employee records is permanently captured with prior and post values
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <AuditorHistoryTable data={data.auditTrail as unknown as Record<string, unknown>[]} />
        </CardContent>
      </Card>
    </div>
  );
}
