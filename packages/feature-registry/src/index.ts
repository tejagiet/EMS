/**
 * @ems/feature-registry — Centralized Feature & Portal Discovery
 * Project: GIET Polytechnic College | AI Department | Team T-1
 * Publisher ID: GIETP-AI-IT-EMS-T1-2026
 */

import {
  PORTAL_CONFIGS,
  PORTAL_ROLE_DEFINITIONS,
  ROLE_PERMISSIONS_MATRIX,
  canAccessPortal,
  getRolePermissions,
  hasPermission,
} from "@ems/config";
import type { PermissionCode, PortalConfig, PortalRole, PortalRoleDefinition } from "@ems/types";

export interface FeatureModule {
  id: string;
  name: string;
  description: string;
  requiredPermissions: PermissionCode[];
  targetPortals: PortalRole[];
  isAvailableInPhase: number;
}

export const EMS_FEATURE_MODULES: readonly FeatureModule[] = [
  {
    id: "auth-rbac",
    name: "Authentication & Role-Based Access Control",
    description: "Session management, portal route guards, and permission checking",
    requiredPermissions: ["organization.read"],
    targetPortals: [
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
    ],
    isAvailableInPhase: 3,
  },
  {
    id: "employee-management",
    name: "Employee Directory & Profiles",
    description: "CRUD operations, department assignments, and job history tracking",
    requiredPermissions: ["employee.read"],
    targetPortals: ["super_admin", "org_admin", "hr_manager", "manager", "dept_head"],
    isAvailableInPhase: 4,
  },
  {
    id: "attendance-shifts",
    name: "Attendance Clocking & Shift Scheduling",
    description: "Clock in/out, biometric sync, shift rosters, and work hours computation",
    requiredPermissions: ["attendance.read"],
    targetPortals: ["super_admin", "org_admin", "hr_manager", "manager", "employee"],
    isAvailableInPhase: 4,
  },
  {
    id: "leave-ledger",
    name: "Leave Requests & Approval Workflow",
    description: "Leave balances, application submissions, and manager approvals",
    requiredPermissions: ["leave.read"],
    targetPortals: ["super_admin", "org_admin", "hr_manager", "manager", "dept_head", "employee"],
    isAvailableInPhase: 4,
  },
  {
    id: "finance-payroll",
    name: "Salary Structures & Payroll Engine",
    description: "Salary slips, tax calculations, bonus incentives, and payroll disbursement",
    requiredPermissions: ["payroll.read"],
    targetPortals: ["super_admin", "org_admin", "finance_payroll_manager", "auditor"],
    isAvailableInPhase: 4,
  },
  {
    id: "recruitment-pipeline",
    name: "Recruitment & Onboarding",
    description: "Job openings, candidate resume scoring, interview feedback, and hiring",
    requiredPermissions: ["recruitment.read"],
    targetPortals: ["super_admin", "org_admin", "hr_manager", "recruitment_manager"],
    isAvailableInPhase: 5,
  },
  {
    id: "it-asset-tracking",
    name: "IT Equipment & Assets",
    description: "Asset serial inventory, hardware checkout, and software license tracking",
    requiredPermissions: ["asset.read"],
    targetPortals: ["super_admin", "org_admin", "it_assets_manager", "dept_head"],
    isAvailableInPhase: 5,
  },
  {
    id: "audit-compliance",
    name: "Security Audit & Activity Logs",
    description: "System logs, immutable change ledgers, and compliance inspections",
    requiredPermissions: ["audit.read"],
    targetPortals: ["super_admin", "org_admin", "auditor"],
    isAvailableInPhase: 3,
  },
] as const;

export function getFeaturesForRole(role: PortalRole): FeatureModule[] {
  const permissions = getRolePermissions(role);
  return EMS_FEATURE_MODULES.filter((module) => {
    const isTargetPortal = module.targetPortals.includes(role) || role === "super_admin";
    const hasRequiredPerm = module.requiredPermissions.some((perm) =>
      hasPermission(permissions, perm),
    );
    return isTargetPortal && hasRequiredPerm;
  });
}

export function getPortalConfig(role: PortalRole): PortalConfig {
  return PORTAL_CONFIGS[role];
}

export function getPortalDefinition(role: PortalRole): PortalRoleDefinition {
  return PORTAL_ROLE_DEFINITIONS[role];
}

export {
  PORTAL_CONFIGS,
  PORTAL_ROLE_DEFINITIONS,
  ROLE_PERMISSIONS_MATRIX,
  canAccessPortal,
  getRolePermissions,
  hasPermission,
};
