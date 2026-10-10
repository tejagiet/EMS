import { verifyPortalAccess } from "@/lib/auth/session";
import { getPayrollRuns } from "@/lib/data/payroll";
import { PayrollRunsClient } from "@/components/payroll/PayrollRunsClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { CreditCard, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Payroll Runs & Processing | Finance & Payroll",
};

export default async function FinancePayrollRunsPage() {
  const context = await verifyPortalAccess("finance_payroll_manager");
  const orgId = context.activeOrganization?.id ?? "";

  const runs = await getPayrollRuns(orgId);

  const pendingCount = runs.filter((r) => r.status === "draft").length;
  const approvedCount = runs.filter((r) => r.status === "approved").length;
  const totalDisbursed = runs
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + r.totalNet, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Payroll Processing Runs
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Generate pay period disbursements, review variance calculations, and initiate disbursement cycles.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Total Payroll Runs"
          value={runs.length}
          subtitle="All historical cycles"
          icon={<CreditCard size={20} />}
        />
        <MetricCard
          label="Pending Processing"
          value={pendingCount}
          subtitle="Requiring attention / approval"
          icon={<Clock size={20} color="#f59e0b" />}
        />
        <MetricCard
          label="Approved Runs"
          value={approvedCount}
          subtitle="Disbursement authorized"
          icon={<CheckCircle2 size={20} color="#10b981" />}
        />
        <MetricCard
          label="Total Disbursed"
          value={`₹${totalDisbursed.toLocaleString("en-IN")}`}
          subtitle="Cumulative net payouts"
          icon={<AlertCircle size={20} color="#3b82f6" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Batch Payroll Processing Ledger</CardTitle>
            <CardDescription>
              Create new pay runs, review attendance integrations, lock payroll periods, and export banking NACH/NEFT files
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <PayrollRunsClient runs={runs} />
        </CardContent>
      </Card>
    </div>
  );
}
