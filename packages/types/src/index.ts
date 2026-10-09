/**
 * @ems/types — Shared TypeScript types for Employee Management System (EMS)
 * Project: GIET Polytechnic College | AI Department | Team T-1
 * Publisher ID: GIETP-AI-IT-EMS-T1-2026
 */

// =============================================================================
// 1. Primitive and Utility Types
// =============================================================================

export type UUID = string;
export type ISODateString = string;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

// =============================================================================
// 2. Ten Portal Roles (EMS RBAC)
// =============================================================================

export const PORTAL_ROLES = [
  "super_admin",
  "org_admin",
  "hr_manager",
  "recruitment_manager",
  "finance_payroll_manager",
  "manager",
  "dept_head",
  "it_assets_manager",
  "employee",
  "auditor",
] as const;

export type PortalRole = (typeof PORTAL_ROLES)[number];

export interface PortalRoleDefinition {
  readonly code: PortalRole;
  readonly name: string;
  readonly description: string;
  readonly defaultPortalPath: string;
  readonly isSystemRole: boolean;
}

// =============================================================================
// 3. Granular Permission Codes
// =============================================================================

export const PERMISSION_CODES = [
  // Organization
  "organization.read",
  "organization.write",
  // Employees
  "employee.read",
  "employee.write",
  // Attendance
  "attendance.self",
  "attendance.read",
  "attendance.manage",
  // Leave
  "leave.self",
  "leave.read",
  "leave.approve",
  // Payroll & Finance
  "payroll.read",
  "payroll.write",
  "payroll.approve",
  // Recruitment
  "recruitment.read",
  "recruitment.write",
  // IT & Assets
  "asset.read",
  "asset.manage",
  // Documents
  "document.read",
  "document.write",
  // Reports & Analytics
  "report.read",
  // Audit
  "audit.read",
  // Roles & Security
  "role.manage",
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];

// =============================================================================
// 4. Data Models: Profiles, Organizations, Memberships
// =============================================================================

export interface Organization {
  id: UUID;
  name: string;
  slug: string;
  code: string;
  address: Nullable<string>;
  phone: Nullable<string>;
  email: Nullable<string>;
  logoUrl: Nullable<string>;
  website: Nullable<string>;
  isActive: boolean;
  settings: Record<string, unknown>;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface UserProfile {
  id: UUID; // Matches auth.users.id
  organizationId: Nullable<UUID>;
  fullName: string;
  avatarUrl: Nullable<string>;
  phone: Nullable<string>;
  dateOfBirth: Nullable<string>;
  gender: Nullable<"male" | "female" | "other" | "prefer_not_to_say">;
  locale: string;
  timezone: string;
  isActive: boolean;
  lastSeenAt: Nullable<ISODateString>;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface EmployeeProfileLink {
  id: UUID;
  organizationId: UUID;
  profileId: Nullable<UUID>;
  branchId: Nullable<UUID>;
  departmentId: Nullable<UUID>;
  designationId: Nullable<UUID>;
  reportingManagerId: Nullable<UUID>;
  employeeCode: string;
  employmentType: "full_time" | "part_time" | "contract" | "intern" | "probation";
  employmentStatus: "active" | "inactive" | "terminated" | "resigned" | "on_leave" | "suspended";
  dateOfJoining: string;
  workEmail: Nullable<string>;
  workPhone: Nullable<string>;
  isActive: boolean;
}

export interface UserRoleAssignment {
  id: UUID;
  organizationId: UUID;
  profileId: UUID;
  roleId: UUID;
  roleCode: PortalRole;
  roleName: string;
  isSystem: boolean;
  isActive: boolean;
  expiresAt: Nullable<ISODateString>;
  assignedAt: ISODateString;
}

export interface OrganizationMembership {
  organizationId: UUID;
  organizationName: string;
  organizationSlug: string;
  roles: PortalRole[];
  isDefault: boolean;
}

// =============================================================================
// 5. Authenticated Context & Session State
// =============================================================================

export interface AuthenticatedUserContext {
  userId: UUID;
  email: string;
  profile: UserProfile;
  activeOrganization: Nullable<Organization>;
  memberships: OrganizationMembership[];
  activeRole: PortalRole;
  availableRoles: PortalRole[];
  permissions: PermissionCode[];
  linkedEmployee: Nullable<EmployeeProfileLink>;
  isAccountActive: boolean;
}

export interface PortalNavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  requiredPermission?: PermissionCode;
  badge?: string;
}

export interface PortalConfig {
  role: PortalRole;
  displayName: string;
  basePath: string;
  description: string;
  navigation: PortalNavigationItem[];
}

// =============================================================================
// 6. Auth Operation Payloads
// =============================================================================

export interface SignInCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface PasswordRecoveryRequest {
  email: string;
}

export interface PasswordResetPayload {
  newPassword: string;
  confirmPassword: string;
}

export interface AuthActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  redirectTo?: string;
}

