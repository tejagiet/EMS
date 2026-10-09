import { getActiveSessionContext } from "@/lib/auth/session";
import { getEmployeeById } from "@/lib/data/employees";
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
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    redirect("/login");
  }

  const { id } = await params;
  const canRead = context.permissions.includes("employee.read") || context.activeRole === "super_admin" || context.linkedEmployee?.id === id;
  if (!canRead) {
    redirect("/unauthorized");
  }

  const employee = await getEmployeeById(context.activeOrganization.id, id);
  if (!employee) {
    notFound();
  }

  const canWrite = context.permissions.includes("employee.write") || context.activeRole === "super_admin";
  const isAuditor = context.activeRole === "auditor";

  return (
    <EmployeeProfileView
      employee={employee}
      canWrite={canWrite}
      isAuditor={isAuditor}
    />
  );
}
