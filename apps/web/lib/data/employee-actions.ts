"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserContext as getActiveSessionContext } from "../auth/session";
import {
  createEmployee,
  updateEmployee,
  setEmployeeStatus,
  upsertDepartment,
  deleteDepartment,
  upsertBranch,
  deleteBranch,
  upsertDesignation,
  importEmployeesFromRows,
  exportEmployeesCsv,
} from "./employees";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  departmentSchema,
  branchSchema,
  designationSchema,
  employeeImportRowSchema,
} from "@ems/validation";
import type { EmployeeImportRow } from "@ems/types";
import { setEmployeePasswordAction } from "./credentials";

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Create Employee Server Action
 */
export async function createEmployeeAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse<{ employeeId: string }>> {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    return { success: false, error: "Authentication required to perform this operation." };
  }

  // Authorization check
  const canWrite = context.permissions.includes("employee.write") || context.activeRole === "super_admin";
  if (!canWrite) {
    return { success: false, error: "Access denied: You do not hold employee.write permission." };
  }

  const rawData: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    if (value !== "") {
      rawData[key] = value;
    }
  });

  // Handle numbers
  if (rawData.noticePeriodDays) {
    rawData.noticePeriodDays = Number(rawData.noticePeriodDays);
  }

  const validation = createEmployeeSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string") {
        fieldErrors[field] = issue.message;
      }
    }
    return { success: false, error: "Validation failed on submitted fields.", fieldErrors };
  }

  const input = validation.data;
  const result = await createEmployee({
    organizationId: context.activeOrganization.id,
    firstName: input.firstName,
    lastName: input.lastName,
    employeeCode: input.employeeCode,
    workEmail: input.workEmail,
    contactNumber: input.contactNumber,
    workPhone: input.workPhone,
    branchId: input.branchId,
    departmentId: input.departmentId,
    designationId: input.designationId,
    reportingManagerId: input.reportingManagerId,
    employmentType: input.employmentType,
    employmentStatus: input.employmentStatus,
    dateOfJoining: input.dateOfJoining,
    dateOfConfirmation: input.dateOfConfirmation,
    noticePeriodDays: input.noticePeriodDays,
    emergencyContactName: input.emergencyContactName,
    emergencyContactRelationship: input.emergencyContactRelationship,
    emergencyContactPhone: input.emergencyContactPhone,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2,
    city: input.city,
    state: input.state,
    postalCode: input.postalCode,
    country: input.country,
    workLocation: input.workLocation,
    notes: input.notes,
  });

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to create employee record." };
  }

  const initialPassword = formData.get("initialPassword")?.toString()?.trim() || "Welcome@EMS2026";
  if (result.employeeId && input.workEmail) {
    try {
      await setEmployeePasswordAction(result.employeeId, initialPassword);
    } catch (passErr) {
      console.warn("[createEmployeeAction] Failed setting initial password:", passErr);
    }
  }

  revalidatePath("/portal/hr/employees");
  revalidatePath("/portal/hr");
  return { success: true, data: { employeeId: result.employeeId! } };
}

/**
 * Update Employee Server Action
 */
export async function updateEmployeeAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    return { success: false, error: "Authentication required." };
  }

  const canWrite = context.permissions.includes("employee.write") || context.activeRole === "super_admin";
  if (!canWrite) {
    return { success: false, error: "Access denied: Missing employee.write permission." };
  }

  const rawData: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    if (value !== "") {
      rawData[key] = value;
    }
  });

  if (rawData.noticePeriodDays) {
    rawData.noticePeriodDays = Number(rawData.noticePeriodDays);
  }

  const validation = updateEmployeeSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string") {
        fieldErrors[field] = issue.message;
      }
    }
    return { success: false, error: "Validation failed.", fieldErrors };
  }

  const input = validation.data;
  const result = await updateEmployee({
    ...input,
    organizationId: context.activeOrganization.id,
  });

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to update employee." };
  }

  revalidatePath(`/portal/hr/employees/${input.id}`);
  revalidatePath("/portal/hr/employees");
  revalidatePath("/portal/hr");
  return { success: true };
}

