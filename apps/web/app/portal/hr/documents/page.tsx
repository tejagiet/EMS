import { verifyPortalAccess } from "@/lib/auth/session";
import { getDocuments } from "@/lib/data/documents";
import { DocumentsClient } from "@/components/documents/DocumentsClient";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Employee Documents | EMS HR Portal",
};

export default async function DocumentsPage() {
  const context = await verifyPortalAccess("hr_manager", {
    permission: "document.read",
  });
  const orgId = context.activeOrganization?.id ?? "";

  const supabase = await createClient();
  const [documents, empRes, profRes] = await Promise.all([
    getDocuments(orgId),
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
      <DocumentsClient
        initialDocuments={documents}
        employees={employeeOptions}
        organizationId={orgId}
        currentUserId={context.userId}
      />
    </div>
  );
}
