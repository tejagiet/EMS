"use server";

import { revalidatePath } from "next/cache";
import {
  createAnnouncement,
  markAnnouncementRead,
  exportAnnouncementsCsv,
} from "./announcements";
import type { AnnouncementPriority, AnnouncementTargetType } from "@ems/types";

export async function createAnnouncementAction(formData: {
  organizationId: string;
  authorId: string;
  title: string;
  content: string;
  priority?: AnnouncementPriority;
  targetAudience?: AnnouncementTargetType;
  targetDepartmentId?: string | null;
  targetBranchId?: string | null;
  targetRole?: string | null;
  isPublished?: boolean;
  expiresAt?: string | null;
}) {
  const result = await createAnnouncement(formData);
  revalidatePath("/portal/hr/announcements");
  revalidatePath("/portal/employee");
  return result;
}

export async function markAnnouncementReadAction(
  announcementId: string,
  profileId: string
) {
  const result = await markAnnouncementRead(announcementId, profileId);
  revalidatePath("/portal/hr/announcements");
  revalidatePath("/portal/employee");
  return result;
}

export async function exportAnnouncementsCsvAction(orgId: string) {
  return await exportAnnouncementsCsv(orgId);
}
