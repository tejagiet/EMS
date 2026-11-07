import {
  passwordRecoverySchema,
  passwordResetSchema,
  passwordSchema,
  signInSchema,
  signUpSchema,
  switchOrganizationSchema,
  switchRoleSchema,
} from "@ems/validation";
import { describe, expect, it } from "vitest";

describe("Phase 3: Authentication Input Validation", () => {
  describe("Sign-In Validation", () => {
    it("accepts valid corporate and institutional email credentials", () => {
      const valid = signInSchema.safeParse({
        email: "admin@giet-polytechnic.edu",
        password: "DevPassword123!",
        rememberMe: true,
      });
      expect(valid.success).toBe(true);
    });

    it("rejects invalid email formats", () => {
      const invalidEmail = signInSchema.safeParse({
        email: "not-an-email",
        password: "ValidPassword123!",
      });
      expect(invalidEmail.success).toBe(false);
      if (!invalidEmail.success) {
        expect(invalidEmail.error.issues[0]?.message).toMatch(/valid email/i);
      }
    });

    it("rejects empty passwords", () => {
      const emptyPass = signInSchema.safeParse({
        email: "user@giet-polytechnic.edu",
        password: "",
      });
      expect(emptyPass.success).toBe(false);
    });
  });

  describe("Sign-Up Validation", () => {
    it("accepts a complete signup request", () => {
      const result = signUpSchema.safeParse({
        fullName: "New EMS User",
        email: "new.user@giet-polytechnic.edu",
        password: "SecurePass123",
        confirmPassword: "SecurePass123",
      });

      expect(result.success).toBe(true);
    });

    it("requires all signup fields", () => {
      const result = signUpSchema.safeParse({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
          expect.arrayContaining(["fullName", "email", "password", "confirmPassword"]),
        );
      }
    });

    it("rejects mismatched signup passwords on confirmation", () => {
      const result = signUpSchema.safeParse({
        fullName: "New EMS User",
        email: "new.user@giet-polytechnic.edu",
        password: "SecurePass123",
        confirmPassword: "DifferentPass123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
        expect(result.error.issues[0]?.message).toMatch(/do not match/i);
      }
    });
  });

  describe("Password Policy & Complexity Rules", () => {
    it("accepts passwords complying with length and character classes", () => {
      expect(passwordSchema.safeParse("SecurePass123").success).toBe(true);
      expect(passwordSchema.safeParse("DevPassword123!").success).toBe(true);
    });

    it("rejects passwords under 8 characters", () => {
      const short = passwordSchema.safeParse("Pass1");
      expect(short.success).toBe(false);
      if (!short.success) {
        expect(short.error.issues[0]?.message).toMatch(/at least 8 characters/i);
      }
    });

    it("rejects passwords missing digits or uppercase letters", () => {
      expect(passwordSchema.safeParse("alllowercasepassword").success).toBe(false);
      expect(passwordSchema.safeParse("ALLUPPERCASEPASSWORD").success).toBe(false);
      expect(passwordSchema.safeParse("NoDigitsInThisPassword").success).toBe(false);
    });
  });

  describe("Password Recovery Validation", () => {
    it("accepts valid recovery email request", () => {
      const result = passwordRecoverySchema.safeParse({
        email: "hr@giet-polytechnic.edu",
      });
      expect(result.success).toBe(true);
    });

    it("rejects malformed recovery email", () => {
      const result = passwordRecoverySchema.safeParse({
        email: "@missing-user.com",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Password Reset Confirmation Validation", () => {
    it("accepts matching new password and confirmation", () => {
      const result = passwordResetSchema.safeParse({
        newPassword: "NewSecurePass2026!",
        confirmPassword: "NewSecurePass2026!",
      });
      expect(result.success).toBe(true);
    });

    it("rejects mismatched confirmation password", () => {
      const result = passwordResetSchema.safeParse({
        newPassword: "NewSecurePass2026!",
        confirmPassword: "DifferentPassword2026!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/do not match/i);
      }
    });
  });

  describe("Organization & Role Switching Validation", () => {
    it("validates UUIDs for organization switching", () => {
      expect(
        switchOrganizationSchema.safeParse({
          organizationId: "00000001-0000-0000-0000-000000000001",
        }).success,
      ).toBe(true);

      expect(
        switchOrganizationSchema.safeParse({
          organizationId: "invalid-uuid-format",
        }).success,
      ).toBe(false);
    });

    it("validates permitted portal roles only", () => {
      expect(switchRoleSchema.safeParse({ roleCode: "super_admin" }).success).toBe(true);
      expect(switchRoleSchema.safeParse({ roleCode: "auditor" }).success).toBe(true);
      expect(switchRoleSchema.safeParse({ roleCode: "hacker_role" }).success).toBe(false);
    });
  });
});
