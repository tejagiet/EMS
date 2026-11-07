import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import type {
  OnboardingCase,
  OnboardingTask,
  OnboardingChecklistTemplate,
  OnboardingStatus,
} from "@ems/types";

function sanitizeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  let str = String(val).replace(/"/g, '""');
  if (/^[=\+\-\@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str}"`;
}

interface RawOnboardingCase {
  id: string;
  organization_id: string;
  employee_id: string;
  candidate_id: string | null;
  joining_date: string;
  department_id: string | null;
  designation_id: string | null;
  branch_id: string | null;
  reporting_manager_id: string | null;
  status: OnboardingStatus;
  notes: string | null;
  created_by: string | null;
  completed_at: string | null;
  completed_by: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface RawOnboardingTask {
  id: string;
  organization_id: string;
  case_id: string;
  title: string;
  description: string | null;
  category: OnboardingTask["category"];
  assigned_role: OnboardingTask["assignedRole"];
  assigned_to: string | null;
  due_date: string | null;
  is_required: boolean;
  status: OnboardingTask["status"];
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch onboarding cases with employee names, progress percent, and task counts
 */
export async function getOnboardingCases(
  orgId: string,
  statusFilter?: OnboardingStatus
): Promise<OnboardingCase[]> {
  const supabase = await createClient();

  let query = supabase
    .from("onboarding_cases")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: rawCases, error } = await query;
  if (error || !rawCases) return [];

  const [empRes, deptRes, desigRes, branchRes, taskRes] = await Promise.all([
    supabase.from("employees").select("id, employee_code, profile_id").eq("organization_id", orgId),
    supabase.from("departments").select("id, name").eq("organization_id", orgId),
    supabase.from("designations").select("id, name").eq("organization_id", orgId),
    supabase.from("branches").select("id, name").eq("organization_id", orgId),
    supabase.from("onboarding_tasks").select("id, case_id, is_required, status").eq("organization_id", orgId),
  ]);

  const profileRes = await supabase.from("profiles").select("id, full_name");
  const profileMap = new Map((profileRes.data ?? []).map((p) => [p.id, p.full_name]));
  const deptMap = new Map((deptRes.data ?? []).map((d) => [d.id, d.name]));
  const desigMap = new Map((desigRes.data ?? []).map((d) => [d.id, d.name]));
  const branchMap = new Map((branchRes.data ?? []).map((b) => [b.id, b.name]));

  const empMap = new Map(
    (empRes.data ?? []).map((e) => [
      e.id,
      {
        code: e.employee_code,
        name: (e.profile_id ? profileMap.get(e.profile_id) : null) ?? `Employee ${e.employee_code}`,
      },
    ])
  );

  const taskList = (taskRes.data as { id: string; case_id: string; is_required: boolean; status: string }[] | null) ?? [];
  const tasksByCase = new Map<string, { total: number; completed: number }>();

  for (const t of taskList) {
    const cur = tasksByCase.get(t.case_id) ?? { total: 0, completed: 0 };
    cur.total += 1;
    if (t.status === "completed") cur.completed += 1;
    tasksByCase.set(t.case_id, cur);
  }

  return (rawCases as RawOnboardingCase[]).map((c) => {
    const emp = empMap.get(c.employee_id);
    const mgr = c.reporting_manager_id ? empMap.get(c.reporting_manager_id) : undefined;
    const taskStats = tasksByCase.get(c.id) ?? { total: 0, completed: 0 };
    const pct = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;

    return {
      id: c.id,
      organizationId: c.organization_id,
      employeeId: c.employee_id,
      candidateId: c.candidate_id,
      joiningDate: c.joining_date,
      departmentId: c.department_id,
      designationId: c.designation_id,
      branchId: c.branch_id,
      reportingManagerId: c.reporting_manager_id,
      status: c.status,
      notes: c.notes,
      createdBy: c.created_by,
      completedAt: c.completed_at,
      completedBy: c.completed_by,
      cancelledAt: c.cancelled_at,
      cancelledBy: c.cancelled_by,
      cancellationReason: c.cancellation_reason,
      employeeName: emp?.name ?? "Unknown",
      employeeCode: emp?.code ?? "EMP",
      departmentName: c.department_id ? deptMap.get(c.department_id) : undefined,
      designationName: c.designation_id ? desigMap.get(c.designation_id) : undefined,
      branchName: c.branch_id ? branchMap.get(c.branch_id) : undefined,
      managerName: mgr?.name,
      totalTasks: taskStats.total,
      completedTasks: taskStats.completed,
      progressPercent: pct,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    };
  });
}

/**
 * Fetch detailed single case with all checklist tasks
 */
export async function getOnboardingCaseDetails(caseId: string) {
  const supabase = await createClient();

  const [caseRes, tasksRes, profRes] = await Promise.all([
    supabase.from("onboarding_cases").select("*").eq("id", caseId).single(),
    supabase.from("onboarding_tasks").select("*").eq("case_id", caseId).order("created_at", { ascending: true }),
    supabase.from("profiles").select("id, full_name"),
  ]);

  if (!caseRes.data) return { caseItem: null, tasks: [] };

  const profMap = new Map((profRes.data ?? []).map((p) => [p.id, p.full_name]));
  const todayStr = new Date().toISOString().slice(0, 10);

  const tasks: OnboardingTask[] = ((tasksRes.data as RawOnboardingTask[] | null) ?? []).map((t) => ({
    id: t.id,
    organizationId: t.organization_id,
    caseId: t.case_id,
    title: t.title,
    description: t.description,
    category: t.category,
    assignedRole: t.assigned_role,
    assignedTo: t.assigned_to,
    assigneeName: t.assigned_to ? profMap.get(t.assigned_to) ?? undefined : undefined,
    dueDate: t.due_date,
    isRequired: t.is_required,
    status: t.status,
    completedAt: t.completed_at,
    completedBy: t.completed_by,
    completedByName: t.completed_by ? profMap.get(t.completed_by) ?? undefined : undefined,
    notes: t.notes,
    isOverdue: Boolean(t.due_date && t.due_date < todayStr && t.status !== "completed"),
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));

  return { caseItem: caseRes.data as RawOnboardingCase, tasks };
}

/**
 * Fetch available onboarding checklist templates
 */
export async function getOnboardingTemplates(orgId: string): Promise<OnboardingChecklistTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("onboarding_checklist_templates")
    .select("*")
    .eq("organization_id", orgId)
    .eq("is_active", true);

  if (error || !data) return [];

  return data.map((t) => ({
    id: t.id,
    organizationId: t.organization_id,
    name: t.name,
    description: t.description,
    isDefault: t.is_default,
    items: t.items ?? [],
    isActive: t.is_active,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));
}

/**
 * Create onboarding case using transactional database RPC
 */
export async function createOnboardingCase(
  orgId: string,
  employeeId: string,
  joiningDate: string,
  deptId?: string | null,
  desigId?: string | null,
  branchId?: string | null,
  managerId?: string | null,
  templateId?: string | null,
  createdBy?: string | null,
  candidateId?: string | null
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("create_onboarding_case", {
    p_org_id: orgId,
    p_employee_id: employeeId,
    p_candidate_id: candidateId ?? null,
    p_joining_date: joiningDate,
    p_dept_id: deptId ?? null,
    p_desig_id: desigId ?? null,
    p_branch_id: branchId ?? null,
    p_manager_id: managerId ?? null,
    p_template_id: templateId ?? null,
    p_created_by: createdBy ?? null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; case_id?: string; error?: string };
  return {
    success: result.success,
    caseId: result.case_id,
    error: result.error,
  };
}

/**
 * Update individual onboarding task status
 */
export async function updateOnboardingTask(
  taskId: string,
  status: OnboardingTask["status"],
  actorId: string,
  notes?: string | null
) {
  const supabase = createAdminClient();

  const isCompleted = status === "completed";
  const { error } = await supabase
    .from("onboarding_tasks")
    .update({
      status,
      completed_at: isCompleted ? new Date().toISOString() : null,
      completed_by: isCompleted ? actorId : null,
      notes: notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Complete onboarding case using transactional database RPC
 */
export async function completeOnboardingCase(
  caseId: string,
  actorId: string,
  notes?: string | null
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("complete_onboarding_case", {
    p_case_id: caseId,
    p_actor_id: actorId,
    p_notes: notes ?? null,
  });

  if (error) return { success: false, error: error.message };
  const res = data as { success: boolean; error?: string };
  return { success: res.success, error: res.error };
}

/**
 * Formula-injection safe CSV export for onboarding cases
 */
export async function exportOnboardingCsv(orgId: string): Promise<string> {
  const cases = await getOnboardingCases(orgId);

  const headers = [
    "Case ID",
    "Employee Code",
    "Employee Name",
    "Department",
    "Designation",
    "Joining Date",
    "Status",
    "Total Tasks",
    "Completed Tasks",
    "Progress (%)",
  ];

  const rows = cases.map((c) => [
    sanitizeCsv(c.id),
    sanitizeCsv(c.employeeCode),
    sanitizeCsv(c.employeeName),
    sanitizeCsv(c.departmentName ?? "N/A"),
    sanitizeCsv(c.designationName ?? "N/A"),
    sanitizeCsv(c.joiningDate),
    sanitizeCsv(c.status),
    sanitizeCsv(c.totalTasks ?? 0),
    sanitizeCsv(c.completedTasks ?? 0),
    sanitizeCsv(`${c.progressPercent ?? 0}%`),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}
