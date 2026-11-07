import { verifyPortalAccess } from "@/lib/auth/session";
import { getEmployeeById } from "@/lib/data/employees";
import { getEmployeeAttendanceHistory } from "@/lib/data/attendance";
import { getEmployeeLeaveBalances } from "@/lib/data/leave";
import { EmployeeProfileView } from "@/components/employees/EmployeeProfileView";
import { notFound, redirect } from "next/navigation";

export const metadata = {
  title: "Employee Profile | EMS",
};

interface EmployeeDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const context = await verifyPortalAccess("hr_manager", {
    allowRoles: ["org_admin"],
    permission: "employee.read",
  });
  if (!context || !context.activeOrganization) {
    redirect("/login");
  }

  const { id } = await params;

  const [employee, attendanceHistory, leaveBalances] = await Promise.all([
    getEmployeeById(context.activeOrganization.id, id),
    getEmployeeAttendanceHistory(context.activeOrganization.id, id, 15).catch(() => []),
    getEmployeeLeaveBalances(context.activeOrganization.id, id).catch(() => []),
  ]);

  if (!employee) {
    notFound();
  }

  const canWrite = context.permissions.includes("employee.write");
  const isAuditor = context.activeRole === "auditor";

  return (
    <EmployeeProfileView
      employee={employee}
      canWrite={canWrite}
      isAuditor={isAuditor}
      attendanceHistory={attendanceHistory}
      leaveBalances={leaveBalances}
    />
  );
}
