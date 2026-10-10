import { BarChart } from "@/components/charts/BarChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { verifyPortalAccess } from "@/lib/auth/session";
import { getOrgAdminAnalytics } from "@/lib/data/analytics";
import { getTeamLeaveRequests } from "@/lib/data/leave";
import { getPayrollRuns } from "@/lib/data/payroll";
import { getCandidates, getJobPostings } from "@/lib/data/recruitment";
import { getAssets } from "@/lib/data/assets";
import {
  Briefcase,
  Building2,
  GitFork,
  History,
  Users,
  CreditCard,
  Calendar,
  Laptop,
  UserCheck,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { OrgAdminHistoryTable } from "./OrgAdminHistoryTable";

export const metadata = {
  title: "Organization Admin Dashboard | EMS",
};

export default async function OrgAdminDashboard() {
  const context = await verifyPortalAccess("org_admin");
  const orgId = context.activeOrganization?.id ?? "";

  const [data, leaveRequests, payrollRuns, postings, candidates, assets] = await Promise.all([
    getOrgAdminAnalytics(orgId),
    getTeamLeaveRequests(orgId, null, "pending"),
    getPayrollRuns(orgId),
    getJobPostings(orgId),
    getCandidates(orgId),
    getAssets(orgId),
  ]);

  const pendingPayrollRuns = payrollRuns.filter((r) => r.status === "draft");
  const activePostingsCount = postings.filter((p) => p.status === "published").length;
  const inPipelineCandidates = candidates.filter((c) => c.stage !== "rejected").length;
  const assignedAssetsCount = assets.filter((a) => a.status === "assigned").length;

  const deptChartData = data.departmentDistribution.map((d) => ({
    label: d.category,
    value: d.count,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Title & Context Header */}
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Organization Admin Dashboard
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Tenant: <strong>{context.activeOrganization?.name ?? "Main Organization"}</strong> ·
          Headcount, structures, and institutional governance.
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
          label="Total Headcount"
          value={data.totalEmployees}
          subtitle="Staff across all branches"
          icon={<Users size={20} />}
        />
        <MetricCard
          label="Active Staff"
          value={data.activeEmployees}
          subtitle="Regular active contracts"
          icon={<Users size={20} />}
          trend={{ direction: "neutral", value: "Verified Active", isPositive: true }}
        />
        <MetricCard
          label="Departments"
          value={data.totalDepartments}
          subtitle="Functional divisions"
          icon={<Building2 size={20} />}
        />
        <MetricCard
          label="Branches"
          value={data.totalBranches}
          subtitle="Operational campuses"
          icon={<GitFork size={20} />}
        />
        <MetricCard
          label="Designations"
          value={data.totalDesignations}
          subtitle="Hierarchy role titles"
          icon={<Briefcase size={20} />}
        />
      </div>

      {/* Charts & Structure Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 20,
        }}
      >
        <BarChart
          title="Department-wise Headcount"
          description="Distribution of registered employees across organizational units"
          data={deptChartData}
          xAxisLabel="Department"
          yAxisLabel="Employees"
        />

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Tenant Approval Pipeline & Operations</CardTitle>
              <CardDescription>Real-time cross-module pending actions and administrative status</CardDescription>
            </div>
          </CardHeader>
          <CardContent style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                backgroundColor: "var(--background)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Calendar size={18} color="#f59e0b" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>Pending Leave Requests</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {leaveRequests.length} applications awaiting supervisor review
                  </div>
                </div>
              </div>
              <Link
                href="/portal/manager/approvals"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "0.8rem",
                  color: "var(--primary)",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Review <ArrowRight size={13} />
              </Link>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                backgroundColor: "var(--background)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CreditCard size={18} color="#3b82f6" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>Monthly Payroll Runs</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {pendingPayrollRuns.length} draft cycles awaiting financial authorization
                  </div>
                </div>
              </div>
              <Link
                href="/portal/finance-payroll/runs"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "0.8rem",
                  color: "var(--primary)",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Inspect <ArrowRight size={13} />
              </Link>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                backgroundColor: "var(--background)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <UserCheck size={18} color="#10b981" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>Talent Requisitions & Pipeline</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {activePostingsCount} active job openings · {inPipelineCandidates} candidates in evaluation
                  </div>
                </div>
              </div>
              <Link
                href="/portal/recruitment/candidates"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "0.8rem",
                  color: "var(--primary)",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                View Pipeline <ArrowRight size={13} />
              </Link>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                backgroundColor: "var(--background)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Laptop size={18} color="#6366f1" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>IT & Hardware Inventory</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {assets.length} tracked assets ({assignedAssetsCount} actively allocated)
                  </div>
                </div>
              </div>
              <Link
                href="/portal/it-assets/inventory"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "0.8rem",
                  color: "var(--primary)",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Manage <ArrowRight size={13} />
              </Link>
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: "0.82rem",
                color: "var(--text-muted)",
                lineHeight: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ShieldCheck size={16} color="#10b981" />
              <span>
                All <strong>{data.totalDepartments}</strong> departments and <strong>{data.totalBranches}</strong> branches
                enforce strict PostgreSQL RLS tenant boundary isolation.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log / Change History */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <History size={18} /> Recent Personnel Change History
            </CardTitle>
            <CardDescription>
              Audit record of employment and designation updates (`employee_history`)
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <OrgAdminHistoryTable data={data.recentHistory} />
        </CardContent>
      </Card>
    </div>
  );
}
