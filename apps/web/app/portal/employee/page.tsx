import { verifyPortalAccess } from "@/lib/auth/session";
import { PortalShellView } from "../PortalShellView";

export default async function EmployeePortalPage() {
  const context = await verifyPortalAccess("employee");

  return (
    <PortalShellView
      context={context}
      role="employee"
      modules={[
        {
          title: "Personal Profile & Credentials",
          phase: 3,
          description:
            "Inspect verified personal data, emergency contacts, employee code, and branch.",
          statusText: `Active: Connected to employee ${context.linkedEmployee?.employeeCode ?? "record"}.`,
        },
        {
          title: "Attendance Punch & Daily Log",
          phase: 4,
          description:
            "Clock attendance timestamps, request attendance regularisation, and view monthly logs.",
        },
        {
          title: "Leave Requests & Entitlements",
          phase: 4,
          description:
            "Submit leave requests, track manager approval status, and check leave ledger balances.",
        },
        {
          title: "Payslip Downloads & Form 16",
          phase: 4,
          description:
            "Download monthly salary slips, tax breakdown reports, and annual statements.",
        },
      ]}
    />
  );
}
