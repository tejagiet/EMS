"use server";

import { revalidatePath } from "next/cache";
import { verifyPortalAccess } from "../auth/session";
import {
  salaryStructureSchema,
  payrollRunCreateSchema,
  payrollDecisionSchema,
} from "@ems/validation";
import {
  upsertSalaryStructure,
  createPayrollRun,
  processPayrollRunDecision,
  exportPayrollRunCsv,
  getPayrollRunDetails,
} from "./payroll";

export interface PayrollActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  data?: unknown;
}

/**
 * 1. Upsert Salary Structure Action
 */
export async function upsertSalaryStructureAction(
  formData: FormData
): Promise<PayrollActionResult> {
  const context = await verifyPortalAccess("finance_payroll_manager", {
    allowRoles: ["org_admin", "super_admin"],
  });
  if (!context.activeOrganization) {
    return { success: false, error: "Active organization context required." };
  }

  const id = formData.get("id")?.toString() || undefined;
  let allowances = [];
  let deductions = [];

  try {
    const rawAllowances = formData.get("allowances")?.toString();
    if (rawAllowances) allowances = JSON.parse(rawAllowances);
  } catch {
    allowances = [];
  }

  try {
    const rawDeductions = formData.get("deductions")?.toString();
    if (rawDeductions) deductions = JSON.parse(rawDeductions);
  } catch {
    deductions = [];
  }

  const rawData = {
    employeeId: formData.get("employeeId")?.toString() || "",
    baseSalary: Number(formData.get("baseSalary") || 0),
    currency: formData.get("currency")?.toString() || "INR",
    paymentFrequency: (formData.get("paymentFrequency")?.toString() || "monthly") as
      | "monthly"
      | "bi_weekly"
      | "weekly",
    allowances,
    deductions,
    effectiveFrom: formData.get("effectiveFrom")?.toString() || "",
    effectiveTo: formData.get("effectiveTo")?.toString() || null,
    isActive: formData.get("isActive") !== "false",
    notes: formData.get("notes")?.toString() || null,
  };

  const validation = salaryStructureSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string") fieldErrors[field] = issue.message;
    }
    return { success: false, error: "Validation failed.", fieldErrors };
  }

  const result = await upsertSalaryStructure(context.activeOrganization.id, {
    id: id || undefined,
    employeeId: validation.data.employeeId,
    baseSalary: validation.data.baseSalary,
    currency: validation.data.currency,
    paymentFrequency: validation.data.paymentFrequency,
    allowances: validation.data.allowances,
    deductions: validation.data.deductions,
    effectiveFrom: validation.data.effectiveFrom,
    effectiveTo: validation.data.effectiveTo ?? null,
    isActive: validation.data.isActive,
    notes: validation.data.notes ?? null,
    createdBy: context.profile?.id,
  });

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to save salary structure." };
  }

  revalidatePath("/portal/finance-payroll");
  return { success: true };
}

/**
 * 2. Create Payroll Run Action
 */
export async function createPayrollRunAction(
  formData: FormData
): Promise<PayrollActionResult> {
  const context = await verifyPortalAccess("finance_payroll_manager", {
    allowRoles: ["org_admin", "super_admin"],
  });
  if (!context.activeOrganization || !context.profile) {
    return { success: false, error: "Active organization context required." };
  }

  const rawData = {
    title: formData.get("title")?.toString() || "",
    periodStart: formData.get("periodStart")?.toString() || "",
    periodEnd: formData.get("periodEnd")?.toString() || "",
    paymentDate: formData.get("paymentDate")?.toString() || "",
    notes: formData.get("notes")?.toString() || null,
  };

  const validation = payrollRunCreateSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string") fieldErrors[field] = issue.message;
    }
    return { success: false, error: "Validation failed.", fieldErrors };
  }

  const result = await createPayrollRun(context.activeOrganization.id, {
    title: validation.data.title,
    periodStart: validation.data.periodStart,
    periodEnd: validation.data.periodEnd,
    paymentDate: validation.data.paymentDate,
    preparerId: context.profile.id,
  });

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to create payroll run." };
  }

  revalidatePath("/portal/finance-payroll");
  return { success: true, data: { payrollRunId: result.payrollRunId } };
}

/**
 * 3. Process Payroll Run Decision Action (Submit, Approve, Reject, Correct)
 */
export async function processPayrollDecisionAction(
  formData: FormData
): Promise<PayrollActionResult> {
  const context = await verifyPortalAccess("finance_payroll_manager", {
    allowRoles: ["org_admin", "super_admin"],
  });
  if (!context.profile) {
    return { success: false, error: "Authenticated profile context required." };
  }

  const rawData = {
    runId: formData.get("runId")?.toString() || "",
    decision: formData.get("decision")?.toString() as "submit" | "approve" | "reject" | "correct",
    notes: formData.get("notes")?.toString() || null,
  };

  const validation = payrollDecisionSchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, error: "Invalid payroll decision payload." };
  }

  const result = await processPayrollRunDecision(
    validation.data.runId,
    validation.data.decision,
    context.profile.id,
    validation.data.notes ?? undefined
  );

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to process decision." };
  }

  revalidatePath("/portal/finance-payroll");
  revalidatePath("/portal/employee");
  return { success: true };
}

/**
 * 4. Export Payroll Run CSV Action
 */
export async function exportPayrollRunCsvAction(runId: string): Promise<string> {
  await verifyPortalAccess("finance_payroll_manager", {
    allowRoles: ["org_admin", "super_admin"],
  });
  return exportPayrollRunCsv(runId);
}

/**
 * 5. Get Payroll Run Details Action
 */
export async function getPayrollRunDetailsAction(runId: string) {
  await verifyPortalAccess("finance_payroll_manager", {
    allowRoles: ["org_admin", "super_admin"],
  });
  return getPayrollRunDetails(runId);
}
