import { createClient } from "../supabase/server";
import type {
  Announcement,
  AnnouncementPriority,
  AnnouncementTargetType,
} from "@ems/types";

function sanitizeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  let str = String(val).replace(/"/g, '""');
  if (/^[=\+\-\@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str}"`;
}

interface RawAnnouncement {
  id: string;
  organization_id: string;
  author_id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  target_audience: AnnouncementTargetType;
  target_department_id: string | null;
  target_branch_id: string | null;
  target_role: string | null;
  is_published: boolean;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch announcements with read receipts
 */
export async function getAnnouncements(
  orgId: string,
  currentProfileId?: string
): Promise<(Announcement & { readCount?: number; isReadByCurrentUser?: boolean })[]> {
  const supabase = await createClient();

  const { data: rawAnnouncements, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error || !rawAnnouncements) return [];

  const [profRes, deptRes, branchRes, readRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name"),
    supabase.from("departments").select("id, name").eq("organization_id", orgId),
    supabase.from("branches").select("id, name").eq("organization_id", orgId),
    supabase.from("announcement_reads").select("announcement_id, profile_id"),
  ]);

  const profMap = new Map((profRes.data ?? []).map((p) => [p.id, p.full_name]));
  const deptMap = new Map((deptRes.data ?? []).map((d) => [d.id, d.name]));
  const branchMap = new Map((branchRes.data ?? []).map((b) => [b.id, b.name]));

  const readsByAnn = new Map<string, { count: number; readByMe: boolean }>();
  for (const r of readRes.data ?? []) {
    const cur = readsByAnn.get(r.announcement_id) ?? { count: 0, readByMe: false };
    cur.count += 1;
    if (currentProfileId && r.profile_id === currentProfileId) {
      cur.readByMe = true;
    }
    readsByAnn.set(r.announcement_id, cur);
  }

  return (rawAnnouncements as RawAnnouncement[]).map((a) => {
    const stats = readsByAnn.get(a.id) ?? { count: 0, readByMe: false };
    const targetLabel =
      a.target_audience === "department" && a.target_department_id
        ? deptMap.get(a.target_department_id)
        : a.target_audience === "branch" && a.target_branch_id
        ? branchMap.get(a.target_branch_id)
        : undefined;

    return {
      id: a.id,
      organizationId: a.organization_id,
      authorId: a.author_id,
      authorName: profMap.get(a.author_id) ?? "HR Announcement",
      title: a.title,
      body: a.content,
      status: a.is_published ? "published" : "draft",
      targetType: a.target_audience,
      targetId: a.target_department_id ?? a.target_branch_id ?? a.target_role ?? null,
      targetLabel,
      priority: a.priority,
      publishedAt: a.published_at,
      expiresAt: a.expires_at,
      readCount: stats.count,
      isRead: stats.readByMe,
      isReadByCurrentUser: stats.readByMe,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    };
  });
}

/**
 * Create announcement and optionally publish immediately
 */
export async function createAnnouncement(payload: {
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
  const supabase = await createClient();

  const isPub = payload.isPublished ?? true;
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      organization_id: payload.organizationId,
      author_id: payload.authorId,
      title: payload.title.trim(),
      content: payload.content.trim(),
      priority: payload.priority ?? "normal",
      target_audience: payload.targetAudience ?? "all",
      target_department_id: payload.targetDepartmentId ?? null,
      target_branch_id: payload.targetBranchId ?? null,
      target_role: payload.targetRole ?? null,
      is_published: isPub,
      published_at: isPub ? new Date().toISOString() : null,
      expires_at: payload.expiresAt ?? null,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, announcementId: data.id };
}

/**
 * Acknowledge announcement read
 */
export async function markAnnouncementRead(announcementId: string, profileId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("announcement_reads")
    .insert({
      announcement_id: announcementId,
      profile_id: profileId,
      read_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error && !error.message.includes("duplicate")) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Formula-safe CSV export for announcements
 */
export async function exportAnnouncementsCsv(orgId: string): Promise<string> {
  const announcements = await getAnnouncements(orgId);

  const headers = [
    "Announcement ID",
    "Title",
    "Author",
    "Priority",
    "Audience",
    "Published At",
    "Reads",
  ];

  const rows = announcements.map((a) => [
    sanitizeCsv(a.id),
    sanitizeCsv(a.title),
    sanitizeCsv(a.authorName ?? "HR"),
    sanitizeCsv(a.priority),
    sanitizeCsv(a.targetType),
    sanitizeCsv(a.publishedAt ?? "Draft"),
    sanitizeCsv(a.readCount ?? 0),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}
