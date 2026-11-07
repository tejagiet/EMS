export interface CandidateEmployeeDetails {
  // Personal
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  bloodGroup?: string;
  // Address Coordinates
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  // Statutory & National Identity
  panNumber?: string;
  aadhaarNumber?: string;
  // Qualifications & Work Experience
  highestQualification?: string;
  university?: string;
  yearOfPassing?: string;
  experienceYears?: string;
  currentCompany?: string;
  currentDesignation?: string;
  expectedSalary?: string;
  noticePeriodDays?: string;
  // Portal Credential
  setupPassword?: string;
  // Additional Notes
  additionalNotes?: string;
}

const META_PREFIX = "---EXTENDED_EMPLOYEE_DATA---";

/**
 * Encodes complete employee details into candidate notes field
 */
export function serializeCandidateDetails(
  details: CandidateEmployeeDetails,
  existingNotes = ""
): string {
  const jsonStr = JSON.stringify(details);
  const cleanExisting = existingNotes.split(META_PREFIX)[0]?.trim() || "";
  return cleanExisting
    ? `${cleanExisting}\n\n${META_PREFIX}\n${jsonStr}`
    : `${META_PREFIX}\n${jsonStr}`;
}

/**
 * Parses complete employee details from candidate notes field
 */
export function parseCandidateDetails(
  rawNotes?: string | null
): CandidateEmployeeDetails {
  if (!rawNotes) {
    return { setupPassword: "Welcome@EMS2026" };
  }

  if (!rawNotes.includes(META_PREFIX)) {
    return {
      setupPassword: "Welcome@EMS2026",
      additionalNotes: rawNotes,
    };
  }

  try {
    const parts = rawNotes.split(META_PREFIX);
    const jsonPart = parts[1]?.trim();
    if (!jsonPart) return { setupPassword: "Welcome@EMS2026" };
    const parsed = JSON.parse(jsonPart);
    if (!parsed.setupPassword) {
      parsed.setupPassword = "Welcome@EMS2026";
    }
    return parsed;
  } catch {
    return {
      setupPassword: "Welcome@EMS2026",
      additionalNotes: rawNotes,
    };
  }
}
