import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { escapeCsvField } from "./employees";
import type {
  JobPosting,
  Candidate,
  CandidateStage,
  CandidateStageHistoryItem,
  Interview,
  JobOffer,
} from "@ems/types";

interface RawJobPosting {
  id: string;
  organization_id: string;
  department_id: string | null;
  designation_id: string | null;
  hiring_manager_id: string | null;
  title: string;
  code: string;
  description: string;
  requirements: string | null;
  location: string;
  employment_type: JobPosting["employmentType"];
  vacancy_count: number;
  min_salary: number | null;
  max_salary: number | null;
  status: JobPosting["status"];
  created_at: string;
  updated_at: string;
  departments?: { name: string } | null;
  designations?: { name: string } | null;
  employees?: { first_name: string | null; last_name: string | null; employee_code: string } | null;
  candidates?: { count: number }[];
}

interface RawCandidate {
  id: string;
  organization_id: string;
  job_posting_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  stage: CandidateStage;
  resume_url: string | null;
  notes: string | null;
  source: string;
  created_at: string;
  updated_at: string;
  job_postings?: { title: string; code: string } | null;
}

interface RawStageHistory {
  id: string;
  candidate_id: string;
  organization_id: string;
  from_stage: CandidateStage;
  to_stage: CandidateStage;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

interface RawInterview {
  id: string;
  candidate_id: string;
  organization_id: string;
  job_posting_id: string;
  interview_type: Interview["interviewType"];
  scheduled_at: string;
  duration_minutes: number;
  interviewer_name: string;
  status: Interview["status"];
  rating: number | null;
  feedback: string | null;
  recommendation: Interview["recommendation"];
  created_at: string;
  updated_at: string;
  candidates?: { first_name: string; last_name: string; email: string } | null;
  job_postings?: { title: string } | null;
}

interface RawOffer {
  id: string;
  candidate_id: string;
  organization_id: string;
  job_posting_id: string;
  designation_id: string | null;
  department_id: string | null;
  offered_salary: number;
  joining_date: string;
  status: JobOffer["status"];
  notes: string | null;
  created_at: string;
  updated_at: string;
  candidates?: { first_name: string; last_name: string; email: string } | null;
  job_postings?: { title: string } | null;
  departments?: { name: string } | null;
  designations?: { name: string } | null;
}

/**
 * 1. Get Job Postings
 */
export async function getJobPostings(
  orgId: string,
  status?: string
): Promise<JobPosting[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("job_postings")
    .select(`
      *,
      departments(name),
      designations(name),
      employees!job_postings_hiring_manager_id_fkey(first_name, last_name, employee_code),
      candidates(count)
    `)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data } = await query;
  const list = (data as RawJobPosting[] | null) ?? [];

  return list.map((p) => {
    const mgr = p.employees;
    const mgrName = mgr
      ? `${mgr.first_name ?? ""} ${mgr.last_name ?? ""}`.trim() || `EMP ${mgr.employee_code}`
      : undefined;

    return {
      id: p.id,
      organizationId: p.organization_id,
      departmentId: p.department_id ?? undefined,
      designationId: p.designation_id ?? undefined,
      hiringManagerId: p.hiring_manager_id ?? undefined,
      title: p.title,
      code: p.code,
      description: p.description,
      requirements: p.requirements ?? undefined,
      location: p.location,
      employmentType: p.employment_type,
      vacancyCount: p.vacancy_count,
      minSalary: p.min_salary ? Number(p.min_salary) : undefined,
      maxSalary: p.max_salary ? Number(p.max_salary) : undefined,
      status: p.status,
      departmentName: p.departments?.name,
      designationName: p.designations?.name,
      hiringManagerName: mgrName,
      candidateCount: p.candidates?.[0]?.count ?? 0,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    };
  });
}

/**
 * 2. Upsert Job Posting
 */
