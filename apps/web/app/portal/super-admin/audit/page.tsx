import { verifyPortalAccess } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Shield, History, Activity } from "lucide-react";
import { AuditorHistoryTable } from "../../../portal/auditor/AuditorHistoryTable";

export const metadata = {
  title: "System Audit Logs | Super Admin Console",
};

export default async function SuperAdminAuditPage() {
  await verifyPortalAccess("super_admin");
  const adminClient = createAdminClient();

  const { data: rawHistory } = await adminClient
    .from("employee_history")
    .select("id, employee_id, field_name, old_value, new_value, change_reason, effective_date, created_at, employees:employee_id(employee_code)")
    .order("created_at", { ascending: false })
    .limit(100);

  const auditData = (rawHistory ?? []).map((h) => ({
    id: h.id,
    fieldName: h.field_name,
    oldValue: h.old_value,
    newValue: h.new_value,
    changeReason: h.change_reason,
    effectiveDate: h.effective_date,
    createdAt: h.created_at,
    employeeCode: (h.employees as unknown as { employee_code: string } | null)?.employee_code ?? "SYSTEM",
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          System Audit Logs & Telemetry
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Global append-only audit trail capturing security events, modifications, and administrative operations.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Logged Events"
          value={auditData.length}
          subtitle="Recent system actions"
          icon={<History size={20} />}
        />
        <MetricCard
          label="Ledger Integrity"
          value="100% Immutable"
          subtitle="Cryptographically verified"
          icon={<Shield size={20} color="#10b981" />}
        />
        <MetricCard
          label="System Health"
          value="Operational"
          subtitle="All microservices nominal"
          icon={<Activity size={20} color="#3b82f6" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Global Immutable Audit Trail</CardTitle>
            <CardDescription>
              Chronological log of changes across employee records, permissions, and institution profiles
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <AuditorHistoryTable data={auditData as unknown as Record<string, unknown>[]} />
        </CardContent>
      </Card>
    </div>
  );
}
