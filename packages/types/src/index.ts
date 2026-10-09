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
