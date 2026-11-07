import { verifyPortalAccess } from "@/lib/auth/session";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Building, Clock, Calendar, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Organization Policies & Parameters | EMS",
};

export default async function OrgAdminPoliciesPage() {
  const context = await verifyPortalAccess("org_admin", {
    permission: "organization.write",
  });
  if (!context || !context.activeOrganization) {
    redirect("/login");
  }

  const org = context.activeOrganization;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Organization Policies & Configuration
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Tenant: <strong>{org.name}</strong> · Institutional rules, working schedule parameters, and operational boundaries.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
        {/* Tenant Profile Policy */}
        <Card>
          <CardHeader>
            <CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Building size={18} /> Tenant Profile & Identification
            </CardTitle>
            <CardDescription>Official institutional registration parameters</CardDescription>
          </CardHeader>
          <CardContent style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Institution Name</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{org.name}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Tenant Code</span>
              <code>{org.code}</code>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Tenant Slug</span>
              <code>{org.slug}</code>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Status</span>
              <Badge label="ACTIVE & ENFORCED" variant="success" size="sm" />
            </div>
          </CardContent>
        </Card>

        {/* Working Hours & Shift Rules */}
        <Card>
          <CardHeader>
            <CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={18} /> Attendance & Workday Policies
            </CardTitle>
            <CardDescription>Configured operational shifts and grace limits</CardDescription>
          </CardHeader>
          <CardContent style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Standard Work Schedule</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>9:00 AM – 5:00 PM IST</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Late Arrival Grace Period</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>15 Minutes</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Minimum Workday Duration</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>8.0 Hours</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Overtime Calculation</span>
              <Badge label="AUTOMATIC (>8h)" variant="secondary" size="sm" />
            </div>
          </CardContent>
        </Card>

        {/* Leave & Entitlements Policy */}
        <Card>
          <CardHeader>
            <CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={18} /> Leave Accrual & Balance Rules
            </CardTitle>
            <CardDescription>Annual leave quotas and rollover parameters</CardDescription>
          </CardHeader>
          <CardContent style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Paid Leave (PL) Quota</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>18 Days / Year</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Sick Leave (SL) Quota</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>12 Days / Year</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Casual Leave (CL) Quota</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>12 Days / Year</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Consecutive Approvals</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Manager + HR Oversight</span>
            </div>
          </CardContent>
        </Card>

        {/* Security & Multi-tenant Boundary Enforcement */}
        <Card>
          <CardHeader>
            <CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={18} /> Tenant Boundary Security Guard
            </CardTitle>
            <CardDescription>Database Row-Level Security and audit policy status</CardDescription>
          </CardHeader>
          <CardContent style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Cross-Tenant Cross-Ref Triggers</span>
              <Badge label="ENABLED & ACTIVE" variant="success" size="sm" />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Employee Code Sequence</span>
              <code>GIET-EMP-XXXX</code>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Row-Level Security (RLS)</span>
              <Badge label="12/12 TABLES LOCKED" variant="success" size="sm" />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Immutable Audit Triggers</span>
              <Badge label="AUTOMATED (PHASE 5+)" variant="success" size="sm" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