/**
 * Change Employee Status Action (Deactivate / Reactivate / Terminate)
 */
export async function changeEmployeeStatusAction(
  employeeId: string,
  status: "active" | "inactive" | "terminated" | "resigned" | "suspended",
  reason?: string
): Promise<ActionResponse> {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    return { success: false, error: "Authentication required." };
  }

  const canWrite = context.permissions.includes("employee.write") || context.activeRole === "super_admin";
  if (!canWrite) {
    return { success: false, error: "Access denied: Missing employee.write permission." };
  }

  const result = await setEmployeeStatus(
    context.activeOrganization.id,
    employeeId,
    status,
    reason
  );

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to change employment status." };
  }

  revalidatePath(`/portal/hr/employees/${employeeId}`);
  revalidatePath("/portal/hr/employees");
  revalidatePath("/portal/hr");
  return { success: true };
}

/**
 * Manage Department Action
 */
export async function manageDepartmentAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    return { success: false, error: "Authentication required." };
  }

  const canWrite = context.permissions.includes("organization.write") || context.activeRole === "super_admin";
  if (!canWrite) {
    return { success: false, error: "Access denied: Missing organization.write permission." };
  }

  const id = formData.get("id")?.toString() || undefined;
  const rawData = {
    name: formData.get("name")?.toString() || "",
    code: formData.get("code")?.toString() || "",
    branchId: formData.get("branchId")?.toString() || null,
    headOfDepartmentId: formData.get("headOfDepartmentId")?.toString() || null,
    parentDepartmentId: formData.get("parentDepartmentId")?.toString() || null,
    description: formData.get("description")?.toString() || null,
    isActive: formData.get("isActive") !== "false",
  };

  const validation = departmentSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string") fieldErrors[field] = issue.message;
    }
    return { success: false, error: "Validation failed.", fieldErrors };
  }

  const result = await upsertDepartment(context.activeOrganization.id, {
    ...validation.data,
    ...(id ? { id } : {}),
  });

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to save department." };
  }

  revalidatePath("/portal/hr/departments");
  return { success: true };
}

/**
 * Manage Branch Action
 */
export async function manageBranchAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    return { success: false, error: "Authentication required." };
  }

  const canWrite = context.permissions.includes("organization.write") || context.activeRole === "super_admin";
  if (!canWrite) {
    return { success: false, error: "Access denied: Missing organization.write permission." };
  }

  const id = formData.get("id")?.toString() || undefined;
  const rawData = {
    name: formData.get("name")?.toString() || "",
    code: formData.get("code")?.toString() || "",
    address: formData.get("address")?.toString() || null,
    phone: formData.get("phone")?.toString() || null,
    email: formData.get("email")?.toString() || null,
    isActive: formData.get("isActive") !== "false",
  };

  const validation = branchSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string") fieldErrors[field] = issue.message;
    }
    return { success: false, error: "Validation failed.", fieldErrors };
  }

  const result = await upsertBranch(context.activeOrganization.id, {
    ...validation.data,
    ...(id ? { id } : {}),
  });

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to save branch." };
  }

  revalidatePath("/portal/hr/branches");
  return { success: true };
}

/**
 * Delete Branch Action
 */
export async function deleteBranchAction(branchId: string): Promise<ActionResponse> {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    return { success: false, error: "Authentication required." };
  }

  const canWrite = context.permissions.includes("organization.write") || context.activeRole === "super_admin";
  if (!canWrite) {
    return { success: false, error: "Access denied: Missing organization.write permission." };
  }

  const result = await deleteBranch(context.activeOrganization.id, branchId);
  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to delete branch." };
  }

  revalidatePath("/portal/hr/branches");
  revalidatePath("/portal/org-admin/branches");
  return { success: true };
}

