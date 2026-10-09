import { describe, expect, it } from "vitest";
import {
  shiftSchema,
  shiftAssignmentSchema,
  attendanceCorrectionSchema,
  leaveTypeSchema,
  leaveRequestSchema,
} from "@ems/validation";
import { escapeCsvField } from "../apps/web/lib/data/employees";

// Pure business calculation helpers to verify business rules
export function calculateAttendanceDuration(
  clockIn: Date,
  clockOut: Date,
  breakMinutes: number = 0
): number {
  const diffMs = clockOut.getTime() - clockIn.getTime();
  const rawMinutes = Math.floor(diffMs / 60000);
  return Math.max(0, rawMinutes - breakMinutes);
}

export function isLateClockIn(
  clockInTime: string, // "HH:MM"
  shiftStartTime: string, // "HH:MM"
  gracePeriodMinutes: number
): boolean {
  const [inH, inM] = clockInTime.split(":").map(Number);
  const [startH, startM] = shiftStartTime.split(":").map(Number);
  if (inH === undefined || inM === undefined || startH === undefined || startM === undefined) return false;

  const inMinutes = inH * 60 + inM;
  const graceLimitMinutes = startH * 60 + startM + gracePeriodMinutes;
  return inMinutes > graceLimitMinutes;
}

export function calculateOvernightShiftDuration(
  startTime: string, // "22:00"
  endTime: string,   // "06:00"
  breakMinutes: number = 60
): number {
  const [sH, sM] = startTime.split(":").map(Number);
  const [eH, eM] = endTime.split(":").map(Number);
  if (sH === undefined || sM === undefined || eH === undefined || eM === undefined) return 0;

  const startMinutes = sH * 60 + sM;
  const endMinutes = eH * 60 + eM;

  let totalMinutes = 0;
  if (endMinutes < startMinutes) {
    // Crosses midnight
    totalMinutes = (24 * 60 - startMinutes) + endMinutes;
  } else {
    totalMinutes = endMinutes - startMinutes;
  }

  return Math.max(0, totalMinutes - breakMinutes);
}

export function checkShiftOverlap(
  newFrom: string,
  newTo: string | null,
  existingFrom: string,
  existingTo: string | null
): boolean {
  const toA = newTo || "9999-12-31";
  const toB = existingTo || "9999-12-31";
  return newFrom <= toB && toA >= existingFrom;
}

export function deriveLeaveAvailableBalance(
  accruedDays: number,
  approvedUsedDays: number,
  pendingReservedDays: number
): number {
  return Math.max(0, accruedDays - approvedUsedDays - pendingReservedDays);
}

