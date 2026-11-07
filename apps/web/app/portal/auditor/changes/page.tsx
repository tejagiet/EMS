import { verifyPortalAccess } from "@/lib/auth/session";
import { getAuditorAnalytics } from "@/lib/data/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { History, Users, ShieldAlert } from "lucide-react";
import { AuditorHistoryTable } from "../AuditorHistoryTable";

export const metadata = {
  title: "Employee Ledger & Changes | Auditor Portal",
};

export default async function AuditorChangesPage() {
  const context = await verifyPortalAccess("auditor", {
    permission: "employee.read",
  });
  const orgId = context.activeOrganization?.id ?? "";
  const data = await getAuditorAnalytics(orgId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
              Employee Personnel Ledger & Revisions
            </h1>
            <Badge label="READ-ONLY" variant="neutral" size="sm" />
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
            Historical record of status transitions, compensation adjustments, designation promotions, and department transfers.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Tracked Revisions"
          value={data.totalAuditRecords}
          subtitle="Field change events"
          icon={<History size={20} />}
        />
        <MetricCard
          label="Active Personnel"
          value={data.totalEmployeesTracked}
          subtitle="Enrolled staff in tenant"
          icon={<Users size={20} color="#10b981" />}
        />
        <MetricCard
          label="Ledger Immutability"
          value="Enforced"
          subtitle="Zero DELETE/UPDATE permissions"
          icon={<ShieldAlert size={20} color="#3b82f6" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Personnel Modification Audit Log</CardTitle>
            <CardDescription>
              Field-level delta history showing pre-mutation values, post-mutation values, and documented change justification
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
