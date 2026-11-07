import { verifyPortalAccess } from "@/lib/auth/session";
import { getSalaryStructures } from "@/lib/data/payroll";
import { getEmployeesDirectory } from "@/lib/data/employees";
import { SalaryStructuresClient } from "@/components/payroll/SalaryStructuresClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { CreditCard, Users, ShieldCheck, Layers } from "lucide-react";

export const metadata = {
  title: "Salary Structures & Pay Bands | Finance & Payroll",
};

export default async function FinanceSalaryStructuresPage() {
  const context = await verifyPortalAccess("finance_payroll_manager", {
    permission: "payroll.read",
  });
  const orgId = context.activeOrganization?.id ?? "";

  const [structures, empResult] = await Promise.all([
    getSalaryStructures(orgId),
    getEmployeesDirectory(orgId, { pageSize: 100 }),
  ]);

  const activeEmployees = empResult.employees.map((e) => ({
    id: e.id,
    fullName: e.fullName,
    employeeCode: e.employeeCode,
  }));

  const totalBase = structures.reduce((sum, s) => sum + s.baseSalary, 0);
  const avgSalary = structures.length > 0 ? Math.round(totalBase / structures.length) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Salary Structures & Pay Bands
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Define fixed base pay, flexible allowances (HRA, DA, Special), and statutory PF/ESI/TDS deduction formulas.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Assigned Structures"
          value={structures.length}
          subtitle={`Across ${activeEmployees.length} staff members`}
          icon={<CreditCard size={20} />}
        />
        <MetricCard
          label="Average Base Salary"
          value={`₹${avgSalary.toLocaleString("en-IN")}`}
          subtitle="Monthly institutional average"
          icon={<Layers size={20} color="#3b82f6" />}
        />
        <MetricCard
          label="Unassigned Employees"
          value={Math.max(0, activeEmployees.length - structures.length)}
          subtitle="Pending salary configuration"
          icon={<Users size={20} color="#f59e0b" />}
        />
        <MetricCard
          label="Statutory Compliances"
          value="EPF, ESI, TDS"
          subtitle="Configured rules active"
          icon={<ShieldCheck size={20} color="#10b981" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Institutional Compensation Register</CardTitle>
            <CardDescription>
              Assign base salary, custom allowances, and recurring deductions per employee
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <SalaryStructuresClient
            structures={structures}
            employees={activeEmployees}
          />
        </CardContent>
      </Card>
    </div>
  );
}
