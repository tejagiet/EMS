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

