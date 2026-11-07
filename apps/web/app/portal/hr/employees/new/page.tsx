import { verifyPortalAccess } from "@/lib/auth/session";
import { getOrganizationMetadataOptions } from "@/lib/data/employees";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Add New Employee | EMS",
};

export default async function NewEmployeePage() {
  const context = await verifyPortalAccess("hr_manager", {
    allowRoles: ["org_admin"],
    permission: "employee.write",
  });
  if (!context || !context.activeOrganization) {
    redirect("/login");
  }

  const metadata = await getOrganizationMetadataOptions(context.activeOrganization.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, color: "var(--primary)" }}>
          Enroll New Employee
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "4px 0 0" }}>
          Register organizational personnel, assign department, designation, and reporting relationships.
        </p>
      </div>

      <EmployeeForm mode="create" metadata={metadata} />
    </div>
  );
}
