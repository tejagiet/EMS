"use server";

import { revalidatePath } from "next/cache";
import {
  registerDocument,
  verifyDocument,
  exportDocumentsCsv,
} from "./documents";
import type { DocumentCategory } from "@ems/types";

export async function registerDocumentAction(formData: {
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
}) {
  const result = await registerDocument(formData);
  revalidatePath("/portal/hr/documents");
  revalidatePath("/portal/employee");
  return result;
}

export async function verifyDocumentAction(
  docId: string,
  status: "verified" | "rejected",
  verifierId: string,
  rejectionReason?: string | null
) {
  const result = await verifyDocument(docId, status, verifierId, rejectionReason);
  revalidatePath("/portal/hr/documents");
  return result;
}

export async function exportDocumentsCsvAction(orgId: string) {
  return await exportDocumentsCsv(orgId);
}
