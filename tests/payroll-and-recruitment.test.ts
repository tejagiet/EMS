import { describe, expect, it } from "vitest";
import {
  salaryComponentSchema,
  salaryStructureSchema,
  payrollRunCreateSchema,
  payrollDecisionSchema,
  jobPostingSchema,
  candidateCreateSchema,
  candidateStageTransitionSchema,
  interviewScheduleSchema,
  interviewFeedbackSchema,
  jobOfferCreateSchema,
  jobOfferDecisionSchema,
  hireCandidateSchema,
} from "@ems/validation";
import { escapeCsvField } from "../apps/web/lib/data/employees";

// Pure business calculation helpers to verify calculations and rules
export function calculatePayrollComponents(
  baseSalary: number,
  allowances: { amount: number }[],
  deductions: { amount: number }[]
): { grossSalary: number; totalDeductions: number; netSalary: number } {
  const allowanceSum = allowances.reduce((acc, cur) => acc + cur.amount, 0);
  const deductionSum = deductions.reduce((acc, cur) => acc + cur.amount, 0);
  const grossSalary = Math.round((baseSalary + allowanceSum) * 100) / 100;
  const totalDeductions = Math.round(deductionSum * 100) / 100;
  const netSalary = Math.max(0, Math.round((grossSalary - totalDeductions) * 100) / 100);
  return { grossSalary, totalDeductions, netSalary };
}

export function isValidCandidateStageTransition(
  fromStage: string,
  toStage: string
): boolean {
  if (toStage === "rejected") {
    return fromStage !== "hired";
  }
  if (fromStage === "applied" && toStage === "screening") return true;
  if (fromStage === "screening" && toStage === "interview") return true;
  if (fromStage === "interview" && toStage === "offer") return true;
  if (fromStage === "offer" && toStage === "hired") return true;
  return false;
}

export function isSalaryEffectiveInPeriod(
  effectiveFrom: string, // YYYY-MM-DD
  effectiveTo: string | null, // YYYY-MM-DD
  periodStart: string,
  periodEnd: string
): boolean {
  const effFrom = effectiveFrom;
  const effTo = effectiveTo || "9999-12-31";
  return effFrom <= periodEnd && effTo >= periodStart;
}

describe("Phase 7: Payroll & Compensation Engine", () => {
  it("calculates gross, total deductions, and net salary with 2 decimal monetary rounding", () => {
    const base = 50000.555; // Unrounded test
    const allowances = [
      { amount: 15000.222 },
      { amount: 8000.111 },
    ];
    const deductions = [
      { amount: 6000.333 },
      { amount: 200.0 },
    ];

    const result = calculatePayrollComponents(
      Math.round(base * 100) / 100,
      allowances.map((a) => ({ amount: Math.round(a.amount * 100) / 100 })),
      deductions.map((d) => ({ amount: Math.round(d.amount * 100) / 100 }))
    );

    expect(result.grossSalary).toBe(73000.89);
    expect(result.totalDeductions).toBe(6200.33);
    expect(result.netSalary).toBe(66800.56);
  });

  it("ensures net salary never goes below zero even with excessive deductions", () => {
    const base = 10000;
    const allowances: { amount: number }[] = [];
    const deductions = [{ amount: 15000 }];

    const result = calculatePayrollComponents(base, allowances, deductions);
    expect(result.grossSalary).toBe(10000);
    expect(result.totalDeductions).toBe(15000);
    expect(result.netSalary).toBe(0);
  });

  it("accurately detects effective salary structures for a payroll period", () => {
    // Current period: Oct 2026
    const periodStart = "2026-10-01";
    const periodEnd = "2026-10-31";

    // Case 1: Structure effective from Jan 2026, no end date -> Active
    expect(isSalaryEffectiveInPeriod("2026-01-01", null, periodStart, periodEnd)).toBe(true);

    // Case 2: Structure ended in Sep 2026 -> Inactive
    expect(isSalaryEffectiveInPeriod("2026-01-01", "2026-09-30", periodStart, periodEnd)).toBe(false);

    // Case 3: Structure starts in Nov 2026 -> Inactive
    expect(isSalaryEffectiveInPeriod("2026-11-01", null, periodStart, periodEnd)).toBe(false);

    // Case 4: Structure covers partial month (ends Oct 15) -> Active
    expect(isSalaryEffectiveInPeriod("2026-01-01", "2026-10-15", periodStart, periodEnd)).toBe(true);
  });

  it("validates salary structure Zod schema requirements", () => {
    const valid = {
      employeeId: "00000000-0000-0000-0000-000000000001",
      baseSalary: 45000,
      currency: "INR",
      paymentFrequency: "monthly",
      allowances: [
        { code: "HRA", name: "House Rent Allowance", amount: 13500, type: "fixed" },
      ],
      deductions: [
        { code: "PF", name: "Provident Fund", amount: 5400, type: "fixed" },
      ],
      effectiveFrom: "2026-10-01",
      isActive: true,
    };

    expect(salaryStructureSchema.safeParse(valid).success).toBe(true);

    // Negative base salary rejected
    expect(
      salaryStructureSchema.safeParse({ ...valid, baseSalary: -500 }).success
    ).toBe(false);

    // Invalid effectiveFrom format rejected
    expect(
      salaryStructureSchema.safeParse({ ...valid, effectiveFrom: "01/10/2026" }).success
    ).toBe(false);
  });

  it("validates payroll run creation Zod schema", () => {
    const valid = {
      title: "October 2026 Monthly Payroll",
      periodStart: "2026-10-01",
      periodEnd: "2026-10-31",
      paymentDate: "2026-10-31",
    };
    expect(payrollRunCreateSchema.safeParse(valid).success).toBe(true);

    // Short title rejected
    expect(
      payrollRunCreateSchema.safeParse({ ...valid, title: "No" }).success
    ).toBe(false);
  });

  it("validates payroll decision actions", () => {
    expect(
      payrollDecisionSchema.safeParse({
        runId: "00000000-0000-0000-0000-000000000001",
        decision: "approve",
      }).success
    ).toBe(true);

    expect(
      payrollDecisionSchema.safeParse({
        runId: "00000000-0000-0000-0000-000000000001",
        decision: "unauthorized_action",
      }).success
    ).toBe(false);
  });
});

