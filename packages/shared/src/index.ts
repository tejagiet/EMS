/**
 * @ems/shared — Shared utilities and helpers for EMS
 * Project: GIET Polytechnic College | AI Department | Team T-1
 * Publisher ID: GIETP-AI-IT-EMS-T1-2026
 */

import { PORTAL_ROLE_DEFINITIONS, PORTAL_ROUTES } from "@ems/config";
import type { PortalRole } from "@ems/types";

// =============================================================================
// 1. Core Utilities
// =============================================================================

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function identity<T>(value: T): T {
  return value;
}

// =============================================================================
// 2. Auth & Navigation Helpers
// =============================================================================

/**
 * Sanitizes an internal redirect path to prevent open redirect vulnerabilities.
 * Only relative paths starting with "/" and not "//" are permitted.
 */
export function sanitizeRedirectUrl(
  url: string | null | undefined,
  defaultFallback = "/portal",
): string {
  if (!url || typeof url !== "string") {
    return defaultFallback;
  }
  const trimmed = url.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("\\")) {
    return trimmed;
  }
  return defaultFallback;
}

/**
 * Resolves the default landing URL for a given portal role.
 */
export function getPortalUrlForRole(role: PortalRole): string {
  return PORTAL_ROUTES[role];
}

/**
 * Returns human-readable label for a portal role.
 */
export function getRoleDisplayName(role: PortalRole): string {
  return PORTAL_ROLE_DEFINITIONS[role].name;
}

/**
 * Extracts initials from a user's full name (e.g. "John Doe" -> "JD").
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return (parts[0]?.[0] ?? "U").toUpperCase();
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

/**
 * Formats standard Supabase or application auth error messages into user-friendly text.
 */
export function formatAuthErrorMessage(error: unknown): string {
  if (!error) return "An unexpected error occurred. Please try again.";
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    const err = error as { message?: string; error_description?: string; code?: string };
    const msg = err.message ?? err.error_description ?? "";
    if (msg.includes("Invalid login credentials")) {
      return "Invalid email or password. Please verify your credentials.";
    }
    if (msg.includes("Email not confirmed")) {
      return "Email address has not been confirmed yet.";
    }
    if (msg.includes("User not found")) {
      return "No account exists with this email address.";
    }
    if (msg.includes("Password should be at least")) {
      return "Password does not meet minimum complexity requirements.";
    }
    if (msg.includes("rate limit")) {
      return "Too many requests. Please wait a moment before trying again.";
    }
    if (msg.includes("fetch failed") || msg.includes("Failed to fetch") || msg.includes("ECONNREFUSED")) {
      return "Unable to connect to authentication server. Please check your Supabase connection and environment configuration.";
    }
    return msg || "Authentication service error.";
  }
  return "An unexpected error occurred.";
}
