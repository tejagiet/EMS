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

// =============================================================================
// 5. Phase 5 Employee Validation Schemas
// =============================================================================

export const employmentTypeSchema = z.enum([
  "full_time",
  "part_time",
  "contract",
  "intern",
  "probation",
]);

export const employmentStatusSchema = z.enum([
  "active",
  "inactive",
  "terminated",
  "resigned",
  "on_leave",
  "suspended",
]);

export const createEmployeeSchema = z.object({
  firstName: z
    .string({ required_error: "First name is required" })
    .min(1, "First name cannot be empty")
    .max(50, "First name is too long")
    .trim(),
  lastName: z
    .string({ required_error: "Last name is required" })
    .min(1, "Last name cannot be empty")
    .max(50, "Last name is too long")
    .trim(),
  employeeCode: z
    .string()
    .max(30, "Employee code is too long")
    .trim()
    .optional()
    .nullable(),
  workEmail: emailSchema.optional().nullable(),
  contactNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Please provide a valid contact number")
    .optional()
    .nullable(),
  workPhone: z.string().max(20).optional().nullable(),
  branchId: z.string().uuid("Invalid branch identifier").optional().nullable(),
  departmentId: z.string().uuid("Invalid department identifier").optional().nullable(),
  designationId: z.string().uuid("Invalid designation identifier").optional().nullable(),
  reportingManagerId: z.string().uuid("Invalid manager identifier").optional().nullable(),
  employmentType: employmentTypeSchema.default("full_time"),
  employmentStatus: employmentStatusSchema.default("active"),
  dateOfJoining: z
    .string({ required_error: "Joining date is required" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Joining date must be formatted as YYYY-MM-DD"),
  dateOfConfirmation: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be formatted as YYYY-MM-DD")
    .optional()
    .nullable(),
  dateOfResignation: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be formatted as YYYY-MM-DD")
    .optional()
    .nullable(),
  dateOfTermination: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be formatted as YYYY-MM-DD")
    .optional()
    .nullable(),
  noticePeriodDays: z.number().int().min(0).max(365).default(30),
  emergencyContactName: z.string().max(100).optional().nullable(),
  emergencyContactRelationship: z.string().max(50).optional().nullable(),
  emergencyContactPhone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Please provide a valid emergency phone number")
    .optional()
    .nullable(),
  addressLine1: z.string().max(255).optional().nullable(),
  addressLine2: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().max(100).default("India"),
  workLocation: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  id: z.string().uuid("Invalid employee identifier"),
});

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export const departmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters").max(100).trim(),
  code: z.string().min(2, "Department code must be at least 2 characters").max(20).trim(),
  branchId: z.string().uuid().optional().nullable(),
  parentDepartmentId: z.string().uuid().optional().nullable(),
  headOfDepartmentId: z.string().uuid().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;

export const branchSchema = z.object({
  name: z.string().min(2, "Branch name must be at least 2 characters").max(100).trim(),
  code: z.string().min(2, "Branch code must be at least 2 characters").max(20).trim(),
  address: z.string().max(255).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: emailSchema.optional().nullable(),
  isActive: z.boolean().default(true),
});

export type BranchInput = z.infer<typeof branchSchema>;

export const designationSchema = z.object({
  name: z.string().min(2, "Designation name must be at least 2 characters").max(100).trim(),
  code: z.string().min(2, "Designation code must be at least 2 characters").max(20).trim(),
  departmentId: z.string().uuid().optional().nullable(),
  grade: z.string().max(50).optional().nullable(),
  level: z.number().int().min(1).max(20).optional().nullable(),
  isActive: z.boolean().default(true),
});

export type DesignationInput = z.infer<typeof designationSchema>;

export const employeeImportRowSchema = z.object({
  employeeCode: z.string().max(30).optional().nullable(),
  firstName: z.string().min(1, "First name is required").max(50).trim(),
  lastName: z.string().min(1, "Last name is required").max(50).trim(),
  workEmail: emailSchema.optional().nullable(),
  contactNumber: z.string().optional().nullable(),
  departmentCode: z.string().min(1, "Department code is required").max(20).trim(),
  branchCode: z.string().min(1, "Branch code is required").max(20).trim(),
  designationCode: z.string().min(1, "Designation code is required").max(20).trim(),
  reportingManagerCode: z.string().max(30).optional().nullable(),
  employmentType: employmentTypeSchema.default("full_time"),
  employmentStatus: employmentStatusSchema.default("active"),
  dateOfJoining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Joining date must be YYYY-MM-DD"),
  workLocation: z.string().max(100).optional().nullable(),
});

export type EmployeeImportRowInput = z.infer<typeof employeeImportRowSchema>;

// =============================================================================
// 5. Phase 6: Shifts, Attendance & Leave Schemas
// =============================================================================

export const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export const shiftSchema = z.object({
  name: z.string().min(2, "Shift name must be at least 2 characters").max(100).trim(),
  code: z.string().min(2, "Shift code must be at least 2 characters").max(20).trim(),
  startTime: z.string().regex(timeRegex, "Start time must be HH:MM or HH:MM:SS format"),
  endTime: z.string().regex(timeRegex, "End time must be HH:MM or HH:MM:SS format"),
  breakDurationMinutes: z.number().int().min(0, "Break duration cannot be negative").default(60),
  gracePeriodMinutes: z.number().int().min(0, "Grace period cannot be negative").default(15),
  applicableDays: z.array(z.number().int().min(1).max(7)).min(1, "Select at least one applicable weekday").default([1, 2, 3, 4, 5]),
  isOvernight: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type ShiftInput = z.infer<typeof shiftSchema>;

export const shiftAssignmentSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID"),
  shiftId: z.string().uuid("Invalid shift ID"),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Effective from date must be YYYY-MM-DD"),
  effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Effective to date must be YYYY-MM-DD").optional().nullable(),
  isActive: z.boolean().default(true),
});

export type ShiftAssignmentInput = z.infer<typeof shiftAssignmentSchema>;

export const attendanceCorrectionSchema = z.object({
  attendanceRecordId: z.string().uuid("Invalid attendance record ID").optional().nullable(),
  employeeId: z.string().uuid("Invalid employee ID").optional().nullable(),
  requestedClockIn: z.string().datetime("Requested clock-in must be an ISO 8601 timestamp"),
  requestedClockOut: z.string().datetime("Requested clock-out must be an ISO 8601 timestamp"),
  reason: z.string().min(5, "Reason must be at least 5 characters long").max(500).trim(),
});

export type AttendanceCorrectionInput = z.infer<typeof attendanceCorrectionSchema>;

export const attendanceCorrectionDecisionSchema = z.object({
  correctionId: z.string().uuid("Invalid correction ID"),
  decision: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().max(500).optional().nullable(),
});

export type AttendanceCorrectionDecisionInput = z.infer<typeof attendanceCorrectionDecisionSchema>;

export const leaveTypeSchema = z.object({
  name: z.string().min(2, "Leave type name must be at least 2 characters").max(100).trim(),
  code: z.string().min(2, "Leave type code must be at least 2 characters").max(20).trim(),
  daysPerYear: z.number().min(0, "Days per year cannot be negative").max(365),
  isPaid: z.boolean().default(true),
  carryForwardDays: z.number().min(0, "Carry forward days cannot be negative").default(0),
  isActive: z.boolean().default(true),
});

export type LeaveTypeInput = z.infer<typeof leaveTypeSchema>;

export const leaveRequestSchema = z.object({
  leaveTypeId: z.string().uuid("Invalid leave type ID"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD"),
  totalDays: z.number().positive("Total days must be greater than zero"),
  reason: z.string().min(5, "Reason must be at least 5 characters long").max(500).trim(),
});

export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;

export const leaveDecisionSchema = z.object({
  requestId: z.string().uuid("Invalid leave request ID"),
  decision: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().max(500).optional().nullable(),
});

export type LeaveDecisionInput = z.infer<typeof leaveDecisionSchema>;

