import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { escapeCsvField } from "./employees";
import {
  extractHandoverFromReason,
  encodeHandoverInReason,
  type WorkHandover,
  type AssignableColleague,
  type DelegatedDutyItem,
} from "./work-handover";
import type { AttendanceRecord, AttendanceCorrection } from "@ems/types";

export interface ClockStatusResult {
  hasOpenSession: boolean;
  activeRecord: AttendanceRecord | null;
  assignedShift: {
    id: string;
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    breakDurationMinutes: number;
    gracePeriodMinutes: number;
    isOvernight: boolean;
  } | null;
}

interface RawAttendance {
  id: string;
  organization_id: string;
  employee_id: string;
  shift_id: string | null;
  work_date: string;
  clock_in: string | null;
  clock_out: string | null;
  break_minutes: number;
  duration_minutes: number;
  status: AttendanceRecord["status"];
  is_late: boolean;
  is_early_departure: boolean;
  is_corrected: boolean;
  correction_notes: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface RawCorrection {
  id: string;
  organization_id: string;
  attendance_record_id: string | null;
  employee_id: string;
  requested_clock_in: string;
  requested_clock_out: string;
  reason: string;
  status: AttendanceCorrection["status"];
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 1. Get Today's Live Attendance Status for an Employee
 */
export async function getTodayAttendanceStatus(
  orgId: string,
  employeeId: string
): Promise<ClockStatusResult> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0]!;

  // 1. Fetch any open record or today's record
  const { data: records } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("organization_id", orgId)
    .eq("employee_id", employeeId)
    .or(`work_date.eq.${today},clock_out.is.null`)
    .order("created_at", { ascending: false })
    .limit(1);

  const rawRec = (records as RawAttendance[] | null)?.[0] ?? null;

  // 2. Fetch active shift assignment for today
  const { data: assignments } = await supabase
    .from("shift_assignments")
    .select("shift_id, shifts(*)")
    .eq("organization_id", orgId)
    .eq("employee_id", employeeId)
    .eq("is_active", true)
    .lte("effective_from", today)
    .limit(1);

  let assignedShift: ClockStatusResult["assignedShift"] = null;
  const rawShift = (assignments as Array<{ shift_id: string; shifts: { id: string; name: string; code: string; start_time: string; end_time: string; break_duration_minutes: number; grace_period_minutes: number; is_overnight: boolean } }> | null)?.[0]?.shifts;

  if (rawShift) {
    assignedShift = {
      id: rawShift.id,
      name: rawShift.name,
      code: rawShift.code,
      startTime: rawShift.start_time,
      endTime: rawShift.end_time,
      breakDurationMinutes: rawShift.break_duration_minutes,
      gracePeriodMinutes: rawShift.grace_period_minutes,
      isOvernight: rawShift.is_overnight,
    };
  }

  const activeRecord: AttendanceRecord | null = rawRec
    ? {
        id: rawRec.id,
        organizationId: rawRec.organization_id,
        employeeId: rawRec.employee_id,
        shiftId: rawRec.shift_id,
        workDate: rawRec.work_date,
        clockIn: rawRec.clock_in,
        clockOut: rawRec.clock_out,
        breakMinutes: rawRec.break_minutes,
        durationMinutes: rawRec.duration_minutes,
        status: rawRec.status,
        isLate: rawRec.is_late,
        isEarlyDeparture: rawRec.is_early_departure,
        isCorrected: rawRec.is_corrected,
        correctionNotes: rawRec.correction_notes,
        notes: rawRec.notes,
        createdAt: rawRec.created_at,
        updatedAt: rawRec.updated_at,
      }
    : null;

  return {
    hasOpenSession: Boolean(activeRecord && !activeRecord.clockOut),
    activeRecord,
    assignedShift,
  };
}

/**
 * 2. Clock In Employee (PostgreSQL RPC with server timestamp)
 */
