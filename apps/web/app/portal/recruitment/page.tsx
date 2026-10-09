import { verifyPortalAccess } from "@/lib/auth/session";
import { PortalShellView } from "../PortalShellView";

export default async function RecruitmentPortalPage() {
  const context = await verifyPortalAccess("recruitment_manager");

  return (
    <PortalShellView
      context={context}
      role="recruitment_manager"
      modules={[
        {
          title: "Job Requisitions & Openings",
          phase: 4,
          description:
            "Post, edit, and publish institutional faculty and corporate job requisitions.",
        },
        {
          title: "Applicant Pipeline & Tracking",
          phase: 4,
          description:
            "Screen applicant resumes, schedule interview panels, and record evaluation rubrics.",
        },
        {
          title: "Offer Generation & Onboarding",
          phase: 4,
          description:
            "Issue formal offer letters, track document verification, and initialize employee profiles.",
        },
      ]}
    />
  );
}
