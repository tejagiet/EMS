import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { SchemaDependencyNotice } from "@/components/ui/SchemaDependencyNotice";
import { verifyPortalAccess } from "@/lib/auth/session";
import { getDeptHeadAnalytics } from "@/lib/data/analytics";
import { Users } from "lucide-react";
import { DeptHeadMembersTable } from "./DeptHeadMembersTable";

export const metadata = {
  title: "Department Head Overview | EMS",
};

export default async function DeptHeadDashboard() {
  const context = await verifyPortalAccess("dept_head");
  const orgId = context.activeOrganization?.id ?? "";
  const deptId = context.linkedEmployee?.departmentId ?? null;

  const data = await getDeptHeadAnalytics(orgId, deptId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Department Head Console
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Departmental headcount overview, staff designations, and strategic capacity management.
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
          label="Department Headcount"
          value={data.departmentHeadcount}
          subtitle="Staff enrolled in department"
          icon={<Users size={20} />}
        />
        <MetricCard
          label="Department Attendance Rate"
          isUnavailable
          requiredPhase={5}
          unavailableReason="Awaiting Phase 5 Attendance records."
        />
        <MetricCard
          label="Annual Reviews Completed"
          isUnavailable
          requiredPhase={8}
          unavailableReason="Awaiting Phase 8 Performance Appraisal cycles."
        />
        <MetricCard
          label="Department Requisitions"
          isUnavailable
          requiredPhase={7}
          unavailableReason="Awaiting Phase 7 Talent Acquisition schema."
        />
      </div>

      {/* Dependency Notices */}
      <SchemaDependencyNotice
        moduleName="Departmental Attendance Summaries"
        requiredPhase={5}
        description="Aggregated departmental presence, late arrivals, and shift patterns will display here once Phase 5 is deployed."
        plannedSchema={["attendance_records", "work_shifts"]}
      />

      {/* Department Staff Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Department Personnel Roster</CardTitle>
            <CardDescription>
              Registered employees belonging to this functional department
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <DeptHeadMembersTable data={data.departmentMembers} />
        </CardContent>
      </Card>
    </div>
  );
}
