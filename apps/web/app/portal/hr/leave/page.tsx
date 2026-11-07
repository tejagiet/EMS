import { verifyPortalAccess } from "@/lib/auth/session";
import { getLeaveTypes, getTeamLeaveRequests } from "@/lib/data/leave";
import { LeaveRequestsQueueClient } from "@/components/leave/LeaveRequestsQueueClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Calendar } from "lucide-react";

export const metadata = {
  title: "Leave Management & Policies | HR Portal",
};

export default async function LeaveManagementPage() {
  const context = await verifyPortalAccess("hr_manager", {
    permission: "leave.read",
  });
  const orgId = context.activeOrganization?.id ?? "";

  const [leaveTypes, allRequests] = await Promise.all([
    getLeaveTypes(orgId),
    getTeamLeaveRequests(orgId),
  ]);

  const breadcrumbs = [
    { label: "HR Portal", href: "/portal/hr" },
    { label: "Leave Management", href: "/portal/hr/leave" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Breadcrumbs items={breadcrumbs} />

      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <Calendar size={28} /> Leave Management & Authoritative Policies
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Organization-wide leave applications queue, accrual rules, policy quotas, and balance ledgers.
        </p>
      </div>

      {/* Active Leave Types Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {leaveTypes.map((lt) => (
          <Card key={lt.id}>
            <CardHeader style={{ paddingBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
                <div>
                  <CardTitle style={{ fontSize: "0.95rem" }}>{lt.name}</CardTitle>
                  <code style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{lt.code}</code>
                </div>
                <Badge label={lt.isPaid ? "PAID" : "UNPAID"} variant={lt.isPaid ? "success" : "neutral"} size="sm" />
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)", marginBottom: 4 }}>
                {lt.daysPerYear} Days / Yr
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Carry Forward: {lt.carryForwardDays} days allowed
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Applications Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Leave Applications Queue</CardTitle>
          <CardDescription>
            Review, authorize, or reject staff leave requests with automatic leave ledger deduction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeaveRequestsQueueClient initialRequests={allRequests} />
        </CardContent>
      </Card>
    </div>
  );
}