describe("Phase 6: Attendance, Shifts, and Leave Management Engine", () => {
  describe("Attendance Duration & Break Handling", () => {
    it("computes standard shift duration minus breaks accurately", () => {
      const clockIn = new Date("2026-10-10T09:00:00Z");
      const clockOut = new Date("2026-10-10T18:00:00Z");
      const duration = calculateAttendanceDuration(clockIn, clockOut, 60);
      expect(duration).toBe(480); // 9 hours (540 mins) - 60 mins break = 480 mins (8 hours)
    });

    it("prevents negative duration when breaks exceed elapsed duration", () => {
      const clockIn = new Date("2026-10-10T09:00:00Z");
      const clockOut = new Date("2026-10-10T09:30:00Z");
      const duration = calculateAttendanceDuration(clockIn, clockOut, 60);
      expect(duration).toBe(0);
    });

    it("accurately computes overnight shift duration crossing midnight", () => {
      const duration = calculateOvernightShiftDuration("22:00", "06:00", 60);
      // 22:00 to 06:00 is 8 hours (480 mins) - 60 mins break = 420 mins (7 hours)
      expect(duration).toBe(420);
    });
  });

  describe("Shift Scheduling & Grace Period Lateness", () => {
    it("flags clock-in as on-time within grace period", () => {
      // Shift starts at 09:00, grace is 15m. Punch at 09:14 is on-time
      const isLate = isLateClockIn("09:14", "09:00", 15);
      expect(isLate).toBe(false);
    });

    it("flags clock-in as late when exceeding grace period limit", () => {
      // Shift starts at 09:00, grace is 15m. Punch at 09:16 is late
      const isLate = isLateClockIn("09:16", "09:00", 15);
      expect(isLate).toBe(true);
    });

    it("detects shift schedule overlaps and conflict prevention", () => {
      // Assignment 1: 2026-10-01 to 2026-10-31
      // Attempted Assignment 2: 2026-10-15 to 2026-11-15 -> Overlap!
      const overlap = checkShiftOverlap("2026-10-15", "2026-11-15", "2026-10-01", "2026-10-31");
      expect(overlap).toBe(true);

      // Non-overlapping future assignment: 2026-11-01 to 2026-11-30 -> No overlap
      const nonOverlap = checkShiftOverlap("2026-11-01", "2026-11-30", "2026-10-01", "2026-10-31");
      expect(nonOverlap).toBe(false);

      // Indefinite assignment overlap
      const indefiniteOverlap = checkShiftOverlap("2026-12-01", null, "2026-10-01", null);
      expect(indefiniteOverlap).toBe(true);
    });
  });

  describe("Authoritative Leave Ledger & Balance Calculation", () => {
    it("derives available balance subtracting used and pending reserves", () => {
      // Accrued 18 days, used 5 days, 3 days in pending review -> available = 10
      const available = deriveLeaveAvailableBalance(18, 5, 3);
      expect(available).toBe(10);
    });

    it("prevents negative available balance on excessive consumption", () => {
      const available = deriveLeaveAvailableBalance(10, 10, 2);
      expect(available).toBe(0);
    });
  });

  describe("Spreadsheet Injection Protection (escapeCsvField)", () => {
    it("prefixes unsafe formula injection characters with single quote", () => {
      expect(escapeCsvField("=cmd|'/C calc'!A0")).toBe(`"'=cmd|'/C calc'!A0"`);
      expect(escapeCsvField("+123456789")).toBe(`"'+123456789"`);
      expect(escapeCsvField("-sum(A1:A10)")).toBe(`"'-sum(A1:A10)"`);
      expect(escapeCsvField("@evil_service")).toBe(`"'@evil_service"`);
    });

    it("escapes quotes properly for standard text", () => {
      expect(escapeCsvField('John "Doe"')).toBe(`"John ""Doe"""`);
    });
  });

  describe("Validation Schemas (Zod)", () => {
    it("validates valid shift creation", () => {
      const valid = shiftSchema.safeParse({
        name: "Morning Regular Shift",
        code: "SHT-M01",
        startTime: "09:00:00",
        endTime: "18:00:00",
        breakDurationMinutes: 60,
        gracePeriodMinutes: 15,
        applicableDays: [1, 2, 3, 4, 5],
        isOvernight: false,
        isActive: true,
      });
      expect(valid.success).toBe(true);
    });

    it("rejects invalid shift start time format", () => {
      const invalid = shiftSchema.safeParse({
        name: "Bad Shift",
        code: "SHT-BAD",
        startTime: "25:99",
        endTime: "18:00",
      });
      expect(invalid.success).toBe(false);
    });

    it("validates shift assignment dates", () => {
      const valid = shiftAssignmentSchema.safeParse({
        employeeId: "00000001-0000-0000-0000-000000000001",
        shiftId: "00000002-0000-0000-0000-000000000001",
        effectiveFrom: "2026-10-10",
        effectiveTo: "2026-12-31",
        isActive: true,
      });
      expect(valid.success).toBe(true);
    });

    it("validates attendance correction request", () => {
      const valid = attendanceCorrectionSchema.safeParse({
        requestedClockIn: "2026-10-10T09:00:00.000Z",
        requestedClockOut: "2026-10-10T18:00:00.000Z",
        reason: "Biometric device offline during morning punch",
      });
      expect(valid.success).toBe(true);
    });

    it("rejects attendance correction with too short reason", () => {
      const invalid = attendanceCorrectionSchema.safeParse({
        requestedClockIn: "2026-10-10T09:00:00.000Z",
        requestedClockOut: "2026-10-10T18:00:00.000Z",
        reason: "oops",
      });
      expect(invalid.success).toBe(false);
    });

    it("validates leave request schema", () => {
      const valid = leaveRequestSchema.safeParse({
        leaveTypeId: "00000003-0000-0000-0000-000000000001",
        startDate: "2026-10-15",
        endDate: "2026-10-18",
        totalDays: 4,
        reason: "Annual family visit and pilgrimage",
      });
      expect(valid.success).toBe(true);
    });

    it("validates leave type creation", () => {
      const valid = leaveTypeSchema.safeParse({
        name: "Earned Privilege Leave",
        code: "EPL",
        daysPerYear: 24,
        isPaid: true,
        carryForwardDays: 10,
        isActive: true,
      });
      expect(valid.success).toBe(true);
    });
  });
});
