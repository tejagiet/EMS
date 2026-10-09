import { verifyPortalAccess } from "@/lib/auth/session";
import { getOnboardingCases, getOnboardingTemplates } from "@/lib/data/onboarding";
import { OnboardingClient } from "@/components/onboarding/OnboardingClient";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Employee Onboarding | EMS HR Portal",
};

export default async function OnboardingPage() {
  const context = await verifyPortalAccess("hr_manager");
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
    <div className="space-y-6">
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
