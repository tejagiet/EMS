"use server";

import { revalidatePath } from "next/cache";
import {
  createOnboardingCase,
  updateOnboardingTask,
  completeOnboardingCase,
  exportOnboardingCsv,
} from "./onboarding";
import type { OnboardingTask } from "@ems/types";

export async function createOnboardingCaseAction(formData: {
  orgId: string;
  employeeId: string;
  joiningDate: string;
  deptId?: string | null;
  desigId?: string | null;
  branchId?: string | null;
  managerId?: string | null;
  templateId?: string | null;
  createdBy?: string | null;
  candidateId?: string | null;
}) {
  const result = await createOnboardingCase(
    formData.orgId,
    formData.employeeId,
    formData.joiningDate,
    formData.deptId,
    formData.desigId,
    formData.branchId,
    formData.managerId,
    formData.templateId,
    formData.createdBy,
    formData.candidateId
  );
  revalidatePath("/portal/hr/onboarding");
  revalidatePath("/portal/hr");
  return result;
}

export async function updateOnboardingTaskAction(
  taskId: string,
  status: OnboardingTask["status"],
  actorId: string,
  notes?: string | null
) {
  const result = await updateOnboardingTask(taskId, status, actorId, notes);
  revalidatePath("/portal/hr/onboarding");
  return result;
}

export async function completeOnboardingCaseAction(
  caseId: string,
  actorId: string,
  notes?: string | null
) {
  const result = await completeOnboardingCase(caseId, actorId, notes);
  revalidatePath("/portal/hr/onboarding");
  revalidatePath("/portal/hr");
  return result;
}

export async function exportOnboardingCsvAction(orgId: string) {
  return await exportOnboardingCsv(orgId);
}
