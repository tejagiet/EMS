import { BarChart } from "@/components/charts/BarChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { verifyPortalAccess } from "@/lib/auth/session";
import { getRecruitmentAnalytics } from "@/lib/data/analytics";
import { getJobPostings, getCandidates } from "@/lib/data/recruitment";
import { getDepartmentsList, getDesignationsList, getBranchesList } from "@/lib/data/employees";
import { JobPostingsClient } from "@/components/recruitment/JobPostingsClient";
import { CandidatePipelineClient } from "@/components/recruitment/CandidatePipelineClient";
import { Briefcase, Users, Calendar, Award } from "lucide-react";

export const metadata = {
  title: "Recruitment & Talent Acquisition | EMS",
};

export default async function RecruitmentDashboard() {
  const context = await verifyPortalAccess("recruitment_manager");
  const orgId = context.activeOrganization?.id ?? "";

  const [analytics, postings, candidates, depts, desigs, branches] = await Promise.all([
    getRecruitmentAnalytics(orgId),
    getJobPostings(orgId),
    getCandidates(orgId),
    getDepartmentsList(orgId),
    getDesignationsList(orgId),
    getBranchesList(orgId),
  ]);

  const openPostingsCount = postings.filter((p) => p.status === "published").length;
  const inInterviewCount = candidates.filter((c) => c.stage === "interview").length;
  const inOfferCount = candidates.filter((c) => c.stage === "offer").length;
  const hiredCount = candidates.filter((c) => c.stage === "hired").length;

  const capacityChartData = analytics.departmentCapacity.map((d) => ({
    label: d.departmentName,
    value: d.currentStaff,
  }));

  const deptOptions = depts.map((d) => ({ id: d.id, name: d.name }));
  const desigOptions = desigs.map((d) => ({ id: d.id, name: d.name }));
  const branchOptions = branches.map((b) => ({ id: b.id, name: b.name }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Recruitment & Talent Acquisition
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Department job requisitions, candidate pipeline tracking, interview scheduling, and onboarding handoffs.
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
          label="Open Requisitions"
          value={openPostingsCount}
          subtitle={`${postings.length} total postings`}
          icon={<Briefcase size={20} />}
        />
        <MetricCard
          label="Active Applicants"
          value={candidates.length}
          subtitle={`${inInterviewCount} in interview`}
          icon={<Users size={20} />}
        />
        <MetricCard
          label="Offers Extended"
          value={inOfferCount}
          subtitle="Awaiting candidate decision"
          icon={<Award size={20} />}
        />
        <MetricCard
          label="Successfully Hired"
          value={hiredCount}
          subtitle="Onboarded to employee register"
          icon={<Calendar size={20} />}
        />
      </div>

      {/* Candidate Pipeline Section */}
      <Card id="candidates">
        <CardHeader>
          <div>
            <CardTitle>Candidate Screening & Evaluation Funnel</CardTitle>
            <CardDescription>
              Track applications from screening through technical interviews, formal offers, and atomic onboarding handoff.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <CandidatePipelineClient
            candidates={candidates}
            jobPostings={postings}
            branches={branchOptions}
          />
        </CardContent>
      </Card>

      {/* Job Postings Section */}
      <Card id="openings">
        <CardHeader>
          <div>
            <CardTitle>Department Job Openings</CardTitle>
            <CardDescription>
              Configure position requirements, approved vacancy quotas, and hiring manager assignments.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <JobPostingsClient
            postings={postings}
            departments={deptOptions}
            designations={desigOptions}
          />
        </CardContent>
      </Card>

      {/* Department Staffing Capacity Chart */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
        <BarChart
          title="Current Department Staffing Capacity"
          description="Distribution of active personnel across departments to guide recruitment priority"
          data={capacityChartData}
          xAxisLabel="Department"
          yAxisLabel="Current Headcount"
        />
      </div>
    </div>
  );
}
