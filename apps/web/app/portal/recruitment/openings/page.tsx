import { verifyPortalAccess } from "@/lib/auth/session";
import { getJobPostings } from "@/lib/data/recruitment";
import { getDepartmentsList, getDesignationsList } from "@/lib/data/employees";
import { JobPostingsClient } from "@/components/recruitment/JobPostingsClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Briefcase, CheckCircle2, Clock, Users } from "lucide-react";

export const metadata = {
  title: "Job Openings & Requisitions | Recruitment Portal",
};

export default async function RecruitmentOpeningsPage() {
  const context = await verifyPortalAccess("recruitment_manager");
  const orgId = context.activeOrganization?.id ?? "";

  const [postings, depts, desigs] = await Promise.all([
    getJobPostings(orgId),
    getDepartmentsList(orgId),
    getDesignationsList(orgId),
  ]);

  const openCount = postings.filter((p) => p.status === "published").length;
  const draftCount = postings.filter((p) => p.status === "draft").length;
  const totalVacancies = postings.reduce((acc, p) => acc + (p.vacancyCount || 1), 0);

  const deptOptions = depts.map((d) => ({ id: d.id, name: d.name }));
  const desigOptions = desigs.map((d) => ({ id: d.id, name: d.name }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Job Openings & Requisitions
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Manage open vacancies, job requirements, salary bands, and department requisition approvals.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Published Openings"
          value={openCount}
          subtitle="Actively accepting applicants"
          icon={<Briefcase size={20} color="#10b981" />}
        />
        <MetricCard
          label="Total Vacancies"
          value={totalVacancies}
          subtitle="Authorized headcount quota"
          icon={<Users size={20} />}
        />
        <MetricCard
          label="Draft Requisitions"
          value={draftCount}
          subtitle="Pending publication"
          icon={<Clock size={20} color="#f59e0b" />}
        />
        <MetricCard
          label="Departments Hiring"
          value={new Set(postings.map((p) => p.departmentId).filter(Boolean)).size}
          subtitle="Across operational units"
          icon={<CheckCircle2 size={20} />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Requisitions & Vacancy Register</CardTitle>
            <CardDescription>
              Create, update, and manage job specifications and compensation criteria
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
    </div>
  );
}
