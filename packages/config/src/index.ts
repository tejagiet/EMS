/**
 * @ems/config — Shared constants and configuration for EMS
 * Project: GIET Polytechnic College | AI Department | Team T-1
 * Publisher ID: GIETP-AI-IT-EMS-T1-2026
 */

import {
  PORTAL_ROLES,
  type PermissionCode,
  type PortalConfig,
  type PortalNavigationItem,
  type PortalRole,
  type PortalRoleDefinition,
} from "@ems/types";

export { PORTAL_ROLES };

// =============================================================================
// 1. Institutional Identification
// =============================================================================

export const INSTITUTION = {
  name: "GIET Polytechnic College",
  department: "Artificial Intelligence (AI) Department",
  batch: "2024–2027",
  projectName: "Employee Management System (EMS)",
  team: "Team T-1",
  category: "Industrial Training Project",
  publisherId: "GIETP-AI-IT-EMS-T1-2026",
  attribution:
    "GIET Polytechnic College | Artificial Intelligence Department | Batch 2024–2027 | EMS Team T-1",
} as const;

export const APP_NAME = "Employee Management System" as const;
export const APP_SHORT_NAME = "EMS" as const;
export const API_VERSION = "v1" as const;

// =============================================================================
// 2. Ten Portal Role Definitions & Route Mappings
// =============================================================================

export const PORTAL_ROLE_DEFINITIONS: Record<PortalRole, PortalRoleDefinition> = {
  super_admin: {
    code: "super_admin",
    name: "Super Administrator",
    description: "Global administrative authority over platform infrastructure and tenants",
    defaultPortalPath: "/portal/super-admin",
    isSystemRole: true,
  },
  org_admin: {
    code: "org_admin",
    name: "Organization Administrator",
    description: "Tenant administrator managing organization units, policies, and memberships",
    defaultPortalPath: "/portal/org-admin",
    isSystemRole: false,
  },
  hr_manager: {
    code: "hr_manager",
    name: "Human Resources",
    description: "Employee records lifecycle, organizational hierarchy, and attendance oversight",
    defaultPortalPath: "/portal/hr",
    isSystemRole: true,
  },
  recruitment_manager: {
    code: "recruitment_manager",
    name: "Recruitment",
    description: "Job openings, candidate pipelines, interviews, and employee onboarding",
    defaultPortalPath: "/portal/recruitment",
    isSystemRole: true,
  },
  finance_payroll_manager: {
    code: "finance_payroll_manager",
    name: "Finance and Payroll",
    description: "Compensation structures, salary processing, disbursement, and tax ledgers",
    defaultPortalPath: "/portal/finance-payroll",
    isSystemRole: true,
  },
  manager: {
    code: "manager",
    name: "Manager",
    description: "Direct reporting-line supervisory portal for attendance, leaves, and approvals",
    defaultPortalPath: "/portal/manager",
    isSystemRole: true,
  },
  dept_head: {
    code: "dept_head",
    name: "Department Head",
    description: "Department operational planning, departmental staff overview, and authorizations",
    defaultPortalPath: "/portal/dept-head",
    isSystemRole: true,
  },
  it_assets_manager: {
    code: "it_assets_manager",
    name: "IT and Assets",
    description: "Hardware, equipment tracking, software licenses, and asset allocation",
    defaultPortalPath: "/portal/it-assets",
    isSystemRole: true,
  },
  employee: {
    code: "employee",
    name: "Employee Self-Service",
    description: "Personal profile, leave applications, attendance clocking, and payslip access",
    defaultPortalPath: "/portal/employee",
    isSystemRole: true,
  },
  auditor: {
    code: "auditor",
    name: "Auditor",
    description:
      "Read-only inspection of organizational logs, audit ledgers, and compliance reports",
    defaultPortalPath: "/portal/auditor",
    isSystemRole: true,
  },
};

export const PORTAL_ROUTES: Record<PortalRole, string> = {
  super_admin: "/portal/super-admin",
  org_admin: "/portal/org-admin",
  hr_manager: "/portal/hr",
  recruitment_manager: "/portal/recruitment",
  finance_payroll_manager: "/portal/finance-payroll",
  manager: "/portal/manager",
  dept_head: "/portal/dept-head",
  it_assets_manager: "/portal/it-assets",
  employee: "/portal/employee",
  auditor: "/portal/auditor",
};

// =============================================================================
// 3. Documented Role-Permission Matrix (Least-Privilege Principle)
// =============================================================================

