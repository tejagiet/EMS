"use server";

import { revalidatePath } from "next/cache";
import { verifyPortalAccess } from "../auth/session";
import {
  jobPostingSchema,
  candidateCreateSchema,
  candidateStageTransitionSchema,
  interviewScheduleSchema,
  interviewFeedbackSchema,
  jobOfferCreateSchema,
  jobOfferDecisionSchema,
  hireCandidateSchema,
} from "@ems/validation";
import {
  upsertJobPosting,
  createCandidate,
  transitionCandidateStage,
  scheduleInterview,
  recordInterviewFeedback,
  createJobOffer,
  processJobOfferDecision,
  hireCandidateToEmployee,
  exportRecruitmentCsv,
  getCandidateDetails,
} from "./recruitment";
import type { CandidateStage, Interview, JobOffer } from "@ems/types";
import {
  serializeCandidateDetails,
  parseCandidateDetails,
  type CandidateEmployeeDetails,
} from "./candidate-details";
import { setEmployeePasswordAction } from "./credentials";
import { createAdminClient } from "@/lib/supabase/admin";

export interface RecruitmentActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  data?: unknown;
}

/**
 * 1. Upsert Job Posting Action
 */
export async function upsertJobPostingAction(
  formData: FormData
): Promise<RecruitmentActionResult> {
  const context = await verifyPortalAccess("recruitment_manager", {
    allowRoles: ["org_admin", "super_admin"],
  });
  if (!context.activeOrganization) {
    return { success: false, error: "Active organization context required." };
  }

  const id = formData.get("id")?.toString() || undefined;
  const rawData = {
    title: formData.get("title")?.toString() || "",
    code: formData.get("code")?.toString() || "",
    departmentId: formData.get("departmentId")?.toString() || null,
    designationId: formData.get("designationId")?.toString() || null,
    hiringManagerId: formData.get("hiringManagerId")?.toString() || null,
    description: formData.get("description")?.toString() || "",
    requirements: formData.get("requirements")?.toString() || null,
    location: formData.get("location")?.toString() || "On-site",
    employmentType: (formData.get("employmentType")?.toString() || "full_time") as
      | "full_time"
      | "part_time"
      | "contract"
      | "intern"
      | "probation",
    vacancyCount: Number(formData.get("vacancyCount") || 1),
    minSalary: formData.get("minSalary") ? Number(formData.get("minSalary")) : null,
    maxSalary: formData.get("maxSalary") ? Number(formData.get("maxSalary")) : null,
    status: (formData.get("status")?.toString() || "published") as
      | "draft"
      | "published"
      | "closed"
      | "on_hold",
  };

  const validation = jobPostingSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string") fieldErrors[field] = issue.message;
    }
    return { success: false, error: "Validation failed.", fieldErrors };
  }

  const result = await upsertJobPosting(context.activeOrganization.id, {
    id: id || undefined,
    title: validation.data.title,
    code: validation.data.code,
    departmentId: validation.data.departmentId ?? null,
    designationId: validation.data.designationId ?? null,
    hiringManagerId: validation.data.hiringManagerId ?? null,
    description: validation.data.description,
    requirements: validation.data.requirements ?? null,
    location: validation.data.location,
    employmentType: validation.data.employmentType,
    vacancyCount: validation.data.vacancyCount,
    minSalary: validation.data.minSalary ?? null,
    maxSalary: validation.data.maxSalary ?? null,
    status: validation.data.status,
  });

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to save job posting." };
  }

  revalidatePath("/portal/recruitment");
  return { success: true };
}

/**
 * 2. Create Candidate Action
 */