export async function upsertJobPosting(
  orgId: string,
  payload: {
    id?: string | undefined;
    title: string;
    code: string;
    departmentId?: string | null | undefined;
    designationId?: string | null | undefined;
    hiringManagerId?: string | null | undefined;
    description: string;
    requirements?: string | null | undefined;
    location?: string | undefined;
    employmentType?: JobPosting["employmentType"] | undefined;
    vacancyCount: number;
    minSalary?: number | null | undefined;
    maxSalary?: number | null | undefined;
    status?: JobPosting["status"] | undefined;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  if (payload.id) {
    const { error } = await supabase
      .from("job_postings")
      .update({
        title: payload.title.trim(),
        code: payload.code.trim().toUpperCase(),
        department_id: payload.departmentId ?? null,
        designation_id: payload.designationId ?? null,
        hiring_manager_id: payload.hiringManagerId ?? null,
        description: payload.description.trim(),
        requirements: payload.requirements ?? null,
        location: payload.location ?? "On-site",
        employment_type: payload.employmentType ?? "full_time",
        vacancy_count: payload.vacancyCount,
        min_salary: payload.minSalary ?? null,
        max_salary: payload.maxSalary ?? null,
        status: payload.status ?? "published",
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", orgId)
      .eq("id", payload.id);

    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("job_postings").insert({
      organization_id: orgId,
      title: payload.title.trim(),
      code: payload.code.trim().toUpperCase(),
      department_id: payload.departmentId ?? null,
      designation_id: payload.designationId ?? null,
      hiring_manager_id: payload.hiringManagerId ?? null,
      description: payload.description.trim(),
      requirements: payload.requirements ?? null,
      location: payload.location ?? "On-site",
      employment_type: payload.employmentType ?? "full_time",
      vacancy_count: payload.vacancyCount,
      min_salary: payload.minSalary ?? null,
      max_salary: payload.maxSalary ?? null,
      status: payload.status ?? "published",
    });

    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 3. Get Candidates
 */
export async function getCandidates(
  orgId: string,
  options?: {
    jobPostingId?: string | undefined;
    stage?: string | undefined;
    search?: string | undefined;
  }
): Promise<Candidate[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("candidates")
    .select("*, job_postings(title, code)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (options?.jobPostingId) {
    query = query.eq("job_posting_id", options.jobPostingId);
  }

  if (options?.stage && options.stage !== "all") {
    query = query.eq("stage", options.stage);
  }

  if (options?.search && options.search.trim() !== "") {
    const term = `%${options.search.trim()}%`;
    query = query.or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`);
  }

  const { data } = await query;
  const list = (data as RawCandidate[] | null) ?? [];

  return list.map((c) => ({
    id: c.id,
    organizationId: c.organization_id,
    jobPostingId: c.job_posting_id,
    firstName: c.first_name,
    lastName: c.last_name,
    fullName: `${c.first_name} ${c.last_name}`.trim(),
    email: c.email,
    phone: c.phone ?? undefined,
    stage: c.stage,
    resumeUrl: c.resume_url ?? undefined,
    notes: c.notes ?? undefined,
    source: c.source,
    jobTitle: c.job_postings?.title,
    jobCode: c.job_postings?.code,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));
}

/**
 * 4. Get Candidate Details (with stage history, interviews, and offers)
 */
export async function getCandidateDetails(
  candidateId: string
): Promise<{
  candidate: Candidate | null;
  history: CandidateStageHistoryItem[];
  interviews: Interview[];
  offers: JobOffer[];
}> {
  const supabase = createAdminClient();

  const { data: cData } = await supabase
    .from("candidates")
    .select("*, job_postings(title, code)")
    .eq("id", candidateId)
    .single();

  if (!cData) return { candidate: null, history: [], interviews: [], offers: [] };

  const rawC = cData as RawCandidate;
  const candidate: Candidate = {
    id: rawC.id,
    organizationId: rawC.organization_id,
    jobPostingId: rawC.job_posting_id,
    firstName: rawC.first_name,
    lastName: rawC.last_name,
    fullName: `${rawC.first_name} ${rawC.last_name}`.trim(),
    email: rawC.email,
    phone: rawC.phone ?? undefined,
    stage: rawC.stage,
    resumeUrl: rawC.resume_url ?? undefined,
    notes: rawC.notes ?? undefined,
    source: rawC.source,
    jobTitle: rawC.job_postings?.title,
    jobCode: rawC.job_postings?.code,
    createdAt: rawC.created_at,
    updatedAt: rawC.updated_at,
  };

  // History
  const { data: hData } = await supabase
    .from("candidate_stage_history")
    .select("*, profiles(full_name)")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: true });

  const rawHist = (hData as RawStageHistory[] | null) ?? [];
  const history: CandidateStageHistoryItem[] = rawHist.map((h) => ({
    id: h.id,
    candidateId: h.candidate_id,
    organizationId: h.organization_id,
    fromStage: h.from_stage,
    toStage: h.to_stage,
    changedBy: h.changed_by ?? undefined,
    notes: h.notes ?? undefined,
    changedByName: h.profiles?.full_name ?? undefined,
    createdAt: h.created_at,
  }));

  // Interviews
  const { data: iData } = await supabase
    .from("interviews")
    .select("*, job_postings(title)")
    .eq("candidate_id", candidateId)
    .order("scheduled_at", { ascending: false });

  const rawInts = (iData as RawInterview[] | null) ?? [];
  const interviews: Interview[] = rawInts.map((i) => ({
    id: i.id,
    candidateId: i.candidate_id,
    organizationId: i.organization_id,
    jobPostingId: i.job_posting_id,
    interviewType: i.interview_type,
    scheduledAt: i.scheduled_at,
    durationMinutes: i.duration_minutes,
    interviewerName: i.interviewer_name,
    status: i.status,
    rating: i.rating ?? undefined,
    feedback: i.feedback ?? undefined,
    recommendation: i.recommendation ?? undefined,
    jobTitle: i.job_postings?.title,
    createdAt: i.created_at,
    updatedAt: i.updated_at,
  }));

  // Offers
  const { data: oData } = await supabase
    .from("job_offers")
    .select("*, departments(name), designations(name)")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });

  const rawOffers = (oData as RawOffer[] | null) ?? [];
  const offers: JobOffer[] = rawOffers.map((o) => ({
    id: o.id,
    candidateId: o.candidate_id,
    organizationId: o.organization_id,
    jobPostingId: o.job_posting_id,
    designationId: o.designation_id ?? undefined,
    departmentId: o.department_id ?? undefined,
    offeredSalary: Number(o.offered_salary),
    joiningDate: o.joining_date,
    status: o.status,
    notes: o.notes ?? undefined,
    departmentName: o.departments?.name,
    designationName: o.designations?.name,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  }));

  return { candidate, history, interviews, offers };
}

/**
 * 5. Create Candidate Application
 */
export async function createCandidate(
  orgId: string,
  payload: {
    jobPostingId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null | undefined;
    notes?: string | null | undefined;
    source?: string | undefined;
  }
): Promise<{ success: boolean; error?: string; candidateId?: string }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("candidates")
    .insert({
      organization_id: orgId,
      job_posting_id: payload.jobPostingId,
      first_name: payload.firstName.trim(),
      last_name: payload.lastName.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone?.trim() ?? null,
      stage: "applied",
      notes: payload.notes?.trim() ?? null,
      source: payload.source ?? "direct",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Candidate has already applied for this position." };
    }
    return { success: false, error: error.message };
  }

  // Record initial stage history
  if (data?.id) {
    await supabase.from("candidate_stage_history").insert({
      candidate_id: data.id,
      organization_id: orgId,
      from_stage: "applied",
      to_stage: "applied",
      notes: "Application submitted.",
    });
  }

  return { success: true, candidateId: data?.id };
}

/**
 * 6. Transition Candidate Pipeline Stage via RPC
 */
export async function transitionCandidateStage(
  candidateId: string,
  toStage: CandidateStage,
  actorId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("transition_candidate_stage", {
    p_candidate_id: candidateId,
    p_to_stage: toStage,
    p_actor_id: actorId,
    p_notes: notes ?? null,
  });

  if (error) return { success: false, error: error.message };

  const result = data as { success: boolean; error?: string };
  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to transition candidate stage." };
  }

  return { success: true };
}

/**
 * 7. Schedule Interview
 */
export async function scheduleInterview(
  orgId: string,
  payload: {
    candidateId: string;
    jobPostingId: string;
    interviewType: Interview["interviewType"];
    scheduledAt: string;
    durationMinutes: number;
    interviewerName: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("interviews").insert({
    organization_id: orgId,
    candidate_id: payload.candidateId,
    job_posting_id: payload.jobPostingId,
    interview_type: payload.interviewType,
    scheduled_at: payload.scheduledAt,
    duration_minutes: payload.durationMinutes,
    interviewer_name: payload.interviewerName.trim(),
    status: "scheduled",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * 8. Record Interview Feedback
 */
export async function recordInterviewFeedback(
  interviewId: string,
  payload: {
    status?: Interview["status"] | undefined;
    rating?: number | null | undefined;
    feedback?: string | null | undefined;
    recommendation?: Interview["recommendation"] | undefined;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("interviews")
    .update({
      status: payload.status ?? "completed",
      rating: payload.rating ?? null,
      feedback: payload.feedback ?? null,
      recommendation: payload.recommendation ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", interviewId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * 9. Create Job Offer
 */
export async function createJobOffer(
  orgId: string,
  payload: {
    candidateId: string;
    jobPostingId: string;
    designationId?: string | null | undefined;
    departmentId?: string | null | undefined;
    offeredSalary: number;
    joiningDate: string;
    notes?: string | null | undefined;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("job_offers").insert({
    organization_id: orgId,
    candidate_id: payload.candidateId,
    job_posting_id: payload.jobPostingId,
    designation_id: payload.designationId ?? null,
    department_id: payload.departmentId ?? null,
    offered_salary: payload.offeredSalary,
    joining_date: payload.joiningDate,
    status: "draft",
    notes: payload.notes ?? null,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * 10. Process Job Offer Decision (Sent, Accepted, Rejected, Withdrawn)
 */
export async function processJobOfferDecision(
  offerId: string,
  status: "sent" | "accepted" | "rejected" | "withdrawn",
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("job_offers")
    .update({
      status,
      notes: notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", offerId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * 11. Call Transactional RPC to Hire Candidate and Handoff to Employee Onboarding
 */
export async function hireCandidateToEmployee(
  candidateId: string,
  branchId: string | null,
  actorId: string,
  notes?: string
): Promise<{
  success: boolean;
  error?: string | undefined;
  employeeId?: string | undefined;
  employeeCode?: string | undefined;
}> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("hire_candidate_to_employee", {
    p_candidate_id: candidateId,
    p_branch_id: branchId ?? null,
    p_actor_id: actorId,
    p_notes: notes ?? null,
  });

  if (error) return { success: false, error: error.message };

  const result = data as {
    success: boolean;
    error?: string;
    employee_id?: string;
    employee_code?: string;
  };

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to hire candidate." };
  }

  return {
    success: true,
    employeeId: result.employee_id,
    employeeCode: result.employee_code,
  };
}

/**
 * 12. Export Candidates Pipeline to Formula-Injection Safe CSV
 */
export async function exportRecruitmentCsv(orgId: string): Promise<string> {
  const candidates = await getCandidates(orgId);

  const headers = [
    "Candidate Name",
    "Email",
    "Phone",
    "Applied Position",
    "Job Code",
    "Current Stage",
    "Source",
    "Applied Date",
  ];

  const rows = candidates.map((c) => [
    escapeCsvField(c.fullName),
    escapeCsvField(c.email),
    escapeCsvField(c.phone ?? ""),
    escapeCsvField(c.jobTitle ?? ""),
    escapeCsvField(c.jobCode ?? ""),
    escapeCsvField(c.stage.toUpperCase()),
    escapeCsvField(c.source),
    escapeCsvField(new Date(c.createdAt).toLocaleDateString("en-GB")),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
}
