import { createClient } from "../supabase/server";
import { escapeCsvField } from "./employees";
import type { LeaveType, LeaveRequest, LeaveBalanceSummary } from "@ems/types";

interface RawLeaveType {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  days_per_year: number;
  is_paid: boolean;
  carry_forward_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RawLeaveRequest {
  id: string;
  organization_id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: LeaveRequest["status"];
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface RawLedgerSummary {
  leave_type_id: string;
  days: number;
  transaction_type: string;
}

/**
 * 1. Get All Leave Types for Organization
 */
export async function getLeaveTypes(orgId: string): Promise<LeaveType[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("leave_types")
    .select("*")
    .eq("organization_id", orgId)
    .order("code");

  const rawList = (data as RawLeaveType[] | null) ?? [];

  return rawList.map((lt) => ({
    id: lt.id,
    organizationId: lt.organization_id,
    name: lt.name,
    code: lt.code,
    daysPerYear: Number(lt.days_per_year),
    isPaid: lt.is_paid,
    carryForwardDays: Number(lt.carry_forward_days),
    isActive: lt.is_active,
    createdAt: lt.created_at,
    updatedAt: lt.updated_at,
  }));
}

/**
 * 2. Upsert Leave Type (HR / Admin)
 */
export async function upsertLeaveType(
  orgId: string,
  payload: {
    id?: string;
    name: string;
    code: string;
    daysPerYear: number;
    isPaid: boolean;
    carryForwardDays?: number;
    isActive?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  if (payload.id) {
    const { error } = await supabase
      .from("leave_types")
      .update({
        name: payload.name.trim(),
        code: payload.code.trim().toUpperCase(),
        days_per_year: payload.daysPerYear,
        is_paid: payload.isPaid,
        carry_forward_days: payload.carryForwardDays ?? 0,
        is_active: payload.isActive ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", orgId)
      .eq("id", payload.id);

    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("leave_types").insert({
      organization_id: orgId,
      name: payload.name.trim(),
      code: payload.code.trim().toUpperCase(),
      days_per_year: payload.daysPerYear,
      is_paid: payload.isPaid,
      carry_forward_days: payload.carryForwardDays ?? 0,
      is_active: payload.isActive ?? true,
    });

    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 3. Authoritative Leave Balance Derivation for an Employee
 * Balances are strictly calculated from leave_ledger entries minus pending requests.
 */
export async function getEmployeeLeaveBalances(
  orgId: string,
  employeeId: string
): Promise<LeaveBalanceSummary[]> {
  const supabase = await createClient();

  const [typesRes, ledgerRes, pendingRes] = await Promise.all([
    supabase.from("leave_types").select("*").eq("organization_id", orgId).eq("is_active", true),
    supabase
      .from("leave_ledger")
      .select("leave_type_id, days, transaction_type")
      .eq("organization_id", orgId)
      .eq("employee_id", employeeId),
    supabase
      .from("leave_requests")
      .select("leave_type_id, total_days")
      .eq("organization_id", orgId)
      .eq("employee_id", employeeId)
      .eq("status", "pending"),
  ]);

  const rawTypes = (typesRes.data as RawLeaveType[] | null) ?? [];
  const rawLedger = (ledgerRes.data as RawLedgerSummary[] | null) ?? [];
  const rawPending = (pendingRes.data as Array<{ leave_type_id: string; total_days: number }> | null) ?? [];

  // Group ledger by leave_type_id
  const accruedMap = new Map<string, number>();
  const usedMap = new Map<string, number>();

  rawLedger.forEach((entry) => {
    const days = Number(entry.days);
    if (days >= 0) {
      accruedMap.set(entry.leave_type_id, (accruedMap.get(entry.leave_type_id) ?? 0) + days);
    } else {
      usedMap.set(entry.leave_type_id, (usedMap.get(entry.leave_type_id) ?? 0) + Math.abs(days));
    }
  });

  // Group pending requests by leave_type_id
  const pendingMap = new Map<string, number>();
  rawPending.forEach((req) => {
    pendingMap.set(req.leave_type_id, (pendingMap.get(req.leave_type_id) ?? 0) + Number(req.total_days));
  });

  return rawTypes.map((lt) => {
    // If no ledger entries exist yet, default initial allocation is the leave type's days_per_year
    const totalAccrued = accruedMap.get(lt.id) ?? (lt.is_paid ? Number(lt.days_per_year) : 0);
    const totalUsed = usedMap.get(lt.id) ?? 0;
    const totalPending = pendingMap.get(lt.id) ?? 0;
    const available = Math.max(0, totalAccrued - totalUsed - totalPending);

    return {
      leaveTypeId: lt.id,
      leaveTypeName: lt.name,
      leaveTypeCode: lt.code,
      daysPerYear: Number(lt.days_per_year),
      isPaid: lt.is_paid,
      accruedDays: totalAccrued,
      usedDays: totalUsed,
      pendingDays: totalPending,
      availableDays: available,
    };
  });
}

/**
 * 4. Get Employee's Personal Leave Requests
 */
export async function getEmployeeLeaveRequests(
  orgId: string,
  employeeId: string
): Promise<LeaveRequest[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("leave_requests")
    .select("*, leave_types(name, code), profiles!reviewed_by(full_name)")
    .eq("organization_id", orgId)
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  const rawList = (data as Array<
    RawLeaveRequest & {
      leave_types?: { name: string; code: string } | null;
      profiles?: { full_name: string | null } | null;
    }
  > | null) ?? [];

  return rawList.map((r) => ({
    id: r.id,
    organizationId: r.organization_id,
    employeeId: r.employee_id,
    leaveTypeId: r.leave_type_id,
    startDate: r.start_date,
    endDate: r.end_date,
    totalDays: Number(r.total_days),
    reason: r.reason,
    status: r.status,
    reviewedBy: r.reviewed_by,
    reviewedAt: r.reviewed_at,
    rejectionReason: r.rejection_reason,
    leaveTypeName: r.leave_types?.name,
    leaveTypeCode: r.leave_types?.code,
    reviewedByName: r.profiles?.full_name ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

/**
 * 5. Get Team / Organization Leave Requests Queue
 */
export async function getTeamLeaveRequests(
  orgId: string,
  managerEmployeeId?: string | null,
  status?: string
): Promise<LeaveRequest[]> {
  const supabase = await createClient();

  let query = supabase
    .from("leave_requests")
    .select("*, employees(id, employee_code, first_name, last_name, reporting_manager_id), leave_types(name, code), profiles!reviewed_by(full_name)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data } = await query;
  const rawList = (data as Array<
    RawLeaveRequest & {
      employees?: { id: string; employee_code: string; first_name: string | null; last_name: string | null; reporting_manager_id: string | null } | null;
      leave_types?: { name: string; code: string } | null;
      profiles?: { full_name: string | null } | null;
    }
  > | null) ?? [];

  const filtered = managerEmployeeId
    ? rawList.filter((r) => r.employees?.reporting_manager_id === managerEmployeeId)
    : rawList;

  return filtered.map((r) => {
    const emp = r.employees;
    const empName = emp
      ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() || `Employee ${emp.employee_code}`
      : undefined;

    return {
      id: r.id,
      organizationId: r.organization_id,
      employeeId: r.employee_id,
      leaveTypeId: r.leave_type_id,
      startDate: r.start_date,
      endDate: r.end_date,
      totalDays: Number(r.total_days),
      reason: r.reason,
      status: r.status,
      reviewedBy: r.reviewed_by,
      reviewedAt: r.reviewed_at,
      rejectionReason: r.rejection_reason,
      employeeName: empName,
      employeeCode: emp?.employee_code,
      leaveTypeName: r.leave_types?.name,
      leaveTypeCode: r.leave_types?.code,
      reviewedByName: r.profiles?.full_name ?? undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });
}

/**
 * 6. Submit Leave Request with Balance Guard
 */
export async function submitLeaveRequest(
  orgId: string,
  employeeId: string,
  payload: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // 1. Verify available balance
  const balances = await getEmployeeLeaveBalances(orgId, employeeId);
  const targetBalance = balances.find((b) => b.leaveTypeId === payload.leaveTypeId);

  if (targetBalance && targetBalance.isPaid && targetBalance.availableDays < payload.totalDays) {
    return {
      success: false,
      error: `Insufficient leave balance. You have ${targetBalance.availableDays} day(s) available, but requested ${payload.totalDays}.`,
    };
  }

  // 2. Insert into leave_requests
  const { error } = await supabase
    .from("leave_requests")
    .insert({
      organization_id: orgId,
      employee_id: employeeId,
      leave_type_id: payload.leaveTypeId,
      start_date: payload.startDate,
      end_date: payload.endDate,
      total_days: payload.totalDays,
      reason: payload.reason.trim(),
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // 3. Notify reporting manager if present
  const { data: empData } = await supabase
    .from("employees")
    .select("first_name, last_name, employee_code, reporting_manager_id, employees!reporting_manager_id(profile_id)")
    .eq("id", employeeId)
    .single();

  const mgrProfileId = (empData as { employees?: { profile_id: string | null } | null } | null)?.employees?.profile_id;
  if (mgrProfileId) {
    const empName = `${empData?.first_name ?? ""} ${empData?.last_name ?? ""}`.trim() || `Employee ${empData?.employee_code}`;
    await supabase.from("notifications").insert({
      organization_id: orgId,
      recipient_profile_id: mgrProfileId,
      title: "New Leave Application",
      message: `${empName} has requested ${payload.totalDays} day(s) of leave from ${payload.startDate}.`,
      type: "leave_submitted",
      link: "/portal/manager#approvals",
    });
  }

  return { success: true };
}

/**
 * 7. Review Leave Request (PostgreSQL RPC)
 */
export async function reviewLeaveRequest(
  requestId: string,
  decision: "approved" | "rejected",
  reviewerProfileId: string,
  rejectionReason?: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("process_leave_request_decision", {
    p_request_id: requestId,
    p_decision: decision,
    p_reviewer_profile_id: reviewerProfileId,
    p_rejection_reason: rejectionReason ?? null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const res = data as { success: boolean; error?: string };
  return res;
}

/**
 * 8. Export Leave Reports to Safe CSV
 */
export async function exportLeaveReportCsv(
  orgId: string,
  managerEmployeeId?: string | null
): Promise<string> {
  const requests = await getTeamLeaveRequests(orgId, managerEmployeeId);

  const headers = [
    "Employee Code",
    "Employee Name",
    "Leave Type",
    "Start Date",
    "End Date",
    "Total Days",
    "Status",
    "Reason",
    "Reviewed By",
    "Reviewed At",
    "Rejection Reason",
  ];

  const rows = requests.map((r) => [
    escapeCsvField(r.employeeCode),
    escapeCsvField(r.employeeName),
    escapeCsvField(r.leaveTypeName ?? r.leaveTypeCode),
    escapeCsvField(r.startDate),
    escapeCsvField(r.endDate),
    escapeCsvField(r.totalDays),
    escapeCsvField(r.status.toUpperCase()),
    escapeCsvField(r.reason),
    escapeCsvField(r.reviewedByName ?? "--"),
    escapeCsvField(r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString() : "--"),
    escapeCsvField(r.rejectionReason ?? "--"),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
}
