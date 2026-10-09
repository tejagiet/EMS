import { DonutChart } from "@/components/charts/DonutChart";
import { LineChart } from "@/components/charts/LineChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { SchemaDependencyNotice } from "@/components/ui/SchemaDependencyNotice";
import { verifyPortalAccess } from "@/lib/auth/session";
import { getHrAnalytics } from "@/lib/data/analytics";
import { Clock, UserCheck, Users } from "lucide-react";
import { HrDirectoryTable } from "./HrDirectoryTable";

export const metadata = {
  title: "HR Portal & Workforce Analytics | EMS",
};

export default async function HrDashboard() {
  const context = await verifyPortalAccess("hr_manager");
  const orgId = context.activeOrganization?.id ?? "";
  const data = await getHrAnalytics(orgId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Human Resources Operations
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Workforce roster, employment lifecycles, and institutional personnel management.
        </p>
      </div>

      {/* KPI Cards */}
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
          isUnavailable
          requiredPhase={5}
          unavailableReason="Awaiting Phase 5 Shift and Clock-in migrations."
        />
        <MetricCard
          label="Pending Leave Requests"
          isUnavailable
          requiredPhase={5}
          unavailableReason="Awaiting Phase 5 Leave Requests ledger migrations."
        />
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

      {/* HR Module Dependencies */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        <SchemaDependencyNotice
          moduleName="Attendance Tracking"
          requiredPhase={5}
          description="Real-time biometric and self-service shift logs will activate once attendance tables are deployed."
          plannedSchema={["attendance_records", "work_shifts", "shift_assignments"]}
        />
        <SchemaDependencyNotice
          moduleName="Leave Ledger"
          requiredPhase={5}
          description="Paid time off accruals and leave approval workflows activate in Phase 5."
          plannedSchema={["leave_types", "leave_requests", "leave_ledger"]}
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
