import { PORTAL_ROUTES } from "@ems/config";
import { formatAuthErrorMessage, sanitizeRedirectUrl } from "@ems/shared";
import type { PortalRole } from "@ems/types";
import {
  passwordRecoverySchema,
  passwordResetSchema,
  signInSchema,
  signUpSchema,
  switchOrganizationSchema,
  switchRoleSchema,
} from "@ems/validation";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { clearUserContextCache, getCurrentUserContext, isValidRoleAssignment } from "./session";

const ACTIVE_ORG_COOKIE = "ems_active_org_id";
const ACTIVE_ROLE_COOKIE = "ems_active_role";

export interface FormState {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

interface ProfileStatusRow {
  is_active: boolean | null;
  organization_id: string | null;
}

interface SignInRole {
  code: string | null;
  is_active: boolean | null;
}

interface SignInAccessRow {
  id: string;
  organization_id: string;
  is_active: boolean;
  expires_at: string | null;
  roles: SignInRole | SignInRole[] | null;
}

/**
 * Server action to authenticate a user with email and password.
 */
export async function signInAction(
  _prevState: FormState | null,
  formData: FormData,
): Promise<FormState | undefined> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
    rememberMe: formData.get("rememberMe") === "on",
  };

  const validation = signInSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") {
        fieldErrors[key] = issue.message;
      }
    }
    return { error: "Please correct the highlighted errors.", fieldErrors };
  }

  const { email, password } = validation.data;
  let target = "/portal";

  try {
    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { error: formatAuthErrorMessage(authError) };
    }

    // Verify account is active in profiles
    const profileResponse = await supabase
      .from("profiles")
      .select("is_active, organization_id")
      .eq("id", authData.user.id)
      .maybeSingle<ProfileStatusRow>();

    if (profileResponse.data?.is_active === false) {
      await supabase.auth.signOut();
      return {
        error: "This account has been deactivated. Please contact your organization administrator.",
      };
    }

    const accessResponse = await supabase
      .from("user_roles")
      .select(
        `
        id,
        organization_id,
        is_active,
        expires_at,
        roles (
          code,
          is_active
        )
      `,
      )
      .eq("profile_id", authData.user.id)
      .eq("is_active", true);

    if (accessResponse.error) {
      await supabase.auth.signOut();
      return { error: formatAuthErrorMessage(accessResponse.error) };
    }

    const accessRows = (accessResponse.data as unknown as SignInAccessRow[] | null) ?? [];
    let hasValidAccess = accessRows.some((row) => {
      const role = Array.isArray(row.roles) ? (row.roles[0] ?? null) : row.roles;
      return isValidRoleAssignment(
        {
          organizationId: row.organization_id,
          roleCode: role?.code ?? null,
          isActive: row.is_active === true,
          roleIsActive: role?.is_active === true,
          expiresAt: row.expires_at,
        },
        new Date(),
      );
    });

    // Auto-heal active employee accounts that exist in employees table but are missing user_roles or profile org link
    if (!hasValidAccess) {
      try {
        const adminClient = createAdminClient();
        let { data: empRecord } = await adminClient
          .from("employees")
          .select("id, organization_id, is_active, first_name, last_name")
          .eq("profile_id", authData.user.id)
          .eq("is_active", true)
          .maybeSingle();

        if (!empRecord && authData.user.email) {
          const { data: empByEmail } = await adminClient
            .from("employees")
            .select("id, organization_id, is_active, first_name, last_name")
            .ilike("work_email", authData.user.email)
            .eq("is_active", true)
            .maybeSingle();

          if (empByEmail) {
            await adminClient
              .from("employees")
              .update({ profile_id: authData.user.id })
              .eq("id", empByEmail.id);
            empRecord = empByEmail;
          }
        }

        if (empRecord && empRecord.organization_id) {
          const fullName =
            `${empRecord.first_name || ""} ${empRecord.last_name || ""}`.trim() || "Employee";

          await adminClient.from("profiles").upsert({
            id: authData.user.id,
            email: authData.user.email,
            full_name: fullName,
            organization_id: empRecord.organization_id,
            is_active: true,
          });

          const { data: roleRow } = await adminClient
            .from("roles")
            .select("id")
            .eq("code", "employee")
            .eq("is_system", true)
            .maybeSingle();

          const employeeRoleId = roleRow?.id || "00000005-0000-0000-0000-000000000004";
          await adminClient.from("user_roles").upsert(
            {
              profile_id: authData.user.id,
              organization_id: empRecord.organization_id,
              role_id: employeeRoleId,
              is_active: true,
            },
            { onConflict: "organization_id,profile_id,role_id" }
          );

          hasValidAccess = true;
        }
      } catch (healErr) {
        console.warn("[signInAction] Account auto-heal failed:", healErr);
      }
    }

    if (!hasValidAccess) {
      await supabase.auth.signOut();
      return {
        error:
          "Your account is awaiting organization and portal access assignment. Please contact an EMS administrator.",
      };
    }

    const redirectToRaw = formData.get("redirectTo");
    const redirectToStr = typeof redirectToRaw === "string" ? redirectToRaw : null;
    target = sanitizeRedirectUrl(redirectToStr, "/portal");
  } catch (err) {
    return { error: formatAuthErrorMessage(err) };
  }

  clearUserContextCache();
  if (typeof window !== "undefined") {
    window.location.href = target;
  } else {
    redirect(target);
  }
  return { success: true };
}

