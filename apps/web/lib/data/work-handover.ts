export interface WorkHandover {
  substituteId: string;
  substituteName: string;
  substituteCode?: string;
  tasks: string;
  notes?: string;
  status?: "assigned" | "acknowledged" | "completed";
  acknowledgedAt?: string;
}

export interface AssignableColleague {
  id: string;
  employeeCode: string;
  name: string;
  departmentName?: string;
  designationTitle?: string;
}

export interface DelegatedDutyItem {
  id: string;
  sourceType: "attendance_correction" | "leave_request";
  absentEmployeeId: string;
  absentEmployeeName: string;
  absentEmployeeCode: string;
  handover: WorkHandover;
  dateOrPeriod: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

/**
 * Encodes work handover metadata into the standard text reason field
 * using a backward-compatible, parseable JSON tag.
 */
export function encodeHandoverInReason(
  reason: string,
  handover?: WorkHandover | null
): string {
  if (!handover || !handover.substituteId) {
    return reason.trim();
  }

  // Remove any preexisting handover tags to prevent duplication
  const cleanReasonText = reason.replace(/\[WORK_HANDOVER:[\s\S]*?\]\s*/g, "").trim();
  const serialized = JSON.stringify(handover);
  return `[WORK_HANDOVER:${serialized}] ${cleanReasonText}`;
}

/**
 * Extracts work handover metadata and clean user justification text
 * from a raw database reason string.
 */
export function extractHandoverFromReason(rawReason: string | null | undefined): {
  handover: WorkHandover | null;
  cleanReason: string;
} {
  if (!rawReason) {
    return { handover: null, cleanReason: "" };
  }

  const match = rawReason.match(/\[WORK_HANDOVER:([\s\S]*?)\]\s*([\s\S]*)/);
  if (!match) {
    return { handover: null, cleanReason: rawReason };
  }

  try {
    const parsed = JSON.parse(match[1]!) as WorkHandover;
    const clean = (match[2] ?? "").trim();
    return {
      handover: parsed,
      cleanReason: clean.length > 0 ? clean : "No additional notes provided.",
    };
  } catch {
    return { handover: null, cleanReason: rawReason };
  }
}
