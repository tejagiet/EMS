import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import type {
  EmployeeDocument,
  DocumentCategory,
  DocumentVerificationStatus,
} from "@ems/types";

function sanitizeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  let str = String(val).replace(/"/g, '""');
  if (/^[=\+\-\@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str}"`;
}

interface RawDoc {
  id: string;
  organization_id: string;
  employee_id: string;
  category: DocumentCategory;
  title: string;
  description: string | null;
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  verification_status: DocumentVerificationStatus;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch documents for organization or specific employee
 */
export async function getDocuments(
  orgId: string,
  employeeId?: string,
  categoryFilter?: DocumentCategory
): Promise<EmployeeDocument[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("documents")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (employeeId) query = query.eq("employee_id", employeeId);
  if (categoryFilter) query = query.eq("category", categoryFilter);

  const { data: rawDocs, error } = await query;
  if (error || !rawDocs) return [];

  const [empRes, profRes] = await Promise.all([
    supabase.from("employees").select("id, employee_code, profile_id").eq("organization_id", orgId),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const profMap = new Map((profRes.data ?? []).map((p) => [p.id, p.full_name]));
  const empMap = new Map(
    (empRes.data ?? []).map((e) => [
      e.id,
      (e.profile_id ? profMap.get(e.profile_id) : null) ?? e.employee_code,
    ])
  );

  return (rawDocs as RawDoc[]).map((d) => ({
    id: d.id,
    organizationId: d.organization_id,
    employeeId: d.employee_id,
    employeeName: empMap.get(d.employee_id) ?? "Employee",
    category: d.category,
    title: d.title,
    fileName: d.file_name,
    filePath: d.file_path,
    fileSizeBytes: d.file_size_bytes,
    mimeType: d.mime_type,
    uploadedBy: d.employee_id,
    isConfidential: false,
    verificationStatus: d.verification_status,
    verifiedBy: d.verified_by,
    verifiedByName: d.verified_by ? profMap.get(d.verified_by) : undefined,
    verifiedAt: d.verified_at,
    expiryDate: d.expiry_date ?? undefined,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  }));
}

/**
 * Register document metadata
 */
export async function registerDocument(payload: {
  organizationId: string;
  employeeId: string;
  category: DocumentCategory;
  title: string;
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  mimeType: string;
  expiryDate?: string | null;
  notes?: string | null;
  uploadedBy?: string | null;
}) {
  const supabase = createAdminClient();

  let uploaderId = payload.uploadedBy;
  if (!uploaderId) {
    const { data: prof } = await supabase.from("profiles").select("id").limit(1).single();
    uploaderId = prof?.id || "00000008-0000-0000-0000-000000000001";
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      organization_id: payload.organizationId,
      employee_id: payload.employeeId,
      category: payload.category,
      title: payload.title.trim(),
      description: payload.notes?.trim() || null,
      file_name: payload.fileName,
      file_path: payload.filePath,
      file_size_bytes: payload.fileSizeBytes || 1024,
      mime_type: payload.mimeType || "application/pdf",
      uploaded_by: uploaderId,
      verification_status: "pending",
      expiry_date: payload.expiryDate ?? null,
      is_confidential: true,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, documentId: data.id };
}

/**
 * Verify or reject document
 */
export async function verifyDocument(
  docId: string,
  status: "verified" | "rejected",
  verifierId: string,
  rejectionReason?: string | null
) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("documents")
    .update({
      verification_status: status,
      verified_by: verifierId,
      verified_at: new Date().toISOString(),
      rejection_reason: status === "rejected" ? rejectionReason ?? null : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", docId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Formula-safe CSV export for documents
 */
export async function exportDocumentsCsv(orgId: string): Promise<string> {
  const docs = await getDocuments(orgId);

  const headers = [
    "Document ID",
    "Title",
    "Employee",
    "Category",
    "File Name",
    "Size (KB)",
    "Status",
    "Expiry Date",
  ];

  const rows = docs.map((d) => [
    sanitizeCsv(d.id),
    sanitizeCsv(d.title),
    sanitizeCsv(d.employeeName ?? "N/A"),
    sanitizeCsv(d.category),
    sanitizeCsv(d.fileName),
    sanitizeCsv(Math.round(d.fileSizeBytes / 1024)),
    sanitizeCsv(d.verificationStatus),
    sanitizeCsv(d.expiryDate ?? "N/A"),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}