describe("Phase 7: Recruitment & Candidate Pipeline", () => {
  it("enforces canonical candidate pipeline stage transitions", () => {
    // Valid forward transitions
    expect(isValidCandidateStageTransition("applied", "screening")).toBe(true);
    expect(isValidCandidateStageTransition("screening", "interview")).toBe(true);
    expect(isValidCandidateStageTransition("interview", "offer")).toBe(true);
    expect(isValidCandidateStageTransition("offer", "hired")).toBe(true);

    // Valid rejection at any stage
    expect(isValidCandidateStageTransition("applied", "rejected")).toBe(true);
    expect(isValidCandidateStageTransition("screening", "rejected")).toBe(true);
    expect(isValidCandidateStageTransition("interview", "rejected")).toBe(true);
    expect(isValidCandidateStageTransition("offer", "rejected")).toBe(true);

    // Invalid stage skips
    expect(isValidCandidateStageTransition("applied", "offer")).toBe(false);
    expect(isValidCandidateStageTransition("applied", "hired")).toBe(false);
    expect(isValidCandidateStageTransition("screening", "hired")).toBe(false);

    // Cannot reject a candidate who has already been hired
    expect(isValidCandidateStageTransition("hired", "rejected")).toBe(false);
  });

  it("validates job posting schema", () => {
    const valid = {
      title: "Assistant Professor - Artificial Intelligence",
      code: "JOB-AI-2026",
      description: "Teaching undergraduate and postgraduate courses in Deep Learning and NLP.",
      vacancyCount: 2,
      minSalary: 45000,
      maxSalary: 75000,
      status: "published",
    };
    expect(jobPostingSchema.safeParse(valid).success).toBe(true);

    // Zero vacancies rejected
    expect(
      jobPostingSchema.safeParse({ ...valid, vacancyCount: 0 }).success
    ).toBe(false);

    // Short description rejected
    expect(
      jobPostingSchema.safeParse({ ...valid, description: "Short" }).success
    ).toBe(false);
  });

  it("validates candidate registration schema and sanitizes email", () => {
    const valid = {
      jobPostingId: "00000000-0000-0000-0000-000000000001",
      firstName: "Ramesh",
      lastName: "Sharma",
      email: "Ramesh.Sharma@Example.Com",
      phone: "+91 98480 12345",
      notes: "Campus referral",
    };
    const parsed = candidateCreateSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe("ramesh.sharma@example.com");
    }

    // Invalid email rejected
    expect(
      candidateCreateSchema.safeParse({ ...valid, email: "invalid-email" }).success
    ).toBe(false);
  });

  it("validates interview schedule and feedback schemas", () => {
    const schedule = {
      candidateId: "00000000-0000-0000-0000-000000000001",
      jobPostingId: "00000000-0000-0000-0000-000000000002",
      interviewType: "technical",
      scheduledAt: "2026-10-15T10:00:00.000Z",
      durationMinutes: 60,
      interviewerName: "Dr. K. Srinivas",
    };
    expect(interviewScheduleSchema.safeParse(schedule).success).toBe(true);

    const feedback = {
      interviewId: "00000000-0000-0000-0000-000000000003",
      rating: 5,
      feedback: "Exceptional mastery of transformers and PyTorch.",
      recommendation: "strong_hire",
    };
    expect(interviewFeedbackSchema.safeParse(feedback).success).toBe(true);

    // Rating out of 1-5 range rejected
    expect(
      interviewFeedbackSchema.safeParse({ ...feedback, rating: 6 }).success
    ).toBe(false);
  });

  it("validates job offer and hiring handoff schemas", () => {
    const offer = {
      candidateId: "00000000-0000-0000-0000-000000000001",
      jobPostingId: "00000000-0000-0000-0000-000000000002",
      offeredSalary: 65000,
      joiningDate: "2026-11-01",
    };
    expect(jobOfferCreateSchema.safeParse(offer).success).toBe(true);

    const hire = {
      candidateId: "00000000-0000-0000-0000-000000000001",
      branchId: "00000000-0000-0000-0000-000000000003",
    };
    expect(hireCandidateSchema.safeParse(hire).success).toBe(true);
  });

  it("protects against CSV formula injection attacks in compensation and candidate exports", () => {
    // Malicious formula prefixes
    expect(escapeCsvField("=SUM(A1:A10)")).toBe(`"'=SUM(A1:A10)"`);
    expect(escapeCsvField("+1234567890")).toBe(`"'+1234567890"`);
    expect(escapeCsvField("-CMD|'/C calc'!A0")).toBe(`"'-CMD|'/C calc'!A0"`);
    expect(escapeCsvField("@eval()")).toBe(`"'@eval()"`);

    // Standard safe string
    expect(escapeCsvField("Dr. K. Srinivas")).toBe(`"Dr. K. Srinivas"`);
    expect(escapeCsvField(65000.5)).toBe(`"65000.5"`);
  });
});
