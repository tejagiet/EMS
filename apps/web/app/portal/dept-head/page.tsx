import { verifyPortalAccess } from "@/lib/auth/session";
import { PortalShellView } from "../PortalShellView";

export default async function DeptHeadPortalPage() {
  const context = await verifyPortalAccess("dept_head");

  return (
    <PortalShellView
      context={context}
      role="dept_head"
      modules={[
        {
          title: "Department Personnel & Staffing",
          phase: 3,
          description: "Overview of all academic or corporate staff assigned to your department.",
          statusText: "Active: Department scoped staff view.",
        },
        {
          title: "Departmental Resource Allocation",
          phase: 4,
          description:
            "Authorise departmental equipment, project budgets, and travel requisitions.",
        },
        {
          title: "Department Performance & Attendance",
          phase: 4,
          description:
            "Aggregated attendance percentage, leave load balancing, and performance metrics.",
        },
      ]}
    />
  );
}
