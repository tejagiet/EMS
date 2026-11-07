import { verifyPortalAccess } from "@/lib/auth/session";
import { getOnboardingCases, getOnboardingTemplates } from "@/lib/data/onboarding";
import { OnboardingClient } from "@/components/onboarding/OnboardingClient";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "New Hire Onboarding Hand-off | Recruitment Portal",
};

export default async function RecruitmentOnboardingPage() {
  const context = await verifyPortalAccess("recruitment_manager", {
    allowRoles: ["org_admin"],
    permission: "recruitment.read",
  });
  const orgId = context.activeOrganization?.id ?? "";

  const supabase = await createClient();
  const [cases, templates, empRes, deptRes, desigRes, branchRes, profRes] = await Promise.all([
    getOnboardingCases(orgId),
    getOnboardingTemplates(orgId),
    supabase.from("employees").select("id, employee_code, profile_id").eq("organization_id", orgId),
    supabase.from("departments").select("id, name").eq("organization_id", orgId),
    supabase.from("designations").select("id, name").eq("organization_id", orgId),
    supabase.from("branches").select("id, name").eq("organization_id", orgId),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const profMap = new Map((profRes.data ?? []).map((p) => [p.id, p.full_name]));
  const employeeOptions = (empRes.data ?? []).map((e) => ({
    id: e.id,
    name: `${e.profile_id ? profMap.get(e.profile_id) ?? "Employee" : "Employee"} (${e.employee_code})`,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          New Hire Onboarding Handoff
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Initialize induction checklists, assign institutional assets, and complete orientation milestones for hired talent.
        </p>
      </div>

      <OnboardingClient
        initialCases={cases}
        templates={templates}
        employees={employeeOptions}
        departments={deptRes.data ?? []}
        designations={desigRes.data ?? []}
        branches={branchRes.data ?? []}
        organizationId={orgId}
        currentUserId={context.userId}
      />
    </div>
  );
}
