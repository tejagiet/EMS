import { verifyPortalAccess } from "@/lib/auth/session";
import { getPayrollRuns } from "@/lib/data/payroll";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { FileText, Download, ShieldCheck, DollarSign } from "lucide-react";

export const metadata = {
  title: "Tax & Financial Reports | Finance & Payroll",
};

export default async function FinancePayrollReportsPage() {
  const context = await verifyPortalAccess("finance_payroll_manager");
  const orgId = context.activeOrganization?.id ?? "";

  const runs = await getPayrollRuns(orgId);

  const totalGross = runs.reduce((acc, r) => acc + r.totalGross, 0);
  const totalDeductions = runs.reduce((acc, r) => acc + r.totalDeductions, 0);
  const totalNet = runs.reduce((acc, r) => acc + r.totalNet, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Tax & Statutory Financial Reports
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Statutory employee deductions, Provident Fund (EPF), ESI contributions, and TDS tax certificates.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Cumulative Gross"
          value={`₹${totalGross.toLocaleString("en-IN")}`}
          subtitle="All payroll runs to date"
          icon={<DollarSign size={20} />}
        />
        <MetricCard
          label="Total Deductions (PF/Tax)"
          value={`₹${totalDeductions.toLocaleString("en-IN")}`}
          subtitle="Withheld for compliance"
          icon={<ShieldCheck size={20} color="#f59e0b" />}
        />
        <MetricCard
          label="Net Payouts Disbursed"
          value={`₹${totalNet.toLocaleString("en-IN")}`}
          subtitle="Deposited into employee accounts"
          icon={<FileText size={20} color="#10b981" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Statutory Financial Reports & Documents</CardTitle>
            <CardDescription>
              Export institutional compliance registers, Form 16 statements, and bank electronic clearance files
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
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
                <span style={{ fontWeight: 600, display: "block" }}>Employees Provident Fund (EPF) Monthly ECR</span>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Electronic Challan cum Return detailing 12% employee + 12% employer statutory contributions
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Badge variant="success">Ready</Badge>
                <button
                  type="button"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "var(--background)",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  <Download size={14} /> Download ECR
                </button>
              </div>
            </div>

            <div
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
                <span style={{ fontWeight: 600, display: "block" }}>Employees State Insurance (ESI) Contribution Sheet</span>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Monthly wage register and contribution calculations for medical and disability insurance
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Badge variant="success">Ready</Badge>
                <button
                  type="button"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "var(--background)",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  <Download size={14} /> Export CSV
                </button>
              </div>
            </div>

            <div
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
                <span style={{ fontWeight: 600, display: "block" }}>Income Tax TDS (Section 192) Deduction Summary</span>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Quarterly 24Q filing preparation sheet and annual Form 16 Part B tax computation breakdowns
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Badge variant="secondary">Quarterly (Q3)</Badge>
                <button
                  type="button"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "var(--background)",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  <Download size={14} /> Export 24Q Sheet
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