// =============================================================================
// 7. Phase 5 Employee Management Module Types
// =============================================================================

export type EmploymentType = "full_time" | "part_time" | "contract" | "intern" | "probation";

export type EmploymentStatus =
  | "active"
  | "inactive"
  | "terminated"
  | "resigned"
  | "on_leave"
  | "suspended";

export interface Employee {
  id: UUID;
  organizationId: UUID;
  profileId: Nullable<UUID>;
  branchId: Nullable<UUID>;
  departmentId: Nullable<UUID>;
  designationId: Nullable<UUID>;
  reportingManagerId: Nullable<UUID>;
  employeeCode: string;
  firstName: Nullable<string>;
  lastName: Nullable<string>;
  fullName: string;
  contactNumber: Nullable<string>;
  workEmail: Nullable<string>;
  workPhone: Nullable<string>;
  emergencyContactName: Nullable<string>;
  emergencyContactRelationship: Nullable<string>;
  emergencyContactPhone: Nullable<string>;
  addressLine1: Nullable<string>;
  addressLine2: Nullable<string>;
  city: Nullable<string>;
  state: Nullable<string>;
  postalCode: Nullable<string>;
  country: Nullable<string>;
  workLocation: Nullable<string>;
  notes: Nullable<string>;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  dateOfJoining: string;
  dateOfConfirmation: Nullable<string>;
  dateOfResignation: Nullable<string>;
  dateOfTermination: Nullable<string>;
  noticePeriodDays: number;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;

  // Joined display attributes
  departmentName?: string | undefined;
  branchName?: string | undefined;
  designationName?: string | undefined;
  reportingManagerName?: string | undefined;
  reportingManagerCode?: string | undefined;
}

export interface EmployeeHistoryRecord {
  id: UUID;
  organizationId: UUID;
  employeeId: UUID;
  changedBy: Nullable<UUID>;
  changedByName?: Nullable<string> | undefined;
  fieldName: string;
  oldValue: Nullable<string>;
  newValue: Nullable<string>;
  changeReason: Nullable<string>;
  effectiveDate: Nullable<string>;
  createdAt: ISODateString;
}

