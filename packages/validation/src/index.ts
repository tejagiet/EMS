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

export const signUpSchema = z
  .object({
    fullName: z
      .string({ required_error: "Full name is required" })
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must not exceed 100 characters")
      .trim(),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string({ required_error: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

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
  reason: z.string().min(5, "Reason must be at least 5 characters long").max(2000).trim(),
});

export type AttendanceCorrectionInput = z.infer<typeof attendanceCorrectionSchema>;

export const attendanceCorrectionDecisionSchema = z.object({
  correctionId: z.string().uuid("Invalid correction ID"),
  decision: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().max(2000).optional().nullable(),
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
  reason: z.string().min(5, "Reason must be at least 5 characters long").max(2000).trim(),
});

export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;

export const leaveDecisionSchema = z.object({
  requestId: z.string().uuid("Invalid leave request ID"),
  decision: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().max(500).optional().nullable(),
});

export type LeaveDecisionInput = z.infer<typeof leaveDecisionSchema>;

// =============================================================================
// Phase 7: Payroll & Salary Validation Schemas
// =============================================================================

export const salaryComponentSchema = z.object({
  code: z.string().min(1, "Component code required").max(20).trim(),
  name: z.string().min(1, "Component name required").max(100).trim(),
  amount: z.number().min(0, "Amount must be greater than or equal to 0"),
  type: z.enum(["fixed", "percentage"]).default("fixed"),
});

export const salaryStructureSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID"),
  baseSalary: z.number().min(0, "Base salary must be non-negative"),
  currency: z.string().max(5).default("INR"),
  paymentFrequency: z.enum(["monthly", "bi_weekly", "weekly"]).default("monthly"),
  allowances: z.array(salaryComponentSchema).default([]),
  deductions: z.array(salaryComponentSchema).default([]),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Effective from must be YYYY-MM-DD"),
  effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Effective to must be YYYY-MM-DD").optional().nullable(),
  isActive: z.boolean().default(true),
  notes: z.string().max(500).optional().nullable(),
});

export type SalaryStructureInput = z.infer<typeof salaryStructureSchema>;

export const payrollRunCreateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100).trim(),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Period start must be YYYY-MM-DD"),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Period end must be YYYY-MM-DD"),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Payment date must be YYYY-MM-DD"),
  notes: z.string().max(500).optional().nullable(),
});

export type PayrollRunCreateInput = z.infer<typeof payrollRunCreateSchema>;

export const payrollDecisionSchema = z.object({
  runId: z.string().uuid("Invalid payroll run ID"),
  decision: z.enum(["submit", "approve", "reject", "correct"]),
  notes: z.string().max(500).optional().nullable(),
});

export type PayrollDecisionInput = z.infer<typeof payrollDecisionSchema>;

// =============================================================================
// Phase 7: Recruitment & Candidate Pipeline Schemas
// =============================================================================

export const jobPostingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(150).trim(),
  code: z.string().min(2, "Job code must be at least 2 characters").max(30).trim(),
  departmentId: z.string().uuid("Invalid department").optional().nullable(),
  designationId: z.string().uuid("Invalid designation").optional().nullable(),
  hiringManagerId: z.string().uuid("Invalid hiring manager").optional().nullable(),
  description: z.string().min(10, "Description must be at least 10 characters").trim(),
  requirements: z.string().max(2000).optional().nullable(),
  location: z.string().min(2).max(100).default("On-site"),
  employmentType: z.enum(["full_time", "part_time", "contract", "intern", "probation"]).default("full_time"),
  vacancyCount: z.number().int().positive("Vacancy count must be at least 1").default(1),
  minSalary: z.number().nonnegative().optional().nullable(),
  maxSalary: z.number().nonnegative().optional().nullable(),
  status: z.enum(["draft", "published", "closed", "on_hold"]).default("published"),
});

export type JobPostingInput = z.infer<typeof jobPostingSchema>;

export const candidateCreateSchema = z.object({
  jobPostingId: z.string().uuid("Invalid job posting ID"),
  firstName: z.string().min(1, "First name cannot be empty").max(50).trim(),
  lastName: z.string().min(1, "Last name cannot be empty").max(50).trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  phone: z.string().max(20).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  source: z.string().max(50).default("direct"),
});

export type CandidateCreateInput = z.infer<typeof candidateCreateSchema>;

export const candidateStageTransitionSchema = z.object({
  candidateId: z.string().uuid("Invalid candidate ID"),
  toStage: z.enum(["applied", "screening", "interview", "offer", "hired", "rejected"]),
  notes: z.string().max(500).optional().nullable(),
});

export type CandidateStageTransitionInput = z.infer<typeof candidateStageTransitionSchema>;

export const interviewScheduleSchema = z.object({
  candidateId: z.string().uuid("Invalid candidate ID"),
  jobPostingId: z.string().uuid("Invalid job posting ID"),
  interviewType: z.enum(["screening", "technical", "hr", "management"]).default("technical"),
  scheduledAt: z.string().datetime("Must be valid ISO timestamp"),
  durationMinutes: z.number().int().min(15).max(240).default(45),
  interviewerName: z.string().min(2, "Interviewer name required").max(100).trim(),
});

