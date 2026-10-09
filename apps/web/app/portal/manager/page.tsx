import { verifyPortalAccess } from "@/lib/auth/session";
import { PortalShellView } from "../PortalShellView";

export default async function ManagerPortalPage() {
  const context = await verifyPortalAccess("manager");

  return (
    <PortalShellView
      context={context}
      role="manager"
      modules={[
        {
          title: "Reporting Line Team Directory",
          phase: 3,
          description:
            "Supervise employee records who directly report under your organizational hierarchy.",
          statusText: "Active: Manager reporting line RLS policy active.",
        },
        {
          title: "Team Leave Approval Queue",
          phase: 4,
          description:
            "Approve or decline leave applications submitted by direct reports with comments.",
        },
        {
          title: "Attendance Rosters & Overtime",
          phase: 4,
          description:
            "Review shift rosters, sign off on overtime submissions, and track absences.",
        },
      ]}
    />
  );
}