export async function clockIn(
  orgId: string,
  employeeId: string,
  notes?: string
): Promise<{ success: boolean; error?: string; recordId?: string | undefined; isLate?: boolean | undefined }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("clock_in_employee", {
    p_org_id: orgId,
    p_employee_id: employeeId,
    p_notes: notes ?? null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const res = data as { success: boolean; error?: string; record_id?: string; is_late?: boolean };
  if (!res.success) {
    return { success: false, error: res.error ?? "Clock-in failed" };
  }

  return {
    success: true,
    recordId: res.record_id,
    isLate: res.is_late,
  };
}

/**
 * 3. Clock Out Employee (PostgreSQL RPC with server timestamp)
 */
export async function clockOut(
  orgId: string,
  employeeId: string,
  notes?: string
): Promise<{ success: boolean; error?: string; durationMinutes?: number | undefined; isEarlyDeparture?: boolean | undefined }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("clock_out_employee", {
    p_org_id: orgId,
    p_employee_id: employeeId,
    p_notes: notes ?? null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const res = data as { success: boolean; error?: string; duration_minutes?: number; is_early_departure?: boolean };
  if (!res.success) {
    return { success: false, error: res.error ?? "Clock-out failed" };
  }

  return {
    success: true,
    durationMinutes: res.duration_minutes,
    isEarlyDeparture: res.is_early_departure,
  };
}

/**
 * 4. Get Employee Attendance History
 */
export async function getEmployeeAttendanceHistory(
  orgId: string,
  employeeId: string,
  limit = 30
): Promise<AttendanceRecord[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("attendance_records")
    .select("*, shifts(name)")
    .eq("organization_id", orgId)
    .eq("employee_id", employeeId)
    .order("work_date", { ascending: false })
    .limit(limit);

  const rawList = (data as Array<RawAttendance & { shifts?: { name: string } | null }> | null) ?? [];

  return rawList.map((r) => ({
    id: r.id,
    organizationId: r.organization_id,
    employeeId: r.employee_id,
    shiftId: r.shift_id,
    workDate: r.work_date,
    clockIn: r.clock_in,
    clockOut: r.clock_out,
    breakMinutes: r.break_minutes,
    durationMinutes: r.duration_minutes,
    status: r.status,
    isLate: r.is_late,
    isEarlyDeparture: r.is_early_departure,
    isCorrected: r.is_corrected,
    correctionNotes: r.correction_notes,
    notes: r.notes,
    shiftName: r.shifts?.name,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

/**
 * 5. Get Team Attendance Roster for a Date
 */
export async function getTeamAttendanceRoster(
  orgId: string,
  managerEmployeeId?: string | null,
  date?: string
): Promise<AttendanceRecord[]> {
  const supabase = createAdminClient();
  const targetDate = date ?? new Date().toISOString().split("T")[0]!;

  let empQuery = supabase
    .from("employees")
    .select("id, employee_code, first_name, last_name")
    .eq("organization_id", orgId)
    .eq("employment_status", "active");

  if (managerEmployeeId) {
    empQuery = empQuery.eq("reporting_manager_id", managerEmployeeId);
  }

  const { data: emps } = await empQuery;
  const empList = (emps as Array<{ id: string; employee_code: string; first_name: string | null; last_name: string | null }> | null) ?? [];
  const empIds = empList.map((e) => e.id);

  if (empIds.length === 0) return [];

  const { data: records } = await supabase
    .from("attendance_records")
    .select("*, shifts(name)")
    .eq("organization_id", orgId)
    .eq("work_date", targetDate)
    .in("employee_id", empIds);

  const rawRecords = (records as Array<RawAttendance & { shifts?: { name: string } | null }> | null) ?? [];
  const recMap = new Map(rawRecords.map((r) => [r.employee_id, r]));

  return empList.map((emp) => {
    const r = recMap.get(emp.id);
    const empName = `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() || `Employee ${emp.employee_code}`;

    if (r) {
      return {
        id: r.id,
        organizationId: r.organization_id,
        employeeId: r.employee_id,
        shiftId: r.shift_id,
        workDate: r.work_date,
        clockIn: r.clock_in,
        clockOut: r.clock_out,
        breakMinutes: r.break_minutes,
        durationMinutes: r.duration_minutes,
        status: r.status,
        isLate: r.is_late,
        isEarlyDeparture: r.is_early_departure,
        isCorrected: r.is_corrected,
        correctionNotes: r.correction_notes,
        notes: r.notes,
        employeeName: empName,
        employeeCode: emp.employee_code,
        shiftName: r.shifts?.name,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    }

    return {
      id: `virtual-${emp.id}`,
      organizationId: orgId,
      employeeId: emp.id,
      shiftId: null,
      workDate: targetDate,
      clockIn: null,
      clockOut: null,
      breakMinutes: 0,
      durationMinutes: 0,
      status: "absent" as const,
      isLate: false,
      isEarlyDeparture: false,
      isCorrected: false,
      correctionNotes: null,
      notes: "No attendance stamped yet",
      employeeName: empName,
      employeeCode: emp.employee_code,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

/**
 * 6. Get Attendance Corrections Queue
 */
export async function getAttendanceCorrectionsList(
  orgId: string,
  managerEmployeeId?: string | null,
  status?: string
): Promise<AttendanceCorrection[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("attendance_corrections")
    .select("*, employees(id, employee_code, first_name, last_name, reporting_manager_id), profiles!reviewed_by(full_name)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data } = await query;
  const rawList = (data as Array<
    RawCorrection & {
      employees?: { id: string; employee_code: string; first_name: string | null; last_name: string | null; reporting_manager_id: string | null } | null;
      profiles?: { full_name: string | null } | null;
    }
  > | null) ?? [];

  const filtered = managerEmployeeId
    ? rawList.filter(
        (r) =>
          r.employees?.reporting_manager_id === managerEmployeeId ||
          !r.employees?.reporting_manager_id
      )
    : rawList;

  return filtered.map((r) => {
    const emp = r.employees;
    const empName = emp
      ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() || `Employee ${emp.employee_code}`
      : undefined;

    return {
      id: r.id,
      organizationId: r.organization_id,
      attendanceRecordId: r.attendance_record_id,
      employeeId: r.employee_id,
      requestedClockIn: r.requested_clock_in,
      requestedClockOut: r.requested_clock_out,
      reason: r.reason,
      status: r.status,
      reviewedBy: r.reviewed_by,
      reviewedAt: r.reviewed_at,
      rejectionReason: r.rejection_reason,
      employeeName: empName,
      employeeCode: emp?.employee_code,
      reviewedByName: r.profiles?.full_name ?? undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });
}

/**
 * 7. Submit Attendance Correction Request
 */
export async function submitAttendanceCorrection(
  orgId: string,
  employeeId: string,
  payload: {
    attendanceRecordId?: string | null;
    requestedClockIn: string;
    requestedClockOut: string;
    reason: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("attendance_corrections").insert({
    organization_id: orgId,
    employee_id: employeeId,
    attendance_record_id: payload.attendanceRecordId || null,
    requested_clock_in: payload.requestedClockIn,
    requested_clock_out: payload.requestedClockOut,
    reason: payload.reason.trim(),
    status: "pending",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 8. Review Attendance Correction (Approve/Reject RPC)
 */
export async function reviewAttendanceCorrection(
  correctionId: string,
  decision: "approved" | "rejected",
  reviewerProfileId: string,
  rejectionReason?: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("process_attendance_correction_decision", {
    p_correction_id: correctionId,
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
 * 9. Export Attendance Records to Safe CSV
 */
export async function exportAttendanceCsv(
  orgId: string,
  managerEmployeeId?: string | null,
  date?: string
): Promise<string> {
  const roster = await getTeamAttendanceRoster(orgId, managerEmployeeId, date);

  const headers = [
    "Employee Code",
    "Employee Name",
    "Work Date",
    "Status",
    "Clock In",
    "Clock Out",
    "Duration (Minutes)",
    "Shift",
    "Is Late",
    "Is Early Departure",
    "Is Corrected",
    "Notes",
  ];

  const rows = roster.map((r) => [
    escapeCsvField(r.employeeCode),
    escapeCsvField(r.employeeName),
    escapeCsvField(r.workDate),
    escapeCsvField(r.status.toUpperCase()),
    escapeCsvField(r.clockIn ? new Date(r.clockIn).toLocaleTimeString() : "--"),
    escapeCsvField(r.clockOut ? new Date(r.clockOut).toLocaleTimeString() : "--"),
    escapeCsvField(r.durationMinutes),
    escapeCsvField(r.shiftName ?? "Standard Shift"),
    escapeCsvField(r.isLate ? "YES" : "NO"),
    escapeCsvField(r.isEarlyDeparture ? "YES" : "NO"),
    escapeCsvField(r.isCorrected ? "YES" : "NO"),
    escapeCsvField(r.notes ?? ""),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
}

/**
 * 10. Get Active Assignable Colleagues for Work Delegation
 */
export async function getAssignableColleagues(
  orgId: string,
  excludeEmployeeId?: string | null
): Promise<AssignableColleague[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, employee_code, first_name, last_name, profile_id, profiles(full_name), departments:departments!employees_department_id_fkey(name), designations:designations!employees_designation_id_fkey(name)"
    )
    .eq("organization_id", orgId)
    .eq("is_active", true);

  if (error || !data) {
    console.error("[getAssignableColleagues] Query error:", error);
    return [];
  }

  const rawList = data as unknown as Array<{
    id: string;
    employee_code: string;
    first_name: string | null;
    last_name: string | null;
    profile_id: string | null;
    profiles?: { full_name: string | null } | Array<{ full_name: string | null }> | null;
    departments?: { name: string } | Array<{ name: string }> | null;
    designations?: { name: string } | Array<{ name: string }> | null;
  }>;

  return rawList
    .filter((emp) => emp.id !== excludeEmployeeId)
    .map((emp) => {
      const explicitName = [emp.first_name, emp.last_name].filter(Boolean).join(" ").trim();
      const profName = Array.isArray(emp.profiles) ? emp.profiles[0]?.full_name : emp.profiles?.full_name;
      const deptName = Array.isArray(emp.departments) ? emp.departments[0]?.name : emp.departments?.name;
      const desigTitle = Array.isArray(emp.designations) ? emp.designations[0]?.name : emp.designations?.name;
      const resolvedName = explicitName || profName || `Staff ${emp.employee_code}`;

      return {
        id: emp.id,
        employeeCode: emp.employee_code,
        name: resolvedName,
        departmentName: deptName,
        designationTitle: desigTitle,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * 11. Get Duties Delegated TO a Specific Colleague
 */
export async function getAssignedSubstituteDuties(
  orgId: string,
  colleagueEmployeeId: string
): Promise<DelegatedDutyItem[]> {
  const supabase = createAdminClient();

  const [correctionsRes, leavesRes] = await Promise.all([
    supabase
      .from("attendance_corrections")
      .select("id, employee_id, requested_clock_in, requested_clock_out, reason, status, created_at, employees(id, employee_code, first_name, last_name, profiles(full_name))")
      .eq("organization_id", orgId)
      .ilike("reason", `%substituteId%${colleagueEmployeeId}%`)
      .order("created_at", { ascending: false }),
    supabase
      .from("leave_requests")
      .select("id, employee_id, start_date, end_date, total_days, reason, status, created_at, employees(id, employee_code, first_name, last_name, profiles(full_name))")
      .eq("organization_id", orgId)
      .ilike("reason", `%substituteId%${colleagueEmployeeId}%`)
      .order("created_at", { ascending: false }),
  ]);

  const results: DelegatedDutyItem[] = [];

  // Parse corrections
  const rawCorrections = (correctionsRes.data as Array<any> | null) ?? [];
  for (const row of rawCorrections) {
    const { handover } = extractHandoverFromReason(row.reason);
    if (handover && handover.substituteId === colleagueEmployeeId) {
      const emp = row.employees;
      const explicitName = [emp?.first_name, emp?.last_name].filter(Boolean).join(" ").trim();
      const empName = explicitName || emp?.profiles?.full_name || `Colleague ${emp?.employee_code ?? ""}`;

      const dateStr = new Date(row.requested_clock_in).toLocaleDateString();

      results.push({
        id: row.id,
        sourceType: "attendance_correction",
        absentEmployeeId: row.employee_id,
        absentEmployeeName: empName,
        absentEmployeeCode: emp?.employee_code ?? "STAFF",
        handover,
        dateOrPeriod: `Work Session (${dateStr})`,
        status: row.status,
        createdAt: row.created_at,
      });
    }
  }

  // Parse leave requests
  const rawLeaves = (leavesRes.data as Array<any> | null) ?? [];
  for (const row of rawLeaves) {
    const { handover } = extractHandoverFromReason(row.reason);
    if (handover && handover.substituteId === colleagueEmployeeId) {
      const emp = row.employees;
      const explicitName = [emp?.first_name, emp?.last_name].filter(Boolean).join(" ").trim();
      const empName = explicitName || emp?.profiles?.full_name || `Colleague ${emp?.employee_code ?? ""}`;

      results.push({
        id: row.id,
        sourceType: "leave_request",
        absentEmployeeId: row.employee_id,
        absentEmployeeName: empName,
        absentEmployeeCode: emp?.employee_code ?? "STAFF",
        handover,
        dateOrPeriod: `${row.start_date} to ${row.end_date} (${row.total_days} days leave)`,
        status: row.status,
        createdAt: row.created_at,
      });
    }
  }

  return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * 12. Get Duties Delegated BY Logged-in Employee to Others
 */
export async function getMyDelegatedDuties(
  orgId: string,
  employeeId: string
): Promise<DelegatedDutyItem[]> {
  const supabase = createAdminClient();

  const [correctionsRes, leavesRes] = await Promise.all([
    supabase
      .from("attendance_corrections")
      .select("id, employee_id, requested_clock_in, requested_clock_out, reason, status, created_at")
      .eq("organization_id", orgId)
      .eq("employee_id", employeeId)
      .ilike("reason", "%[WORK_HANDOVER:%")
      .order("created_at", { ascending: false }),
    supabase
      .from("leave_requests")
      .select("id, employee_id, start_date, end_date, total_days, reason, status, created_at")
      .eq("organization_id", orgId)
      .eq("employee_id", employeeId)
      .ilike("reason", "%[WORK_HANDOVER:%")
      .order("created_at", { ascending: false }),
  ]);

  const results: DelegatedDutyItem[] = [];

  const rawCorrections = (correctionsRes.data as Array<any> | null) ?? [];
  for (const row of rawCorrections) {
    const { handover } = extractHandoverFromReason(row.reason);
    if (handover) {
      results.push({
        id: row.id,
        sourceType: "attendance_correction",
        absentEmployeeId: employeeId,
        absentEmployeeName: "You",
        absentEmployeeCode: "SELF",
        handover,
        dateOrPeriod: `Work Session (${new Date(row.requested_clock_in).toLocaleDateString()})`,
        status: row.status,
        createdAt: row.created_at,
      });
    }
  }

  const rawLeaves = (leavesRes.data as Array<any> | null) ?? [];
  for (const row of rawLeaves) {
    const { handover } = extractHandoverFromReason(row.reason);
    if (handover) {
      results.push({
        id: row.id,
        sourceType: "leave_request",
        absentEmployeeId: employeeId,
        absentEmployeeName: "You",
        absentEmployeeCode: "SELF",
        handover,
        dateOrPeriod: `${row.start_date} to ${row.end_date} (${row.total_days} days leave)`,
        status: row.status,
        createdAt: row.created_at,
      });
    }
  }

  return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * 13. Acknowledge Work Handover / Duty Delegation by Substitute Colleague
 */
export async function acknowledgeDutyDelegation(
  orgId: string,
  recordId: string,
  sourceType: "attendance_correction" | "leave_request",
  substituteEmployeeId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();
  const table = sourceType === "attendance_correction" ? "attendance_corrections" : "leave_requests";

  const { data: rec, error: fetchErr } = await supabase
    .from(table)
    .select("id, reason")
    .eq("id", recordId)
    .eq("organization_id", orgId)
    .single();

  if (fetchErr || !rec) {
    return { success: false, error: "Record not found or access denied." };
  }

  const { handover, cleanReason } = extractHandoverFromReason(rec.reason);
  if (!handover) {
    return { success: false, error: "No duty handover is registered on this ticket." };
  }

  if (handover.substituteId !== substituteEmployeeId) {
    return { success: false, error: "Only the designated substitute colleague can acknowledge this duty." };
  }

  handover.status = "acknowledged";
  handover.acknowledgedAt = new Date().toISOString();

  const updatedReason = encodeHandoverInReason(cleanReason, handover);

  const { error: updateErr } = await supabase
    .from(table)
    .update({
      reason: updatedReason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", recordId)
    .eq("organization_id", orgId);

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  return { success: true };
}
