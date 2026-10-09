import { verifyPortalAccess } from "@/lib/auth/session";
import { getOffboardingCases } from "@/lib/data/offboarding";
import { OffboardingClient } from "@/components/offboarding/OffboardingClient";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Employee Offboarding & Exits | EMS HR Portal",
};

export default async function OffboardingPage() {
  const context = await verifyPortalAccess("hr_manager");
  const orgId = context.activeOrganization?.id ?? "";

  const supabase = await createClient();
  const [cases, empRes, profRes] = await Promise.all([
    getOffboardingCases(orgId),
    supabase.from("employees").select("id, employee_code, profile_id").eq("organization_id", orgId),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const profMap = new Map((profRes.data ?? []).map((p) => [p.id, p.full_name]));
  const employeeOptions = (empRes.data ?? []).map((e) => ({
    id: e.id,
    name: `${e.profile_id ? profMap.get(e.profile_id) ?? "Employee" : "Employee"} (${e.employee_code})`,
  }));

  return (
    <div className="space-y-6">
      <OffboardingClient
        initialCases={cases}
        employees={employeeOptions}
        organizationId={orgId}
        currentUserId={context.userId}
      />
    </div>
  );
}
