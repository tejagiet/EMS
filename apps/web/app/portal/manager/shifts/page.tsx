import { verifyPortalAccess } from "@/lib/auth/session";
import { getTeamAttendanceRoster } from "@/lib/data/attendance";
import { AttendanceRosterClient } from "@/components/attendance/AttendanceRosterClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Calendar, Users, CheckCircle2, Clock } from "lucide-react";

export const metadata = {
  title: "Team Schedules & Rosters | Manager Portal",
};

export default async function ManagerShiftsPage() {
  const context = await verifyPortalAccess("manager");
  const orgId = context.activeOrganization?.id ?? "";
  const managerEmployeeId = context.linkedEmployee?.id ?? null;
  const today = new Date().toISOString().split("T")[0]!;

  const roster = await getTeamAttendanceRoster(orgId, managerEmployeeId, today);

  const presentCount = roster.filter((r) => r.status === "present" || r.isLate).length;
  const lateCount = roster.filter((r) => r.isLate).length;
  const absentCount = roster.filter((r) => r.status === "absent").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Team Schedules & Daily Rosters
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Monitor daily punch records, scheduled work shifts, and real-time attendance status for direct reports.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Supervised Staff"
          value={roster.length}
          subtitle="Team headcount rostered"
          icon={<Users size={20} />}
        />
        <MetricCard
          label="Present Today"
          value={presentCount}
          subtitle="Active on campus / duty"
          icon={<CheckCircle2 size={20} color="#10b981" />}
        />
        <MetricCard
          label="Late Check-Ins"
          value={lateCount}
          subtitle="Punched after grace period"
          icon={<Clock size={20} color="#f59e0b" />}
        />
        <MetricCard
          label="Absent / On Leave"
          value={absentCount}
          subtitle="Off-duty staff members"
          icon={<Calendar size={20} color="#ef4444" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Daily Roster & Shift Attendance</CardTitle>
            <CardDescription>
              Real-time check-in timestamps, assigned working shifts, and physical/remote attendance markers
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <AttendanceRosterClient initialRoster={roster} currentDate={today} />
        </CardContent>
      </Card>
    </div>
  );
}
