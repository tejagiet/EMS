import { verifyPortalAccess } from "@/lib/auth/session";
import { getEmployeeById, getOrganizationMetadataOptions } from "@/lib/data/employees";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { notFound, redirect } from "next/navigation";

export const metadata = {
  title: "Edit Employee Profile | EMS",
};

interface EditEmployeePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditEmployeePage({ params }: EditEmployeePageProps) {
  const context = await verifyPortalAccess("hr_manager", {
    allowRoles: ["org_admin"],
    permission: "employee.write",
  });
  if (!context || !context.activeOrganization) {
    redirect("/login");
  }

  const { id } = await params;
  const [employee, metadata] = await Promise.all([
    getEmployeeById(context.activeOrganization.id, id),
    getOrganizationMetadataOptions(context.activeOrganization.id),
  ]);

  if (!employee) {
    notFound();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, color: "var(--primary)" }}>
          Edit Employee: {employee.fullName}
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "4px 0 0" }}>
          Update employee assignment, contact coordinates, notice period, or reporting relationships.
        </p>
      </div>

      <EmployeeForm mode="edit" initialData={employee} metadata={metadata} />
    </div>
  );
}
