"use server";

import { revalidatePath } from "next/cache";
import { getActiveSessionContext } from "../auth/session";
import { upsertShift, assignShift } from "./shifts";
import { shiftSchema, shiftAssignmentSchema } from "@ems/validation";

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Upsert Shift Definition (HR / Admin)
 */
export async function upsertShiftAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    return { success: false, error: "Authentication required." };
  }

  const canManage =
    context.permissions.includes("attendance.manage") ||
    context.permissions.includes("organization.write") ||
    context.activeRole === "super_admin";

  if (!canManage) {
    return { success: false, error: "Access denied: Missing attendance.manage permission." };
  }

  const id = formData.get("id")?.toString() || undefined;
  const daysStr = formData.get("applicableDays")?.toString() || "[1,2,3,4,5]";
  let applicableDays: number[] = [1, 2, 3, 4, 5];
  try {
    applicableDays = JSON.parse(daysStr);
  } catch {
    applicableDays = [1, 2, 3, 4, 5];
  }

  const rawData = {
    name: formData.get("name")?.toString() || "",
    code: formData.get("code")?.toString() || "",
    startTime: formData.get("startTime")?.toString() || "",
    endTime: formData.get("endTime")?.toString() || "",
    breakDurationMinutes: Number(formData.get("breakDurationMinutes") || 60),
    gracePeriodMinutes: Number(formData.get("gracePeriodMinutes") || 15),
    applicableDays,
    isOvernight: formData.get("isOvernight") === "true",
    isActive: formData.get("isActive") !== "false",
  };

  const validation = shiftSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string") fieldErrors[field] = issue.message;
    }
    return { success: false, error: "Validation failed.", fieldErrors };
  }

  const result = await upsertShift(context.activeOrganization.id, {
    ...validation.data,
    ...(id ? { id } : {}),
  });

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to save shift." };
  }

  revalidatePath("/portal/hr/shifts");
  return { success: true };
}

/**
 * Assign Shift to Employee (HR / Admin)
 */
export async function assignShiftAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    return { success: false, error: "Authentication required." };
  }

  const canManage =
    context.permissions.includes("attendance.manage") ||
    context.permissions.includes("organization.write") ||
    context.activeRole === "super_admin";

  if (!canManage) {
    return { success: false, error: "Access denied: Missing attendance.manage permission." };
  }

  const id = formData.get("id")?.toString() || undefined;
  const rawData = {
    employeeId: formData.get("employeeId")?.toString() || "",
    shiftId: formData.get("shiftId")?.toString() || "",
    effectiveFrom: formData.get("effectiveFrom")?.toString() || "",
    effectiveTo: formData.get("effectiveTo")?.toString() || null,
    isActive: formData.get("isActive") !== "false",
  };

  const validation = shiftAssignmentSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string") fieldErrors[field] = issue.message;
    }
    return { success: false, error: "Validation failed.", fieldErrors };
  }

  const result = await assignShift(context.activeOrganization.id, {
    employeeId: validation.data.employeeId,
    shiftId: validation.data.shiftId,
    effectiveFrom: validation.data.effectiveFrom,
    effectiveTo: validation.data.effectiveTo ?? null,
    isActive: validation.data.isActive,
    ...(id ? { id } : {}),
  });

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to assign shift." };
  }

  revalidatePath("/portal/hr/shifts");
  revalidatePath("/portal/manager");
  return { success: true };
}
