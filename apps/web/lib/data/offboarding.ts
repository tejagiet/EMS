import { createClient } from "../supabase/server";
import type {
  OffboardingCase,
  OffboardingClearanceItem,
  OffboardingStatus,
  ClearanceDepartment,
  ClearanceStatus,
} from "@ems/types";

function sanitizeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  let str = String(val).replace(/"/g, '""');
  if (/^[=\+\-\@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str}"`;
}

interface RawOffboardingCase {
  id: string;
  organization_id: string;
  employee_id: string;
  exit_type: OffboardingCase["exitType"];
  reason: string;
  resignation_date: string | null;
  notice_period_days: number;
  last_working_date: string;
  status: OffboardingStatus;
  eligible_for_rehire: boolean;
  notes: string | null;
  handover_notes: string | null;
  deactivated_at: string | null;
  deactivated_by: string | null;
  created_by: string | null;
  completed_at: string | null;
  completed_by: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface RawClearanceItem {
  id: string;
  organization_id: string;
  case_id: string;
  department: ClearanceDepartment;
  title: string;
  description: string | null;
  is_required: boolean;
  status: ClearanceStatus;
  cleared_at: string | null;
  cleared_by: string | null;
  notes: string | null;
  linked_asset_id: string | null;
  created_at: string;
  updated_at: string;
}

export type ExtendedOffboardingCase = OffboardingCase & {
  totalClearances?: number;
  clearedClearances?: number;
  clearanceProgressPercent?: number;
  eligibleForRehire?: boolean;
};

/**
 * Fetch offboarding cases with employee metadata and clearance stats
 */
export async function getOffboardingCases(
  orgId: string,
  statusFilter?: OffboardingStatus
): Promise<ExtendedOffboardingCase[]> {
  const supabase = await createClient();

  let query = supabase
    .from("offboarding_cases")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: rawCases, error } = await query;
  if (error || !rawCases) return [];

  const [empRes, deptRes, clearanceRes] = await Promise.all([
    supabase.from("employees").select("id, employee_code, profile_id, department_id, branch_id").eq("organization_id", orgId),
    supabase.from("departments").select("id, name").eq("organization_id", orgId),
    supabase.from("offboarding_clearance_items").select("id, case_id, is_required, status").eq("organization_id", orgId),
  ]);

  const profileRes = await supabase.from("profiles").select("id, full_name");
  const profileMap = new Map((profileRes.data ?? []).map((p) => [p.id, p.full_name]));
  const deptMap = new Map((deptRes.data ?? []).map((d) => [d.id, d.name]));

  const empMap = new Map(
    (empRes.data ?? []).map((e) => [
      e.id,
      {
        code: e.employee_code,
        name: (e.profile_id ? profileMap.get(e.profile_id) : null) ?? `Employee ${e.employee_code}`,
        departmentId: e.department_id,
        branchId: e.branch_id,
      },
    ])
  );

  const clearanceList = (clearanceRes.data as { id: string; case_id: string; is_required: boolean; status: string }[] | null) ?? [];
  const clearanceByCase = new Map<string, { total: number; cleared: number }>();

  for (const c of clearanceList) {
    const cur = clearanceByCase.get(c.case_id) ?? { total: 0, cleared: 0 };
    cur.total += 1;
    if (c.status === "cleared") cur.cleared += 1;
    clearanceByCase.set(c.case_id, cur);
  }

  return (rawCases as RawOffboardingCase[]).map((c) => {
    const emp = empMap.get(c.employee_id);
    const clearanceStats = clearanceByCase.get(c.id) ?? { total: 0, cleared: 0 };
    const pct = clearanceStats.total > 0 ? Math.round((clearanceStats.cleared / clearanceStats.total) * 100) : 0;

    return {
      id: c.id,
      organizationId: c.organization_id,
      employeeId: c.employee_id,
      initiatedBy: c.created_by ?? c.employee_id,
      exitType: c.exit_type,
      reason: c.reason,
      noticePeriodDays: c.notice_period_days,
      lastWorkingDate: c.last_working_date,
      status: c.status,
      accountDeactivated: Boolean(c.deactivated_at),
      deactivatedAt: c.deactivated_at,
      eligibleForRehire: c.eligible_for_rehire,
      employeeName: emp?.name ?? "Unknown",
      employeeCode: emp?.code ?? "EMP",
      departmentName: emp?.departmentId ? deptMap.get(emp.departmentId) : undefined,
      totalClearanceItems: clearanceStats.total,
      clearedItems: clearanceStats.cleared,
      totalClearances: clearanceStats.total,
      clearedClearances: clearanceStats.cleared,
      clearanceProgressPercent: pct,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    };
  });
}

export type ExtendedClearanceItem = OffboardingClearanceItem & {
  title?: string | undefined;
  isRequired?: boolean | undefined;
  linkedAssetId?: string | null | undefined;
  assetTag?: string | undefined;
};

/**
 * Fetch detailed offboarding case with all clearance items
 */
export async function getOffboardingCaseDetails(caseId: string) {
  const supabase = await createClient();

  const [caseRes, itemsRes, profRes, assetRes] = await Promise.all([
    supabase.from("offboarding_cases").select("*").eq("id", caseId).single(),
    supabase.from("offboarding_clearance_items").select("*").eq("case_id", caseId).order("department", { ascending: true }),
    supabase.from("profiles").select("id, full_name"),
    supabase.from("assets").select("id, asset_tag, name, serial_number"),
  ]);

  if (!caseRes.data) return { caseItem: null, clearanceItems: [] };

  const profMap = new Map((profRes.data ?? []).map((p) => [p.id, p.full_name]));
  const assetMap = new Map((assetRes.data ?? []).map((a) => [a.id, `${a.name} (${a.asset_tag})`]));

  const clearanceItems: ExtendedClearanceItem[] = ((itemsRes.data as RawClearanceItem[] | null) ?? []).map((item) => ({
    id: item.id,
    organizationId: item.organization_id,
    caseId: item.case_id,
    departmentType: item.department,
    itemName: item.title,
    title: item.title,
    isRequired: item.is_required,
    status: item.status,
    clearedAt: item.cleared_at,
    clearedBy: item.cleared_by,
    clearedByName: item.cleared_by ? profMap.get(item.cleared_by) ?? undefined : undefined,
    comments: item.notes,
    linkedAssetId: item.linked_asset_id,
    assetTag: item.linked_asset_id ? assetMap.get(item.linked_asset_id) : undefined,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));

  return { caseItem: caseRes.data as RawOffboardingCase, clearanceItems };
}

/**
 * Initiate offboarding case via database RPC
 */
export async function initiateOffboardingCase(
  orgId: string,
  employeeId: string,
  exitType: OffboardingCase["exitType"],
  reason: string,
  lastWorkingDate: string,
  resignationDate?: string | null,
  noticePeriodDays: number = 30,
  handoverNotes?: string | null,
  notes?: string | null,
  createdBy?: string | null
) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("initiate_offboarding_case", {
    p_org_id: orgId,
    p_employee_id: employeeId,
    p_exit_type: exitType,
    p_reason: reason,
    p_last_working_date: lastWorkingDate,
    p_resignation_date: resignationDate ?? null,
    p_notice_period_days: noticePeriodDays,
    p_handover_notes: handoverNotes ?? null,
    p_notes: notes ?? null,
    p_created_by: createdBy ?? null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const res = data as { success: boolean; case_id?: string; error?: string };
  return {
    success: res.success,
    caseId: res.case_id,
    error: res.error,
  };
}

/**
 * Update clearance item status
 */
export async function updateClearanceItem(
  itemId: string,
  status: ClearanceStatus,
  actorId: string,
  notes?: string | null
) {
  const supabase = await createClient();

  const isCleared = status === "cleared";
  const { error } = await supabase
    .from("offboarding_clearance_items")
    .update({
      status,
      cleared_at: isCleared ? new Date().toISOString() : null,
      cleared_by: isCleared ? actorId : null,
      notes: notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Finalize offboarding decision and deactivate employee via transactional RPC
 */
export async function processOffboardingDecision(
  caseId: string,
  decision: "complete" | "cancel",
  actorId: string,
  notes?: string | null,
  rehireEligible: boolean = true
) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("process_offboarding_decision", {
    p_case_id: caseId,
    p_decision: decision,
    p_actor_id: actorId,
    p_notes: notes ?? null,
    p_rehire_eligible: rehireEligible,
  });

  if (error) return { success: false, error: error.message };
  const res = data as { success: boolean; error?: string };
  return { success: res.success, error: res.error };
}

/**
 * Formula-injection safe CSV export for offboarding cases
 */
export async function exportOffboardingCsv(orgId: string): Promise<string> {
  const cases = await getOffboardingCases(orgId);

  const headers = [
    "Case ID",
    "Employee Code",
    "Employee Name",
    "Exit Type",
    "Reason",
    "Last Working Date",
    "Status",
    "Clearances Total",
    "Clearances Cleared",
    "Clearance Progress (%)",
    "Rehire Eligible",
  ];

  const rows = cases.map((c) => [
    sanitizeCsv(c.id),
    sanitizeCsv(c.employeeCode),
    sanitizeCsv(c.employeeName),
    sanitizeCsv(c.exitType),
    sanitizeCsv(c.reason),
    sanitizeCsv(c.lastWorkingDate),
    sanitizeCsv(c.status),
    sanitizeCsv(c.totalClearances ?? 0),
    sanitizeCsv(c.clearedClearances ?? 0),
    sanitizeCsv(`${c.clearanceProgressPercent ?? 0}%`),
    sanitizeCsv(c.eligibleForRehire ? "Yes" : "No"),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}
