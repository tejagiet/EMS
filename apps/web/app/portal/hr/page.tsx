import { verifyPortalAccess } from "@/lib/auth/session";
import { PortalShellView } from "../PortalShellView";

export default async function HRPortalPage() {
  const context = await verifyPortalAccess("hr_manager");

  return (
    <PortalShellView
      context={context}
      role="hr_manager"
      modules={[
        {
          title: "Employee Directory & Master Records",
          phase: 3,
          description:
            "Maintain employee personnel profiles, employment status, codes, and designations.",
          statusText: "Active: Organization-scoped employee records connected.",
        },
        {
          title: "Attendance & Shift Oversight",
          phase: 4,
          description:
            "Monitor daily clocking, biometric sync, overtime logs, and punctuality reports.",
        },
        {
          title: "Leave Policy & Balances",
          phase: 4,
          description:
            "Manage annual, medical, and privilege leave quotas and review pending requests.",
        },
        {
          title: "Employee History & Lifecycle Ledger",
          phase: 3,
          description:
            "Review immutable change records for promotions, transfers, and status adjustments.",
          statusText: "Active: Employee history ledger enabled.",
        },
      ]}
    />
  );
}
