"use client";

import { createClient } from "@/lib/supabase/client";

export interface ProvisionTenantInput {
  name: string;
  code: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  defaultBranchName?: string;
  defaultBranchCode?: string;
  isActive?: boolean;
}

export interface ProvisionTenantResult {
  success: boolean;
  error?: string;
  organization?: {
    id: string;
    name: string;
    code: string;
    slug: string;
    isActive: boolean;
    is_active: boolean;
    createdAt: string;
    created_at: string;
    defaultBranchId?: string;
  };
}

/**
 * Provision a new tenant institution in the platform.
 * Supports both database RPC (provision_tenant) and direct Supabase insertion fallback.
 */
export async function provisionTenantAction(
  input: ProvisionTenantInput
): Promise<ProvisionTenantResult> {
  try {
    const trimmedName = input.name?.trim();
    const trimmedCode = input.code?.trim().toUpperCase();
    const trimmedSlug = (input.slug?.trim() || trimmedName?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "")
      .toLowerCase();

    if (!trimmedName) {
      return { success: false, error: "Institution / Organization name is required." };
    }
    if (!trimmedCode) {
      return { success: false, error: "Tenant code is required (e.g. GIETP)." };
    }
    if (!trimmedSlug) {
      return { success: false, error: "Tenant URL slug is required (e.g. giet-polytechnic)." };
    }

    const supabase = createClient();

    // 1. Try atomic database RPC
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("provision_tenant", {
        p_name: trimmedName,
        p_code: trimmedCode,
        p_slug: trimmedSlug,
        p_email: input.email?.trim() || null,
        p_phone: input.phone?.trim() || null,
        p_address: input.address?.trim() || null,
        p_default_branch_name: input.defaultBranchName?.trim() || "Main Campus",
        p_is_active: input.isActive ?? true,
      });

      if (!rpcError && rpcData) {
        const orgObj = typeof rpcData === "string" ? JSON.parse(rpcData) : rpcData;
        const normalized = {
          id: orgObj.id,
          name: orgObj.name,
          code: orgObj.code,
          slug: orgObj.slug,
          isActive: orgObj.is_active ?? true,
          is_active: orgObj.is_active ?? true,
          createdAt: orgObj.created_at || new Date().toISOString(),
          created_at: orgObj.created_at || new Date().toISOString(),
          defaultBranchId: orgObj.default_branch_id,
        };

        // Notify subscribers to refresh organization tables & metrics
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("ems:refresh-organizations", { detail: normalized }));
          window.dispatchEvent(new CustomEvent("ems:refresh"));
        }

        return {
          success: true,
          organization: normalized,
        };
      }

      // If the RPC error was not "function not found" but a business logic violation (e.g. unique constraint), return it
      if (rpcError && rpcError.code !== "PGRST202" && !rpcError.message.includes("could not find the function")) {
        return {
          success: false,
          error: rpcError.message || "Failed to provision tenant.",
        };
      }
    } catch {
      // Continue to direct table insertion fallback
    }

    // 2. Direct Supabase Table Insertion Fallback
    const orgPayload = {
      name: trimmedName,
      code: trimmedCode,
      slug: trimmedSlug,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
      website: input.website?.trim() || null,
      is_active: input.isActive ?? true,
      settings: {},
    };

    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .insert(orgPayload)
      .select()
      .single();

    if (orgError) {
      if (orgError.code === "23505" || orgError.message.includes("unique")) {
        return {
          success: false,
          error: "An institution with this Tenant Code or Slug already exists. Please choose a unique code/slug.",
        };
      }
      return {
        success: false,
        error: orgError.message || "Failed to provision tenant in database.",
      };
    }

    // Insert Default Branch
    let defaultBranchId: string | undefined;
    if (orgData?.id) {
      const { data: branchData } = await supabase
        .from("branches")
        .insert({
          organization_id: orgData.id,
          name: input.defaultBranchName?.trim() || "Main Campus",
          code: input.defaultBranchCode?.trim().toUpperCase() || "MAIN",
          is_active: true,
        })
        .select("id")
        .single();

      defaultBranchId = branchData?.id;
    }

    const createdOrg = {
      id: orgData.id,
      name: orgData.name,
      code: orgData.code,
      slug: orgData.slug,
      isActive: orgData.is_active,
      is_active: orgData.is_active,
      createdAt: orgData.created_at || new Date().toISOString(),
      created_at: orgData.created_at || new Date().toISOString(),
      defaultBranchId,
    };

    // Notify listeners
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ems:refresh-organizations", { detail: createdOrg }));
      window.dispatchEvent(new CustomEvent("ems:refresh"));
    }

    return {
      success: true,
      organization: createdOrg,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred while provisioning tenant.";
    return { success: false, error: message };
  }
}

