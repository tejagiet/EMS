import { verifyPortalAccess } from "@/lib/auth/session";
import { getPayrollRuns } from "@/lib/data/payroll";
import type { PayrollRun } from "@/lib/data/payroll";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, Clock, ShieldAlert, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Salary Approvals & Authorization | Finance & Payroll",
};

export default async function FinancePayrollApprovalsPage() {
  const context = await verifyPortalAccess("finance_payroll_manager");
  const orgId = context.activeOrganization?.id ?? "";

  const runs: PayrollRun[] = await getPayrollRuns(orgId);
  const pendingApprovalRuns: PayrollRun[] = runs.filter((r: PayrollRun) => r.status === "draft");
  const approvedRuns: PayrollRun[] = runs.filter((r: PayrollRun) => r.status === "approved");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Salary Approvals & Multi-Tier Sign-Off
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Mandatory approval gates prior to bank payment file generation and salary distribution.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Pending Approvals"
          value={pendingApprovalRuns.length}
          subtitle="Awaiting financial sign-off"
          icon={<Clock size={20} color="#f59e0b" />}
        />
        <MetricCard
          label="Approved Runs"
          value={approvedRuns.length}
          subtitle="Signed off this academic year"
          icon={<CheckCircle2 size={20} color="#10b981" />}
        />
        <MetricCard
          label="Sign-Off Requirement"
          value="Dual Verification"
          subtitle="Finance Manager + Admin"
          icon={<ShieldAlert size={20} color="#3b82f6" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Payroll Sign-Off Queue</CardTitle>
            <CardDescription>
              Review calculated net totals, attendance adjustments, and authorize banking payout batches
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {pendingApprovalRuns.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)" }}>
              <CheckCircle2 size={40} color="#10b981" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--foreground)", margin: "0 0 4px" }}>
                All Payroll Runs Approved
              </h3>
              <p style={{ fontSize: "0.875rem", margin: 0 }}>
                There are currently no payroll batches awaiting approval in this organization.
              </p>
              <div style={{ marginTop: 16 }}>
                <Link
                  href="/portal/finance-payroll/runs"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.85rem",
                    color: "var(--primary)",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  View Historical Runs <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {pendingApprovalRuns.map((run) => (
                <div
                  key={run.id}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: "1.05rem" }}>{run.title}</span>
                      <Badge variant="warning">{run.status.replace("_", " ").toUpperCase()}</Badge>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 4px" }}>
                      Period: {run.periodStart} to {run.periodEnd} | Payment Date: {run.paymentDate}
                    </p>
                    <div style={{ display: "flex", gap: 16, fontSize: "0.82rem" }}>
                      <span>Gross: <strong>₹{run.totalGross.toLocaleString("en-IN")}</strong></span>
                      <span>Deductions: <strong>₹{run.totalDeductions.toLocaleString("en-IN")}</strong></span>
                      <span>Net Payable: <strong style={{ color: "var(--primary)" }}>₹{run.totalNet.toLocaleString("en-IN")}</strong></span>
                    </div>
                  </div>

                  <Link
                    href={`/portal/finance-payroll/runs`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 16px",
                      borderRadius: 6,
                      background: "var(--primary)",
                      color: "#fff",
                      textDecoration: "none",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                  >
                    Review & Authorize <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
