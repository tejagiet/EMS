"use server";

import { revalidatePath } from "next/cache";
import {
  submitPerformanceReview,
  exportReviewsCsv,
} from "./performance";

export async function submitPerformanceReviewAction(formData: {
  reviewId: string;
  actorId: string;
  stage: "self" | "manager" | "acknowledge";
  rating?: number | null;
  comments?: string | null;
}) {
  const result = await submitPerformanceReview(formData);
  revalidatePath("/portal/hr/performance");
  revalidatePath("/portal/employee");
  return result;
}

export async function exportReviewsCsvAction(orgId: string, cycleId?: string) {
  return await exportReviewsCsv(orgId, cycleId);
}
