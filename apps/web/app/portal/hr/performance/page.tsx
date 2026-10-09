import { verifyPortalAccess } from "@/lib/auth/session";
import { getPerformanceCycles, getPerformanceReviews, getPerformanceGoals } from "@/lib/data/performance";
import { PerformanceClient } from "@/components/performance/PerformanceClient";

export const metadata = {
  title: "Performance & Appraisals | EMS HR Portal",
};

export default async function PerformancePage() {
  const context = await verifyPortalAccess("hr_manager");
  const orgId = context.activeOrganization?.id ?? "";

  const [cycles, reviews, goals] = await Promise.all([
    getPerformanceCycles(orgId),
    getPerformanceReviews(orgId),
    getPerformanceGoals(orgId),
  ]);

  return (
    <div className="space-y-6">
      <PerformanceClient
        cycles={cycles}
        reviews={reviews}
        goals={goals}
        organizationId={orgId}
        currentUserId={context.userId}
      />
    </div>
  );
}
