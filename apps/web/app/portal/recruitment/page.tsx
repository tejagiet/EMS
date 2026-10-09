import { BarChart } from "@/components/charts/BarChart";
import { UnavailableChartCard } from "@/components/charts/UnavailableChartCard";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { SchemaDependencyNotice } from "@/components/ui/SchemaDependencyNotice";
import { verifyPortalAccess } from "@/lib/auth/session";
import { getRecruitmentAnalytics, type DesigItem } from "@/lib/data/analytics";
import { Briefcase, Building2 } from "lucide-react";

export const metadata = {
  title: "Recruitment & Talent Acquisition | EMS",
};

export default async function RecruitmentDashboard() {
  const context = await verifyPortalAccess("recruitment_manager");
  const orgId = context.activeOrganization?.id ?? "";
  const data = await getRecruitmentAnalytics(orgId);

  const capacityChartData = data.departmentCapacity.map((d) => ({
    label: d.departmentName,
    value: d.currentStaff,
  }));

  const designationColumns: DataTableColumn<DesigItem>[] = [
    {
      key: "name",
      header: "Position Title",
      sortable: true,
      render: (row) => <span style={{ fontWeight: 600 }}>{row.name}</span>,
    },
    {
      key: "code",
      header: "Job Code",
      sortable: true,
      render: (row) => (
        <code
          style={{
            fontSize: "0.8rem",
            padding: "2px 6px",
            borderRadius: 4,
            background: "var(--background)",
          }}
        >
          {row.code}
        </code>
      ),
    },
    {
      key: "grade",
      header: "Grade",
      render: (row) => (
        <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
          {row.grade ?? "Standard"}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Role Availability",
      render: (row) => (
        <Badge
          label={row.isActive ? "OPEN FOR REQUISITION" : "INACTIVE"}
          variant={row.isActive ? "success" : "neutral"}
          size="sm"
        />
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Recruitment & Talent Acquisition
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Position requisitions, organizational capacity planning, and hiring workflows.
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
          label="Open Job Requisitions"
          isUnavailable
          requiredPhase={7}
          unavailableReason="Awaiting Phase 7 Job Postings migrations."
        />
        <MetricCard
          label="Candidates in Pipeline"
          isUnavailable
          requiredPhase={7}
          unavailableReason="Awaiting Phase 7 Candidate Pipeline migrations."
        />
        <MetricCard
          label="Upcoming Interviews"
          isUnavailable
          requiredPhase={7}
          unavailableReason="Awaiting Phase 7 Interview Schedule migrations."
        />
        <MetricCard
          label="Active Job Roles"
          value={data.totalDesignations}
          subtitle="Positions configured in org"
          icon={<Briefcase size={20} />}
        />
        <MetricCard
          label="Hiring Departments"
          value={data.totalDepartments}
          subtitle="Divisions in organization"
          icon={<Building2 size={20} />}
        />
      </div>

      {/* Charts & Pipeline Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 20,
        }}
      >
        <BarChart
          title="Department Staffing Baseline"
          description="Current staff numbers across departments to evaluate hiring requisitions"
          data={capacityChartData}
          xAxisLabel="Department"
          yAxisLabel="Current Staff"
        />

        <UnavailableChartCard
          title="Candidate Pipeline Stages"
          description="Visual funnel showing applicants: Applied → Screened → Interviewed → Offered → Hired"
          requiredPhase={7}
          domainModule="Recruitment & Applicant Tracking System"
          targetTables={["job_postings", "candidates", "applications", "interviews"]}
        />
      </div>

      {/* Schema Notice */}
      <SchemaDependencyNotice
        moduleName="Recruitment & Onboarding Module"
        requiredPhase={7}
        description="Comprehensive candidate applicant tracking, interview scorecards, and automated offer letter workflows will be implemented in Phase 7."
        plannedSchema={["job_postings", "candidates", "interviews", "onboarding_tasks"]}
      />

      {/* Available Designations Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Approved Organizational Designations</CardTitle>
            <CardDescription>
              Role specifications available for talent requisitions and recruitment postings
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={data.designationsList}
            columns={designationColumns}
            keyExtractor={(row) => row.id}
            pageSize={6}
          />
        </CardContent>
      </Card>
    </div>
  );
}
