import { verifyPortalAccess } from "@/lib/auth/session";
import { PortalShellView } from "../PortalShellView";

export default async function FinancePayrollPortalPage() {
  const context = await verifyPortalAccess("finance_payroll_manager");

  return (
    <PortalShellView
      context={context}
      role="finance_payroll_manager"
      modules={[
        {
          title: "Payroll Execution & Processing Engine",
          phase: 4,
          description: "Calculate gross salary, deductions, provident funds, and net pay batches.",
        },
        {
          title: "Salary Disbursement & Approvals",
          phase: 4,
          description: "Dual-authorization workflow for releasing monthly salary disbursements.",
        },
        {
          title: "Taxation & Compliance Ledgers",
          phase: 4,
          description:
            "Generate statutory compliance reports, tax deduction tables, and bank export files.",
        },
      ]}
    />
  );
}
