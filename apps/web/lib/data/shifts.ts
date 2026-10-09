import { createClient } from "../supabase/server";
import type { Shift, ShiftAssignment } from "@ems/types";

interface RawShift {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
  grace_period_minutes: number;
  applicable_days: number[];
  is_overnight: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RawAssignment {
  id: string;
  organization_id: string;
  employee_id: string;
  shift_id: string;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 1. Get All Shifts for Organization
 */
export async function getShiftsList(orgId: string): Promise<Shift[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("shifts")
    .select("*")
    .eq("organization_id", orgId)
    .order("code");

  const rawList = (data as RawShift[] | null) ?? [];

  return rawList.map((s) => ({
    id: s.id,
    organizationId: s.organization_id,
    name: s.name,
    code: s.code,
    startTime: s.start_time,
    endTime: s.end_time,
    breakDurationMinutes: s.break_duration_minutes,
    gracePeriodMinutes: s.grace_period_minutes,
    applicableDays: Array.isArray(s.applicable_days) ? s.applicable_days : [1, 2, 3, 4, 5],
    isOvernight: s.is_overnight,
    isActive: s.is_active,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  }));
}

/**
 * 2. Upsert Shift Definition
 */
export async function upsertShift(
  orgId: string,
  payload: {
    id?: string;
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    breakDurationMinutes?: number;
    gracePeriodMinutes?: number;
    applicableDays?: number[];
    isOvernight?: boolean;
    isActive?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Automatic overnight shift detection if not explicitly passed
  let overnight = payload.isOvernight ?? false;
  if (payload.startTime && payload.endTime && payload.endTime < payload.startTime) {
    overnight = true;
  }

  if (payload.id) {
    const { error } = await supabase
      .from("shifts")
      .update({
        name: payload.name.trim(),
        code: payload.code.trim().toUpperCase(),
        start_time: payload.startTime,
        end_time: payload.endTime,
        break_duration_minutes: payload.breakDurationMinutes ?? 60,
        grace_period_minutes: payload.gracePeriodMinutes ?? 15,
        applicable_days: payload.applicableDays ?? [1, 2, 3, 4, 5],
        is_overnight: overnight,
        is_active: payload.isActive ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", orgId)
      .eq("id", payload.id);

    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("shifts").insert({
      organization_id: orgId,
      name: payload.name.trim(),
      code: payload.code.trim().toUpperCase(),
      start_time: payload.startTime,
      end_time: payload.endTime,
      break_duration_minutes: payload.breakDurationMinutes ?? 60,
      grace_period_minutes: payload.gracePeriodMinutes ?? 15,
      applicable_days: payload.applicableDays ?? [1, 2, 3, 4, 5],
      is_overnight: overnight,
      is_active: payload.isActive ?? true,
    });

    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 3. Get Active Shift Assignments
 */
export async function getShiftAssignments(
  orgId: string,
  employeeId?: string
): Promise<ShiftAssignment[]> {
  const supabase = await createClient();

  let query = supabase
    .from("shift_assignments")
    .select("*, shifts(name, code), employees(employee_code, first_name, last_name)")
    .eq("organization_id", orgId)
    .order("effective_from", { ascending: false });

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }

  const { data } = await query;
  const rawList = (data as Array<
    RawAssignment & {
      shifts?: { name: string; code: string } | null;
      employees?: { employee_code: string; first_name: string | null; last_name: string | null } | null;
    }
  > | null) ?? [];

  return rawList.map((a) => {
    const emp = a.employees;
    const empName = emp
      ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() || `Employee ${emp.employee_code}`
      : undefined;

    return {
      id: a.id,
      organizationId: a.organization_id,
      employeeId: a.employee_id,
      shiftId: a.shift_id,
      effectiveFrom: a.effective_from,
      effectiveTo: a.effective_to,
      isActive: a.is_active,
      shiftName: a.shifts?.name,
      shiftCode: a.shifts?.code,
      employeeName: empName,
      employeeCode: emp?.employee_code,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    };
  });
}

/**
 * 4. Assign Shift to Employee with Overlap Conflict Prevention
 */
export async function assignShift(
  orgId: string,
  payload: {
    id?: string | undefined;
    employeeId: string;
    shiftId: string;
    effectiveFrom: string;
    effectiveTo?: string | null | undefined;
    isActive?: boolean | undefined;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Overlap conflict check
  const { data: existing } = await supabase
    .from("shift_assignments")
    .select("id, effective_from, effective_to")
    .eq("organization_id", orgId)
    .eq("employee_id", payload.employeeId)
    .eq("is_active", true);

  const existingList = (existing as Array<{ id: string; effective_from: string; effective_to: string | null }> | null) ?? [];
  const from = payload.effectiveFrom;
  const to = payload.effectiveTo || "9999-12-31";

  for (const ex of existingList) {
    if (payload.id && ex.id === payload.id) continue;
    const exFrom = ex.effective_from;
    const exTo = ex.effective_to || "9999-12-31";

    // Overlap condition: from <= exTo && to >= exFrom
    if (from <= exTo && to >= exFrom) {
      return {
        success: false,
        error: `Schedule conflict: An active shift assignment already exists for this employee covering ${exFrom} to ${ex.effective_to ?? "Indefinite"}.`,
      };
    }
  }

  if (payload.id) {
    const { error } = await supabase
      .from("shift_assignments")
      .update({
        shift_id: payload.shiftId,
        effective_from: payload.effectiveFrom,
        effective_to: payload.effectiveTo || null,
        is_active: payload.isActive ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", orgId)
      .eq("id", payload.id);

    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("shift_assignments").insert({
      organization_id: orgId,
      employee_id: payload.employeeId,
      shift_id: payload.shiftId,
      effective_from: payload.effectiveFrom,
      effective_to: payload.effectiveTo || null,
      is_active: payload.isActive ?? true,
    });

    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}
