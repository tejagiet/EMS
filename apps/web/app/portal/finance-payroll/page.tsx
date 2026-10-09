import { BarChart } from "@/components/charts/BarChart";
import { UnavailableChartCard } from "@/components/charts/UnavailableChartCard";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { SchemaDependencyNotice } from "@/components/ui/SchemaDependencyNotice";
import { verifyPortalAccess } from "@/lib/auth/session";
import { getFinancePayrollAnalytics } from "@/lib/data/analytics";
import { CreditCard, Users } from "lucide-react";

export const metadata = {
  title: "Finance & Payroll Console | EMS",
};

export default async function FinancePayrollDashboard() {
  const context = await verifyPortalAccess("finance_payroll_manager");
  const orgId = context.activeOrganization?.id ?? "";
  const data = await getFinancePayrollAnalytics(orgId);

  const deptPayrollChart = data.departmentBreakdown.map((d) => ({
    label: d.departmentName,
    value: d.count,
  }));

  const gradeColumns = [
    {
      key: "name",
      header: "Designation Title",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span style={{ fontWeight: 600 }}>{String(row.name)}</span>
      ),
    },
    {
      key: "grade",
      header: "Compensation Grade",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <Badge
          label={typeof row.grade === "string" ? row.grade.toUpperCase() : "UNGRADED"}
          variant={typeof row.grade === "string" ? "secondary" : "neutral"}
          size="sm"
        />
      ),
    },
    {
      key: "level",
      header: "Salary Band Level",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
          {typeof row.level === "number" ? `Level ${row.level.toString()}` : "Standard"}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Finance & Payroll Operations
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Salaried headcount, organizational compensation grades, and statutory payroll workflows.
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
          value={data.activeSalariedCount}
          subtitle="Enrolled on payroll register"
          icon={<Users size={20} />}
        />
        <MetricCard
          label="Current Payroll Period"
          isUnavailable
          requiredPhase={6}
          unavailableReason="Awaiting Phase 6 Payroll Cycle schema."
        />
        <MetricCard
          label="Pending Batch Approvals"
          isUnavailable
          requiredPhase={6}
          unavailableReason="Awaiting Phase 6 Disbursement ledger."
        />
        <MetricCard
          label="Compensation Grades"
          value={data.totalDesignations}
          subtitle="Approved pay bands"
          icon={<CreditCard size={20} />}
        />
      </div>

      {/* Charts & Dependency Notices */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 20,
        }}
      >
        <BarChart
          title="Department Payroll Allocation Roster"
          description="Distribution of salaried employees across cost centers"
          data={deptPayrollChart}
          xAxisLabel="Department"
          yAxisLabel="Salaried Staff"
        />

        <UnavailableChartCard
          title="Payroll Disbursement History by Period"
          description="Aggregated gross compensation, deductions, and net disbursements per financial cycle"
          requiredPhase={6}
          domainModule="Payroll & Salary Structures"
          targetTables={["salary_structures", "salary_components", "payroll_runs", "payslips"]}
        />
      </div>

      {/* Schema Notice */}
      <SchemaDependencyNotice
        moduleName="Compensation & Payroll Engine"
        requiredPhase={6}
        description="Salary components (Basic, HRA, Allowances, PF, ESI, Tax withholding), payroll batch runs, and digital payslip generation activate in Phase 6."
        plannedSchema={["salary_structures", "payroll_runs", "payslips", "tax_declarations"]}
      />

      {/* Designation Salary Grades */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Designation Pay Bands & Compensation Grades</CardTitle>
            <CardDescription>
              Registered hierarchical salary levels mapped to institutional roles
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={data.designationGrades as unknown as Record<string, unknown>[]}
            columns={gradeColumns}
            keyExtractor={(row) => String(row.id)}
            pageSize={6}
          />
        </CardContent>
      </Card>
    </div>
  );
}