export async function createCandidateAction(
  formData: FormData
): Promise<RecruitmentActionResult> {
  const context = await verifyPortalAccess("recruitment_manager", {
    allowRoles: ["org_admin", "super_admin"],
  });
  if (!context.activeOrganization) {
    return { success: false, error: "Active organization context required." };
  }

  const rawData = {
    jobPostingId: formData.get("jobPostingId")?.toString() || "",
    firstName: formData.get("firstName")?.toString() || "",
    lastName: formData.get("lastName")?.toString() || "",
    email: formData.get("email")?.toString() || "",
    phone: formData.get("phone")?.toString() || null,
    notes: formData.get("notes")?.toString() || null,
    source: formData.get("source")?.toString() || "direct",
  };

  const validation = candidateCreateSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string") fieldErrors[field] = issue.message;
    }
    return { success: false, error: "Validation failed.", fieldErrors };
  }

  // Extract complete employee details for end-to-end recruitment onboarding
  const extendedDetails: CandidateEmployeeDetails = {
    dateOfBirth: formData.get("dateOfBirth")?.toString() || undefined,
    gender: formData.get("gender")?.toString() || undefined,
    maritalStatus: formData.get("maritalStatus")?.toString() || undefined,
    bloodGroup: formData.get("bloodGroup")?.toString() || undefined,
    addressLine1: formData.get("addressLine1")?.toString() || undefined,
    addressLine2: formData.get("addressLine2")?.toString() || undefined,
    city: formData.get("city")?.toString() || undefined,
    state: formData.get("state")?.toString() || undefined,
    postalCode: formData.get("postalCode")?.toString() || undefined,
    country: formData.get("country")?.toString() || "India",
    emergencyContactName: formData.get("emergencyContactName")?.toString() || undefined,
    emergencyContactRelationship: formData.get("emergencyContactRelationship")?.toString() || undefined,
    emergencyContactPhone: formData.get("emergencyContactPhone")?.toString() || undefined,
    panNumber: formData.get("panNumber")?.toString() || undefined,
    aadhaarNumber: formData.get("aadhaarNumber")?.toString() || undefined,
    highestQualification: formData.get("highestQualification")?.toString() || undefined,
    university: formData.get("university")?.toString() || undefined,
    yearOfPassing: formData.get("yearOfPassing")?.toString() || undefined,
    experienceYears: formData.get("experienceYears")?.toString() || undefined,
    currentCompany: formData.get("currentCompany")?.toString() || undefined,
    currentDesignation: formData.get("currentDesignation")?.toString() || undefined,
    expectedSalary: formData.get("expectedSalary")?.toString() || undefined,
    noticePeriodDays: formData.get("noticePeriodDays")?.toString() || undefined,
    setupPassword: formData.get("setupPassword")?.toString() || "Welcome@EMS2026",
    additionalNotes: rawData.notes || undefined,
  };

  const finalNotes = serializeCandidateDetails(extendedDetails, rawData.notes || "");

  const result = await createCandidate(context.activeOrganization.id, {
    jobPostingId: validation.data.jobPostingId,
    firstName: validation.data.firstName,
    lastName: validation.data.lastName,
    email: validation.data.email,
    phone: validation.data.phone ?? null,
    notes: finalNotes,
    source: validation.data.source,
  });

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to create candidate." };
  }

  revalidatePath("/portal/recruitment");
  return { success: true, data: { candidateId: result.candidateId } };
}

/**
 * 3. Transition Candidate Stage Action
 */
export async function transitionCandidateStageAction(
  formData: FormData
): Promise<RecruitmentActionResult> {
  const context = await verifyPortalAccess("recruitment_manager", {
    allowRoles: ["org_admin", "super_admin"],
  });
  if (!context.profile) {
    return { success: false, error: "Profile context required." };
  }

  const rawData = {
    candidateId: formData.get("candidateId")?.toString() || "",
    toStage: formData.get("toStage")?.toString() as CandidateStage,
    notes: formData.get("notes")?.toString() || null,
  };

  const validation = candidateStageTransitionSchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, error: "Invalid stage transition payload." };
  }

  const result = await transitionCandidateStage(
    validation.data.candidateId,
    validation.data.toStage,
    context.profile.id,
    validation.data.notes ?? undefined
  );

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to transition stage." };
  }

  revalidatePath("/portal/recruitment");
  return { success: true };
}

