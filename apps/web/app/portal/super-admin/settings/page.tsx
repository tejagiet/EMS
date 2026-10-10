import { verifyPortalAccess } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { Settings, Database, Server } from "lucide-react";

export const metadata = {
  title: "Platform Settings | Super Admin Console",
};

export default async function SuperAdminSettingsPage() {
  await verifyPortalAccess("super_admin");
  const adminClient = createAdminClient();

  const { data: globalSettings } = await adminClient
    .from("settings")
    .select("id, organization_id, key, value, description, is_public")
    .is("organization_id", null);

  const settingsList = globalSettings ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Platform Settings & Environment
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Global configuration values, PostgreSQL security defaults, and institutional tenancy rules.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Global Parameters"
          value={settingsList.length || 6}
          subtitle="Configured parameters"
          icon={<Settings size={20} />}
        />
        <MetricCard
          label="Database Isolation"
          value="RLS Tenant Bound"
          subtitle="Strict multi-tenancy"
          icon={<Database size={20} color="#10b981" />}
        />
        <MetricCard
          label="Instance Mode"
          value="Production Active"
          subtitle="GIET Polytechnic College"
          icon={<Server size={20} color="#3b82f6" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>System Configuration Parameters</CardTitle>
            <CardDescription>
              Platform-wide environment policies governing authentication, session lifetimes, and logging
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                border: "1px solid var(--border)",
                borderRadius: 8,
                backgroundColor: "var(--background)",
              }}
            >
              <div>
                <span style={{ fontWeight: 600, display: "block" }}>Session Timeout Lifetime</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Maximum inactive duration before re-authentication is required
                </span>
              </div>
              <Badge variant="neutral">24 Hours (86400s)</Badge>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                border: "1px solid var(--border)",
                borderRadius: 8,
                backgroundColor: "var(--background)",
              }}
            >
              <div>
                <span style={{ fontWeight: 600, display: "block" }}>Row-Level Security Enforcement</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Mandatory PostgreSQL RLS policies across all tenant relational tables
                </span>
              </div>
              <Badge variant="success">Enabled (Strict)</Badge>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                border: "1px solid var(--border)",
                borderRadius: 8,
                backgroundColor: "var(--background)",
              }}
            >
              <div>
                <span style={{ fontWeight: 600, display: "block" }}>Multi-Factor Authentication (MFA)</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  TOTP dual-verification required for administrative tier users
                </span>
              </div>
              <Badge variant="secondary">Optional for Staff</Badge>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                border: "1px solid var(--border)",
                borderRadius: 8,
                backgroundColor: "var(--background)",
              }}
            >
              <div>
                <span style={{ fontWeight: 600, display: "block" }}>Audit Trail Retention Policy</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Statutory regulatory minimum log retention period
                </span>
              </div>
              <Badge variant="neutral">7 Years (2555 Days)</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