export type InterviewScheduleInput = z.infer<typeof interviewScheduleSchema>;

export const interviewFeedbackSchema = z.object({
  interviewId: z.string().uuid("Invalid interview ID"),
  status: z.enum(["scheduled", "completed", "cancelled"]).default("completed"),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  feedback: z.string().max(2000).optional().nullable(),
  recommendation: z.enum(["strong_hire", "hire", "undecided", "reject"]).optional().nullable(),
});

export type InterviewFeedbackInput = z.infer<typeof interviewFeedbackSchema>;

export const jobOfferCreateSchema = z.object({
  candidateId: z.string().uuid("Invalid candidate ID"),
  jobPostingId: z.string().uuid("Invalid job posting ID"),
  designationId: z.string().uuid("Invalid designation ID").optional().nullable(),
  departmentId: z.string().uuid("Invalid department ID").optional().nullable(),
  offeredSalary: z.number().positive("Offered salary must be positive"),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Joining date must be YYYY-MM-DD"),
  notes: z.string().max(500).optional().nullable(),
});

export type JobOfferCreateInput = z.infer<typeof jobOfferCreateSchema>;

export const jobOfferDecisionSchema = z.object({
  offerId: z.string().uuid("Invalid offer ID"),
  status: z.enum(["sent", "accepted", "rejected", "withdrawn"]),
  notes: z.string().max(500).optional().nullable(),
});

export type JobOfferDecisionInput = z.infer<typeof jobOfferDecisionSchema>;

export const hireCandidateSchema = z.object({
  candidateId: z.string().uuid("Invalid candidate ID"),
  branchId: z.string().uuid("Branch assignment required").optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type HireCandidateInput = z.infer<typeof hireCandidateSchema>;



// =============================================================================
// SECTION 13: Phase 8 Operations & Talent Management Validation Schemas
// =============================================================================

// 13.1 Onboarding
export const onboardingCaseCreateSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID"),
  candidateId: z.string().uuid("Invalid candidate ID").optional().nullable(),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Joining date must be YYYY-MM-DD"),
  departmentId: z.string().uuid("Invalid department ID").optional().nullable(),
  designationId: z.string().uuid("Invalid designation ID").optional().nullable(),
  branchId: z.string().uuid("Invalid branch ID").optional().nullable(),
  reportingManagerId: z.string().uuid("Invalid reporting manager ID").optional().nullable(),
  templateId: z.string().uuid("Invalid template ID").optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export type OnboardingCaseCreateInput = z.infer<typeof onboardingCaseCreateSchema>;

export const onboardingTaskUpdateSchema = z.object({
  taskId: z.string().uuid("Invalid task ID"),
  status: z.enum(["pending", "in_progress", "completed", "skipped"]),
  notes: z.string().max(500).optional().nullable(),
});

export type OnboardingTaskUpdateInput = z.infer<typeof onboardingTaskUpdateSchema>;

export const onboardingCompleteSchema = z.object({
  caseId: z.string().uuid("Invalid case ID"),
  notes: z.string().max(1000).optional().nullable(),
});

export type OnboardingCompleteInput = z.infer<typeof onboardingCompleteSchema>;

// 13.2 Offboarding
export const offboardingInitiateSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID"),
  exitType: z.enum(["resignation", "termination", "contract_end", "retirement"]),
  reason: z.string().min(5, "Exit reason must be at least 5 characters").max(1000),
  lastWorkingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Last working date must be YYYY-MM-DD"),
  noticePeriodDays: z.number().int().min(0).max(180).default(30),
});

export type OffboardingInitiateInput = z.infer<typeof offboardingInitiateSchema>;

export const offboardingClearanceUpdateSchema = z.object({
  clearanceItemId: z.string().uuid("Invalid clearance item ID"),
  status: z.enum(["pending", "cleared", "flagged"]),
  comments: z.string().max(500).optional().nullable(),
});

export type OffboardingClearanceUpdateInput = z.infer<typeof offboardingClearanceUpdateSchema>;

export const offboardingDecisionSchema = z.object({
  caseId: z.string().uuid("Invalid case ID"),
  step: z.enum(["manager_approval", "hr_approval", "complete_exit"]),
  decision: z.enum(["approve", "reject"]),
  notes: z.string().max(1000).optional().nullable(),
});

export type OffboardingDecisionInput = z.infer<typeof offboardingDecisionSchema>;

// 13.3 Performance
export const performanceCycleCreateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD"),
  description: z.string().max(1000).optional().nullable(),
});

export type PerformanceCycleCreateInput = z.infer<typeof performanceCycleCreateSchema>;

export const performanceGoalSchema = z.object({
  cycleId: z.string().uuid("Invalid cycle ID"),
  employeeId: z.string().uuid("Invalid employee ID"),
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().max(1000).optional().nullable(),
  weight: z.number().min(0).max(100),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Target date must be YYYY-MM-DD").optional().nullable(),
  progressPercent: z.number().int().min(0).max(100).default(0),
  status: z.enum(["not_started", "in_progress", "achieved", "partially_achieved", "missed"]).default("in_progress"),
});

