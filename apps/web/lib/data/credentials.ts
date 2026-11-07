"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/client";
import { getActiveSessionContext } from "@/lib/auth/session";

const CRED_PREFIX = "[PORTAL_CREDENTIAL:";
const CRED_SUFFIX = "]";

/**
 * Extracts plain-text setup password from employee notes metadata.
 */
export function extractEmployeePassword(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const startIdx = notes.indexOf(CRED_PREFIX);
  if (startIdx === -1) return null;
  const endIdx = notes.indexOf(CRED_SUFFIX, startIdx + CRED_PREFIX.length);
  if (endIdx === -1) return null;
  return notes.slice(startIdx + CRED_PREFIX.length, endIdx).trim();
}

/**
 * Injects or updates plain-text setup password in employee notes metadata.
 */
export function injectEmployeePassword(
  currentNotes: string | null | undefined,
  password: string
): string {
  const existingPassword = extractEmployeePassword(currentNotes);
  const credTag = `${CRED_PREFIX}${password}${CRED_SUFFIX}`;

  if (!currentNotes || !currentNotes.trim()) {
    return credTag;
  }

  if (existingPassword) {
    const oldTag = `${CRED_PREFIX}${existingPassword}${CRED_SUFFIX}`;
    return currentNotes.replace(oldTag, credTag);
  }

  return `${currentNotes.trim()}\n${credTag}`;
}

export interface SetPasswordResult {
  success: boolean;
  error?: string;
  password?: string;
}

/**
 * Administrator action to set or reset an employee's portal access password.
 * Updates Supabase Auth credentials AND stores the visible password for administrative audit.
 */
export async function setEmployeePasswordAction(
  employeeId: string,
  newPassword: string
): Promise<SetPasswordResult> {
  const context = await getActiveSessionContext();
  if (!context || !context.activeOrganization) {
    return { success: false, error: "Administrative authentication required." };
  }

  const role = context.activeRole;
  const isAuthorized = role === "org_admin" || role === "super_admin" || role === "hr_manager";
  if (!isAuthorized) {
    return { success: false, error: "Insufficient administrative permissions to manage credentials." };
  }

  if (!newPassword || newPassword.trim().length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  const supabase = createAdminClient();

  // 1. Fetch employee
  const { data: emp, error: empErr } = await supabase
    .from("employees")
    .select("id, profile_id, work_email, first_name, last_name, notes, organization_id")
    .eq("id", employeeId)
    .single();

  if (empErr || !emp) {
    return { success: false, error: "Employee record not found." };
  }

  const email = emp.work_email?.trim();
  if (!email) {
    return { success: false, error: "Employee must have a work email configured to set up login credentials." };
  }

  try {
    // 2. Synchronize with Supabase Auth
    let authUserId = emp.profile_id;

    if (authUserId) {
      // Update existing user password
      const { error: updateAuthErr } = await supabase.auth.admin.updateUserById(authUserId, {
        password: newPassword,
        email_confirm: true,
      });
      if (updateAuthErr) {
        console.warn("[Credentials] updateUserById error:", updateAuthErr.message);
      }
    } else {
      // Check if user already exists in Auth by email
      const { data: usersList } = await supabase.auth.admin.listUsers();
      const existingUser = usersList?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );

      if (existingUser) {
        authUserId = existingUser.id;
        await supabase.auth.admin.updateUserById(existingUser.id, {
          password: newPassword,
          email_confirm: true,
        });
      } else {
        // Create new Auth user
        const { data: newUser, error: createAuthErr } = await supabase.auth.admin.createUser({
          email,
          password: newPassword,
          email_confirm: true,
          user_metadata: {
            full_name: `${emp.first_name} ${emp.last_name}`.trim(),
          },
        });
        if (createAuthErr) {
          console.warn("[Credentials] createUser error:", createAuthErr.message);
        } else if (newUser?.user) {
          authUserId = newUser.user.id;
        }
      }

      if (authUserId) {
        await supabase
          .from("employees")
          .update({ profile_id: authUserId })
          .eq("id", employeeId);
      }
    }

    if (authUserId) {
      // Ensure profile is assigned to the organization and active
      const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "Employee";
      await supabase.from("profiles").upsert({
        id: authUserId,
        email,
        full_name: fullName,
        organization_id: emp.organization_id,
        is_active: true,
      });

      // Ensure user_roles has active employee role assignment so user never gets stuck at pending
      const { data: roleRow } = await supabase
        .from("roles")
        .select("id")
        .eq("code", "employee")
        .eq("is_system", true)
        .maybeSingle();

      const employeeRoleId = roleRow?.id || "00000005-0000-0000-0000-000000000004";
      await supabase.from("user_roles").upsert(
        {
          profile_id: authUserId,
          organization_id: emp.organization_id,
          role_id: employeeRoleId,
          is_active: true,
        },
        { onConflict: "organization_id,profile_id,role_id" }
      );
    }

    // 3. Update employee record with tagged visible password
    const updatedNotes = injectEmployeePassword(emp.notes, newPassword);
    const { error: noteErr } = await supabase
      .from("employees")
      .update({ notes: updatedNotes })
      .eq("id", employeeId);

    if (noteErr) {
      return { success: false, error: "Failed to persist credential metadata." };
    }

    return { success: true, password: newPassword };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

/**
 * Self-service action for the logged-in employee / company user to set up or change their password.
 * Updates their Supabase Auth password AND updates the employee record so it remains visible to admins.
 */
export async function setupMyPasswordAction(
  newPassword: string
): Promise<SetPasswordResult> {
  const context = await getActiveSessionContext();
  if (!context || !context.profile) {
    return { success: false, error: "Session required to update your password." };
  }

  if (!newPassword || newPassword.trim().length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  const supabase = createAdminClient();
  const userId = context.profile.id;

  try {
    // 1. Update password in Supabase Auth
    const { error: authErr } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
      email_confirm: true,
    });

    if (authErr) {
      return { success: false, error: authErr.message };
    }

    // 2. Find linked employee record
    const { data: emp } = await supabase
      .from("employees")
      .select("id, notes")
      .eq("profile_id", userId)
      .limit(1)
      .maybeSingle();

    if (emp) {
      const updatedNotes = injectEmployeePassword(emp.notes, newPassword);
      await supabase
        .from("employees")
        .update({ notes: updatedNotes })
        .eq("id", emp.id);
    }

    return { success: true, password: newPassword };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update password." };
  }
}
