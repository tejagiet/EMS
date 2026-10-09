"use server";

import { revalidatePath } from "next/cache";
import {
  initiateOffboardingCase,
  updateClearanceItem,
  processOffboardingDecision,
  exportOffboardingCsv,
} from "./offboarding";
import type { OffboardingCase, ClearanceStatus } from "@ems/types";

export async function initiateOffboardingCaseAction(formData: {
  orgId: string;
  employeeId: string;
  exitType: OffboardingCase["exitType"];
  reason: string;
  lastWorkingDate: string;
  resignationDate?: string | null;
  noticePeriodDays?: number;
  handoverNotes?: string | null;
  notes?: string | null;
  createdBy?: string | null;
}) {
  const result = await initiateOffboardingCase(
    formData.orgId,
    formData.employeeId,
    formData.exitType,
    formData.reason,
    formData.lastWorkingDate,
    formData.resignationDate,
    formData.noticePeriodDays ?? 30,
    formData.handoverNotes,
    formData.notes,
    formData.createdBy
  );
  revalidatePath("/portal/hr/offboarding");
  revalidatePath("/portal/hr");
  return result;
}

export async function updateClearanceItemAction(
  itemId: string,
  status: ClearanceStatus,
  actorId: string,
  notes?: string | null
) {
  const result = await updateClearanceItem(itemId, status, actorId, notes);
  revalidatePath("/portal/hr/offboarding");
  return result;
}

export async function processOffboardingDecisionAction(
  caseId: string,
  decision: "complete" | "cancel",
  actorId: string,
  notes?: string | null,
  rehireEligible: boolean = true
) {
  const result = await processOffboardingDecision(
    caseId,
    decision,
    actorId,
    notes,
    rehireEligible
  );
  revalidatePath("/portal/hr/offboarding");
  revalidatePath("/portal/hr");
  revalidatePath("/portal/employees");
  return result;
}

export async function exportOffboardingCsvAction(orgId: string) {
  return await exportOffboardingCsv(orgId);
}
