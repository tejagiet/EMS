import { verifyPortalAccess } from "@/lib/auth/session";
import { PortalShellView } from "../PortalShellView";

export default async function AuditorPortalPage() {
  const context = await verifyPortalAccess("auditor");

  return (
    <PortalShellView
      context={context}
      role="auditor"
      modules={[
        {
          title: "System & Authentication Audit Trail",
          phase: 3,
          description:
            "Read-only access to user logins, session events, password changes, and IP logs.",
          statusText: "Active: Read-only audit policies verified.",
        },
        {
          title: "Employee Master Ledger Changes",
          phase: 3,
          description:
            "Inspect immutable audit log of employee compensation changes, transfers, and promotions.",
          statusText: "Active: employee_history immutable table connected.",
        },
        {
          title: "Payroll Compliance & Disbursement Audit",
          phase: 4,
          description:
            "Review statutory deduction compliance, overtime calculations, and payout trails.",
        },
        {
          title: "Regulatory Inspection Reports",
          phase: 4,
          description:
            "Export timestamped compliance inspection documents and certification records.",
        },
      ]}
    />
  );
}
