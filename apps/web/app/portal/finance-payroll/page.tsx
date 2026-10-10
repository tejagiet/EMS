import { BarChart } from "@/components/charts/BarChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { verifyPortalAccess } from "@/lib/auth/session";
import { getFinancePayrollAnalytics } from "@/lib/data/analytics";
import { getPayrollRuns, getSalaryStructures } from "@/lib/data/payroll";
import { getEmployeesDirectory } from "@/lib/data/employees";
import { PayrollRunsClient } from "@/components/payroll/PayrollRunsClient";
import { SalaryStructuresClient } from "@/components/payroll/SalaryStructuresClient";
import { CreditCard, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { DesignationPayBandsTable } from "./DesignationPayBandsTable";

export const metadata = {
  title: "Finance & Payroll Console | EMS",
};

export default async function FinancePayrollDashboard() {
  const context = await verifyPortalAccess("finance_payroll_manager");
  const orgId = context.activeOrganization?.id ?? "";

  const [analytics, runs, structures, empResult] = await Promise.all([
    getFinancePayrollAnalytics(orgId),
    getPayrollRuns(orgId),
    getSalaryStructures(orgId),
    getEmployeesDirectory(orgId, { pageSize: 100 }),
  ]);

  const activeEmployees = empResult.employees.map((e) => ({
    id: e.id,
    fullName: e.fullName,
    employeeCode: e.employeeCode,
  }));

  const pendingRunsCount = runs.filter((r) => r.status === "pending_approval").length;
  const approvedRunsCount = runs.filter((r) => r.status === "approved").length;

  const latestApprovedRun = runs.find((r) => r.status === "approved");
  const latestDisbursed = latestApprovedRun ? latestApprovedRun.totalNet : 0;

  const deptPayrollChart = analytics.departmentBreakdown.map((d) => ({
    label: d.departmentName,
    value: d.count,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Finance & Payroll Operations
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Configurable salary structures, batch payroll calculations, multi-level approvals, and immutable payslips.
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
          label="Active Salaried Staff"
          value={analytics.activeSalariedCount}
          subtitle={`${structures.length} configured structures`}
          icon={<Users size={20} />}
        />
        <MetricCard
          label="Pending Run Approvals"
          value={pendingRunsCount}
          subtitle={pendingRunsCount > 0 ? "Action required" : "All batches processed"}
          icon={<AlertCircle size={20} />}
        />
        <MetricCard
          label="Latest Approved Net"
          value={`₹${latestDisbursed.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`}
          subtitle={latestApprovedRun ? `${latestApprovedRun.title} (${approvedRunsCount} closed)` : "No approved runs yet"}
          icon={<CheckCircle2 size={20} />}
        />
        <MetricCard
          label="Compensation Grades"
          value={analytics.totalDesignations}
          subtitle="Approved pay bands"
          icon={<CreditCard size={20} />}
        />
      </div>

      {/* Interactive Payroll Processing Section */}
      <Card id="runs">
        <CardHeader>
          <div>
            <CardTitle>Payroll Runs & Approval Cycles</CardTitle>
            <CardDescription>
              Calculate periodic employee compensation, review deduction breakdowns, approve runs, and export audit sheets.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <PayrollRunsClient runs={runs} />
        </CardContent>
      </Card>

      {/* Salary Structures Section */}
      <Card id="structures">
        <CardHeader>
          <div>
            <CardTitle>Employee Salary Structures</CardTitle>
            <CardDescription>
              Effective-dated basic salary, customizable allowances (HRA, Special), and statutory deductions (PF, PT).
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <SalaryStructuresClient structures={structures} employees={activeEmployees} />
        </CardContent>
      </Card>

      {/* Charts & Grade Distribution */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 20,
        }}
      >
        <BarChart
          title="Department Payroll Allocation Roster"
          description="Distribution of salaried employees across academic and administrative departments"
          data={deptPayrollChart}
          xAxisLabel="Department"
          yAxisLabel="Salaried Staff"
        />

        <Card id="reports">
          <CardHeader>
            <div>
              <CardTitle>Designation Pay Bands & Grades</CardTitle>
              <CardDescription>
                Hierarchical compensation bands established by GIET institutional administration
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <DesignationPayBandsTable
              data={analytics.designationGrades as unknown as Record<string, unknown>[]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
