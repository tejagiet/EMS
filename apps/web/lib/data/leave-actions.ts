"use server";

import { revalidatePath } from "next/cache";
import { getActiveSessionContext } from "../auth/session";
import {
  submitLeaveRequest,
  reviewLeaveRequest,
  upsertLeaveType,
  exportLeaveReportCsv,
} from "./leave";
import {
  leaveRequestSchema,
  leaveDecisionSchema,
  leaveTypeSchema,
} from "@ems/validation";

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Submit Leave Request Action (Employee Self-Service)
 */
export async function submitLeaveRequestAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    return { success: false, error: "Authentication required to submit leave requests." };
  }

  const employeeId = context.linkedEmployee?.id;
  if (!employeeId) {
    return { success: false, error: "Your profile is not linked to an employee record." };
  }

  const rawData = {
    leaveTypeId: formData.get("leaveTypeId")?.toString() || "",
    startDate: formData.get("startDate")?.toString() || "",
    endDate: formData.get("endDate")?.toString() || "",
    totalDays: Number(formData.get("totalDays") || 0),
    reason: formData.get("reason")?.toString() || "",
  };

  const validation = leaveRequestSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string") fieldErrors[field] = issue.message;
    }
    return { success: false, error: "Validation failed.", fieldErrors };
  }

  const result = await submitLeaveRequest(
    context.activeOrganization.id,
    employeeId,
    validation.data
  );

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to apply for leave." };
  }

  revalidatePath("/portal/employee");
  revalidatePath("/portal/manager");
  revalidatePath("/portal/hr/leave");

  return { success: true };
}

/**
 * Review Leave Request Action (Manager / HR)
 */
export async function reviewLeaveRequestAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    return { success: false, error: "Authentication required." };
  }

  const canApprove =
    context.permissions.includes("leave.approve") ||
    context.activeRole === "org_admin" ||
    context.activeRole === "hr_manager" ||
    context.activeRole === "manager" ||
    context.activeRole === "super_admin";

  if (!canApprove) {
    return { success: false, error: "Access denied: Missing leave.approve permission." };
  }

  const rawData = {
    requestId: formData.get("requestId")?.toString() || "",
    decision: formData.get("decision")?.toString() || "",
    rejectionReason: formData.get("rejectionReason")?.toString() || null,
  };

  const validation = leaveDecisionSchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, error: "Invalid leave review decision format." };
  }

  const result = await reviewLeaveRequest(
    validation.data.requestId,
    validation.data.decision,
    context.userId,
    validation.data.rejectionReason
  );

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to process leave decision." };
  }

  revalidatePath("/portal/manager");
  revalidatePath("/portal/hr/leave");
  revalidatePath("/portal/employee");

  return { success: true };
}

/**
 * Upsert Leave Type Action (HR / Admin)
 */
export async function upsertLeaveTypeAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    return { success: false, error: "Authentication required." };
  }

  const canManage =
    context.permissions.includes("leave.approve") ||
    context.permissions.includes("organization.write") ||
    context.activeRole === "super_admin";

  if (!canManage) {
    return { success: false, error: "Access denied: Missing policy management permission." };
  }

  const id = formData.get("id")?.toString() || undefined;
  const rawData = {
    name: formData.get("name")?.toString() || "",
    code: formData.get("code")?.toString() || "",
    daysPerYear: Number(formData.get("daysPerYear") || 12),
    isPaid: formData.get("isPaid") !== "false",
    carryForwardDays: Number(formData.get("carryForwardDays") || 0),
    isActive: formData.get("isActive") !== "false",
  };

  const validation = leaveTypeSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string") fieldErrors[field] = issue.message;
    }
    return { success: false, error: "Validation failed.", fieldErrors };
  }

  const result = await upsertLeaveType(context.activeOrganization.id, {
    ...validation.data,
    ...(id ? { id } : {}),
  });

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to save leave type." };
  }

  revalidatePath("/portal/hr/leave");
  return { success: true };
}

/**
 * Export Leave Report CSV Action
 */
export async function exportLeaveReportCsvAction(): Promise<{
  success: boolean;
  csvContent?: string;
  error?: string;
}> {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    return { success: false, error: "Authentication required." };
  }

  const canRead =
    context.permissions.includes("leave.read") ||
    context.permissions.includes("leave.approve") ||
    context.activeRole === "manager" ||
    context.activeRole === "super_admin";

  if (!canRead) {
    return { success: false, error: "Access denied: Missing leave.read permission." };
  }

  const managerId = context.activeRole === "manager" ? context.linkedEmployee?.id : null;
  const csv = await exportLeaveReportCsv(context.activeOrganization.id, managerId);

  return { success: true, csvContent: csv };
}
