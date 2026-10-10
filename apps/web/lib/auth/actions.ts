"use server";

import { PORTAL_ROUTES } from "@ems/config";
import { formatAuthErrorMessage, sanitizeRedirectUrl } from "@ems/shared";
import type { PortalRole } from "@ems/types";
import {
  passwordRecoverySchema,
  passwordResetSchema,
  signInSchema,
  switchOrganizationSchema,
  switchRoleSchema,
} from "@ems/validation";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";

const ACTIVE_ORG_COOKIE = "ems_active_org_id";
const ACTIVE_ROLE_COOKIE = "ems_active_role";

export interface FormState {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

interface ProfileStatusRow {
  is_active: boolean | null;
  organization_id: string | null;
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

    const redirectToRaw = formData.get("redirectTo");
    const redirectToStr = typeof redirectToRaw === "string" ? redirectToRaw : null;
    target = sanitizeRedirectUrl(redirectToStr, "/portal");
  } catch (err) {
    return { error: formatAuthErrorMessage(err) };
  }

  redirect(target);
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

  redirect("/login?message=signed_out");
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
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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

  redirect("/login?message=password_updated");
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

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, validation.data.organizationId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/portal");
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
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ROLE_COOKIE, role, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const targetUrl = PORTAL_ROUTES[role];
  redirect(targetUrl);
}
