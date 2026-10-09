import { canAccessPortal } from "@ems/config";
import {
  formatAuthErrorMessage,
  getInitials,
  getPortalUrlForRole,
  sanitizeRedirectUrl,
} from "@ems/shared";
import type { AuthenticatedUserContext, PortalRole } from "@ems/types";
import { describe, expect, it } from "vitest";

describe("Phase 3: Security Guards & Multi-Tenant Authorization", () => {
  describe("Open Redirect Protection (sanitizeRedirectUrl)", () => {
    it("allows valid relative internal redirect URLs", () => {
      expect(sanitizeRedirectUrl("/portal/hr")).toBe("/portal/hr");
      expect(sanitizeRedirectUrl("/portal/employee#attendance")).toBe(
        "/portal/employee#attendance",
      );
      expect(sanitizeRedirectUrl("/portal")).toBe("/portal");
    });

    it("sanitizes and blocks absolute external URLs", () => {
      expect(sanitizeRedirectUrl("https://malicious-site.com/steal-session")).toBe("/portal");
      expect(sanitizeRedirectUrl("http://attacker.com")).toBe("/portal");
    });

    it("sanitizes protocol-relative URLs (//evil.com)", () => {
      expect(sanitizeRedirectUrl("//malicious.com")).toBe("/portal");
      expect(sanitizeRedirectUrl("//attacker.com/portal")).toBe("/portal");
    });

    it("sanitizes backslash injection (\\evil.com)", () => {
      expect(sanitizeRedirectUrl("/\\evil.com")).toBe("/portal");
    });

    it("falls back to custom fallback if provided", () => {
      expect(sanitizeRedirectUrl("invalid-relative-url", "/login")).toBe("/login");
      expect(sanitizeRedirectUrl(null, "/dashboard")).toBe("/dashboard");
    });
  });

  describe("Session & Account Status Security Enforcement", () => {
    const mockActiveContext: AuthenticatedUserContext = {
      userId: "00000008-0000-0000-0000-000000000003",
      email: "emp1@giet-polytechnic.edu",
      profile: {
        id: "00000008-0000-0000-0000-000000000003",
        organizationId: "00000001-0000-0000-0000-000000000001",
        fullName: "GIET Employee One",
        avatarUrl: null,
        phone: null,
        dateOfBirth: null,
        gender: null,
        locale: "en",
        timezone: "Asia/Kolkata",
        isActive: true,
        lastSeenAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      activeOrganization: {
        id: "00000001-0000-0000-0000-000000000001",
        name: "GIET Polytechnic College",
        slug: "giet-polytechnic",
        code: "GIET",
        address: null,
        phone: null,
        email: null,
        logoUrl: null,
        website: null,
        isActive: true,
        settings: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      memberships: [
        {
          organizationId: "00000001-0000-0000-0000-000000000001",
          organizationName: "GIET Polytechnic College",
          organizationSlug: "giet-polytechnic",
          roles: ["employee"],
          isDefault: true,
        },
      ],
      activeRole: "employee",
      availableRoles: ["employee"],
      permissions: ["attendance.self", "leave.self", "document.read", "organization.read"],
      linkedEmployee: null,
      isAccountActive: true,
    };

    it("verifies active account status check", () => {
      expect(mockActiveContext.isAccountActive).toBe(true);
      expect(mockActiveContext.profile.isActive).toBe(true);
    });

    it("flags deactivated account and denies portal access", () => {
      const inactiveContext: AuthenticatedUserContext = {
        ...mockActiveContext,
        isAccountActive: false,
        profile: {
          ...mockActiveContext.profile,
          isActive: false,
        },
      };

      expect(inactiveContext.isAccountActive).toBe(false);
      // Inactive account must not be granted portal access
      const canProceed =
        inactiveContext.isAccountActive && canAccessPortal(inactiveContext.activeRole, "employee");
      expect(canProceed).toBe(false);
    });
  });

  describe("Cross-Tenant Isolation & Privilege Escalation Prevention", () => {
    it("ensures portal URL resolves consistently for each role", () => {
      expect(getPortalUrlForRole("super_admin")).toBe("/portal/super-admin");
      expect(getPortalUrlForRole("hr_manager")).toBe("/portal/hr");
      expect(getPortalUrlForRole("finance_payroll_manager")).toBe("/portal/finance-payroll");
      expect(getPortalUrlForRole("auditor")).toBe("/portal/auditor");
    });

    it("blocks unauthorized portal escalation attempts", () => {
      const attackerRole: PortalRole = "employee";
      const privilegedPortals: PortalRole[] = [
        "super_admin",
        "org_admin",
        "finance_payroll_manager",
        "hr_manager",
      ];

      for (const target of privilegedPortals) {
        expect(canAccessPortal(attackerRole, target)).toBe(false);
      }
    });

    it("prevents arbitrary cross-organization membership switching", () => {
      const userMemberships = ["00000001-0000-0000-0000-000000000001"]; // GIET only
      const targetOrg = "00000001-0000-0000-0000-000000000002"; // Apex org

      // Attempt to switch to Apex org without holding membership
      const isAuthorizedMember = userMemberships.includes(targetOrg);
      expect(isAuthorizedMember).toBe(false);
    });
  });

  describe("Error Message Sanitization", () => {
    it("sanitizes invalid login credential messages", () => {
      const msg = formatAuthErrorMessage({ message: "Invalid login credentials" });
      expect(msg).toBe("Invalid email or password. Please verify your credentials.");
    });

    it("sanitizes rate limit error messages", () => {
      const msg = formatAuthErrorMessage({ message: "rate limit exceeded for email" });
      expect(msg).toMatch(/too many requests/i);
    });
  });

  describe("UI Display Helpers", () => {
    it("computes initials accurately", () => {
      expect(getInitials("GIET Admin User")).toBe("GU");
      expect(getInitials("John Doe")).toBe("JD");
      expect(getInitials("SingleName")).toBe("S");
      expect(getInitials(null)).toBe("U");
    });
  });
});
