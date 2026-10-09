import Link from "next/link";
import { DonutChart } from "@/components/charts/DonutChart";
import { LineChart } from "@/components/charts/LineChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Button } from "@/components/ui/Button";
import { verifyPortalAccess } from "@/lib/auth/session";
import { getHrAnalytics } from "@/lib/data/analytics";
import { getTeamAttendanceRoster } from "@/lib/data/attendance";
import { getTeamLeaveRequests } from "@/lib/data/leave";
import { Clock, UserCheck, Users, Calendar, AlertTriangle, ArrowRight } from "lucide-react";
import { HrDirectoryTable } from "./HrDirectoryTable";

export const metadata = {
  title: "HR Portal & Workforce Analytics | EMS",
};

export default async function HrDashboard() {
  const context = await verifyPortalAccess("hr_manager");
  const orgId = context.activeOrganization?.id ?? "";

  const [data, roster, pendingLeaves] = await Promise.all([
    getHrAnalytics(orgId),
    getTeamAttendanceRoster(orgId),
    getTeamLeaveRequests(orgId, null, "pending"),
  ]);

  const exceptionsCount = roster.filter((r) => r.isLate || r.isEarlyDeparture || r.status === "absent").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Human Resources Operations
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Workforce roster, employment lifecycles, real-time attendance rosters, and leave approvals.
        </p>
      </div>

      {/* KPI Cards — Connected Live Metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 16,
        }}
      >
        <MetricCard
          label="Active Workforce"
          value={data.activeEmployees}
          subtitle="Contractually active staff"
          icon={<Users size={20} />}
        />
        <MetricCard
          label="Probation Roster"
          value={data.probationCount}
          subtitle="Awaiting confirmation"
          icon={<UserCheck size={20} />}
        />
        <MetricCard
          label="Contract Staff"
          value={data.contractCount}
          subtitle="Fixed-term contracts"
          icon={<Clock size={20} />}
        />
        <MetricCard
          label="Attendance Exceptions"
          value={exceptionsCount}
          subtitle="Late, absent, or unclocked today"
          icon={<AlertTriangle size={20} />}
        />
        <MetricCard
          label="Pending Leave Requests"
          value={pendingLeaves.length}
          subtitle="Applications awaiting decision"
          icon={<Calendar size={20} />}
        />
      </div>

      {/* Quick Access Operational Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 16,
        }}
      >
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Attendance Rosters</CardTitle>
              <CardDescription>Daily clock-in logs and time exceptions</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 16px" }}>
              Monitor daily punches across all units, detect late arrivals, and export safe timesheet CSVs.
            </p>
            <Link href="/portal/hr/attendance">
              <Button size="sm" variant="secondary">
                View Rosters <ArrowRight size={14} style={{ marginLeft: 6 }} />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Shift Scheduling</CardTitle>
              <CardDescription>Working hours and roster assignments</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 16px" }}>
              Configure daytime and overnight shifts with grace periods, and assign staff members.
            </p>
            <Link href="/portal/hr/shifts">
              <Button size="sm" variant="secondary">
                Manage Shifts <ArrowRight size={14} style={{ marginLeft: 6 }} />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Leave Management</CardTitle>
              <CardDescription>Authoritative ledger and approvals</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 16px" }}>
              Review organization-wide leave requests and configure institutional quota allocations.
            </p>
            <Link href="/portal/hr/leave">
              <Button size="sm" variant="secondary">
                Manage Leaves <ArrowRight size={14} style={{ marginLeft: 6 }} />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Visualizations */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 20,
        }}
      >
        <DonutChart
          title="Employment Classification"
          description="Distribution of contracts across workforce categories"
          data={data.employmentTypeDistribution}
          centerLabel="Workforce"
        />

        <LineChart
          title="Workforce Joining Trend"
          description="Monthly personnel onboarding timeline derived from date_of_joining"
          data={data.monthlyJoiningTrend}
        />
      </div>

      {/* Interactive Employee Directory */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Workforce Directory</CardTitle>
            <CardDescription>
              Filterable staff roster with department, designation, and status indicators
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <HrDirectoryTable employees={data.directory} />
        </CardContent>
      </Card>
    </div>
  );
}
