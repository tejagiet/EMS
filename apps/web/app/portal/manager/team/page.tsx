import { verifyPortalAccess } from "@/lib/auth/session";
import { getManagerAnalytics } from "@/lib/data/analytics";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Users, CheckCircle2, Building2, Briefcase } from "lucide-react";
import { ManagerTeamTable } from "../ManagerTeamTable";

export const metadata = {
  title: "Reporting Team | Manager Portal",
};

export default async function ManagerTeamPage() {
  const context = await verifyPortalAccess("manager");
  const orgId = context.activeOrganization?.id ?? "";
  const managerEmployeeId = context.linkedEmployee?.id ?? null;

  const data = await getManagerAnalytics(orgId, managerEmployeeId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Reporting Team Members
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Supervisory roster of direct reports, department assignments, and contact channels.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Direct Reports"
          value={data.directReportsCount}
          subtitle="Team members under supervision"
          icon={<Users size={20} />}
        />
        <MetricCard
          label="Active Staff"
          value={data.teamMembers.filter((m) => m.status === "active").length}
          subtitle="Operational personnel"
          icon={<CheckCircle2 size={20} color="#10b981" />}
        />
        <MetricCard
          label="Departments"
          value={new Set(data.teamMembers.map((m) => m.department)).size}
          subtitle="Functional units represented"
          icon={<Building2 size={20} color="#3b82f6" />}
        />
        <MetricCard
          label="Roles Supervised"
          value={new Set(data.teamMembers.map((m) => m.designation)).size}
          subtitle="Unique job designations"
          icon={<Briefcase size={20} color="#f59e0b" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Direct Reporting Personnel</CardTitle>
            <CardDescription>
              Verified staff members with reporting lines directed to your management profile
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ManagerTeamTable data={data.teamMembers} />
        </CardContent>
      </Card>
    </div>
  );
}