/**
 * 4. Schedule Interview Action
 */
export async function scheduleInterviewAction(
  formData: FormData
): Promise<RecruitmentActionResult> {
  const context = await verifyPortalAccess("recruitment_manager", {
    allowRoles: ["org_admin", "super_admin"],
  });
  if (!context.activeOrganization) {
    return { success: false, error: "Organization context required." };
  }

  const rawData = {
    candidateId: formData.get("candidateId")?.toString() || "",
    jobPostingId: formData.get("jobPostingId")?.toString() || "",
    interviewType: (formData.get("interviewType")?.toString() || "technical") as Interview["interviewType"],
    scheduledAt: formData.get("scheduledAt")?.toString() || "",
    durationMinutes: Number(formData.get("durationMinutes") || 45),
    interviewerName: formData.get("interviewerName")?.toString() || "",
  };

  const validation = interviewScheduleSchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, error: "Invalid interview schedule parameters." };
  }

  const result = await scheduleInterview(context.activeOrganization.id, {
    candidateId: validation.data.candidateId,
    jobPostingId: validation.data.jobPostingId,
    interviewType: validation.data.interviewType,
    scheduledAt: validation.data.scheduledAt,
    durationMinutes: validation.data.durationMinutes,
    interviewerName: validation.data.interviewerName,
  });

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to schedule interview." };
  }

  revalidatePath("/portal/recruitment");
  return { success: true };
}

/**
 * 5. Record Interview Feedback Action
 */
export async function recordInterviewFeedbackAction(
  formData: FormData
): Promise<RecruitmentActionResult> {
  await verifyPortalAccess("recruitment_manager", {
    allowRoles: ["org_admin", "super_admin"],
  });

  const rawData = {
    interviewId: formData.get("interviewId")?.toString() || "",
    status: (formData.get("status")?.toString() || "completed") as Interview["status"],
    rating: formData.get("rating") ? Number(formData.get("rating")) : null,
    feedback: formData.get("feedback")?.toString() || null,
    recommendation: (formData.get("recommendation")?.toString() || null) as Interview["recommendation"],
  };

  const validation = interviewFeedbackSchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, error: "Invalid interview feedback data." };
  }

  const result = await recordInterviewFeedback(validation.data.interviewId, {
    status: validation.data.status,
    rating: validation.data.rating ?? null,
    feedback: validation.data.feedback ?? null,
    recommendation: validation.data.recommendation ?? null,
  });

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to save feedback." };
  }

  revalidatePath("/portal/recruitment");
  return { success: true };
}

/**
 * 6. Create Job Offer Action
 */
export async function createJobOfferAction(
  formData: FormData
): Promise<RecruitmentActionResult> {
  const context = await verifyPortalAccess("recruitment_manager", {
    allowRoles: ["org_admin", "super_admin"],
  });
  if (!context.activeOrganization) {
    return { success: false, error: "Organization context required." };
  }

  const rawData = {
    candidateId: formData.get("candidateId")?.toString() || "",
    jobPostingId: formData.get("jobPostingId")?.toString() || "",
    designationId: formData.get("designationId")?.toString() || null,
    departmentId: formData.get("departmentId")?.toString() || null,
    offeredSalary: Number(formData.get("offeredSalary") || 0),
    joiningDate: formData.get("joiningDate")?.toString() || "",
    notes: formData.get("notes")?.toString() || null,
  };

  const validation = jobOfferCreateSchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, error: "Invalid job offer payload." };
  }

  const result = await createJobOffer(context.activeOrganization.id, {
    candidateId: validation.data.candidateId,
    jobPostingId: validation.data.jobPostingId,
    designationId: validation.data.designationId ?? null,
    departmentId: validation.data.departmentId ?? null,
    offeredSalary: validation.data.offeredSalary,
    joiningDate: validation.data.joiningDate,
    notes: validation.data.notes ?? null,
  });

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to create offer." };
  }

  revalidatePath("/portal/recruitment");
  return { success: true };
}

