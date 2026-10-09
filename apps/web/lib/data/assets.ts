import { createClient } from "../supabase/server";
import type {
  ITAsset,
  AssetAssignment,
  AssetMaintenanceRecord,
  AssetCategory,
  AssetCondition,
  AssetStatus,
} from "@ems/types";

function sanitizeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  let str = String(val).replace(/"/g, '""');
  if (/^[=\+\-\@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str}"`;
}

interface RawAsset {
  id: string;
  organization_id: string;
  asset_tag: string;
  name: string;
  category: AssetCategory;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  purchase_cost: number | null;
  warranty_expiry: string | null;
  condition: AssetCondition;
  status: AssetStatus;
  location: string | null;
  specifications: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface RawAssignment {
  id: string;
  organization_id: string;
  asset_id: string;
  employee_id: string;
  assigned_date: string;
  expected_return_date: string | null;
  returned_date: string | null;
  return_condition: AssetCondition | null;
  is_active: boolean;
  assigned_by: string | null;
  received_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ExtendedAsset = ITAsset & {
  purchaseCost?: number | null | undefined;
  assignedToEmployeeName?: string | undefined;
  assignedDate?: string | undefined;
};

/**
 * Fetch inventory assets with optional status and category filters
 */
export async function getAssets(
  orgId: string,
  filters?: { status?: AssetStatus; category?: AssetCategory }
): Promise<ExtendedAsset[]> {
  const supabase = await createClient();

  let query = supabase
    .from("assets")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.category) query = query.eq("category", filters.category);

  const { data: rawAssets, error } = await query;
  if (error || !rawAssets) return [];

  const { data: activeAssignments } = await supabase
    .from("asset_assignments")
    .select("id, asset_id, employee_id, assigned_date")
    .eq("organization_id", orgId)
    .eq("is_active", true);

  const empIds = (activeAssignments ?? []).map((a) => a.employee_id);
  const { data: empData } = await supabase
    .from("employees")
    .select("id, employee_code, profile_id")
    .in("id", empIds.length > 0 ? empIds : ["00000000-0000-0000-0000-000000000000"]);

  const { data: profData } = await supabase.from("profiles").select("id, full_name");
  const profMap = new Map((profData ?? []).map((p) => [p.id, p.full_name]));

  const empMap = new Map(
    (empData ?? []).map((e) => [
      e.id,
      (e.profile_id ? profMap.get(e.profile_id) : null) ?? e.employee_code,
    ])
  );

  const assignmentByAsset = new Map<string, { assignmentId: string; employeeId: string; employeeName: string; assignedDate: string }>();
  for (const a of activeAssignments ?? []) {
    assignmentByAsset.set(a.asset_id, {
      assignmentId: a.id,
      employeeId: a.employee_id,
      employeeName: empMap.get(a.employee_id) ?? "Assigned",
      assignedDate: a.assigned_date,
    });
  }

  return (rawAssets as RawAsset[]).map((a) => {
    const active = assignmentByAsset.get(a.id);
    return {
      id: a.id,
      organizationId: a.organization_id,
      assetTag: a.asset_tag,
      name: a.name,
      category: a.category,
      model: a.model ?? undefined,
      serialNumber: a.serial_number ?? undefined,
      purchaseDate: a.purchase_date ?? undefined,
      purchaseCost: a.purchase_cost ? Number(a.purchase_cost) : null,
      warrantyExpiry: a.warranty_expiry ?? undefined,
      condition: a.condition,
      status: a.status,
      location: a.location ?? "Main Campus",
      specifications: a.specifications ?? {},
      currentEmployeeId: active?.employeeId,
      currentEmployeeName: active?.employeeName,
      currentAssignmentId: active?.assignmentId,
      assignedToEmployeeName: active?.employeeName,
      assignedDate: active?.assignedDate,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    };
  });
}

/**
 * Fetch detailed asset with history of assignments and maintenance logs
 */
export async function getAssetDetails(assetId: string) {
  const supabase = await createClient();

  const [assetRes, assignRes, maintRes, profRes, empRes] = await Promise.all([
    supabase.from("assets").select("*").eq("id", assetId).single(),
    supabase.from("asset_assignments").select("*").eq("asset_id", assetId).order("assigned_date", { ascending: false }),
    supabase.from("asset_maintenance").select("*").eq("asset_id", assetId).order("maintenance_date", { ascending: false }),
    supabase.from("profiles").select("id, full_name"),
    supabase.from("employees").select("id, employee_code, profile_id"),
  ]);

  if (!assetRes.data) return { asset: null, assignments: [], maintenance: [] };

  const profMap = new Map((profRes.data ?? []).map((p) => [p.id, p.full_name]));
  const empMap = new Map(
    (empRes.data ?? []).map((e) => [
      e.id,
      (e.profile_id ? profMap.get(e.profile_id) : null) ?? e.employee_code,
    ])
  );

  const assignments: AssetAssignment[] = ((assignRes.data as RawAssignment[] | null) ?? []).map((a) => ({
    id: a.id,
    organizationId: a.organization_id,
    assetId: a.asset_id,
    employeeId: a.employee_id,
    employeeName: empMap.get(a.employee_id),
    assignedDate: a.assigned_date,
    returnDueDate: a.expected_return_date ?? undefined,
    returnedDate: a.returned_date ?? undefined,
    returnedCondition: a.return_condition ?? undefined,
    isActive: a.is_active,
    assignedBy: a.assigned_by,
    notes: a.notes ?? undefined,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  }));

  const maintenance: AssetMaintenanceRecord[] = (maintRes.data ?? []).map((m: any) => ({
    id: m.id,
    organizationId: m.organization_id,
    assetId: m.asset_id,
    maintenanceType: m.maintenance_type,
    cost: m.cost ? Number(m.cost) : 0,
    startDate: m.maintenance_date ?? new Date().toISOString().slice(0, 10),
    status: "completed",
    notes: m.notes ?? undefined,
    createdAt: m.created_at,
    updatedAt: m.created_at,
  }));

  return { asset: assetRes.data as RawAsset, assignments, maintenance };
}

/**
 * Create a new asset record
 */
export async function createAsset(payload: {
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
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assets")
    .insert({
      organization_id: payload.organizationId,
      asset_tag: payload.assetTag.toUpperCase().trim(),
      name: payload.name.trim(),
      category: payload.category,
      model: payload.model ?? null,
      serial_number: payload.serialNumber ?? null,
      purchase_date: payload.purchaseDate ?? null,
      purchase_cost: payload.purchaseCost ?? null,
      warranty_expiry: payload.warrantyExpiry ?? null,
      condition: payload.condition ?? "good",
      status: "available",
      location: payload.location ?? "Main Campus",
      notes: payload.notes ?? null,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, assetId: data.id };
}

/**
 * Assign asset to employee using transactional RPC
 */
export async function assignAsset(
  assetId: string,
  employeeId: string,
  assignedDate: string,
  expectedReturnDate?: string | null,
  assignedBy?: string | null,
  notes?: string | null
) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("assign_asset", {
    p_asset_id: assetId,
    p_employee_id: employeeId,
    p_assigned_date: assignedDate,
    p_expected_return_date: expectedReturnDate ?? null,
    p_assigned_by: assignedBy ?? null,
    p_notes: notes ?? null,
  });

  if (error) return { success: false, error: error.message };
  const res = data as { success: boolean; assignment_id?: string; error?: string };
  return {
    success: res.success,
    assignmentId: res.assignment_id,
    error: res.error,
  };
}

/**
 * Return asset and restore availability using transactional RPC
 */
export async function returnAsset(
  assetId: string,
  returnCondition: AssetCondition,
  returnedDate: string,
  receivedBy?: string | null,
  notes?: string | null
) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("return_asset", {
    p_asset_id: assetId,
    p_return_condition: returnCondition,
    p_returned_date: returnedDate,
    p_received_by: receivedBy ?? null,
    p_notes: notes ?? null,
  });

  if (error) return { success: false, error: error.message };
  const res = data as { success: boolean; error?: string };
  return { success: res.success, error: res.error };
}

/**
 * Formula-injection safe CSV export for IT assets
 */
export async function exportAssetsCsv(orgId: string): Promise<string> {
  const assets = await getAssets(orgId);

  const headers = [
    "Asset Tag",
    "Asset Name",
    "Category",
    "Model",
    "Serial Number",
    "Status",
    "Condition",
    "Assigned Employee",
    "Assigned Date",
    "Location",
    "Purchase Cost",
  ];

  const rows = assets.map((a) => [
    sanitizeCsv(a.assetTag),
    sanitizeCsv(a.name),
    sanitizeCsv(a.category),
    sanitizeCsv(a.model ?? "N/A"),
    sanitizeCsv(a.serialNumber ?? "N/A"),
    sanitizeCsv(a.status),
    sanitizeCsv(a.condition),
    sanitizeCsv(a.assignedToEmployeeName ?? "None"),
    sanitizeCsv(a.assignedDate ?? "N/A"),
    sanitizeCsv(a.location),
    sanitizeCsv(a.purchaseCost != null ? a.purchaseCost : "N/A"),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}
