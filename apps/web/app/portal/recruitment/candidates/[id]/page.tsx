import { verifyPortalAccess } from "@/lib/auth/session";
import { getCandidateDetails, getJobPostings } from "@/lib/data/recruitment";
import { getBranchesList } from "@/lib/data/employees";
import { CandidateProfilePageClient } from "@/components/recruitment/CandidateProfilePageClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Candidate Profile & Onboarding | Recruitment Portal",
};

interface CandidateProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function CandidateProfilePage({
  params,
}: CandidateProfilePageProps) {
  const context = await verifyPortalAccess("recruitment_manager", {
    allowRoles: ["org_admin"],
    permission: "recruitment.read",
  });

  const { id } = await params;
  const orgId = context.activeOrganization?.id ?? "";
  const canWrite = context.permissions.includes("recruitment.write");

  const [details, postings, branches] = await Promise.all([
    getCandidateDetails(id),
    getJobPostings(orgId),
    getBranchesList(orgId),
  ]);

  if (!details.candidate) {
    redirect("/portal/recruitment/candidates");
  }

  return (
    <CandidateProfilePageClient
      candidate={details.candidate}
      history={details.history}
      interviews={details.interviews}
      offers={details.offers}
      jobPostings={postings}
      branches={branches}
      canWrite={canWrite}
    />
  );
}