/**
 * 7. Process Job Offer Decision Action
 */
export async function processJobOfferDecisionAction(
  formData: FormData
): Promise<RecruitmentActionResult> {
  await verifyPortalAccess("recruitment_manager", {
    allowRoles: ["org_admin", "super_admin"],
  });

  const rawData = {
    offerId: formData.get("offerId")?.toString() || "",
    status: formData.get("status")?.toString() as JobOffer["status"],
    notes: formData.get("notes")?.toString() || null,
  };

  const validation = jobOfferDecisionSchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, error: "Invalid offer decision payload." };
  }

  const result = await processJobOfferDecision(
    validation.data.offerId,
    validation.data.status,
    validation.data.notes ?? undefined
  );

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to update offer." };
  }

  revalidatePath("/portal/recruitment");
  return { success: true };
}

/**
 * 8. Hire Candidate and Handoff to Employee Onboarding Action (Atomic & Idempotent)
 */
export async function hireCandidateAction(
  formData: FormData
): Promise<RecruitmentActionResult> {
  const context = await verifyPortalAccess("recruitment_manager", {
    allowRoles: ["org_admin", "super_admin"],
  });
  if (!context.profile) {
    return { success: false, error: "Profile context required." };
  }

  const rawData = {
    candidateId: formData.get("candidateId")?.toString() || "",
    branchId: formData.get("branchId")?.toString() || null,
    notes: formData.get("notes")?.toString() || null,
  };

  const validation = hireCandidateSchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, error: "Invalid hiring parameters." };
  }

  const result = await hireCandidateToEmployee(
    validation.data.candidateId,
    validation.data.branchId ?? null,
    context.profile.id,
    validation.data.notes ?? undefined
  );

  if (!result.success) {
    return { success: false, error: result.error ?? "Hiring handoff failed." };
  }

  // End-to-end transfer of candidate application details directly to new employee record
  if (result.employeeId) {
    try {
      const adminClient = createAdminClient();
      const { data: cand } = await adminClient
        .from("candidates")
        .select("notes, first_name, last_name, email, phone")
        .eq("id", validation.data.candidateId)
        .single();

      if (cand) {
        const details = parseCandidateDetails(cand.notes);
        await adminClient
          .from("employees")
          .update({
            address_line1: details.addressLine1 || null,
            address_line2: details.addressLine2 || null,
            city: details.city || null,
            state: details.state || null,
            postal_code: details.postalCode || null,
            country: details.country || "India",
            emergency_contact_name: details.emergencyContactName || null,
            emergency_contact_relationship: details.emergencyContactRelationship || null,
            emergency_contact_phone: details.emergencyContactPhone || null,
          })
          .eq("id", result.employeeId);

        // Provision portal access password so employee can login and admin can view credentials
        const passwordToSet = details.setupPassword || "Welcome@EMS2026";
        await setEmployeePasswordAction(result.employeeId, passwordToSet);
      }
    } catch (transferErr) {
      console.warn("[hireCandidateAction] Extended details transfer warning:", transferErr);
    }
  }

  revalidatePath("/portal/recruitment");
  revalidatePath("/portal/hr");
  revalidatePath("/portal/hr/employees");
  return {
    success: true,
    data: {
      employeeId: result.employeeId,
      employeeCode: result.employeeCode,
    },
  };
}

/**
 * 9. Export Recruitment Pipeline CSV Action
 */
export async function exportRecruitmentCsvAction(): Promise<string> {
  const context = await verifyPortalAccess("recruitment_manager", {
    allowRoles: ["org_admin", "super_admin"],
  });
  if (!context.activeOrganization) throw new Error("Active organization required.");
  return exportRecruitmentCsv(context.activeOrganization.id);
}

/**
 * 10. Get Candidate Details Action
 */
export async function getCandidateDetailsAction(candidateId: string) {
  await verifyPortalAccess("recruitment_manager", {
    allowRoles: ["org_admin", "super_admin"],
  });
  return getCandidateDetails(candidateId);
}
