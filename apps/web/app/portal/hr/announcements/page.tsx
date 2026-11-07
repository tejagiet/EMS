import { verifyPortalAccess } from "@/lib/auth/session";
import { getAnnouncements } from "@/lib/data/announcements";
import { AnnouncementsClient } from "@/components/announcements/AnnouncementsClient";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Company Announcements | EMS HR Portal",
};

export default async function AnnouncementsPage() {
  const context = await verifyPortalAccess("hr_manager", {
    permission: "organization.read",
  });
  const orgId = context.activeOrganization?.id ?? "";

  const supabase = await createClient();
  const [announcements, deptRes, branchRes] = await Promise.all([
    getAnnouncements(orgId, context.userId),
    supabase.from("departments").select("id, name").eq("organization_id", orgId),
    supabase.from("branches").select("id, name").eq("organization_id", orgId),
  ]);

  return (
    <div className="space-y-6">
      <AnnouncementsClient
        initialAnnouncements={announcements}
        departments={deptRes.data ?? []}
        branches={branchRes.data ?? []}
        organizationId={orgId}
        currentUserId={context.userId}
      />
    </div>
  );
}