export type PerformanceGoalInput = z.infer<typeof performanceGoalSchema>;

export const performanceReviewSubmitSchema = z.object({
  reviewId: z.string().uuid("Invalid review ID"),
  stage: z.enum(["self", "manager", "acknowledge"]),
  rating: z.number().min(1.0, "Rating cannot be less than 1.0").max(5.0, "Rating cannot exceed 5.0"),
  feedback: z.string().min(5, "Feedback comments required").max(3000),
  competenciesScore: z.number().min(1.0).max(5.0).optional().nullable(),
});

export type PerformanceReviewSubmitInput = z.infer<typeof performanceReviewSubmitSchema>;

// 13.4 Tasks
export const employeeTaskCreateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().max(2000).optional().nullable(),
  assigneeId: z.string().uuid("Invalid assignee ID").optional().nullable(),
  relatedEmployeeId: z.string().uuid("Invalid related employee ID").optional().nullable(),
  workflowType: z.enum(["general", "onboarding", "offboarding", "it", "hr", "compliance"]).default("general"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD").optional().nullable(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be YYYY-MM-DD").optional().nullable(),
});

export type EmployeeTaskCreateInput = z.infer<typeof employeeTaskCreateSchema>;

export const employeeTaskUpdateSchema = z.object({
  taskId: z.string().uuid("Invalid task ID"),
  status: z.enum(["open", "in_progress", "blocked", "completed", "cancelled"]),
  completionEvidence: z.string().max(1000).optional().nullable(),
});

export type EmployeeTaskUpdateInput = z.infer<typeof employeeTaskUpdateSchema>;

// 13.5 IT Assets
export const assetCreateSchema = z.object({
  assetTag: z.string().min(3, "Asset tag must be at least 3 characters").max(50),
  name: z.string().min(2, "Asset name required").max(150),
  category: z.enum(["laptop", "desktop", "monitor", "mobile", "network", "software", "peripherals", "other"]),
  serialNumber: z.string().max(100).optional().nullable(),
  manufacturer: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Purchase date must be YYYY-MM-DD").optional().nullable(),
  warrantyExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Warranty date must be YYYY-MM-DD").optional().nullable(),
  location: z.string().max(100).default("Main Campus"),
  condition: z.enum(["excellent", "good", "fair", "poor"]).default("good"),
  specifications: z.record(z.unknown()).optional(),
});

export type AssetCreateInput = z.infer<typeof assetCreateSchema>;

export const assetAssignSchema = z.object({
  assetId: z.string().uuid("Invalid asset ID"),
  employeeId: z.string().uuid("Invalid employee ID"),
  assignedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Assigned date must be YYYY-MM-DD"),
  returnDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Return due date must be YYYY-MM-DD").optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type AssetAssignInput = z.infer<typeof assetAssignSchema>;

export const assetReturnSchema = z.object({
  assignmentId: z.string().uuid("Invalid assignment ID"),
  returnedCondition: z.enum(["excellent", "good", "fair", "poor"]).default("good"),
  notes: z.string().max(500).optional().nullable(),
});

export type AssetReturnInput = z.infer<typeof assetReturnSchema>;

// 13.6 Documents
export const documentUploadSchema = z.object({
  title: z.string().min(3, "Document title required").max(200),
  category: z.enum(["identification", "academic", "employment_contract", "payroll_tax", "certification", "policy", "performance", "medical", "other"]),
  employeeId: z.string().uuid("Invalid employee ID").optional().nullable(),
  filePath: z.string().min(1, "File path required"),
  fileName: z.string().min(1, "File name required"),
  fileSizeBytes: z.number().int().positive().max(26214400, "Maximum file size is 25MB"),
  mimeType: z.string().min(1, "MIME type required"),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expiry date must be YYYY-MM-DD").optional().nullable(),
  isConfidential: z.boolean().default(true),
});

export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;

export const documentVerifySchema = z.object({
  documentId: z.string().uuid("Invalid document ID"),
  verificationStatus: z.enum(["verified", "rejected"]),
  notes: z.string().max(500).optional().nullable(),
});

export type DocumentVerifyInput = z.infer<typeof documentVerifySchema>;

// 13.7 Announcements
export const announcementCreateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(250),
  body: z.string().min(5, "Announcement body required"),
  targetType: z.enum(["all", "department", "branch", "role"]).default("all"),
  targetId: z.string().max(100).optional().nullable(),
  priority: z.enum(["normal", "high", "urgent"]).default("normal"),
  publishedAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

export type AnnouncementCreateInput = z.infer<typeof announcementCreateSchema>;

// 13.8 Shared Approvals
export const sharedApprovalDecisionSchema = z.object({
  approvalId: z.string().uuid("Invalid approval ID"),
  decision: z.enum(["approve", "reject", "cancelled"]),
  notes: z.string().max(500).optional().nullable(),
});

export type SharedApprovalDecisionInput = z.infer<typeof sharedApprovalDecisionSchema>;
