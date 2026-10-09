import { createClient } from "../supabase/server";
import type {
  PerformanceCycle,
  PerformanceGoal,
  PerformanceReview,
  PerformanceCycleStatus,
  PerformanceGoalStatus,
  PerformanceReviewStatus,
} from "@ems/types";

function sanitizeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  let str = String(val).replace(/"/g, '""');
  if (/^[=\+\-\@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str}"`;
}

interface RawCycle {
  id: string;
  organization_id: string;
  title: string;
  cycle_type: string;
  start_date: string;
  end_date: string;
  status: PerformanceCycleStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface RawGoal {
  id: string;
  organization_id: string;
  cycle_id: string;
  employee_id: string;
  title: string;
  description: string | null;
  category: string;
  weight: number;
  target_value: string | null;
  current_value: string | null;
  status: PerformanceGoalStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

interface RawReview {
  id: string;
  organization_id: string;
  cycle_id: string;
  employee_id: string;
  reviewer_id: string;
  self_rating: number | null;
  self_comments: string | null;
  self_submitted_at: string | null;
  manager_rating: number | null;
  manager_comments: string | null;
  manager_submitted_at: string | null;
  final_rating: number | null;
  final_comments: string | null;
  status: PerformanceReviewStatus;
  is_locked: boolean;
  acknowledged_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ExtendedPerformanceGoal = PerformanceGoal & {
  category?: string;
  targetValue?: string | null;
  currentValue?: string | null;
};

export type ExtendedPerformanceReview = PerformanceReview & {
  selfComments?: string | null;
  managerComments?: string | null;
  finalRating?: number | null;
  finalComments?: string | null;
};

/**
 * Fetch performance cycles for organization
 */
export async function getPerformanceCycles(orgId: string): Promise<PerformanceCycle[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("performance_cycles")
    .select("*")
    .eq("organization_id", orgId)
    .order("start_date", { ascending: false });

  if (error || !data) return [];

  return (data as RawCycle[]).map((c) => ({
    id: c.id,
    organizationId: c.organization_id,
    title: c.title,
    startDate: c.start_date,
    endDate: c.end_date,
    status: c.status,
    description: c.description,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));
}

/**
 * Fetch employee goals for a cycle or employee
 */
export async function getPerformanceGoals(orgId: string, cycleId?: string, employeeId?: string): Promise<ExtendedPerformanceGoal[]> {
  const supabase = await createClient();

  let query = supabase
    .from("performance_goals")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (cycleId) query = query.eq("cycle_id", cycleId);
  if (employeeId) query = query.eq("employee_id", employeeId);

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as RawGoal[]).map((g) => ({
    id: g.id,
    organizationId: g.organization_id,
    cycleId: g.cycle_id,
    employeeId: g.employee_id,
    title: g.title,
    description: g.description,
    category: g.category,
    weight: g.weight,
    progressPercent: 50,
    targetValue: g.target_value,
    currentValue: g.current_value,
    status: g.status,
    createdAt: g.created_at,
    updatedAt: g.updated_at,
  }));
}

/**
 * Fetch reviews for a cycle with employee and reviewer metadata
 */
export async function getPerformanceReviews(orgId: string, cycleId?: string): Promise<ExtendedPerformanceReview[]> {
  const supabase = await createClient();

  let query = supabase
    .from("performance_reviews")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (cycleId) query = query.eq("cycle_id", cycleId);

  const { data: rawReviews, error } = await query;
  if (error || !rawReviews) return [];

  const [empRes, profRes, cycleRes] = await Promise.all([
    supabase.from("employees").select("id, employee_code, profile_id").eq("organization_id", orgId),
    supabase.from("profiles").select("id, full_name"),
    supabase.from("performance_cycles").select("id, title").eq("organization_id", orgId),
  ]);

  const profMap = new Map((profRes.data ?? []).map((p) => [p.id, p.full_name]));
  const cycleMap = new Map((cycleRes.data ?? []).map((c) => [c.id, c.title]));

  const empMap = new Map(
    (empRes.data ?? []).map((e) => [
      e.id,
      (e.profile_id ? profMap.get(e.profile_id) : null) ?? e.employee_code,
    ])
  );

  return (rawReviews as RawReview[]).map((r) => ({
    id: r.id,
    organizationId: r.organization_id,
    cycleId: r.cycle_id,
    cycleTitle: cycleMap.get(r.cycle_id),
    employeeId: r.employee_id,
    employeeName: empMap.get(r.employee_id) ?? "Employee",
    reviewerEmployeeId: r.reviewer_id,
    reviewerName: empMap.get(r.reviewer_id) ?? "Manager",
    selfRating: r.self_rating !== null ? Number(r.self_rating) : null,
    selfComments: r.self_comments,
    selfFeedback: r.self_comments,
    selfSubmittedAt: r.self_submitted_at,
    managerRating: r.manager_rating !== null ? Number(r.manager_rating) : null,
    managerComments: r.manager_comments,
    managerFeedback: r.manager_comments,
    managerSubmittedAt: r.manager_submitted_at,
    finalRating: r.final_rating !== null ? Number(r.final_rating) : null,
    finalComments: r.final_comments,
    status: r.status,
    isLocked: r.is_locked,
    employeeAcknowledged: Boolean(r.acknowledged_at),
    employeeAcknowledgedAt: r.acknowledged_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

/**
 * Submit performance review using transactional RPC with 1.0–5.0 bounds check
 */
export async function submitPerformanceReview(payload: {
  reviewId: string;
  actorId: string;
  stage: "self" | "manager" | "acknowledge";
  rating?: number | null;
  comments?: string | null;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("submit_performance_review", {
    p_review_id: payload.reviewId,
    p_actor_id: payload.actorId,
    p_stage: payload.stage,
    p_rating: payload.rating !== undefined ? payload.rating : null,
    p_comments: payload.comments ?? null,
  });

  if (error) return { success: false, error: error.message };
  const res = data as { success: boolean; error?: string };
  return { success: res.success, error: res.error };
}

/**
 * Formula-injection safe CSV export for reviews
 */
export async function exportReviewsCsv(orgId: string, cycleId?: string): Promise<string> {
  const reviews = await getPerformanceReviews(orgId, cycleId);

  const headers = [
    "Review ID",
    "Cycle",
    "Employee",
    "Reviewer",
    "Self Rating",
    "Manager Rating",
    "Final Rating",
    "Status",
    "Locked",
  ];

  const rows = reviews.map((r) => [
    sanitizeCsv(r.id),
    sanitizeCsv(r.cycleTitle ?? "Cycle"),
    sanitizeCsv(r.employeeName ?? "N/A"),
    sanitizeCsv(r.reviewerName ?? "N/A"),
    sanitizeCsv(r.selfRating != null ? r.selfRating.toFixed(1) : "-"),
    sanitizeCsv(r.managerRating != null ? r.managerRating.toFixed(1) : "-"),
    sanitizeCsv(r.finalRating != null ? r.finalRating.toFixed(1) : "-"),
    sanitizeCsv(r.status),
    sanitizeCsv(r.isLocked ? "Yes" : "No"),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}
