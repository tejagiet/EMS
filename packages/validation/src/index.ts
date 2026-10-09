/**
 * @ems/validation — Shared Zod schemas for EMS
 * Project: GIET Polytechnic College | AI Department | Team T-1
 * Publisher ID: GIETP-AI-IT-EMS-T1-2026
 */

import { PORTAL_ROLES } from "@ems/types";
import { z } from "zod";

// =============================================================================
// 1. Password Policy Rules
// =============================================================================

export const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must not exceed 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one digit");

export const emailSchema = z
  .string({ required_error: "Email is required" })
  .email("Please provide a valid email address")
  .min(5, "Email is too short")
  .max(255, "Email is too long")
  .toLowerCase()
  .trim();

// =============================================================================
// 2. Authentication Validation Schemas
// =============================================================================

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: "Password is required" }).min(1, "Password cannot be empty"),
  rememberMe: z.boolean().optional().default(false),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const passwordRecoverySchema = z.object({
  email: emailSchema,
});

export type PasswordRecoveryInput = z.infer<typeof passwordRecoverySchema>;

export const passwordResetSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string({ required_error: "Please confirm your password" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

// =============================================================================
// 3. Organization & Role Switching Schemas
// =============================================================================

export const switchOrganizationSchema = z.object({
  organizationId: z.string().uuid("Invalid organization identifier"),
});

export type SwitchOrganizationInput = z.infer<typeof switchOrganizationSchema>;

export const switchRoleSchema = z.object({
  roleCode: z.enum(PORTAL_ROLES, {
    errorMap: () => ({ message: "Invalid portal role selected" }),
  }),
});

export type SwitchRoleInput = z.infer<typeof switchRoleSchema>;

// =============================================================================
// 4. User Profile Update Schema
// =============================================================================

export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .trim(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Please provide a valid phone number with country code")
    .optional()
    .nullable(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be formatted as YYYY-MM-DD")
    .optional()
    .nullable(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional().nullable(),
  locale: z.string().min(2).max(10).default("en"),
  timezone: z.string().min(2).max(50).default("UTC"),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
