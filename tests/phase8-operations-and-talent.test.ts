import { describe, expect, it } from "vitest";
import {
  onboardingCaseCreateSchema,
  onboardingTaskUpdateSchema,
  offboardingInitiateSchema,
  offboardingDecisionSchema,
  assetCreateSchema,
  assetAssignSchema,
  assetReturnSchema,
  performanceGoalSchema,
  performanceReviewSubmitSchema,
  employeeTaskCreateSchema,
  employeeTaskUpdateSchema,
  documentUploadSchema,
  documentVerifySchema,
  announcementCreateSchema,
} from "@ems/validation";

// Sanitizer test helper to verify Excel / Sheets formula injection mitigation
function sanitizeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  let str = String(val).replace(/"/g, '""');
  if (/^[=\+\-\@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str}"`;
}

// Business rule helper simulations matching database triggers & RPCs
export function canCompleteOnboarding(tasks: { isRequired: boolean; status: string }[]): {
  canComplete: boolean;
  incompleteRequiredCount: number;
} {
  const incomplete = tasks.filter((t) => t.isRequired && t.status !== "completed");
  return {
    canComplete: incomplete.length === 0,
    incompleteRequiredCount: incomplete.length,
  };
}

export function canCompleteOffboarding(clearances: { status: string }[]): {
  canComplete: boolean;
  pendingCount: number;
} {
  const pending = clearances.filter((c) => c.status !== "cleared");
  return {
    canComplete: pending.length === 0,
    pendingCount: pending.length,
  };
}

export function canAssignAsset(asset: {
  status: string;
  hasActiveAssignment: boolean;
}): { canAssign: boolean; reason?: string } {
  if (asset.status === "retired" || asset.status === "lost") {
    return { canAssign: false, reason: "Asset is retired or lost." };
  }
  if (asset.status === "under_maintenance") {
    return { canAssign: false, reason: "Asset is currently under maintenance." };
  }
  if (asset.status !== "available" || asset.hasActiveAssignment) {
    return { canAssign: false, reason: "Asset is already assigned." };
  }
  return { canAssign: true };
}

export function validatePerformanceRating(rating: number): boolean {
  return rating >= 1.0 && rating <= 5.0;
}

export function isAudienceTargeted(
  targetType: "all" | "department" | "branch" | "role",
  targetId: string | null,
  employee: { departmentId: string; branchId: string; role: string }
): boolean {
  if (targetType === "all") return true;
  if (targetType === "department") return targetId === employee.departmentId;
  if (targetType === "branch") return targetId === employee.branchId;
  if (targetType === "role") return targetId === employee.role;
  return false;
}

describe("Phase 8: Operations and Talent Management Modules", () => {
  describe("1. Employee Onboarding Engine", () => {
    it("validates onboarding case schema parameters", () => {
      const valid = onboardingCaseCreateSchema.safeParse({
        employeeId: "22222222-2222-2222-2222-222222222222",
        joiningDate: "2026-11-01",
      });
      expect(valid.success).toBe(true);

      const invalidDate = onboardingCaseCreateSchema.safeParse({
        employeeId: "22222222-2222-2222-2222-222222222222",
        joiningDate: "invalid-date",
      });
      expect(invalidDate.success).toBe(false);
    });

    it("enforces onboarding completion closure guard when required tasks are incomplete", () => {
      const tasks = [
        { isRequired: true, status: "completed" },
        { isRequired: true, status: "pending" },
        { isRequired: false, status: "pending" },
      ];
      const check = canCompleteOnboarding(tasks);
      expect(check.canComplete).toBe(false);
      expect(check.incompleteRequiredCount).toBe(1);

      // When all required tasks are completed:
      tasks[1].status = "completed";
      const checkPassed = canCompleteOnboarding(tasks);
      expect(checkPassed.canComplete).toBe(true);
      expect(checkPassed.incompleteRequiredCount).toBe(0);
    });
  });

  describe("2. Employee Offboarding & Exit Management", () => {
    it("validates offboarding case creation schema", () => {
      const valid = offboardingInitiateSchema.safeParse({
        employeeId: "22222222-2222-2222-2222-222222222222",
        exitType: "resignation",
        reason: "Pursuing higher technical studies",
        lastWorkingDate: "2026-12-31",
        noticePeriodDays: 30,
      });
      expect(valid.success).toBe(true);
    });

    it("blocks offboarding final decision when clearance items remain uncleared", () => {
      const clearances = [
        { status: "cleared" },
        { status: "pending" }, // IT hardware not returned
        { status: "cleared" },
      ];
      const check = canCompleteOffboarding(clearances);
      expect(check.canComplete).toBe(false);
      expect(check.pendingCount).toBe(1);

      clearances[1].status = "cleared";
      const checkCompleted = canCompleteOffboarding(clearances);
      expect(checkCompleted.canComplete).toBe(true);
    });
  });

  describe("3. IT Asset Management & Allocation", () => {
    it("validates asset registration schema", () => {
      const valid = assetCreateSchema.safeParse({
        assetTag: "GIET-LAP-2026",
        name: "Dell Latitude 5440",
        category: "laptop",
        location: "Main Campus",
      });
      expect(valid.success).toBe(true);
    });

    it("prevents assigning retired, under-maintenance, or already-assigned assets", () => {
      expect(canAssignAsset({ status: "retired", hasActiveAssignment: false }).canAssign).toBe(false);
      expect(canAssignAsset({ status: "under_maintenance", hasActiveAssignment: false }).canAssign).toBe(false);
      expect(canAssignAsset({ status: "assigned", hasActiveAssignment: true }).canAssign).toBe(false);
      expect(canAssignAsset({ status: "available", hasActiveAssignment: false }).canAssign).toBe(true);
    });

    it("validates asset return schema with inspection condition", () => {
      const valid = assetReturnSchema.safeParse({
        assignmentId: "11111111-1111-1111-1111-111111111111",
        returnedCondition: "good",
      });
      expect(valid.success).toBe(true);
    });
  });

  describe("4. Performance Appraisals & Goals", () => {
    it("validates performance appraisal rating bounds (1.0 to 5.0)", () => {
      expect(validatePerformanceRating(1.0)).toBe(true);
      expect(validatePerformanceRating(3.5)).toBe(true);
      expect(validatePerformanceRating(5.0)).toBe(true);
      expect(validatePerformanceRating(0.9)).toBe(false);
      expect(validatePerformanceRating(5.1)).toBe(false);
      expect(validatePerformanceRating(-1)).toBe(false);
    });

    it("validates performance review submission schema", () => {
      const valid = performanceReviewSubmitSchema.safeParse({
        reviewId: "11111111-1111-1111-1111-111111111111",
        stage: "manager",
        rating: 4.5,
        feedback: "Excellent execution on curriculum delivery and research mentoring.",
      });
      expect(valid.success).toBe(true);

      const invalidRating = performanceReviewSubmitSchema.safeParse({
        reviewId: "11111111-1111-1111-1111-111111111111",
        stage: "manager",
        rating: 6.0, // Exceeds 5.0
        feedback: "Invalid rating test",
      });
      expect(invalidRating.success).toBe(false);
    });
  });

  describe("5. Document Repository & Metadata", () => {
    it("validates document registration schema", () => {
      const valid = documentUploadSchema.safeParse({
        title: "Aadhaar Card Copy",
        category: "identification",
        fileName: "aadhaar_scan.pdf",
        filePath: "orgs/1111/docs/aadhaar_scan.pdf",
        fileSizeBytes: 245000,
        mimeType: "application/pdf",
      });
      expect(valid.success).toBe(true);
    });
  });

  describe("6. Company Announcements & Audience Scoping", () => {
    it("validates announcement creation schema", () => {
      const valid = announcementCreateSchema.safeParse({
        title: "Annual Polytechnic Convocation 2026",
        body: "All faculty and staff are invited to attend the annual convocation.",
        priority: "high",
        targetType: "all",
      });
      expect(valid.success).toBe(true);
    });

    it("verifies announcement target audience filtering", () => {
      const staffMember = {
        departmentId: "dept-ai",
        branchId: "branch-main",
        role: "faculty",
      };

      expect(isAudienceTargeted("all", null, staffMember)).toBe(true);
      expect(isAudienceTargeted("department", "dept-ai", staffMember)).toBe(true);
      expect(isAudienceTargeted("department", "dept-civil", staffMember)).toBe(false);
      expect(isAudienceTargeted("branch", "branch-main", staffMember)).toBe(true);
      expect(isAudienceTargeted("branch", "branch-north", staffMember)).toBe(false);
    });
  });

  describe("7. CSV Sanitization & Security Guards", () => {
    it("sanitizes CSV formula injection triggers (=, +, -, @, \\t, \\r)", () => {
      expect(sanitizeCsv("=SUM(A1:A10)")).toBe(`"'=SUM(A1:A10)"`);
      expect(sanitizeCsv("+cmd|' /C calc'!A0")).toBe(`"'+cmd|' /C calc'!A0"`);
      expect(sanitizeCsv("-100")).toBe(`"'-100"`);
      expect(sanitizeCsv("@admin")).toBe(`"'@admin"`);
      expect(sanitizeCsv("\tmalicious")).toBe(`"'\tmalicious"`);
      expect(sanitizeCsv("Standard Safe Text")).toBe(`"Standard Safe Text"`);
    });
  });
});
