import { verifyPortalAccess } from "@/lib/auth/session";
import { getEmployeePayslips } from "@/lib/data/payroll";
import { EmployeePayslipsClient } from "@/components/payroll/EmployeePayslipsClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { CreditCard, Download, DollarSign } from "lucide-react";

export const metadata = {
  title: "My Payslips & Compensation | Employee Portal",
};

export default async function EmployeePayslipsPage() {
  const context = await verifyPortalAccess("employee");
  const linkedEmployee = context.linkedEmployee;

  const payslips = linkedEmployee ? await getEmployeePayslips(linkedEmployee.id) : [];

  const latestSlip = payslips[0] ?? null;
  const totalEarnedNet = payslips.reduce((sum, p) => sum + p.netSalary, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          My Payslips & Compensation Statements
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Access monthly salary slips, itemized earnings, statutory PF/ESI/tax deductions, and download receipts.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Latest Net Payout"
          value={latestSlip ? `₹${latestSlip.netSalary.toLocaleString("en-IN")}` : "₹0"}
          subtitle={latestSlip ? `Period: ${latestSlip.periodStart} to ${latestSlip.periodEnd}` : "No payslips issued"}
          icon={<CreditCard size={20} color="#10b981" />}
        />
        <MetricCard
          label="Cumulative Net Deposited"
          value={`₹${totalEarnedNet.toLocaleString("en-IN")}`}
          subtitle="All historical payslips"
          icon={<DollarSign size={20} color="#3b82f6" />}
        />
        <MetricCard
          label="Issued Statements"
          value={payslips.length}
          subtitle="PDF payslips available"
          icon={<Download size={20} />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Historical Salary Statements</CardTitle>
            <CardDescription>
              View detailed salary breakdown or download authenticated monthly PDF payslip vouchers
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <EmployeePayslipsClient payslips={payslips} />
        </CardContent>
      </Card>
    </div>
  );
}