export const ROLE_PERMISSIONS_MATRIX: Record<PortalRole, readonly PermissionCode[]> = {
  super_admin: [
    "organization.read",
    "organization.write",
    "employee.read",
    "employee.write",
    "attendance.self",
    "attendance.read",
    "attendance.manage",
    "leave.self",
    "leave.read",
    "leave.approve",
    "payroll.read",
    "payroll.write",
    "payroll.approve",
    "recruitment.read",
    "recruitment.write",
    "asset.read",
    "asset.manage",
    "document.read",
    "document.write",
    "report.read",
    "audit.read",
    "role.manage",
  ],
  org_admin: [
    "organization.read",
    "organization.write",
    "employee.read",
    "employee.write",
    "attendance.self",
    "attendance.read",
    "attendance.manage",
    "leave.self",
    "leave.read",
    "leave.approve",
    "payroll.read",
    "recruitment.read",
    "asset.read",
    "asset.manage",
    "document.read",
    "document.write",
    "report.read",
    "audit.read",
    "role.manage",
  ],
  hr_manager: [
    "organization.read",
    "employee.read",
    "employee.write",
    "attendance.self",
    "attendance.read",
    "attendance.manage",
    "leave.self",
    "leave.read",
    "leave.approve",
    "recruitment.read",
    "document.read",
    "document.write",
    "report.read",
  ],
  recruitment_manager: [
    "organization.read",
    "employee.read",
    "recruitment.read",
    "recruitment.write",
    "document.read",
    "report.read",
  ],
  finance_payroll_manager: [
    "organization.read",
    "employee.read",
    "payroll.read",
    "payroll.write",
    "payroll.approve",
    "report.read",
    "document.read",
  ],
  manager: [
    "organization.read",
    "employee.read",
    "attendance.self",
    "attendance.read",
    "attendance.manage",
    "leave.self",
    "leave.read",
    "leave.approve",
    "report.read",
  ],
  dept_head: [
    "organization.read",
    "employee.read",
    "attendance.self",
    "attendance.read",
    "attendance.manage",
    "leave.self",
    "leave.read",
    "leave.approve",
    "asset.read",
    "report.read",
    "document.read",
  ],
  it_assets_manager: [
    "organization.read",
    "employee.read",
    "asset.read",
    "asset.manage",
    "report.read",
  ],
  employee: ["organization.read", "attendance.self", "leave.self", "document.read"],
  auditor: [
    "organization.read",
    "employee.read",
    "attendance.read",
    "leave.read",
    "payroll.read",
    "asset.read",
    "document.read",
    "report.read",
    "audit.read",
  ],
};

// =============================================================================
// 4. Portal Shell Navigation Configurations
// =============================================================================

