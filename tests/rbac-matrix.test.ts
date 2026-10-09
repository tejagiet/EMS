import {
  canAccessPortal,
  filterNavigationByPermissions,
  getRolePermissions,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  PORTAL_CONFIGS,
  PORTAL_ROLE_DEFINITIONS,
  PORTAL_ROUTES,
  ROLE_PERMISSIONS_MATRIX,
} from "@ems/config";
import { PERMISSION_CODES, PORTAL_ROLES, type PortalRole } from "@ems/types";
import { describe, expect, it } from "vitest";

describe("Phase 3: RBAC & Permission Matrix Verification", () => {
  describe("Portals & Roles Completeness", () => {
    it("supports exactly all 10 defined portal roles", () => {
      expect(PORTAL_ROLES).toHaveLength(10);
      expect(PORTAL_ROLES).toEqual([
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
      ]);
    });

    it("has complete metadata and route configurations for each portal role", () => {
      for (const role of PORTAL_ROLES) {
        expect(PORTAL_ROLE_DEFINITIONS[role]).toBeDefined();
        expect(PORTAL_ROLE_DEFINITIONS[role].name).toBeTruthy();
        expect(PORTAL_ROUTES[role]).toBeDefined();
        expect(PORTAL_CONFIGS[role]).toBeDefined();
        expect(PORTAL_CONFIGS[role].navigation.length).toBeGreaterThan(0);
      }
    });

    it("verifies all 22 granular permission codes exist", () => {
      expect(PERMISSION_CODES).toHaveLength(22);
      expect(PERMISSION_CODES).toContain("organization.read");
      expect(PERMISSION_CODES).toContain("organization.write");
      expect(PERMISSION_CODES).toContain("employee.read");
      expect(PERMISSION_CODES).toContain("employee.write");
      expect(PERMISSION_CODES).toContain("attendance.self");
      expect(PERMISSION_CODES).toContain("attendance.read");
      expect(PERMISSION_CODES).toContain("attendance.manage");
      expect(PERMISSION_CODES).toContain("leave.self");
      expect(PERMISSION_CODES).toContain("leave.read");
      expect(PERMISSION_CODES).toContain("leave.approve");
      expect(PERMISSION_CODES).toContain("payroll.read");
      expect(PERMISSION_CODES).toContain("payroll.write");
      expect(PERMISSION_CODES).toContain("payroll.approve");
      expect(PERMISSION_CODES).toContain("recruitment.read");
      expect(PERMISSION_CODES).toContain("recruitment.write");
      expect(PERMISSION_CODES).toContain("asset.read");
      expect(PERMISSION_CODES).toContain("asset.manage");
      expect(PERMISSION_CODES).toContain("document.read");
      expect(PERMISSION_CODES).toContain("document.write");
      expect(PERMISSION_CODES).toContain("report.read");
      expect(PERMISSION_CODES).toContain("audit.read");
      expect(PERMISSION_CODES).toContain("role.manage");
    });
  });

  describe("Least-Privilege Role-Permission Matrix Enforcements", () => {
    it("Super Admin holds all 22 granular permissions", () => {
      const perms = getRolePermissions("super_admin");
      expect(perms).toHaveLength(22);
      for (const code of PERMISSION_CODES) {
        expect(hasPermission(perms, code)).toBe(true);
      }
    });

    it("Employee Self-Service receives strictly self permissions and cannot write or manage", () => {
      const perms = getRolePermissions("employee");
      expect(hasPermission(perms, "attendance.self")).toBe(true);
      expect(hasPermission(perms, "leave.self")).toBe(true);
      expect(hasPermission(perms, "organization.read")).toBe(true);

      // Disallowed administrative and management actions
      expect(hasPermission(perms, "employee.write")).toBe(false);
      expect(hasPermission(perms, "payroll.write")).toBe(false);
      expect(hasPermission(perms, "payroll.read")).toBe(false);
      expect(hasPermission(perms, "attendance.manage")).toBe(false);
      expect(hasPermission(perms, "leave.approve")).toBe(false);
      expect(hasPermission(perms, "role.manage")).toBe(false);
      expect(hasPermission(perms, "audit.read")).toBe(false);
    });

    it("Auditor role has strictly read-only access (no write, manage, or approve)", () => {
      const perms = getRolePermissions("auditor");
      expect(hasPermission(perms, "audit.read")).toBe(true);
      expect(hasPermission(perms, "employee.read")).toBe(true);
      expect(hasPermission(perms, "payroll.read")).toBe(true);
      expect(hasPermission(perms, "report.read")).toBe(true);

      // Strict read-only: no write or approval permissions allowed
      expect(hasPermission(perms, "payroll.write")).toBe(false);
      expect(hasPermission(perms, "payroll.approve")).toBe(false);
      expect(hasPermission(perms, "employee.write")).toBe(false);
      expect(hasPermission(perms, "organization.write")).toBe(false);
      expect(hasPermission(perms, "leave.approve")).toBe(false);
      expect(hasPermission(perms, "role.manage")).toBe(false);
      expect(hasPermission(perms, "asset.manage")).toBe(false);
    });

    it("Payroll authorization is restricted to Finance & Payroll and Super Admin", () => {
      const payrollRoles: PortalRole[] = ["finance_payroll_manager", "super_admin"];
      const nonPayrollRoles = PORTAL_ROLES.filter((r) => !payrollRoles.includes(r));

      for (const role of payrollRoles) {
        expect(hasPermission(getRolePermissions(role), "payroll.read")).toBe(true);
        expect(hasPermission(getRolePermissions(role), "payroll.write")).toBe(true);
      }

      for (const role of nonPayrollRoles) {
        if (role === "auditor" || role === "org_admin") {
          // Auditor and Org Admin may read payroll, but CANNOT write or approve
          expect(hasPermission(getRolePermissions(role), "payroll.write")).toBe(false);
          expect(hasPermission(getRolePermissions(role), "payroll.approve")).toBe(false);
        } else {
          expect(hasPermission(getRolePermissions(role), "payroll.read")).toBe(false);
          expect(hasPermission(getRolePermissions(role), "payroll.write")).toBe(false);
        }
      }
    });

    it("Manager can approve team leaves and manage attendance but cannot alter payroll or roles", () => {
      const perms = getRolePermissions("manager");
      expect(hasPermission(perms, "leave.approve")).toBe(true);
      expect(hasPermission(perms, "attendance.manage")).toBe(true);
      expect(hasPermission(perms, "payroll.write")).toBe(false);
      expect(hasPermission(perms, "role.manage")).toBe(false);
    });
  });

  describe("Permission Evaluation Utilities", () => {
    const samplePerms = ["employee.read", "leave.self", "attendance.self"] as const;

    it("evaluates hasPermission correctly", () => {
      expect(hasPermission(samplePerms, "employee.read")).toBe(true);
      expect(hasPermission(samplePerms, "payroll.write")).toBe(false);
    });

    it("evaluates hasAnyPermission correctly", () => {
      expect(hasAnyPermission(samplePerms, ["payroll.write", "employee.read"])).toBe(true);
      expect(hasAnyPermission(samplePerms, ["payroll.write", "role.manage"])).toBe(false);
    });

    it("evaluates hasAllPermissions correctly", () => {
      expect(hasAllPermissions(samplePerms, ["employee.read", "leave.self"])).toBe(true);
      expect(hasAllPermissions(samplePerms, ["employee.read", "payroll.write"])).toBe(false);
    });

    it("verifies portal access boundaries with canAccessPortal", () => {
      // Super admin can access all portals
      for (const target of PORTAL_ROLES) {
        expect(canAccessPortal("super_admin", target)).toBe(true);
      }
      // Employee cannot access finance or hr
      expect(canAccessPortal("employee", "finance_payroll_manager")).toBe(false);
      expect(canAccessPortal("employee", "hr_manager")).toBe(false);
      expect(canAccessPortal("employee", "employee")).toBe(true);
      // HR cannot access finance
      expect(canAccessPortal("hr_manager", "finance_payroll_manager")).toBe(false);
    });

    it("filters portal navigation based on granted permissions", () => {
      const hrNav = PORTAL_CONFIGS.hr_manager.navigation;
      const employeePerms = getRolePermissions("employee");
      const filtered = filterNavigationByPermissions(hrNav, employeePerms);

      // Overview has no required permission so it appears
      expect(filtered.some((item) => item.id === "overview")).toBe(true);
      // Items requiring employee.read or attendance.manage must be hidden from employee
      expect(filtered.some((item) => item.id === "attendance")).toBe(false);
    });
  });
});
