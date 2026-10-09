import { createClient } from "../supabase/server";
import type { EmployeeTask, TaskPriority, TaskStatus, TaskWorkflowType } from "@ems/types";

function sanitizeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  let str = String(val).replace(/"/g, '""');
  if (/^[=\+\-\@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str}"`;
}

interface RawTask {
  id: string;
  organization_id: string;
  employee_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  completed_at: string | null;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type ExtendedEmployeeTask = EmployeeTask & {
  employeeName?: string;
  category?: string;
};

/**
 * Fetch employee tasks with overdue indicator and employee names
 */
export async function getEmployeeTasks(
  orgId: string,
  employeeId?: string,
  statusFilter?: TaskStatus
): Promise<ExtendedEmployeeTask[]> {
  const supabase = await createClient();

  let query = supabase
    .from("employee_tasks")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (employeeId) query = query.eq("employee_id", employeeId);
  if (statusFilter) query = query.eq("status", statusFilter);

  const { data: rawTasks, error } = await query;
  if (error || !rawTasks) return [];

  const [empRes, profRes] = await Promise.all([
    supabase.from("employees").select("id, employee_code, profile_id").eq("organization_id", orgId),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const profMap = new Map((profRes.data ?? []).map((p) => [p.id, p.full_name]));
  const empMap = new Map(
    (empRes.data ?? []).map((e) => [
      e.id,
      (e.profile_id ? profMap.get(e.profile_id) : null) ?? e.employee_code,
    ])
  );

  const todayStr = new Date().toISOString().slice(0, 10);

  return (rawTasks as RawTask[]).map((t) => ({
    id: t.id,
    organizationId: t.organization_id,
    creatorId: t.created_by ?? t.employee_id,
    assigneeId: t.employee_id,
    relatedEmployeeId: t.employee_id,
    workflowType: "general" as TaskWorkflowType,
    title: t.title,
    description: t.description,
    priority: t.priority,
    status: t.status,
    dueDate: t.due_date,
    completedAt: t.completed_at,
    employeeName: empMap.get(t.employee_id) ?? "Employee",
    assigneeName: empMap.get(t.employee_id) ?? "Employee",
    category: t.category,
    creatorName: t.created_by ? profMap.get(t.created_by) : undefined,
    isOverdue: Boolean(t.due_date && t.due_date < todayStr && t.status !== "completed" && t.status !== "cancelled"),
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));
}

/**
 * Create a new task and log activity
 */
export async function createEmployeeTask(payload: {
  organizationId: string;
  employeeId: string;
  createdBy: string;
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: string | null;
  category?: string;
  tags?: string[];
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employee_tasks")
    .insert({
      organization_id: payload.organizationId,
      employee_id: payload.employeeId,
      created_by: payload.createdBy,
      title: payload.title.trim(),
      description: payload.description ?? null,
      priority: payload.priority ?? "medium",
      status: "open",
      due_date: payload.dueDate ?? null,
      category: payload.category ?? "general",
      tags: payload.tags ?? [],
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  await supabase.from("task_activity_log").insert({
    task_id: data.id,
    organization_id: payload.organizationId,
    actor_id: payload.createdBy,
    action: "created",
    to_status: "open",
    notes: "Task created",
  });

  return { success: true, taskId: data.id };
}

/**
 * Update task status and record audit log
 */
export async function updateEmployeeTaskStatus(
  taskId: string,
  newStatus: TaskStatus,
  actorId: string,
  notes?: string | null
) {
  const supabase = await createClient();

  const isCompleted = newStatus === "completed";
  const { data: task, error: fetchErr } = await supabase
    .from("employee_tasks")
    .select("status, organization_id")
    .eq("id", taskId)
    .single();

  if (fetchErr || !task) return { success: false, error: "Task not found" };

  const { error: updErr } = await supabase
    .from("employee_tasks")
    .update({
      status: newStatus,
      completed_at: isCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (updErr) return { success: false, error: updErr.message };

  await supabase.from("task_activity_log").insert({
    task_id: taskId,
    organization_id: task.organization_id,
    actor_id: actorId,
    action: "status_changed",
    from_status: task.status,
    to_status: newStatus,
    notes: notes ?? null,
  });

  return { success: true };
}

/**
 * Formula-safe CSV export for tasks
 */
export async function exportTasksCsv(orgId: string): Promise<string> {
  const tasks = await getEmployeeTasks(orgId);

  const headers = [
    "Task ID",
    "Title",
    "Employee",
    "Priority",
    "Status",
    "Category",
    "Due Date",
    "Overdue",
  ];

  const rows = tasks.map((t) => [
    sanitizeCsv(t.id),
    sanitizeCsv(t.title),
    sanitizeCsv(t.employeeName ?? "N/A"),
    sanitizeCsv(t.priority),
    sanitizeCsv(t.status),
    sanitizeCsv(t.category ?? "General"),
    sanitizeCsv(t.dueDate ?? "None"),
    sanitizeCsv(t.isOverdue ? "Yes" : "No"),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}
