import { verifyPortalAccess } from "@/lib/auth/session";
import { getDeptHeadAnalytics } from "@/lib/data/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Users, CheckCircle2, Briefcase } from "lucide-react";
import { DeptHeadMembersTable } from "../DeptHeadMembersTable";

export const metadata = {
  title: "Department Staff | Department Head Portal",
};

export default async function DeptHeadStaffPage() {
  const context = await verifyPortalAccess("dept_head");
  const orgId = context.activeOrganization?.id ?? "";
  const deptId = context.linkedEmployee?.departmentId ?? null;

  const data = await getDeptHeadAnalytics(orgId, deptId);

  const activeStaffCount = data.departmentMembers.filter((m) => m.status === "active").length;
  const designationsCount = new Set(data.departmentMembers.map((m) => m.designation)).size;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Department Staff Directory
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Comprehensive roster of academic faculty, research personnel, and administrative staff enrolled in your department.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Total Headcount"
          value={data.departmentHeadcount}
          subtitle="Enrolled staff members"
          icon={<Users size={20} />}
        />
        <MetricCard
          label="Active Personnel"
          value={activeStaffCount}
          subtitle="On-duty departmental staff"
          icon={<CheckCircle2 size={20} color="#10b981" />}
        />
        <MetricCard
          label="Job Designations"
          value={designationsCount}
          subtitle="Academic & technical tiers"
          icon={<Briefcase size={20} color="#3b82f6" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Enrolled Departmental Personnel</CardTitle>
            <CardDescription>
              Detailed employee directory, employee codes, designations, and contact channels
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
