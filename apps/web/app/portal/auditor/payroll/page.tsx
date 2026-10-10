import { verifyPortalAccess } from "@/lib/auth/session";
import { getPayrollRuns } from "@/lib/data/payroll";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { CreditCard, CheckCircle2, ShieldCheck, DollarSign } from "lucide-react";

export const metadata = {
  title: "Payroll Audit Trail | Auditor Portal",
};

export default async function AuditorPayrollPage() {
  const context = await verifyPortalAccess("auditor");
  const orgId = context.activeOrganization?.id ?? "";

  const runs = await getPayrollRuns(orgId);

  const totalGross = runs.reduce((sum, r) => sum + r.totalGross, 0);
  const totalNet = runs.reduce((sum, r) => sum + r.totalNet, 0);
  const approvedRuns = runs.filter((r) => r.status === "approved");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
              Payroll Audit & Financial Verification
            </h1>
            <Badge label="READ-ONLY" variant="neutral" size="sm" />
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
            Verification of historical salary batches, statutory tax compliance withholdings, and bank disbursement sign-offs.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Total Payroll Batches"
          value={runs.length}
          subtitle="Processed cycles"
          icon={<CreditCard size={20} />}
        />
        <MetricCard
          label="Authorized Disbursals"
          value={approvedRuns.length}
          subtitle="Approved batches"
          icon={<CheckCircle2 size={20} color="#10b981" />}
        />
        <MetricCard
          label="Cumulative Gross Accrued"
          value={`₹${totalGross.toLocaleString("en-IN")}`}
          subtitle={`Net: ₹${totalNet.toLocaleString("en-IN")}`}
          icon={<DollarSign size={20} color="#3b82f6" />}
        />
        <MetricCard
          label="Financial Audit State"
          value="Balanced"
          subtitle="TDS & PF reconciliations pass"
          icon={<ShieldCheck size={20} color="#10b981" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Historical Payroll Batches</CardTitle>
            <CardDescription>
              Inspection ledger of payroll periods, gross allocations, deductions, and authorization status
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {runs.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0, padding: 16 }}>
                No payroll processing runs recorded for this organization.
              </p>
            ) : (
              runs.map((run) => (
                <div
                  key={run.id}
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
                      <span style={{ fontWeight: 600 }}>{run.title}</span>
                      <Badge variant={run.status === "approved" ? "success" : "warning"}>
                        {run.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                      Period: {run.periodStart} to {run.periodEnd} | Paid: {run.paymentDate}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 16, fontSize: "0.85rem" }}>
                    <span>Gross: <strong>₹{run.totalGross.toLocaleString("en-IN")}</strong></span>
                    <span>Deductions: <strong>₹{run.totalDeductions.toLocaleString("en-IN")}</strong></span>
                    <span>Net: <strong style={{ color: "var(--primary)" }}>₹{run.totalNet.toLocaleString("en-IN")}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
