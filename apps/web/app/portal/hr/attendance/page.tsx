import { verifyPortalAccess } from "@/lib/auth/session";
import { getTeamAttendanceRoster } from "@/lib/data/attendance";
import { AttendanceRosterClient } from "@/components/attendance/AttendanceRosterClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Clock } from "lucide-react";

export const metadata = {
  title: "Organization Attendance Rosters | HR Portal",
};

interface AttendancePageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function AttendancePage({ searchParams }: AttendancePageProps) {
  const context = await verifyPortalAccess("hr_manager", {
    allowRoles: ["org_admin"],
    permission: "attendance.read",
  });
  const orgId = context.activeOrganization?.id ?? "";
  const params = await searchParams;
  const targetDate = params.date ?? new Date().toISOString().split("T")[0]!;

  const roster = await getTeamAttendanceRoster(orgId, null, targetDate);

  const breadcrumbs = [
    { label: "HR Portal", href: "/portal/hr" },
    { label: "Attendance Rosters", href: "/portal/hr/attendance" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Breadcrumbs items={breadcrumbs} />

      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <Clock size={28} /> Organization Attendance Rosters
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Comprehensive daily attendance logs, shift verification, late arrivals, and exportable timesheets.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance Ledger ({targetDate})</CardTitle>
          <CardDescription>
            Live synchronization with PostgreSQL trusted server clocking records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceRosterClient initialRoster={roster} currentDate={targetDate} />
        </CardContent>
      </Card>
    </div>
  );
}
