"use server";

import { revalidatePath } from "next/cache";
import {
  createAsset,
  assignAsset,
  returnAsset,
  exportAssetsCsv,
} from "./assets";
import type { AssetCategory, AssetCondition } from "@ems/types";

export async function createAssetAction(formData: {
  organizationId: string;
  assetTag: string;
  name: string;
  category: AssetCategory;
  model?: string | null;
  serialNumber?: string | null;
  purchaseDate?: string | null;
  purchaseCost?: number | null;
  warrantyExpiry?: string | null;
  condition?: AssetCondition;
  location?: string | null;
  notes?: string | null;
}) {
  const result = await createAsset(formData);
  revalidatePath("/portal/it-assets");
  return result;
}

export async function assignAssetAction(formData: {
  assetId: string;
  employeeId: string;
  assignedDate: string;
  expectedReturnDate?: string | null;
  assignedBy?: string | null;
  notes?: string | null;
}) {
  const result = await assignAsset(
    formData.assetId,
    formData.employeeId,
    formData.assignedDate,
    formData.expectedReturnDate,
    formData.assignedBy,
    formData.notes
  );
  revalidatePath("/portal/it-assets");
  revalidatePath("/portal/employee");
  return result;
}

export async function returnAssetAction(formData: {
  assetId: string;
  returnCondition: AssetCondition;
  returnedDate: string;
  receivedBy?: string | null;
  notes?: string | null;
}) {
  const result = await returnAsset(
    formData.assetId,
    formData.returnCondition,
    formData.returnedDate,
    formData.receivedBy,
    formData.notes
  );
  revalidatePath("/portal/it-assets");
  revalidatePath("/portal/employee");
  return result;
}

export async function exportAssetsCsvAction(orgId: string) {
  return await exportAssetsCsv(orgId);
}