export const PORTAL_CONFIGS: Record<PortalRole, PortalConfig> = {
  super_admin: {
    role: "super_admin",
    displayName: "Super Admin Portal",
    basePath: "/portal/super-admin",
    description: "System-wide administration, tenant provisioning, and global telemetry",
    navigation: [
      { id: "overview", label: "Overview", path: "/portal/super-admin" },
      {
        id: "organizations",
        label: "Organizations",
        path: "/portal/super-admin#organizations",
        requiredPermission: "organization.write",
      },
      {
        id: "roles",
        label: "Roles & Security",
        path: "/portal/super-admin#roles",
        requiredPermission: "role.manage",
      },
      {
        id: "audit",
        label: "System Audit Logs",
        path: "/portal/super-admin#audit",
        requiredPermission: "audit.read",
      },
      { id: "settings", label: "Platform Settings", path: "/portal/super-admin#settings" },
    ],
  },
  org_admin: {
    role: "org_admin",
    displayName: "Organization Admin Portal",
    basePath: "/portal/org-admin",
    description: "Manage organizational units, branches, departments, and user roles",
    navigation: [
      { id: "overview", label: "Overview", path: "/portal/org-admin" },
      {
        id: "departments",
        label: "Departments & Branches",
        path: "/portal/org-admin#departments",
        requiredPermission: "organization.write",
      },
      {
        id: "members",
        label: "Members & Roles",
        path: "/portal/org-admin#members",
        requiredPermission: "role.manage",
      },
      { id: "policies", label: "Organization Policies", path: "/portal/org-admin#policies" },
      {
        id: "audit",
        label: "Audit Ledger",
        path: "/portal/org-admin#audit",
        requiredPermission: "audit.read",
      },
    ],
  },
  hr_manager: {
    role: "hr_manager",
    displayName: "HR Portal",
    basePath: "/portal/hr",
    description:
      "Employee records, organizational hierarchy, leave policies, and attendance oversight",
    navigation: [
      { id: "overview", label: "Overview", path: "/portal/hr" },
      {
        id: "employees",
        label: "Employee Directory",
        path: "/portal/hr/employees",
        requiredPermission: "employee.read",
      },
      {
        id: "departments",
        label: "Departments & Units",
        path: "/portal/hr/departments",
        requiredPermission: "organization.read",
      },
      {
        id: "designations",
        label: "Designations & Grades",
        path: "/portal/hr/designations",
        requiredPermission: "organization.read",
      },
      {
        id: "branches",
        label: "Branches & Locations",
        path: "/portal/hr/branches",
        requiredPermission: "organization.read",
      },
      {
        id: "attendance",
        label: "Attendance Rosters",
        path: "/portal/hr/attendance",
        requiredPermission: "attendance.read",
      },
      {
        id: "shifts",
        label: "Shift Scheduling",
        path: "/portal/hr/shifts",
        requiredPermission: "attendance.manage",
      },
      {
        id: "leave",
        label: "Leave Management",
        path: "/portal/hr/leave",
        requiredPermission: "leave.approve",
      },
      {
        id: "onboarding",
        label: "Onboarding Cases",
        path: "/portal/hr/onboarding",
        requiredPermission: "employee.write",
      },
      {
        id: "offboarding",
        label: "Offboarding & Exits",
        path: "/portal/hr/offboarding",
        requiredPermission: "employee.write",
      },
      {
        id: "performance",
        label: "Performance Appraisals",
        path: "/portal/hr/performance",
        requiredPermission: "employee.write",
      },
      {
        id: "documents",
        label: "Document Centre",
        path: "/portal/hr/documents",
        requiredPermission: "document.write",
      },
      {
        id: "announcements",
        label: "Announcements",
        path: "/portal/hr/announcements",
        requiredPermission: "organization.write",
      },
      {
        id: "import_export",
        label: "Import & Export",
        path: "/portal/hr/import-export",
        requiredPermission: "employee.read",
      },
    ],
  },
  recruitment_manager: {
    role: "recruitment_manager",
    displayName: "Recruitment Portal",
    basePath: "/portal/recruitment",
    description: "Open requisitions, applicant pipelines, interview scheduling, and onboarding",
    navigation: [
      { id: "overview", label: "Overview", path: "/portal/recruitment" },
      {
        id: "openings",
        label: "Job Openings",
        path: "/portal/recruitment#openings",
        requiredPermission: "recruitment.read",
      },
      {
        id: "candidates",
        label: "Candidate Pipeline",
        path: "/portal/recruitment#candidates",
        requiredPermission: "recruitment.write",
      },
      { id: "onboarding", label: "New Hire Onboarding", path: "/portal/recruitment#onboarding" },
    ],
  },
  finance_payroll_manager: {
    role: "finance_payroll_manager",
    displayName: "Finance & Payroll Portal",
    basePath: "/portal/finance-payroll",
    description: "Salary structures, payroll cycles, tax deductions, and payment authorizations",
    navigation: [
      { id: "overview", label: "Overview", path: "/portal/finance-payroll" },
      {
        id: "salary-structures",
        label: "Salary Structures",
        path: "/portal/finance-payroll#structures",
        requiredPermission: "payroll.read",
      },
      {
        id: "payroll-runs",
        label: "Payroll Processing",
        path: "/portal/finance-payroll#runs",
        requiredPermission: "payroll.write",
      },
      {
        id: "approvals",
        label: "Salary Approvals",
        path: "/portal/finance-payroll#approvals",
        requiredPermission: "payroll.approve",
      },
      {
        id: "tax-reports",
        label: "Tax & Financial Reports",
        path: "/portal/finance-payroll#reports",
        requiredPermission: "report.read",
      },
    ],
  },
  manager: {
    role: "manager",
    displayName: "Manager Portal",
    basePath: "/portal/manager",
    description: "Direct reports monitoring, shift rosters, attendance approvals, and team leaves",
    navigation: [
      { id: "overview", label: "Overview", path: "/portal/manager" },
      {
        id: "my-team",
        label: "Reporting Team",
        path: "/portal/manager#team",
        requiredPermission: "employee.read",
      },
      {
        id: "approvals",
        label: "Pending Approvals",
        path: "/portal/manager#approvals",
        requiredPermission: "leave.approve",
      },
      {
        id: "shifts",
        label: "Team Schedules",
        path: "/portal/manager#shifts",
        requiredPermission: "attendance.read",
      },
    ],
  },
  dept_head: {
    role: "dept_head",
    displayName: "Department Head Portal",
    basePath: "/portal/dept-head",
    description: "Departmental operations, resource allocation, and department performance",
    navigation: [
      { id: "overview", label: "Overview", path: "/portal/dept-head" },
      {
        id: "department-staff",
        label: "Department Staff",
        path: "/portal/dept-head#staff",
        requiredPermission: "employee.read",
      },
      {
        id: "dept-leave",
        label: "Leave Approvals",
        path: "/portal/dept-head#leave",
        requiredPermission: "leave.approve",
      },
      {
        id: "dept-assets",
        label: "Department Assets",
        path: "/portal/dept-head#assets",
        requiredPermission: "asset.read",
      },
    ],
  },
  it_assets_manager: {
    role: "it_assets_manager",
    displayName: "IT & Assets Portal",
    basePath: "/portal/it-assets",
    description: "Inventory management, device allocation, license compliance, and maintenance",
    navigation: [
      { id: "overview", label: "Overview", path: "/portal/it-assets" },
      {
        id: "inventory",
        label: "Asset Inventory",
        path: "/portal/it-assets#inventory",
        requiredPermission: "asset.read",
      },
      {
        id: "allocations",
        label: "Equipment Allocation",
        path: "/portal/it-assets#allocations",
        requiredPermission: "asset.manage",
      },
      { id: "maintenance", label: "Maintenance Log", path: "/portal/it-assets#maintenance" },
    ],
  },
  employee: {
    role: "employee",
    displayName: "Employee Portal",
    basePath: "/portal/employee",
    description: "Personal self-service: attendance clocking, leave requests, and profile details",
    navigation: [
      { id: "overview", label: "My Dashboard", path: "/portal/employee" },
      {
        id: "attendance",
        label: "My Attendance",
        path: "/portal/employee#attendance",
        requiredPermission: "attendance.self",
      },
      {
        id: "leave",
        label: "My Leaves",
        path: "/portal/employee#leave",
        requiredPermission: "leave.self",
      },
      { id: "payslips", label: "My Payslips", path: "/portal/employee#payslips" },
      {
        id: "documents",
        label: "My Documents",
        path: "/portal/employee#documents",
        requiredPermission: "document.read",
      },
    ],
  },
  auditor: {
    role: "auditor",
    displayName: "Auditor Portal",
    basePath: "/portal/auditor",
    description:
      "Read-only compliance verification, security trail inspection, and regulatory audits",
    navigation: [
      { id: "overview", label: "Audit Overview", path: "/portal/auditor" },
      {
        id: "logs",
        label: "Activity Audit Logs",
        path: "/portal/auditor#logs",
        requiredPermission: "audit.read",
      },
      {
        id: "payroll-audit",
        label: "Payroll Audit Trail",
        path: "/portal/auditor#payroll",
        requiredPermission: "payroll.read",
      },
      {
        id: "employee-changes",
        label: "Employee Ledger",
        path: "/portal/auditor#changes",
        requiredPermission: "employee.read",
      },
    ],
  },
};

// =============================================================================
// 5. RBAC Evaluator Utilities
// =============================================================================

export function getRolePermissions(role: PortalRole): readonly PermissionCode[] {
  return ROLE_PERMISSIONS_MATRIX[role];
}

export function hasPermission(
  userPermissions: readonly PermissionCode[],
  required: PermissionCode,
): boolean {
  return userPermissions.includes(required);
}

export function hasAnyPermission(
  userPermissions: readonly PermissionCode[],
  required: readonly PermissionCode[],
): boolean {
  return required.some((perm) => userPermissions.includes(perm));
}

export function hasAllPermissions(
  userPermissions: readonly PermissionCode[],
  required: readonly PermissionCode[],
): boolean {
  return required.every((perm) => userPermissions.includes(perm));
}

export function canAccessPortal(role: PortalRole, targetRole: PortalRole): boolean {
  if (role === "super_admin") return true;
  return role === targetRole;
}

export function filterNavigationByPermissions(
  items: readonly PortalNavigationItem[],
  userPermissions: readonly PermissionCode[],
): PortalNavigationItem[] {
  return items.filter((item) => {
    if (!item.requiredPermission) return true;
    return hasPermission(userPermissions, item.requiredPermission);
  });
}