/**
 * Delete Department Action
 */
export async function deleteDepartmentAction(departmentId: string): Promise<ActionResponse> {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    return { success: false, error: "Authentication required." };
  }

  const canWrite = context.permissions.includes("organization.write") || context.activeRole === "super_admin";
  if (!canWrite) {
    return { success: false, error: "Access denied: Missing organization.write permission." };
  }

  const result = await deleteDepartment(context.activeOrganization.id, departmentId);
  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to delete department." };
  }

  revalidatePath("/portal/hr/departments");
  revalidatePath("/portal/org-admin/departments");
  return { success: true };
}

/**
 * Manage Designation Action
 */
export async function manageDesignationAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    return { success: false, error: "Authentication required." };
  }

  const canWrite = context.permissions.includes("organization.write") || context.activeRole === "super_admin";
  if (!canWrite) {
    return { success: false, error: "Access denied: Missing organization.write permission." };
  }

  const id = formData.get("id")?.toString() || undefined;
  const rawData = {
    name: formData.get("name")?.toString() || "",
    code: formData.get("code")?.toString() || "",
    departmentId: formData.get("departmentId")?.toString() || null,
    grade: formData.get("grade")?.toString() || null,
    level: formData.get("level") ? Number(formData.get("level")) : null,
    isActive: formData.get("isActive") !== "false",
  };

  const validation = designationSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string") fieldErrors[field] = issue.message;
    }
    return { success: false, error: "Validation failed.", fieldErrors };
  }

  const result = await upsertDesignation(context.activeOrganization.id, {
    ...validation.data,
    ...(id ? { id } : {}),
  });

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to save designation." };
  }

  revalidatePath("/portal/hr/designations");
  return { success: true };
}

/**
 * Batch CSV Import Action
 */
export async function importEmployeesCsvAction(
  parsedRows: EmployeeImportRow[]
): Promise<ActionResponse<{ importedCount: number; failedCount: number; errors: unknown[] }>> {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    return { success: false, error: "Authentication required." };
  }

  const canWrite = context.permissions.includes("employee.write") || context.activeRole === "super_admin";
  if (!canWrite) {
    return { success: false, error: "Access denied: Missing employee.write permission." };
  }

  // Pre-validate row schemas
  const validatedRows: EmployeeImportRow[] = [];
  const errors: Array<{ rowNumber: number; employeeCode?: string; message: string }> = [];

  parsedRows.forEach((row, idx) => {
    const val = employeeImportRowSchema.safeParse(row);
    if (!val.success) {
      errors.push({
        rowNumber: idx + 1,
        ...(row.employeeCode ? { employeeCode: row.employeeCode } : {}),
        message: val.error.issues.map((i) => i.message).join("; "),
      });
    } else {
      validatedRows.push(val.data as EmployeeImportRow);
    }
  });

  const importResult = await importEmployeesFromRows(context.activeOrganization.id, validatedRows);

  const combinedErrors = [...errors, ...importResult.errors];

  revalidatePath("/portal/hr/employees");
  revalidatePath("/portal/hr");

  return {
    success: true,
    data: {
      importedCount: importResult.importedCount,
      failedCount: combinedErrors.length,
      errors: combinedErrors,
    },
  };
}

/**
 * Export Employees to CSV Action
 */
export async function exportEmployeesCsvAction(
  filters: Record<string, string>
): Promise<ActionResponse<{ csvContent: string }>> {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    return { success: false, error: "Authentication required." };
  }

  const canRead = context.permissions.includes("employee.read") || context.activeRole === "super_admin";
  if (!canRead) {
    return { success: false, error: "Access denied: Missing employee.read permission." };
  }

  const csvContent = await exportEmployeesCsv(context.activeOrganization.id, filters);
  return {
    success: true,
    data: { csvContent },
  };
}