export interface DepartmentDetail {
  id: UUID;
  organizationId: UUID;
  branchId: Nullable<UUID>;
  parentDepartmentId: Nullable<UUID>;
  headOfDepartmentId: Nullable<UUID>;
  headOfDepartmentName?: Nullable<string> | undefined;
  name: string;
  code: string;
  description: Nullable<string>;
  isActive: boolean;
  employeeCount?: number | undefined;
  branchName?: string | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface BranchDetail {
  id: UUID;
  organizationId: UUID;
  name: string;
  code: string;
  address: Nullable<string>;
  phone: Nullable<string>;
  email: Nullable<string>;
  isActive: boolean;
  employeeCount?: number | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface DesignationDetail {
  id: UUID;
  organizationId: UUID;
  departmentId: Nullable<UUID>;
  departmentName?: string | undefined;
  name: string;
  code: string;
  grade: Nullable<string>;
  level: Nullable<number>;
  isActive: boolean;
  employeeCount?: number | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface EmployeeDirectoryFilterParams {
  search?: string | undefined;
  departmentId?: string | undefined;
  branchId?: string | undefined;
  designationId?: string | undefined;
  status?: string | undefined;
  joiningFrom?: string | undefined;
  joiningTo?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
  sortBy?: string | undefined;
  sortOrder?: ("asc" | "desc") | undefined;
}

export interface EmployeeImportRow {
  employeeCode?: string | undefined;
  firstName: string;
  lastName: string;
  workEmail?: string | undefined;
  contactNumber?: string | undefined;
  departmentCode: string;
  branchCode: string;
  designationCode: string;
  reportingManagerCode?: string | undefined;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  dateOfJoining: string;
  workLocation?: string | undefined;
}

export interface EmployeeImportResult {
  totalRows: number;
  importedCount: number;
  failedCount: number;
  errors: Array<{
    rowNumber: number;
    employeeCode?: string | undefined;
    message: string;
  }>;
}

// =============================================================================
// 7. Phase 6: Attendance, Shifts, and Leave Types
// =============================================================================

export interface Shift {
  id: UUID;
  organizationId: UUID;
  name: string;
  code: string;
  startTime: string; // HH:mm:ss
  endTime: string;   // HH:mm:ss
  breakDurationMinutes: number;
  gracePeriodMinutes: number;
  applicableDays: number[]; // 1=Mon .. 7=Sun
  isOvernight: boolean;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ShiftAssignment {
  id: UUID;
  organizationId: UUID;
  employeeId: UUID;
  shiftId: UUID;
  effectiveFrom: string;
  effectiveTo: Nullable<string>;
  isActive: boolean;
  shiftName?: string | undefined;
  shiftCode?: string | undefined;
  employeeName?: string | undefined;
  employeeCode?: string | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "half_day"
  | "on_leave"
  | "holiday"
  | "weekend";

export interface AttendanceRecord {
  id: UUID;
  organizationId: UUID;
  employeeId: UUID;
  shiftId: Nullable<UUID>;
  workDate: string; // YYYY-MM-DD
  clockIn: Nullable<ISODateString>;
  clockOut: Nullable<ISODateString>;
  breakMinutes: number;
  durationMinutes: number;
  status: AttendanceStatus;
  isLate: boolean;
  isEarlyDeparture: boolean;
  isCorrected: boolean;
  correctionNotes: Nullable<string>;
  notes: Nullable<string>;
  employeeName?: string | undefined;
  employeeCode?: string | undefined;
  shiftName?: string | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type AttendanceCorrectionStatus = "pending" | "approved" | "rejected";

export interface AttendanceCorrection {
  id: UUID;
  organizationId: UUID;
  attendanceRecordId: Nullable<UUID>;
  employeeId: UUID;
  requestedClockIn: ISODateString;
  requestedClockOut: ISODateString;
  reason: string;
  status: AttendanceCorrectionStatus;
  reviewedBy: Nullable<UUID>;
  reviewedAt: Nullable<ISODateString>;
  rejectionReason: Nullable<string>;
  employeeName?: string | undefined;
  employeeCode?: string | undefined;
  reviewedByName?: string | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface LeaveType {
  id: UUID;
  organizationId: UUID;
  name: string;
  code: string;
  daysPerYear: number;
  isPaid: boolean;
  carryForwardDays: number;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type LeaveRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveRequest {
  id: UUID;
  organizationId: UUID;
  employeeId: UUID;
  leaveTypeId: UUID;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalDays: number;
  reason: string;
  status: LeaveRequestStatus;
  reviewedBy: Nullable<UUID>;
  reviewedAt: Nullable<ISODateString>;
  rejectionReason: Nullable<string>;
  employeeName?: string | undefined;
  employeeCode?: string | undefined;
  leaveTypeName?: string | undefined;
  leaveTypeCode?: string | undefined;
  reviewedByName?: string | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type LeaveLedgerTransactionType =
  | "credit"
  | "debit"
  | "accrual"
  | "deduction"
  | "carry_forward"
  | "adjustment";

export interface LeaveLedgerEntry {
  id: UUID;
  organizationId: UUID;
  employeeId: UUID;
  leaveTypeId: UUID;
  leaveRequestId: Nullable<UUID>;
  transactionType: LeaveLedgerTransactionType;
  days: number;
  notes: Nullable<string>;
  createdAt: ISODateString;
}

export interface LeaveBalanceSummary {
  leaveTypeId: UUID;
  leaveTypeName: string;
  leaveTypeCode: string;
  daysPerYear: number;
  isPaid: boolean;
  accruedDays: number;
  usedDays: number;
  pendingDays: number;
  availableDays: number;
}

export type NotificationType =
  | "leave_submitted"
  | "leave_approved"
  | "leave_rejected"
  | "correction_submitted"
  | "correction_reviewed"
  | "shift_assigned"
  | "payroll_submitted"
  | "payroll_approved"
  | "payroll_rejected"
  | "payslip_ready"
  | "candidate_stage_changed"
  | "interview_scheduled"
  | "offer_created"
  | "candidate_hired"
  | "system";

export interface AppNotification {
  id: UUID;
  organizationId: UUID;
  recipientProfileId: UUID;
  title: string;
  message: string;
  type: NotificationType;
  link: Nullable<string>;
  isRead: boolean;
  createdAt: ISODateString;
}

// =============================================================================
// 9. Phase 7 Payroll & Compensation Types
// =============================================================================

export interface SalaryComponentItem {
  code: string;
  name: string;
  amount: number;
  type: "fixed" | "percentage";
}

export interface SalaryStructure {
  id: UUID;
  organizationId: UUID;
  employeeId: UUID;
  baseSalary: number;
  currency: string;
  paymentFrequency: "monthly" | "bi_weekly" | "weekly";
  allowances: SalaryComponentItem[];
  deductions: SalaryComponentItem[];
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo?: Nullable<string> | undefined;
  isActive: boolean;
  notes?: Nullable<string> | undefined;
  createdBy?: Nullable<UUID> | undefined;
  employeeName?: string | undefined;
  employeeCode?: string | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type PayrollRunStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "cancelled";

export interface PayrollRun {
  id: UUID;
  organizationId: UUID;
  title: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
  paymentDate: string; // YYYY-MM-DD
  status: PayrollRunStatus;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  isLocked: boolean;
  preparedBy?: Nullable<UUID> | undefined;
  approvedBy?: Nullable<UUID> | undefined;
  approvedAt?: Nullable<ISODateString> | undefined;
  rejectionReason?: Nullable<string> | undefined;
  notes?: Nullable<string> | undefined;
  preparedByName?: string | undefined;
  approvedByName?: string | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface PayrollRecord {
  id: UUID;
  payrollRunId: UUID;
  organizationId: UUID;
  employeeId: UUID;
  salaryStructureId?: Nullable<UUID> | undefined;
  baseSalary: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  allowancesBreakdown: SalaryComponentItem[];
  deductionsBreakdown: SalaryComponentItem[];
  payslipNumber: string;
  paymentStatus: "pending" | "paid" | "cancelled";
  paymentMethod: "bank_transfer" | "cheque" | "cash";
  employeeName?: string | undefined;
  employeeCode?: string | undefined;
  departmentName?: string | undefined;
  designationName?: string | undefined;
  periodTitle?: string | undefined;
  periodStart?: string | undefined;
  periodEnd?: string | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface PayrollApprovalHistoryItem {
  id: UUID;
  payrollRunId: UUID;
  organizationId: UUID;
  actorId: UUID;
  action: "created" | "submitted" | "approved" | "rejected" | "locked" | "corrected";
  comments?: Nullable<string> | undefined;
  actorName?: string | undefined;
  createdAt: ISODateString;
}

// =============================================================================
// 10. Phase 7 Recruitment & Talent Acquisition Types
// =============================================================================

export type JobPostingStatus = "draft" | "published" | "closed" | "on_hold";

export interface JobPosting {
  id: UUID;
  organizationId: UUID;
  departmentId?: Nullable<UUID> | undefined;
  designationId?: Nullable<UUID> | undefined;
  hiringManagerId?: Nullable<UUID> | undefined;
  title: string;
  code: string;
  description: string;
  requirements?: Nullable<string> | undefined;
  location: string;
  employmentType: EmploymentType;
  vacancyCount: number;
  minSalary?: Nullable<number> | undefined;
  maxSalary?: Nullable<number> | undefined;
  status: JobPostingStatus;
  departmentName?: string | undefined;
  designationName?: string | undefined;
  hiringManagerName?: string | undefined;
  candidateCount?: number | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type CandidateStage =
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

export interface Candidate {
  id: UUID;
  organizationId: UUID;
  jobPostingId: UUID;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: Nullable<string> | undefined;
  stage: CandidateStage;
  resumeUrl?: Nullable<string> | undefined;
  notes?: Nullable<string> | undefined;
  source: string;
  jobTitle?: string | undefined;
  jobCode?: string | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CandidateStageHistoryItem {
  id: UUID;
  candidateId: UUID;
  organizationId: UUID;
  fromStage: CandidateStage;
  toStage: CandidateStage;
  changedBy?: Nullable<UUID> | undefined;
  notes?: Nullable<string> | undefined;
  changedByName?: string | undefined;
  createdAt: ISODateString;
}

export type InterviewType = "screening" | "technical" | "hr" | "management";
export type InterviewStatus = "scheduled" | "completed" | "cancelled";
export type InterviewRecommendation = "strong_hire" | "hire" | "undecided" | "reject";

export interface Interview {
  id: UUID;
  candidateId: UUID;
  organizationId: UUID;
  jobPostingId: UUID;
  interviewType: InterviewType;
  scheduledAt: ISODateString;
  durationMinutes: number;
  interviewerName: string;
  status: InterviewStatus;
  rating?: Nullable<number> | undefined;
  feedback?: Nullable<string> | undefined;
  recommendation?: Nullable<InterviewRecommendation> | undefined;
  candidateName?: string | undefined;
  candidateEmail?: string | undefined;
  jobTitle?: string | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type OfferStatus = "draft" | "sent" | "accepted" | "rejected" | "withdrawn";

export interface JobOffer {
  id: UUID;
  candidateId: UUID;
  organizationId: UUID;
  jobPostingId: UUID;
  designationId?: Nullable<UUID> | undefined;
  departmentId?: Nullable<UUID> | undefined;
  offeredSalary: number;
  joiningDate: string; // YYYY-MM-DD
  status: OfferStatus;
  notes?: Nullable<string> | undefined;
  candidateName?: string | undefined;
  candidateEmail?: string | undefined;
  jobTitle?: string | undefined;
  departmentName?: string | undefined;
  designationName?: string | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}



// =============================================================================
// 12. Phase 8: Operations & Talent Management Types
// =============================================================================

// 12.1 Onboarding
export type OnboardingStatus = "pending" | "in_progress" | "awaiting_review" | "completed" | "cancelled";
export type OnboardingTaskCategory = "general" | "documentation" | "it_setup" | "training" | "hr" | "manager";
export type OnboardingTaskRole = "hr" | "it" | "manager" | "employee";
export type OnboardingTaskStatus = "pending" | "in_progress" | "completed" | "skipped";

export interface OnboardingTemplateItem {
  title: string;
  description?: string | undefined;
  category: OnboardingTaskCategory;
  assigned_role: OnboardingTaskRole;
  is_required: boolean;
  days_due: number;
}

export interface OnboardingChecklistTemplate {
  id: UUID;
  organizationId: UUID;
  name: string;
  description?: Nullable<string> | undefined;
  isDefault: boolean;
  items: OnboardingTemplateItem[];
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface OnboardingCase {
  id: UUID;
  organizationId: UUID;
  employeeId: UUID;
  candidateId?: Nullable<UUID> | undefined;
  joiningDate: string; // YYYY-MM-DD
  departmentId?: Nullable<UUID> | undefined;
  designationId?: Nullable<UUID> | undefined;
  branchId?: Nullable<UUID> | undefined;
  reportingManagerId?: Nullable<UUID> | undefined;
  status: OnboardingStatus;
  notes?: Nullable<string> | undefined;
  createdBy?: Nullable<UUID> | undefined;
  completedAt?: Nullable<ISODateString> | undefined;
  completedBy?: Nullable<UUID> | undefined;
  cancelledAt?: Nullable<ISODateString> | undefined;
  cancelledBy?: Nullable<UUID> | undefined;
  cancellationReason?: Nullable<string> | undefined;
  employeeName?: string | undefined;
  employeeCode?: string | undefined;
  departmentName?: string | undefined;
  designationName?: string | undefined;
  branchName?: string | undefined;
  managerName?: string | undefined;
  totalTasks?: number | undefined;
  completedTasks?: number | undefined;
  progressPercent?: number | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface OnboardingTask {
  id: UUID;
  organizationId: UUID;
  caseId: UUID;
  title: string;
  description?: Nullable<string> | undefined;
  category: OnboardingTaskCategory;
  assignedRole: OnboardingTaskRole;
  assignedTo?: Nullable<UUID> | undefined;
  assigneeName?: string | undefined;
  dueDate?: Nullable<string> | undefined;
  isRequired: boolean;
  status: OnboardingTaskStatus;
  completedAt?: Nullable<ISODateString> | undefined;
  completedBy?: Nullable<UUID> | undefined;
  completedByName?: string | undefined;
  notes?: Nullable<string> | undefined;
  isOverdue?: boolean | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// 12.2 Offboarding
export type ExitType = "resignation" | "termination" | "contract_end" | "retirement";
export type OffboardingStatus = "requested" | "under_review" | "approved" | "in_progress" | "clearance_pending" | "completed" | "rejected" | "cancelled";
export type ClearanceDepartment = "it" | "finance" | "hr" | "department" | "admin";
export type ClearanceStatus = "pending" | "cleared" | "flagged";

export interface OffboardingCase {
  id: UUID;
  organizationId: UUID;
  employeeId: UUID;
  initiatedBy: UUID;
  exitType: ExitType;
  reason: string;
  lastWorkingDate: string; // YYYY-MM-DD
  noticePeriodDays: number;
  status: OffboardingStatus;
  managerApproved?: Nullable<boolean> | undefined;
  managerApprovedBy?: Nullable<UUID> | undefined;
  managerApprovedAt?: Nullable<ISODateString> | undefined;
  hrApproved?: Nullable<boolean> | undefined;
  hrApprovedBy?: Nullable<UUID> | undefined;
  hrApprovedAt?: Nullable<ISODateString> | undefined;
  exitInterviewNotes?: Nullable<string> | undefined;
  accountDeactivated: boolean;
  deactivatedAt?: Nullable<ISODateString> | undefined;
  rejectionReason?: Nullable<string> | undefined;
  employeeName?: string | undefined;
  employeeCode?: string | undefined;
  departmentName?: string | undefined;
  designationName?: string | undefined;
  totalClearanceItems?: number | undefined;
  clearedItems?: number | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface OffboardingClearanceItem {
  id: UUID;
  organizationId: UUID;
  caseId: UUID;
  departmentType: ClearanceDepartment;
  itemName: string;
  status: ClearanceStatus;
  clearedBy?: Nullable<UUID> | undefined;
  clearedByName?: string | undefined;
  clearedAt?: Nullable<ISODateString> | undefined;
  comments?: Nullable<string> | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// 12.3 Performance Management
export type PerformanceCycleStatus = "draft" | "active" | "in_review" | "completed" | "closed";
export type PerformanceGoalStatus = "not_started" | "in_progress" | "achieved" | "partially_achieved" | "missed";
export type PerformanceReviewStatus = "draft" | "self_assessment" | "manager_review" | "awaiting_acknowledgement" | "completed";

export interface PerformanceCycle {
  id: UUID;
  organizationId: UUID;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: PerformanceCycleStatus;
  description?: Nullable<string> | undefined;
  createdBy?: Nullable<UUID> | undefined;
  reviewCount?: number | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface PerformanceGoal {
  id: UUID;
  organizationId: UUID;
  cycleId: UUID;
  employeeId: UUID;
  title: string;
  description?: Nullable<string> | undefined;
  weight: number;
  targetDate?: Nullable<string> | undefined;
  progressPercent: number;
  status: PerformanceGoalStatus;
  employeeName?: string | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface PerformanceReview {
  id: UUID;
  organizationId: UUID;
  cycleId: UUID;
  employeeId: UUID;
  reviewerEmployeeId?: Nullable<UUID> | undefined;
  status: PerformanceReviewStatus;
  selfRating?: Nullable<number> | undefined;
  selfFeedback?: Nullable<string> | undefined;
  selfSubmittedAt?: Nullable<ISODateString> | undefined;
  managerRating?: Nullable<number> | undefined;
  managerFeedback?: Nullable<string> | undefined;
  competenciesScore?: Nullable<number> | undefined;
  managerSubmittedAt?: Nullable<ISODateString> | undefined;
  employeeAcknowledged: boolean;
  employeeAcknowledgedAt?: Nullable<ISODateString> | undefined;
  employeeComments?: Nullable<string> | undefined;
  isLocked: boolean;
  cycleTitle?: string | undefined;
  employeeName?: string | undefined;
  employeeCode?: string | undefined;
  reviewerName?: string | undefined;
  departmentName?: string | undefined;
  designationName?: string | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// 12.4 Tasks
export type TaskWorkflowType = "general" | "onboarding" | "offboarding" | "it" | "hr" | "compliance";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "open" | "in_progress" | "blocked" | "completed" | "cancelled";

export interface EmployeeTask {
  id: UUID;
  organizationId: UUID;
  title: string;
  description?: Nullable<string> | undefined;
  creatorId: UUID;
  assigneeId?: Nullable<UUID> | undefined;
  relatedEmployeeId?: Nullable<UUID> | undefined;
  workflowType: TaskWorkflowType;
  priority: TaskPriority;
  status: TaskStatus;
  startDate?: Nullable<string> | undefined;
  dueDate?: Nullable<string> | undefined;
  completedAt?: Nullable<ISODateString> | undefined;
  completionEvidence?: Nullable<string> | undefined;
  creatorName?: string | undefined;
  assigneeName?: string | undefined;
  relatedEmployeeName?: string | undefined;
  isOverdue?: boolean | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface TaskActivityLogItem {
  id: UUID;
  taskId: UUID;
  actorId: UUID;
  actorName?: string | undefined;
  action: string;
  notes?: Nullable<string> | undefined;
  createdAt: ISODateString;
}

// 12.5 IT Assets
export type AssetCategory = "laptop" | "desktop" | "monitor" | "mobile" | "network" | "software" | "peripherals" | "other";
export type AssetStatus = "available" | "assigned" | "under_maintenance" | "lost" | "damaged" | "retired";
export type AssetCondition = "excellent" | "good" | "fair" | "poor";

export interface ITAsset {
  id: UUID;
  organizationId: UUID;
  assetTag: string;
  serialNumber?: Nullable<string> | undefined;
  name: string;
  category: AssetCategory;
  manufacturer?: Nullable<string> | undefined;
  model?: Nullable<string> | undefined;
  purchaseDate?: Nullable<string> | undefined;
  warrantyExpiry?: Nullable<string> | undefined;
  location: string;
  status: AssetStatus;
  condition: AssetCondition;
  specifications?: Record<string, unknown> | undefined;
  currentEmployeeId?: Nullable<UUID> | undefined;
  currentEmployeeName?: string | undefined;
  currentAssignmentId?: Nullable<UUID> | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface AssetAssignment {
  id: UUID;
  organizationId: UUID;
  assetId: UUID;
  employeeId: UUID;
  assignedBy?: Nullable<UUID> | undefined;
  assignedDate: string; // YYYY-MM-DD
  returnDueDate?: Nullable<string> | undefined;
  returnedDate?: Nullable<string> | undefined;
  returnedCondition?: Nullable<string> | undefined;
  isActive: boolean;
  notes?: Nullable<string> | undefined;
  assetName?: string | undefined;
  assetTag?: string | undefined;
  employeeName?: string | undefined;
  employeeCode?: string | undefined;
  assignedByName?: string | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface AssetMaintenanceRecord {
  id: UUID;
  organizationId: UUID;
  assetId: UUID;
  maintenanceType: "repair" | "upgrade" | "inspection" | "cleaning";
  serviceProvider?: Nullable<string> | undefined;
  cost: number;
  startDate: string; // YYYY-MM-DD
  endDate?: Nullable<string> | undefined;
  status: "scheduled" | "in_progress" | "completed";
  notes?: Nullable<string> | undefined;
  assetName?: string | undefined;
  assetTag?: string | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// 12.6 Documents
export type DocumentCategory = "identification" | "academic" | "employment_contract" | "payroll_tax" | "certification" | "policy" | "performance" | "medical" | "other";
export type DocumentVerificationStatus = "pending" | "verified" | "rejected";

export interface EmployeeDocument {
  id: UUID;
  organizationId: UUID;
  employeeId?: Nullable<UUID> | undefined;
  title: string;
  category: DocumentCategory;
  description?: Nullable<string> | undefined;
  filePath: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedBy: UUID;
  expiryDate?: Nullable<string> | undefined;
  verificationStatus: DocumentVerificationStatus;
  verifiedBy?: Nullable<UUID> | undefined;
  verifiedAt?: Nullable<ISODateString> | undefined;
  isConfidential: boolean;
  employeeName?: string | undefined;
  employeeCode?: string | undefined;
  uploaderName?: string | undefined;
  verifiedByName?: string | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// 12.7 Announcements
export type AnnouncementStatus = "draft" | "published" | "archived";
export type AnnouncementTargetType = "all" | "department" | "branch" | "role";
export type AnnouncementPriority = "normal" | "high" | "urgent";

export interface Announcement {
  id: UUID;
  organizationId: UUID;
  title: string;
  body: string;
  authorId: UUID;
  status: AnnouncementStatus;
  targetType: AnnouncementTargetType;
  targetId?: Nullable<string> | undefined;
  priority: AnnouncementPriority;
  publishedAt?: Nullable<ISODateString> | undefined;
  expiresAt?: Nullable<ISODateString> | undefined;
  authorName?: string | undefined;
  isRead?: boolean | undefined;
  targetLabel?: string | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface AnnouncementRead {
  id: UUID;
  announcementId: UUID;
  profileId: UUID;
  readAt: ISODateString;
}

// 12.8 Shared Approvals
export type SharedApprovalRequestType = "onboarding_closure" | "offboarding_clearance" | "asset_assignment" | "document_verification" | "general";
export type SharedApprovalStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface SharedApproval {
  id: UUID;
  organizationId: UUID;
  requestType: SharedApprovalRequestType;
  entityId: UUID;
  requesterId: UUID;
  assignedRole: string;
  assignedApproverId?: Nullable<UUID> | undefined;
  status: SharedApprovalStatus;
  decisionNotes?: Nullable<string> | undefined;
  decidedAt?: Nullable<ISODateString> | undefined;
  requesterName?: string | undefined;
  entityTitle?: string | undefined;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Convenient Aliases
export type DocumentItem = EmployeeDocument;
export type Asset = ITAsset;
export type AssetMaintenance = AssetMaintenanceRecord;
export type ReviewStatus = PerformanceReviewStatus;

