import { createClient } from "../supabase/server";
import { escapeCsvField } from "./employees";
import type {
  SalaryStructure,
  PayrollRun,
  PayrollRecord,
  PayrollApprovalHistoryItem,
  SalaryComponentItem,
} from "@ems/types";

export type {
  SalaryStructure,
  PayrollRun,
  PayrollRecord,
  PayrollApprovalHistoryItem,
  SalaryComponentItem,
};

interface RawSalaryStructure {
  id: string;
  organization_id: string;
  employee_id: string;
  base_salary: number;
  currency: string;
  payment_frequency: "monthly" | "bi_weekly" | "weekly";
  allowances: SalaryComponentItem[];
  deductions: SalaryComponentItem[];
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  employees?: {
    employee_code: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface RawPayrollRun {
  id: string;
  organization_id: string;
  title: string;
  period_start: string;
  period_end: string;
  payment_date: string;
  status: PayrollRun["status"];
  total_gross: number;
  total_deductions: number;
  total_net: number;
  employee_count: number;
  is_locked: boolean;
  prepared_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  prepared_profile?: { full_name: string | null } | null;
  approved_profile?: { full_name: string | null } | null;
}

interface RawPayrollRecord {
  id: string;
  payroll_run_id: string;
  organization_id: string;
  employee_id: string;
  salary_structure_id: string | null;
  base_salary: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  allowances_breakdown: SalaryComponentItem[];
  deductions_breakdown: SalaryComponentItem[];
  payslip_number: string;
  payment_status: "pending" | "paid" | "cancelled";
  payment_method: "bank_transfer" | "cheque" | "cash";
  created_at: string;
  updated_at: string;
  employees?: {
    employee_code: string;
    first_name: string | null;
    last_name: string | null;
    departments?: { name: string } | null;
    designations?: { name: string } | null;
  } | null;
  payroll_runs?: {
    title: string;
    period_start: string;
    period_end: string;
  } | null;
}

interface RawHistoryItem {
  id: string;
  payroll_run_id: string;
  organization_id: string;
  actor_id: string;
  action: PayrollApprovalHistoryItem["action"];
  comments: string | null;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

/**
 * 1. Get Salary Structures
 */
export async function getSalaryStructures(
  orgId: string,
  employeeId?: string
): Promise<SalaryStructure[]> {
  const supabase = await createClient();

  let query = supabase
    .from("salary_structures")
    .select("*, employees(employee_code, first_name, last_name)")
    .eq("organization_id", orgId)
    .order("effective_from", { ascending: false });

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }

  const { data } = await query;
  const list = (data as RawSalaryStructure[] | null) ?? [];

  return list.map((s) => {
    const emp = s.employees;
    const empName = emp
      ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() || `Employee ${emp.employee_code}`
      : undefined;

    return {
      id: s.id,
      organizationId: s.organization_id,
      employeeId: s.employee_id,
      baseSalary: Number(s.base_salary),
      currency: s.currency,
      paymentFrequency: s.payment_frequency,
      allowances: s.allowances ?? [],
      deductions: s.deductions ?? [],
      effectiveFrom: s.effective_from,
      effectiveTo: s.effective_to ?? undefined,
      isActive: s.is_active,
      notes: s.notes ?? undefined,
      createdBy: s.created_by ?? undefined,
      employeeName: empName,
      employeeCode: emp?.employee_code,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    };
  });
}

/**
 * 2. Upsert Salary Structure
 */
export async function upsertSalaryStructure(
  orgId: string,
  payload: {
    id?: string | undefined;
    employeeId: string;
    baseSalary: number;
    currency?: string | undefined;
    paymentFrequency?: "monthly" | "bi_weekly" | "weekly" | undefined;
    allowances: SalaryComponentItem[];
    deductions: SalaryComponentItem[];
    effectiveFrom: string;
    effectiveTo?: string | null | undefined;
    isActive?: boolean | undefined;
    notes?: string | null | undefined;
    createdBy?: string | undefined;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  if (payload.id) {
    const { error } = await supabase
      .from("salary_structures")
      .update({
        base_salary: payload.baseSalary,
        currency: payload.currency ?? "INR",
        payment_frequency: payload.paymentFrequency ?? "monthly",
        allowances: payload.allowances,
        deductions: payload.deductions,
        effective_from: payload.effectiveFrom,
        effective_to: payload.effectiveTo ?? null,
        is_active: payload.isActive ?? true,
        notes: payload.notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", orgId)
      .eq("id", payload.id);

    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("salary_structures").insert({
      organization_id: orgId,
      employee_id: payload.employeeId,
      base_salary: payload.baseSalary,
      currency: payload.currency ?? "INR",
      payment_frequency: payload.paymentFrequency ?? "monthly",
      allowances: payload.allowances,
      deductions: payload.deductions,
      effective_from: payload.effectiveFrom,
      effective_to: payload.effectiveTo ?? null,
      is_active: payload.isActive ?? true,
      notes: payload.notes ?? null,
      created_by: payload.createdBy ?? null,
    });

    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 3. Get Payroll Runs for Organization
 */
export async function getPayrollRuns(orgId: string): Promise<PayrollRun[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("payroll_runs")
    .select(`
      *,
      prepared_profile:profiles!payroll_runs_prepared_by_fkey(full_name),
      approved_profile:profiles!payroll_runs_approved_by_fkey(full_name)
    `)
    .eq("organization_id", orgId)
    .order("period_start", { ascending: false });

  const list = (data as RawPayrollRun[] | null) ?? [];

  return list.map((r) => ({
    id: r.id,
    organizationId: r.organization_id,
    title: r.title,
    periodStart: r.period_start,
    periodEnd: r.period_end,
    paymentDate: r.payment_date,
    status: r.status,
    totalGross: Number(r.total_gross),
    totalDeductions: Number(r.total_deductions),
    totalNet: Number(r.total_net),
    employeeCount: r.employee_count,
    isLocked: r.is_locked,
    preparedBy: r.prepared_by ?? undefined,
    approvedBy: r.approved_by ?? undefined,
    approvedAt: r.approved_at ?? undefined,
    rejectionReason: r.rejection_reason ?? undefined,
    notes: r.notes ?? undefined,
    preparedByName: r.prepared_profile?.full_name ?? undefined,
    approvedByName: r.approved_profile?.full_name ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

/**
 * 4. Get Payroll Run Details (with line items and audit history)
 */
export async function getPayrollRunDetails(
  runId: string
): Promise<{
  run: PayrollRun | null;
  records: PayrollRecord[];
  history: PayrollApprovalHistoryItem[];
}> {
  const supabase = await createClient();

  // Run header
  const { data: runData } = await supabase
    .from("payroll_runs")
    .select(`
      *,
      prepared_profile:profiles!payroll_runs_prepared_by_fkey(full_name),
      approved_profile:profiles!payroll_runs_approved_by_fkey(full_name)
    `)
    .eq("id", runId)
    .single();

  if (!runData) {
    return { run: null, records: [], history: [] };
  }

  const rawRun = runData as RawPayrollRun;
  const run: PayrollRun = {
    id: rawRun.id,
    organizationId: rawRun.organization_id,
    title: rawRun.title,
    periodStart: rawRun.period_start,
    periodEnd: rawRun.period_end,
    paymentDate: rawRun.payment_date,
    status: rawRun.status,
    totalGross: Number(rawRun.total_gross),
    totalDeductions: Number(rawRun.total_deductions),
    totalNet: Number(rawRun.total_net),
    employeeCount: rawRun.employee_count,
    isLocked: rawRun.is_locked,
    preparedBy: rawRun.prepared_by ?? undefined,
    approvedBy: rawRun.approved_by ?? undefined,
    approvedAt: rawRun.approved_at ?? undefined,
    rejectionReason: rawRun.rejection_reason ?? undefined,
    notes: rawRun.notes ?? undefined,
    preparedByName: rawRun.prepared_profile?.full_name ?? undefined,
    approvedByName: rawRun.approved_profile?.full_name ?? undefined,
    createdAt: rawRun.created_at,
    updatedAt: rawRun.updated_at,
  };

  // Line items
  const { data: recData } = await supabase
    .from("payroll_records")
    .select(`
      *,
      employees(
        employee_code,
        first_name,
        last_name,
        departments(name),
        designations(name)
      )
    `)
    .eq("payroll_run_id", runId)
    .order("payslip_number", { ascending: true });

  const rawRecords = (recData as RawPayrollRecord[] | null) ?? [];
  const records: PayrollRecord[] = rawRecords.map((r) => {
    const emp = r.employees;
    const empName = emp
      ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() || `Employee ${emp.employee_code}`
      : undefined;

    return {
      id: r.id,
      payrollRunId: r.payroll_run_id,
      organizationId: r.organization_id,
      employeeId: r.employee_id,
      salaryStructureId: r.salary_structure_id ?? undefined,
      baseSalary: Number(r.base_salary),
      grossSalary: Number(r.gross_salary),
      totalDeductions: Number(r.total_deductions),
      netSalary: Number(r.net_salary),
      allowancesBreakdown: r.allowances_breakdown ?? [],
      deductionsBreakdown: r.deductions_breakdown ?? [],
      payslipNumber: r.payslip_number,
      paymentStatus: r.payment_status,
      paymentMethod: r.payment_method,
      employeeName: empName,
      employeeCode: emp?.employee_code,
      departmentName: emp?.departments?.name,
      designationName: emp?.designations?.name,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });

  // Approval history
  const { data: histData } = await supabase
    .from("payroll_approval_history")
    .select(`
      *,
      profiles(full_name)
    `)
    .eq("payroll_run_id", runId)
    .order("created_at", { ascending: true });

  const rawHist = (histData as RawHistoryItem[] | null) ?? [];
  const history: PayrollApprovalHistoryItem[] = rawHist.map((h) => ({
    id: h.id,
    payrollRunId: h.payroll_run_id,
    organizationId: h.organization_id,
    actorId: h.actor_id,
    action: h.action,
    comments: h.comments ?? undefined,
    actorName: h.profiles?.full_name ?? undefined,
    createdAt: h.created_at,
  }));

  return { run, records, history };
}

/**
 * 5. Get Employee Payslips (for Employee Portal self-service)
 */
export async function getEmployeePayslips(employeeId: string): Promise<PayrollRecord[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("payroll_records")
    .select(`
      *,
      payroll_runs!inner(title, period_start, period_end, status, is_locked)
    `)
    .eq("employee_id", employeeId)
    .eq("payroll_runs.status", "approved")
    .order("created_at", { ascending: false });

  const rawList = (data as RawPayrollRecord[] | null) ?? [];

  return rawList.map((r) => ({
    id: r.id,
    payrollRunId: r.payroll_run_id,
    organizationId: r.organization_id,
    employeeId: r.employee_id,
    salaryStructureId: r.salary_structure_id ?? undefined,
    baseSalary: Number(r.base_salary),
    grossSalary: Number(r.gross_salary),
    totalDeductions: Number(r.total_deductions),
    netSalary: Number(r.net_salary),
    allowancesBreakdown: r.allowances_breakdown ?? [],
    deductionsBreakdown: r.deductions_breakdown ?? [],
    payslipNumber: r.payslip_number,
    paymentStatus: r.payment_status,
    paymentMethod: r.payment_method,
    periodTitle: r.payroll_runs?.title,
    periodStart: r.payroll_runs?.period_start,
    periodEnd: r.payroll_runs?.period_end,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

/**
 * 6. Get Payslip Details By ID (Authorized view for printing/PDF generation)
 */
export async function getPayslipById(
  payslipId: string,
  userProfileId?: string
): Promise<PayrollRecord | null> {
  const supabase = await createClient();

  const query = supabase
    .from("payroll_records")
    .select(`
      *,
      employees(
        employee_code,
        first_name,
        last_name,
        profile_id,
        departments(name),
        designations(name)
      ),
      payroll_runs(title, period_start, period_end)
    `)
    .eq("id", payslipId);

  const { data } = await query.single();
  if (!data) return null;

  const raw = data as RawPayrollRecord & {
    employees?: {
      employee_code: string;
      first_name: string | null;
      last_name: string | null;
      profile_id: string | null;
      departments?: { name: string } | null;
      designations?: { name: string } | null;
    } | null;
  };

  // If userProfileId is specified and not finance admin, check ownership
  if (userProfileId && raw.employees?.profile_id && raw.employees.profile_id !== userProfileId) {
    // RLS will also block this, but enforce check
    return null;
  }

  const emp = raw.employees;
  const empName = emp
    ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() || `Employee ${emp.employee_code}`
    : undefined;

  return {
    id: raw.id,
    payrollRunId: raw.payroll_run_id,
    organizationId: raw.organization_id,
    employeeId: raw.employee_id,
    salaryStructureId: raw.salary_structure_id ?? undefined,
    baseSalary: Number(raw.base_salary),
    grossSalary: Number(raw.gross_salary),
    totalDeductions: Number(raw.total_deductions),
    netSalary: Number(raw.net_salary),
    allowancesBreakdown: raw.allowances_breakdown ?? [],
    deductionsBreakdown: raw.deductions_breakdown ?? [],
    payslipNumber: raw.payslip_number,
    paymentStatus: raw.payment_status,
    paymentMethod: raw.payment_method,
    employeeName: empName,
    employeeCode: emp?.employee_code,
    departmentName: emp?.departments?.name,
    designationName: emp?.designations?.name,
    periodTitle: raw.payroll_runs?.title,
    periodStart: raw.payroll_runs?.period_start,
    periodEnd: raw.payroll_runs?.period_end,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

/**
 * 7. Call Transactional RPC to Create / Calculate Payroll Run
 */
export async function createPayrollRun(
  orgId: string,
  payload: {
    title: string;
    periodStart: string;
    periodEnd: string;
    paymentDate: string;
    preparerId: string;
  }
): Promise<{ success: boolean; error?: string | undefined; payrollRunId?: string | undefined }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_payroll_run", {
    p_org_id: orgId,
    p_title: payload.title,
    p_period_start: payload.periodStart,
    p_period_end: payload.periodEnd,
    p_payment_date: payload.paymentDate,
    p_preparer_id: payload.preparerId,
  });

  if (error) return { success: false, error: error.message };

  const result = data as {
    success: boolean;
    error?: string;
    payroll_run_id?: string;
  };

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to create payroll run." };
  }

  return { success: true, payrollRunId: result.payroll_run_id };
}

/**
 * 8. Process Payroll Run Decision (Submit, Approve, Reject, Correct)
 */
export async function processPayrollRunDecision(
  runId: string,
  decision: "submit" | "approve" | "reject" | "correct",
  actorId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("process_payroll_run_decision", {
    p_run_id: runId,
    p_decision: decision,
    p_actor_id: actorId,
    p_notes: notes ?? null,
  });

  if (error) return { success: false, error: error.message };

  const result = data as { success: boolean; error?: string };
  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to process decision." };
  }

  return { success: true };
}

/**
 * 9. Export Payroll Run to Formula-Injection Safe CSV
 */
export async function exportPayrollRunCsv(runId: string): Promise<string> {
  const { run, records } = await getPayrollRunDetails(runId);
  if (!run) throw new Error("Payroll run not found.");

  const headers = [
    "Payslip Number",
    "Employee Code",
    "Employee Name",
    "Department",
    "Designation",
    "Base Salary (INR)",
    "Gross Salary (INR)",
    "Total Deductions (INR)",
    "Net Salary (INR)",
    "Payment Status",
    "Payment Method",
  ];

  const rows = records.map((r) => [
    escapeCsvField(r.payslipNumber),
    escapeCsvField(r.employeeCode ?? ""),
    escapeCsvField(r.employeeName ?? ""),
    escapeCsvField(r.departmentName ?? ""),
    escapeCsvField(r.designationName ?? ""),
    escapeCsvField(r.baseSalary.toFixed(2)),
    escapeCsvField(r.grossSalary.toFixed(2)),
    escapeCsvField(r.totalDeductions.toFixed(2)),
    escapeCsvField(r.netSalary.toFixed(2)),
    escapeCsvField(r.paymentStatus),
    escapeCsvField(r.paymentMethod),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
}