/**
 * Delete a tenant institution from the platform.
 * Cleans up related branches, departments, and configurations.
 */
export async function deleteTenantAction(
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!orgId) {
      return { success: false, error: "Organization ID is required." };
    }

    const supabase = createClient();

    // 1. Try atomic delete RPC
    try {
      const { error: rpcError } = await supabase.rpc("delete_tenant", {
        p_org_id: orgId,
      });

      if (!rpcError) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("ems:tenant-deleted", { detail: { id: orgId } }));
          window.dispatchEvent(new CustomEvent("ems:refresh"));
        }
        return { success: true };
      }

      // If function doesn't exist, proceed to fallback
      if (rpcError.code !== "PGRST202" && !rpcError.message.includes("could not find the function")) {
        // Business logic error
        console.warn("[deleteTenantAction] RPC error, trying direct delete:", rpcError.message);
      }
    } catch {
      // Proceed to direct table delete
    }

    // 2. Direct cascading delete fallback
    await supabase.from("branches").delete().eq("organization_id", orgId);
    await supabase.from("departments").delete().eq("organization_id", orgId);
    await supabase.from("designations").delete().eq("organization_id", orgId);
    await supabase.from("user_roles").delete().eq("organization_id", orgId);
    await supabase.from("settings").delete().eq("organization_id", orgId);
    
    const { error: delError } = await supabase
      .from("organizations")
      .delete()
      .eq("id", orgId);

    if (delError) {
      return { success: false, error: delError.message || "Failed to delete organization." };
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ems:tenant-deleted", { detail: { id: orgId } }));
      window.dispatchEvent(new CustomEvent("ems:refresh"));
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred while deleting tenant.";
    return { success: false, error: message };
  }
}

/**
 * Update an existing tenant institution's details.
 */
export async function updateTenantAction(
  orgId: string,
  input: Partial<ProvisionTenantInput>
): Promise<{ success: boolean; error?: string; organization?: any }> {
  try {
    if (!orgId) {
      return { success: false, error: "Organization ID is required." };
    }

    const supabase = createClient();
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) updatePayload.name = input.name.trim();
    if (input.code !== undefined) updatePayload.code = input.code.trim().toUpperCase();
    if (input.slug !== undefined) updatePayload.slug = input.slug.trim().toLowerCase();
    if (input.email !== undefined) updatePayload.email = input.email?.trim() || null;
    if (input.phone !== undefined) updatePayload.phone = input.phone?.trim() || null;
    if (input.address !== undefined) updatePayload.address = input.address?.trim() || null;
    if (input.website !== undefined) updatePayload.website = input.website?.trim() || null;
    if (input.isActive !== undefined) updatePayload.is_active = input.isActive;

    const { data, error } = await supabase
      .from("organizations")
      .update(updatePayload)
      .eq("id", orgId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message || "Failed to update organization." };
    }

    const updated = {
      id: data.id,
      name: data.name,
      code: data.code,
      slug: data.slug,
      isActive: data.is_active,
      is_active: data.is_active,
      createdAt: data.created_at,
      created_at: data.created_at,
    };

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ems:refresh-organizations", { detail: updated }));
      window.dispatchEvent(new CustomEvent("ems:refresh"));
    }

    return { success: true, organization: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred while updating tenant.";
    return { success: false, error: message };
  }
}

