import { verifyPortalAccess } from "@/lib/auth/session";
import { getCandidates, getJobPostings } from "@/lib/data/recruitment";
import { getBranchesList } from "@/lib/data/employees";
import { CandidatePipelineClient } from "@/components/recruitment/CandidatePipelineClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Users, UserCheck, Calendar, Award } from "lucide-react";

export const metadata = {
  title: "Candidate Pipeline & Applications | Recruitment Portal",
};

export default async function RecruitmentCandidatesPage() {
  const context = await verifyPortalAccess("recruitment_manager", {
    allowRoles: ["org_admin"],
    permission: "recruitment.read",
  });
  const orgId = context.activeOrganization?.id ?? "";
  const canWrite = context.permissions.includes("recruitment.write");

  const [candidates, postings, branches] = await Promise.all([
    getCandidates(orgId),
    getJobPostings(orgId),
    getBranchesList(orgId),
  ]);

  const appliedCount = candidates.filter((c) => c.stage === "applied").length;
  const interviewCount = candidates.filter((c) => c.stage === "interview").length;
  const offerCount = candidates.filter((c) => c.stage === "offer").length;
  const hiredCount = candidates.filter((c) => c.stage === "hired").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Candidate Pipeline & Evaluation
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Screen applicant profiles, track stages, schedule interview rounds, and advance selections.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Total Applicants"
          value={candidates.length}
          subtitle={`${appliedCount} new applications`}
          icon={<Users size={20} />}
        />
        <MetricCard
          label="In Interviews"
          value={interviewCount}
          subtitle="Evaluation underway"
          icon={<Calendar size={20} color="#3b82f6" />}
        />
        <MetricCard
          label="Offers Extended"
          value={offerCount}
          subtitle="Awaiting response"
          icon={<Award size={20} color="#f59e0b" />}
        />
        <MetricCard
          label="Hired Personnel"
          value={hiredCount}
          subtitle="Transitioned to staff"
          icon={<UserCheck size={20} color="#10b981" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Talent Acquisition Pipeline Funnel</CardTitle>
            <CardDescription>
              Filter candidates across active requisitions, evaluate competencies, and execute stage transitions
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <CandidatePipelineClient
            candidates={candidates}
            jobPostings={postings}
            branches={branches.map((b) => ({ id: b.id, name: b.name }))}
            canWrite={canWrite}
          />
        </CardContent>
      </Card>
    </div>
  );
}
