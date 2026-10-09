"use server";

import { revalidatePath } from "next/cache";
import {
  createEmployeeTask,
  updateEmployeeTaskStatus,
  exportTasksCsv,
} from "./tasks";
import type { TaskPriority, TaskStatus } from "@ems/types";

export async function createEmployeeTaskAction(formData: {
  organizationId: string;
  employeeId: string;
  createdBy: string;
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: string | null;
  category?: string;
  tags?: string[];
}) {
  const result = await createEmployeeTask(formData);
  revalidatePath("/portal/hr");
  revalidatePath("/portal/employee");
  return result;
}

export async function updateEmployeeTaskStatusAction(
  taskId: string,
  newStatus: TaskStatus,
  actorId: string,
  notes?: string | null
) {
  const result = await updateEmployeeTaskStatus(taskId, newStatus, actorId, notes);
  revalidatePath("/portal/hr");
  revalidatePath("/portal/employee");
  return result;
}

export async function exportTasksCsvAction(orgId: string) {
  return await exportTasksCsv(orgId);
}
