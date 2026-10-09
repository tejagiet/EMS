"use server";

import { revalidatePath } from "next/cache";
import { getActiveSessionContext } from "../auth/session";
import {
  clockIn,
  clockOut,
  submitAttendanceCorrection,
  reviewAttendanceCorrection,
  exportAttendanceCsv,
} from "./attendance";
import {
  attendanceCorrectionSchema,
  attendanceCorrectionDecisionSchema,
} from "@ems/validation";

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Clock In Server Action (Employee Self-Service)
 */
export async function clockInAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse<{ isLate?: boolean }>> {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    return { success: false, error: "Authentication required to clock in." };
  }

  const employeeId = context.linkedEmployee?.id;
  if (!employeeId) {
    return {
      success: false,
      error: "Your authenticated profile is not currently linked to an active employee record.",
    };
  }

  const notes = formData.get("notes")?.toString() || undefined;
  const result = await clockIn(context.activeOrganization.id, employeeId, notes);

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to clock in." };
  }

  revalidatePath("/portal/employee");
  revalidatePath("/portal/manager");
  revalidatePath("/portal/hr/attendance");

  return { success: true, data: { isLate: Boolean(result.isLate) } };
}

/**
 * Clock Out Server Action (Employee Self-Service)
 */
export async function clockOutAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse<{ durationMinutes?: number; isEarlyDeparture?: boolean }>> {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    return { success: false, error: "Authentication required to clock out." };
  }

  const employeeId = context.linkedEmployee?.id;
  if (!employeeId) {
    return {
      success: false,
      error: "Your authenticated profile is not currently linked to an active employee record.",
    };
  }

  const notes = formData.get("notes")?.toString() || undefined;
  const result = await clockOut(context.activeOrganization.id, employeeId, notes);

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to clock out." };
  }

  revalidatePath("/portal/employee");
  revalidatePath("/portal/manager");
  revalidatePath("/portal/hr/attendance");

  return {
    success: true,
    data: {
      durationMinutes: result.durationMinutes ?? 0,
      isEarlyDeparture: Boolean(result.isEarlyDeparture),
    },
  };
}

/**
 * Submit Attendance Correction Action (Employee Self-Service)
 */
export async function submitAttendanceCorrectionAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    return { success: false, error: "Authentication required." };
  }

  const employeeId = context.linkedEmployee?.id;
  if (!employeeId) {
    return { success: false, error: "Profile not linked to an employee record." };
  }

  const rawData = {
    attendanceRecordId: formData.get("attendanceRecordId")?.toString() || null,
    requestedClockIn: formData.get("requestedClockIn")?.toString() || "",
    requestedClockOut: formData.get("requestedClockOut")?.toString() || "",
    reason: formData.get("reason")?.toString() || "",
  };

  const validation = attendanceCorrectionSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string") fieldErrors[field] = issue.message;
    }
    return { success: false, error: "Validation failed.", fieldErrors };
  }

  const result = await submitAttendanceCorrection(
    context.activeOrganization.id,
    employeeId,
    {
      attendanceRecordId: validation.data.attendanceRecordId || null,
      requestedClockIn: validation.data.requestedClockIn,
      requestedClockOut: validation.data.requestedClockOut,
      reason: validation.data.reason,
    }
  );

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to submit correction request." };
  }

  revalidatePath("/portal/employee");
  revalidatePath("/portal/manager");
  revalidatePath("/portal/hr/attendance");

  return { success: true };
}

/**
 * Review Attendance Correction Action (Manager / HR)
 */
export async function reviewAttendanceCorrectionAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    return { success: false, error: "Authentication required." };
  }

  const canManage =
    context.permissions.includes("attendance.manage") ||
    context.activeRole === "manager" ||
    context.activeRole === "super_admin";

  if (!canManage) {
    return { success: false, error: "Access denied: Missing attendance authorization." };
  }

  const rawData = {
    correctionId: formData.get("correctionId")?.toString() || "",
    decision: formData.get("decision")?.toString() || "",
    rejectionReason: formData.get("rejectionReason")?.toString() || null,
  };

  const validation = attendanceCorrectionDecisionSchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, error: "Invalid review decision format." };
  }

  const result = await reviewAttendanceCorrection(
    validation.data.correctionId,
    validation.data.decision,
    context.userId,
    validation.data.rejectionReason
  );

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to process correction review." };
  }

  revalidatePath("/portal/manager");
  revalidatePath("/portal/hr/attendance");

  return { success: true };
}

/**
 * Export Attendance CSV Action
 */
export async function exportAttendanceCsvAction(
  date?: string
): Promise<{ success: boolean; csvContent?: string; error?: string }> {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    return { success: false, error: "Authentication required." };
  }

  const canRead =
    context.permissions.includes("attendance.read") ||
    context.permissions.includes("attendance.manage") ||
    context.activeRole === "manager" ||
    context.activeRole === "super_admin";

  if (!canRead) {
    return { success: false, error: "Access denied: Missing attendance.read permission." };
  }

  const managerId = context.activeRole === "manager" ? context.linkedEmployee?.id : null;
  const csv = await exportAttendanceCsv(context.activeOrganization.id, managerId, date);

  return { success: true, csvContent: csv };
}
