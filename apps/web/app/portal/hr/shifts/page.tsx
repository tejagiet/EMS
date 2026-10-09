import { verifyPortalAccess } from "@/lib/auth/session";
import { getShiftsList, getShiftAssignments } from "@/lib/data/shifts";
import { getEmployeesDirectory } from "@/lib/data/employees";
import { ShiftsClient } from "@/components/shifts/ShiftsClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Clock } from "lucide-react";

export const metadata = {
  title: "Shift Scheduling & Rosters | HR Portal",
};

export default async function ShiftsPage() {
  const context = await verifyPortalAccess("hr_manager");
  const orgId = context.activeOrganization?.id ?? "";

  const [shifts, assignments, empRes] = await Promise.all([
    getShiftsList(orgId),
    getShiftAssignments(orgId),
    getEmployeesDirectory(orgId, { pageSize: 500 }),
  ]);

  const employees = empRes.employees.map((e) => ({
    id: e.id,
    name: e.fullName,
    code: e.employeeCode,
  }));

  const canManage = context.permissions.includes("attendance.manage") || context.activeRole === "super_admin";

  const breadcrumbs = [
    { label: "HR Portal", href: "/portal/hr" },
    { label: "Shift Scheduling", href: "/portal/hr/shifts" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Breadcrumbs items={breadcrumbs} />

      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <Clock size={28} /> Shift Scheduling & Work Rosters
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Define operational working hours, grace periods, overnight cycles, and assign staff members to shifts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shift Schedule Management</CardTitle>
          <CardDescription>
            Institutional working hours configuration and staff assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShiftsClient
            shifts={shifts}
            assignments={assignments}
            employees={employees}
            canManage={canManage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