/**
 * Server action to create a public account pending administrator access assignment.
 */
export async function signUpAction(
  _prevState: FormState | null,
  _formData: FormData,
): Promise<FormState> {
  return {
    error:
      "Public registration has been disabled. Employee and staff accounts are provisioned exclusively by Institutional Administrators.",
  };
}

/**
 * Server action to sign out and clear session.
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_ORG_COOKIE);
  cookieStore.delete(ACTIVE_ROLE_COOKIE);
  clearUserContextCache();

  if (typeof window !== "undefined") {
    window.location.href = "/login?message=signed_out";
  } else {
    redirect("/login?message=signed_out");
  }
}

/**
 * Server action to initiate password recovery email.
 */
export async function forgotPasswordAction(
  _prevState: FormState | null,
  formData: FormData,
): Promise<FormState> {
  const rawData = {
    email: formData.get("email"),
  };

  const validation = passwordRecoverySchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.issues[0]?.message ?? "Invalid email" };
  }

  const supabase = await createClient();
  const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");

  const { error } = await supabase.auth.resetPasswordForEmail(validation.data.email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
  });

  if (error) {
    return { error: formatAuthErrorMessage(error) };
  }

  return {
    success: true,
  };
}

/**
 * Server action to set a new password after recovery.
 */
export async function resetPasswordAction(
  _prevState: FormState | null,
  formData: FormData,
): Promise<FormState | undefined> {
  const rawData = {
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const validation = passwordResetSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.issues[0]?.message ?? "Invalid password parameters" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: validation.data.newPassword,
  });

  if (error) {
    return { error: formatAuthErrorMessage(error) };
  }

  if (typeof window !== "undefined") {
    window.location.href = "/login?message=password_updated";
  } else {
    redirect("/login?message=password_updated");
  }
}

/**
 * Server action to switch active organization membership.
 */
export async function switchOrganizationAction(formData: FormData): Promise<void> {
  const rawData = {
    organizationId: formData.get("organizationId"),
  };

  const validation = switchOrganizationSchema.safeParse(rawData);
  if (!validation.success) {
    return;
  }

  const context = await getCurrentUserContext();
  const targetOrganizationId = validation.data.organizationId;
  const targetMembership = context?.memberships.find(
    (membership) => membership.organizationId === targetOrganizationId,
  );

  // The membership list is derived from server-loaded, active, unexpired role
  // assignments. Never let a client choose an arbitrary organization id.
  if (!context?.isAccountActive || !targetMembership || targetMembership.roles.length === 0) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, targetOrganizationId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  // A role selected in the previous organization is never carried into the
  // new scope. The next context load selects a role from the new membership.
  cookieStore.delete(ACTIVE_ROLE_COOKIE);
  clearUserContextCache();

  if (typeof window !== "undefined") {
    window.location.href = "/portal";
  } else {
    redirect("/portal");
  }
}

/**
 * Server action to switch active portal role.
 */
export async function switchRoleAction(formData: FormData): Promise<void> {
  const rawData = {
    roleCode: formData.get("roleCode"),
  };

  const validation = switchRoleSchema.safeParse(rawData);
  if (!validation.success) {
    return;
  }

  const role: PortalRole = validation.data.roleCode;
  const context = await getCurrentUserContext();
  const activeMembership = context?.activeOrganization
    ? context.memberships.find(
        (membership) => membership.organizationId === context.activeOrganization?.id,
      )
  : undefined;

  if (
    !context?.isAccountActive ||
    !context.activeOrganization?.isActive ||
    !activeMembership?.roles.includes(role) ||
    !context.availableRoles.includes(role)
  ) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ROLE_COOKIE, role, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  clearUserContextCache();

  const targetUrl = PORTAL_ROUTES[role];
  if (typeof window !== "undefined") {
    window.location.href = targetUrl;
  } else {
    redirect(targetUrl);
  }
}
