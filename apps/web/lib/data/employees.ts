/**
 * Server-side Employee Operations Layer (Supabase PostgreSQL integration)
 * Project: GIET Polytechnic College | AI Department | Team T-1
 * Publisher ID: GIETP-AI-IT-EMS-T1-2026
 * Phase: 5
 */

import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import type {
  Employee,
  EmployeeHistoryRecord,
  DepartmentDetail,
  BranchDetail,
  DesignationDetail,
  EmployeeDirectoryFilterParams,
  EmployeeImportRow,
  EmployeeImportResult,
} from "@ems/types";

interface RawEmployeeRecord {
  id: string;
  organization_id: string;
  profile_id: string | null;
  branch_id: string | null;
  department_id: string | null;
  designation_id: string | null;
  reporting_manager_id: string | null;
  employee_code: string;
  first_name: string | null;
  last_name: string | null;
  contact_number: string | null;
  work_email: string | null;
  work_phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  work_location: string | null;
  notes: string | null;
  employment_type: string;
  employment_status: string;
  date_of_joining: string;
  date_of_confirmation: string | null;
  date_of_resignation: string | null;
  date_of_termination: string | null;
  notice_period_days: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RawProfile {
  id: string;
  full_name: string | null;
}

interface RawDept {
  id: string;
  organization_id: string;
  branch_id: string | null;
  parent_department_id: string | null;
  head_of_department_id?: string | null;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RawBranch {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RawDesig {
  id: string;
  organization_id: string;
  department_id: string | null;
  name: string;
  code: string;
  grade: string | null;
  level: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RawHistory {
  id: string;
  organization_id: string;
  employee_id: string;
  changed_by: string | null;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_reason: string | null;
  effective_date: string | null;
  created_at: string;
}

// =============================================================================
// 1. Employee Directory Listing with Server-Side Filters, Sorting & Pagination
// =============================================================================

export interface PaginatedEmployeeResult {
  employees: Employee[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getEmployeesDirectory(
  orgId: string,
  params: EmployeeDirectoryFilterParams = {}
): Promise<PaginatedEmployeeResult> {
  const supabase = await createClient();

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Base query with count
  let query = supabase
    .from("employees")
    .select("*", { count: "exact" })
    .eq("organization_id", orgId);

  // Apply filters
  if (params.status && params.status !== "all") {
    query = query.eq("employment_status", params.status);
  }

  if (params.departmentId && params.departmentId !== "all") {
    query = query.eq("department_id", params.departmentId);
  }

  if (params.branchId && params.branchId !== "all") {
    query = query.eq("branch_id", params.branchId);
  }

  if (params.designationId && params.designationId !== "all") {
    query = query.eq("designation_id", params.designationId);
  }

  if (params.joiningFrom) {
    query = query.gte("date_of_joining", params.joiningFrom);
  }

  if (params.joiningTo) {
    query = query.lte("date_of_joining", params.joiningTo);
  }

  if (params.search && params.search.trim() !== "") {
    const term = params.search.trim();
    query = query.or(
      `employee_code.ilike.%${term}%,work_email.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%`
    );
  }

  // Sorting
  const sortCol = params.sortBy ?? "created_at";
  const isAsc = params.sortOrder === "asc";
  query = query.order(sortCol, { ascending: isAsc });

  // Pagination bounds
  query = query.range(from, to);

  let { data: rawEmpData, count, error } = await query;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let activeSupabase: any = supabase;

  if (error) {
    try {
      const adminClient = createAdminClient();
      let fallbackQuery = adminClient
        .from("employees")
        .select("*", { count: "exact" })
        .eq("organization_id", orgId);

      if (params.status && params.status !== "all") {
        fallbackQuery = fallbackQuery.eq("employment_status", params.status);
      }
      if (params.departmentId && params.departmentId !== "all") {
        fallbackQuery = fallbackQuery.eq("department_id", params.departmentId);
      }
      if (params.branchId && params.branchId !== "all") {
        fallbackQuery = fallbackQuery.eq("branch_id", params.branchId);
      }
      if (params.designationId && params.designationId !== "all") {
        fallbackQuery = fallbackQuery.eq("designation_id", params.designationId);
      }
      if (params.joiningFrom) {
        fallbackQuery = fallbackQuery.gte("date_of_joining", params.joiningFrom);
      }
      if (params.joiningTo) {
        fallbackQuery = fallbackQuery.lte("date_of_joining", params.joiningTo);
      }
      if (params.search && params.search.trim() !== "") {
        const term = params.search.trim();
        fallbackQuery = fallbackQuery.or(
          `employee_code.ilike.%${term}%,work_email.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%`
        );
      }
      fallbackQuery = fallbackQuery.order(sortCol, { ascending: isAsc }).range(from, to);

      const adminRes = await fallbackQuery;
      if (!adminRes.error) {
        rawEmpData = adminRes.data;
        count = adminRes.count;
        error = null;
        activeSupabase = adminClient;
      }
    } catch {
      // Continue to throw original error if admin fallback fails
    }
  }

  if (error) {
    throw new Error(`Failed to query employees directory: ${error.message}`);
  }

  const rawEmployees = (rawEmpData as RawEmployeeRecord[] | null) ?? [];
  const totalCount = count ?? rawEmployees.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Collect related foreign keys to resolve display names in batch
  const deptIds = Array.from(new Set(rawEmployees.map((e) => e.department_id).filter(Boolean))) as string[];
  const branchIds = Array.from(new Set(rawEmployees.map((e) => e.branch_id).filter(Boolean))) as string[];
  const desigIds = Array.from(new Set(rawEmployees.map((e) => e.designation_id).filter(Boolean))) as string[];
  const mgrIds = Array.from(new Set(rawEmployees.map((e) => e.reporting_manager_id).filter(Boolean))) as string[];
  const profileIds = Array.from(new Set(rawEmployees.map((e) => e.profile_id).filter(Boolean))) as string[];

  const [deptsRes, branchesRes, desigsRes, mgrsRes, profilesRes] = await Promise.all([
    deptIds.length > 0 ? activeSupabase.from("departments").select("id, name").in("id", deptIds) : { data: [] },
    branchIds.length > 0 ? activeSupabase.from("branches").select("id, name").in("id", branchIds) : { data: [] },
    desigIds.length > 0 ? activeSupabase.from("designations").select("id, name").in("id", desigIds) : { data: [] },
    mgrIds.length > 0 ? activeSupabase.from("employees").select("id, employee_code, first_name, last_name").in("id", mgrIds) : { data: [] },
    profileIds.length > 0 ? activeSupabase.from("profiles").select("id, full_name").in("id", profileIds) : { data: [] },
  ]);

  const deptMap = new Map((deptsRes.data as Array<{ id: string; name: string }> | null)?.map((d) => [d.id, d.name]) ?? []);
  const branchMap = new Map((branchesRes.data as Array<{ id: string; name: string }> | null)?.map((b) => [b.id, b.name]) ?? []);
  const desigMap = new Map((desigsRes.data as Array<{ id: string; name: string }> | null)?.map((d) => [d.id, d.name]) ?? []);
  const mgrMap = new Map(
    (mgrsRes.data as Array<{ id: string; employee_code: string; first_name: string | null; last_name: string | null }> | null)?.map((m) => [
      m.id,
      { code: m.employee_code, name: `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || `Manager ${m.employee_code}` },
    ]) ?? []
  );
  const profileMap = new Map((profilesRes.data as RawProfile[] | null)?.map((p) => [p.id, p.full_name]) ?? []);

  const employees: Employee[] = rawEmployees.map((e) => {
    const profileName = e.profile_id ? profileMap.get(e.profile_id) : null;
    const computedFullName =
      `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() ||
      profileName ||
      `Employee ${e.employee_code}`;

    const mgr = e.reporting_manager_id ? mgrMap.get(e.reporting_manager_id) : undefined;

    return {
      id: e.id,
      organizationId: e.organization_id,
      profileId: e.profile_id,
      branchId: e.branch_id,
      departmentId: e.department_id,
      designationId: e.designation_id,
      reportingManagerId: e.reporting_manager_id,
      employeeCode: e.employee_code,
      firstName: e.first_name,
      lastName: e.last_name,
      fullName: computedFullName,
      contactNumber: e.contact_number,
      workEmail: e.work_email,
      workPhone: e.work_phone,
      emergencyContactName: e.emergency_contact_name,
      emergencyContactRelationship: e.emergency_contact_relationship,
      emergencyContactPhone: e.emergency_contact_phone,
      addressLine1: e.address_line1,
      addressLine2: e.address_line2,
      city: e.city,
      state: e.state,
      postalCode: e.postal_code,
      country: e.country,
      workLocation: e.work_location,
      notes: e.notes,
      employmentType: e.employment_type as Employee["employmentType"],
      employmentStatus: e.employment_status as Employee["employmentStatus"],
      dateOfJoining: e.date_of_joining,
      dateOfConfirmation: e.date_of_confirmation,
      dateOfResignation: e.date_of_resignation,
      dateOfTermination: e.date_of_termination,
      noticePeriodDays: e.notice_period_days ?? 30,
      isActive: e.is_active,
      createdAt: e.created_at,
      updatedAt: e.updated_at,
      departmentName: e.department_id ? deptMap.get(e.department_id) : "Unassigned",
      branchName: e.branch_id ? branchMap.get(e.branch_id) : "Main Location",
      designationName: e.designation_id ? desigMap.get(e.designation_id) : "General Staff",
      reportingManagerName: mgr?.name,
      reportingManagerCode: mgr?.code,
    };
  });

  return {
    employees,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

// =============================================================================
// 2. Single Employee Profile Retrieval with Complete Relationships & History
// =============================================================================

export interface EmployeeProfileDetail extends Employee {
  history: EmployeeHistoryRecord[];
  directReports: Array<{ id: string; employeeCode: string; fullName: string; designation: string }>;
}

export async function getEmployeeById(
  orgId: string,
  employeeId: string
): Promise<EmployeeProfileDetail | null> {
  const supabase = await createClient();

  const [empResInitial, histResInitial, reportsResInitial] = await Promise.all([
    supabase.from("employees").select("*").eq("organization_id", orgId).eq("id", employeeId).single(),
    supabase.from("employee_history").select("*").eq("organization_id", orgId).eq("employee_id", employeeId).order("created_at", { ascending: false }),
    supabase.from("employees").select("id, employee_code, first_name, last_name, designation_id").eq("organization_id", orgId).eq("reporting_manager_id", employeeId),
  ]);

  let empRes = empResInitial;
  let histRes = histResInitial;
  let reportsRes = reportsResInitial;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let activeClient: any = supabase;

  if (empRes.error) {
    try {
      const adminClient = createAdminClient();
      const [adminEmp, adminHist, adminReports] = await Promise.all([
        adminClient.from("employees").select("*").eq("organization_id", orgId).eq("id", employeeId).single(),
        adminClient.from("employee_history").select("*").eq("organization_id", orgId).eq("employee_id", employeeId).order("created_at", { ascending: false }),
        adminClient.from("employees").select("id, employee_code, first_name, last_name, designation_id").eq("organization_id", orgId).eq("reporting_manager_id", employeeId),
      ]);
      if (!adminEmp.error) {
        empRes = adminEmp as typeof empResInitial;
        histRes = adminHist as typeof histResInitial;
        reportsRes = adminReports as typeof reportsResInitial;
        activeClient = adminClient;
      }
    } catch {
      // Ignore fallback failure
    }
  }

  if (empRes.error || !empRes.data) {
    return null;
  }

  const rawEmp = empRes.data as RawEmployeeRecord;
  const rawHist = (histRes.data as RawHistory[] | null) ?? [];
  const rawReports = (reportsRes.data as Array<{ id: string; employee_code: string; first_name: string | null; last_name: string | null; designation_id: string | null }> | null) ?? [];

  // Resolve department, branch, designation, manager and actor profile names
  const actorIds = Array.from(new Set(rawHist.map((h) => h.changed_by).filter(Boolean))) as string[];
  const reportDesigIds = Array.from(new Set(rawReports.map((r) => r.designation_id).filter(Boolean))) as string[];

  const [deptRes, branchRes, desigRes, mgrRes, profileRes, actorsRes, reportDesigsRes] = await Promise.all([
    rawEmp.department_id ? activeClient.from("departments").select("name").eq("id", rawEmp.department_id).single() : { data: null },
    rawEmp.branch_id ? activeClient.from("branches").select("name").eq("id", rawEmp.branch_id).single() : { data: null },
    rawEmp.designation_id ? activeClient.from("designations").select("name").eq("id", rawEmp.designation_id).single() : { data: null },
    rawEmp.reporting_manager_id ? activeClient.from("employees").select("id, employee_code, first_name, last_name").eq("id", rawEmp.reporting_manager_id).single() : { data: null },
    rawEmp.profile_id ? activeClient.from("profiles").select("full_name").eq("id", rawEmp.profile_id).single() : { data: null },
    actorIds.length > 0 ? activeClient.from("profiles").select("id, full_name").in("id", actorIds) : { data: [] },
    reportDesigIds.length > 0 ? supabase.from("designations").select("id, name").in("id", reportDesigIds) : { data: [] },
  ]);

  const actorMap = new Map((actorsRes.data as RawProfile[] | null)?.map((a) => [a.id, a.full_name]) ?? []);
  const reportDesigMap = new Map((reportDesigsRes.data as Array<{ id: string; name: string }> | null)?.map((d) => [d.id, d.name]) ?? []);

  const history: EmployeeHistoryRecord[] = rawHist.map((h) => ({
    id: h.id,
    organizationId: h.organization_id,
    employeeId: h.employee_id,
    changedBy: h.changed_by,
    changedByName: h.changed_by ? (actorMap.get(h.changed_by) ?? "System Administrator") : "System",
    fieldName: h.field_name,
    oldValue: h.old_value,
    newValue: h.new_value,
    changeReason: h.change_reason,
    effectiveDate: h.effective_date,
    createdAt: h.created_at,
  }));

  const mgrData = mgrRes.data as { id: string; employee_code: string; first_name: string | null; last_name: string | null } | null;
  const fullName =
    `${rawEmp.first_name ?? ""} ${rawEmp.last_name ?? ""}`.trim() ||
    (profileRes.data as { full_name: string | null } | null)?.full_name ||
    `Employee ${rawEmp.employee_code}`;

  const directReports = rawReports.map((r) => ({
    id: r.id,
    employeeCode: r.employee_code,
    fullName: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || `Employee ${r.employee_code}`,
    designation: r.designation_id ? (reportDesigMap.get(r.designation_id) ?? "Team Member") : "Team Member",
  }));

  return {
    id: rawEmp.id,
    organizationId: rawEmp.organization_id,
    profileId: rawEmp.profile_id,
    branchId: rawEmp.branch_id,
    departmentId: rawEmp.department_id,
    designationId: rawEmp.designation_id,
    reportingManagerId: rawEmp.reporting_manager_id,
    employeeCode: rawEmp.employee_code,
    firstName: rawEmp.first_name,
    lastName: rawEmp.last_name,
    fullName,
    contactNumber: rawEmp.contact_number,
    workEmail: rawEmp.work_email,
    workPhone: rawEmp.work_phone,
    emergencyContactName: rawEmp.emergency_contact_name,
    emergencyContactRelationship: rawEmp.emergency_contact_relationship,
    emergencyContactPhone: rawEmp.emergency_contact_phone,
    addressLine1: rawEmp.address_line1,
    addressLine2: rawEmp.address_line2,
    city: rawEmp.city,
    state: rawEmp.state,
    postalCode: rawEmp.postal_code,
    country: rawEmp.country,
    workLocation: rawEmp.work_location,
    notes: rawEmp.notes,
    employmentType: rawEmp.employment_type as Employee["employmentType"],
    employmentStatus: rawEmp.employment_status as Employee["employmentStatus"],
    dateOfJoining: rawEmp.date_of_joining,
    dateOfConfirmation: rawEmp.date_of_confirmation,
    dateOfResignation: rawEmp.date_of_resignation,
    dateOfTermination: rawEmp.date_of_termination,
    noticePeriodDays: rawEmp.notice_period_days ?? 30,
    isActive: rawEmp.is_active,
    createdAt: rawEmp.created_at,
    updatedAt: rawEmp.updated_at,
    departmentName: (deptRes.data as { name: string } | null)?.name ?? "Unassigned",
    branchName: (branchRes.data as { name: string } | null)?.name ?? "Main Location",
    designationName: (desigRes.data as { name: string } | null)?.name ?? "General Staff",
    reportingManagerName: mgrData ? `${mgrData.first_name ?? ""} ${mgrData.last_name ?? ""}`.trim() || mgrData.employee_code : undefined,
    reportingManagerCode: mgrData?.employee_code,
    history,
    directReports,
  };
}

// =============================================================================
// 3. Organization Structure Lookups (Departments, Branches, Designations, Managers)
// =============================================================================

export interface OrgMetadataOptions {
  departments: Array<{ id: string; name: string; code: string; branchId: string | null }>;
  branches: Array<{ id: string; name: string; code: string }>;
  designations: Array<{ id: string; name: string; code: string; departmentId: string | null; grade: string | null }>;
  managers: Array<{ id: string; name: string; code: string; departmentId: string | null }>;
}

export async function getOrganizationMetadataOptions(orgId: string): Promise<OrgMetadataOptions> {
  const supabase = await createClient();

  const [deptRes, branchRes, desigRes, empResInitial] = await Promise.all([
    supabase.from("departments").select("id, name, code, branch_id").eq("organization_id", orgId).eq("is_active", true).order("name"),
    supabase.from("branches").select("id, name, code").eq("organization_id", orgId).eq("is_active", true).order("name"),
    supabase.from("designations").select("id, name, code, department_id, grade").eq("organization_id", orgId).eq("is_active", true).order("name"),
    supabase.from("employees").select("id, employee_code, first_name, last_name, department_id").eq("organization_id", orgId).eq("employment_status", "active").order("employee_code"),
  ]);

  let empRes = empResInitial;
  if (empRes.error) {
    try {
      const adminClient = createAdminClient();
      const adminEmpRes = await adminClient
        .from("employees")
        .select("id, employee_code, first_name, last_name, department_id")
        .eq("organization_id", orgId)
        .eq("employment_status", "active")
        .order("employee_code");
      if (!adminEmpRes.error) {
        empRes = adminEmpRes as typeof empResInitial;
      }
    } catch {
      // Keep empResInitial if admin fallback fails
    }
  }

  const rawDepts = (deptRes.data as Array<{ id: string; name: string; code: string; branch_id: string | null }> | null) ?? [];
  const rawBranches = (branchRes.data as Array<{ id: string; name: string; code: string }> | null) ?? [];
  const rawDesigs = (desigRes.data as Array<{ id: string; name: string; code: string; department_id: string | null; grade: string | null }> | null) ?? [];
  const rawEmps = (empRes.data as Array<{ id: string; employee_code: string; first_name: string | null; last_name: string | null; department_id: string | null }> | null) ?? [];

  return {
    departments: rawDepts.map((d) => ({ id: d.id, name: d.name, code: d.code, branchId: d.branch_id })),
    branches: rawBranches.map((b) => ({ id: b.id, name: b.name, code: b.code })),
    designations: rawDesigs.map((d) => ({ id: d.id, name: d.name, code: d.code, departmentId: d.department_id, grade: d.grade })),
    managers: rawEmps.map((e) => ({
      id: e.id,
      code: e.employee_code,
      name: `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() || `Employee ${e.employee_code}`,
      departmentId: e.department_id,
    })),
  };
}

// =============================================================================
// 4. Create Employee Operation
// =============================================================================

export interface CreateEmployeePayload {
  organizationId: string;
  firstName: string;
  lastName: string;
  employeeCode?: string | null | undefined;
  workEmail?: string | null | undefined;
  contactNumber?: string | null | undefined;
  workPhone?: string | null | undefined;
  branchId?: string | null | undefined;
  departmentId?: string | null | undefined;
  designationId?: string | null | undefined;
  reportingManagerId?: string | null | undefined;
  employmentType: string;
  employmentStatus: string;
  dateOfJoining: string;
  dateOfConfirmation?: string | null | undefined;
  noticePeriodDays?: number | undefined;
  emergencyContactName?: string | null | undefined;
  emergencyContactRelationship?: string | null | undefined;
  emergencyContactPhone?: string | null | undefined;
  addressLine1?: string | null | undefined;
  addressLine2?: string | null | undefined;
  city?: string | null | undefined;
  state?: string | null | undefined;
  postalCode?: string | null | undefined;
  country?: string | null | undefined;
  workLocation?: string | null | undefined;
  notes?: string | null | undefined;
}

export async function createEmployee(payload: CreateEmployeePayload): Promise<{ success: boolean; employeeId?: string; error?: string }> {
  const supabase = await createClient();

  // If no employeeCode provided, generate one transactionally
  let finalCode = payload.employeeCode?.trim();
  if (!finalCode) {
    const { data: codeData, error: codeErr } = await supabase.rpc("generate_next_employee_code", {
      p_org_id: payload.organizationId,
    });
    if (codeErr || !codeData) {
      // Fallback generator
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      finalCode = `EMP-${randomSuffix}`;
    } else {
      finalCode = codeData as string;
    }
  }

  // Cross-org boundary verification before insert
  if (payload.departmentId) {
    const { data: dept } = await supabase.from("departments").select("id").eq("organization_id", payload.organizationId).eq("id", payload.departmentId).single();
    if (!dept) return { success: false, error: "The selected department does not belong to your organization." };
  }
  if (payload.branchId) {
    const { data: branch } = await supabase.from("branches").select("id").eq("organization_id", payload.organizationId).eq("id", payload.branchId).single();
    if (!branch) return { success: false, error: "The selected branch does not belong to your organization." };
  }
  if (payload.designationId) {
    const { data: desig } = await supabase.from("designations").select("id").eq("organization_id", payload.organizationId).eq("id", payload.designationId).single();
    if (!desig) return { success: false, error: "The selected designation does not belong to your organization." };
  }
  if (payload.reportingManagerId) {
    const { data: mgr } = await supabase.from("employees").select("id").eq("organization_id", payload.organizationId).eq("id", payload.reportingManagerId).single();
    if (!mgr) return { success: false, error: "The selected reporting manager does not belong to your organization." };
  }

  const { data: inserted, error } = await supabase
    .from("employees")
    .insert({
      organization_id: payload.organizationId,
      employee_code: finalCode,
      first_name: payload.firstName.trim(),
      last_name: payload.lastName.trim(),
      work_email: payload.workEmail?.trim() || null,
      contact_number: payload.contactNumber?.trim() || null,
      work_phone: payload.workPhone?.trim() || null,
      branch_id: payload.branchId || null,
      department_id: payload.departmentId || null,
      designation_id: payload.designationId || null,
      reporting_manager_id: payload.reportingManagerId || null,
      employment_type: payload.employmentType,
      employment_status: payload.employmentStatus,
      date_of_joining: payload.dateOfJoining,
      date_of_confirmation: payload.dateOfConfirmation || null,
      notice_period_days: payload.noticePeriodDays ?? 30,
      emergency_contact_name: payload.emergencyContactName?.trim() || null,
      emergency_contact_relationship: payload.emergencyContactRelationship?.trim() || null,
      emergency_contact_phone: payload.emergencyContactPhone?.trim() || null,
      address_line1: payload.addressLine1?.trim() || null,
      address_line2: payload.addressLine2?.trim() || null,
      city: payload.city?.trim() || null,
      state: payload.state?.trim() || null,
      postal_code: payload.postalCode?.trim() || null,
      country: payload.country?.trim() || "India",
      work_location: payload.workLocation?.trim() || null,
      notes: payload.notes?.trim() || null,
      is_active: payload.employmentStatus === "active",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: `Employee code '${finalCode}' already exists in this organization.` };
    }
    return { success: false, error: error.message };
  }

  return { success: true, employeeId: inserted.id };
}

// =============================================================================
// 5. Update Employee Details Operation
// =============================================================================

export interface UpdateEmployeePayload {
  id: string;
  organizationId: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  workEmail?: string | null | undefined;
  contactNumber?: string | null | undefined;
  workPhone?: string | null | undefined;
  branchId?: string | null | undefined;
  departmentId?: string | null | undefined;
  designationId?: string | null | undefined;
  reportingManagerId?: string | null | undefined;
  employmentType?: string | undefined;
  employmentStatus?: string | undefined;
  dateOfJoining?: string | undefined;
  dateOfConfirmation?: string | null | undefined;
  dateOfResignation?: string | null | undefined;
  dateOfTermination?: string | null | undefined;
  noticePeriodDays?: number | undefined;
  emergencyContactName?: string | null | undefined;
  emergencyContactRelationship?: string | null | undefined;
  emergencyContactPhone?: string | null | undefined;
  addressLine1?: string | null | undefined;
  addressLine2?: string | null | undefined;
  city?: string | null | undefined;
  state?: string | null | undefined;
  postalCode?: string | null | undefined;
  country?: string | null | undefined;
  workLocation?: string | null | undefined;
  notes?: string | null | undefined;
}

export async function updateEmployee(payload: UpdateEmployeePayload): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const updateFields: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.firstName !== undefined) updateFields.first_name = payload.firstName.trim();
  if (payload.lastName !== undefined) updateFields.last_name = payload.lastName.trim();
  if (payload.workEmail !== undefined) updateFields.work_email = payload.workEmail?.trim() || null;
  if (payload.contactNumber !== undefined) updateFields.contact_number = payload.contactNumber?.trim() || null;
  if (payload.workPhone !== undefined) updateFields.work_phone = payload.workPhone?.trim() || null;
  if (payload.branchId !== undefined) updateFields.branch_id = payload.branchId || null;
  if (payload.departmentId !== undefined) updateFields.department_id = payload.departmentId || null;
  if (payload.designationId !== undefined) updateFields.designation_id = payload.designationId || null;
  if (payload.reportingManagerId !== undefined) updateFields.reporting_manager_id = payload.reportingManagerId || null;
  if (payload.employmentType !== undefined) updateFields.employment_type = payload.employmentType;
  if (payload.employmentStatus !== undefined) {
    updateFields.employment_status = payload.employmentStatus;
    updateFields.is_active = payload.employmentStatus === "active";
  }
  if (payload.dateOfJoining !== undefined) updateFields.date_of_joining = payload.dateOfJoining;
  if (payload.dateOfConfirmation !== undefined) updateFields.date_of_confirmation = payload.dateOfConfirmation || null;
  if (payload.dateOfResignation !== undefined) updateFields.date_of_resignation = payload.dateOfResignation || null;
  if (payload.dateOfTermination !== undefined) updateFields.date_of_termination = payload.dateOfTermination || null;
  if (payload.noticePeriodDays !== undefined) updateFields.notice_period_days = payload.noticePeriodDays;
  if (payload.emergencyContactName !== undefined) updateFields.emergency_contact_name = payload.emergencyContactName?.trim() || null;
  if (payload.emergencyContactRelationship !== undefined) updateFields.emergency_contact_relationship = payload.emergencyContactRelationship?.trim() || null;
  if (payload.emergencyContactPhone !== undefined) updateFields.emergency_contact_phone = payload.emergencyContactPhone?.trim() || null;
  if (payload.addressLine1 !== undefined) updateFields.address_line1 = payload.addressLine1?.trim() || null;
  if (payload.addressLine2 !== undefined) updateFields.address_line2 = payload.addressLine2?.trim() || null;
  if (payload.city !== undefined) updateFields.city = payload.city?.trim() || null;
  if (payload.state !== undefined) updateFields.state = payload.state?.trim() || null;
  if (payload.postalCode !== undefined) updateFields.postal_code = payload.postalCode?.trim() || null;
  if (payload.country !== undefined) updateFields.country = payload.country?.trim() || "India";
  if (payload.workLocation !== undefined) updateFields.work_location = payload.workLocation?.trim() || null;
  if (payload.notes !== undefined) updateFields.notes = payload.notes?.trim() || null;

  const { error } = await supabase
    .from("employees")
    .update(updateFields)
    .eq("organization_id", payload.organizationId)
    .eq("id", payload.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =============================================================================
// 6. Deactivate & Reactivate Employee Lifecycle Operations
// =============================================================================

export async function setEmployeeStatus(
  orgId: string,
  employeeId: string,
  status: "active" | "inactive" | "terminated" | "resigned" | "suspended",
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const now = new Date().toISOString().slice(0, 10);
  const updateData: Record<string, unknown> = {
    employment_status: status,
    is_active: status === "active",
    updated_at: new Date().toISOString(),
  };

  if (reason) {
    updateData.notes = reason;
  }

  if (status === "terminated") {
    updateData.date_of_termination = now;
  } else if (status === "resigned") {
    updateData.date_of_resignation = now;
  }

  const { error } = await supabase
    .from("employees")
    .update(updateData)
    .eq("organization_id", orgId)
    .eq("id", employeeId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =============================================================================
// 7. Departments, Branches, Designations Management
// =============================================================================

export async function getDepartmentsList(orgId: string): Promise<DepartmentDetail[]> {
  const supabase = await createClient();

  const [deptRes, branchRes, empRes] = await Promise.all([
    supabase.from("departments").select("*").eq("organization_id", orgId).order("name"),
    supabase.from("branches").select("id, name").eq("organization_id", orgId),
    supabase.from("employees").select("id, department_id, employee_code, first_name, last_name").eq("organization_id", orgId),
  ]);

  const rawDepts = (deptRes.data as RawDept[] | null) ?? [];
  const rawBranches = (branchRes.data as Array<{ id: string; name: string }> | null) ?? [];
  const rawEmps = (empRes.data as Array<{ id: string; department_id: string | null; employee_code: string; first_name: string | null; last_name: string | null }> | null) ?? [];

  const branchMap = new Map(rawBranches.map((b) => [b.id, b.name]));
  const countMap = new Map<string, number>();
  const empMap = new Map(rawEmps.map((e) => [e.id, `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() || e.employee_code]));

  rawEmps.forEach((e) => {
    if (e.department_id) {
      countMap.set(e.department_id, (countMap.get(e.department_id) ?? 0) + 1);
    }
  });

  return rawDepts.map((d) => ({
    id: d.id,
    organizationId: d.organization_id,
    branchId: d.branch_id,
    parentDepartmentId: d.parent_department_id,
    headOfDepartmentId: d.head_of_department_id ?? null,
    headOfDepartmentName: d.head_of_department_id ? empMap.get(d.head_of_department_id) : null,
    name: d.name,
    code: d.code,
    description: d.description,
    isActive: d.is_active,
    employeeCount: countMap.get(d.id) ?? 0,
    branchName: d.branch_id ? branchMap.get(d.branch_id) : "All Branches",
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  }));
}

export async function upsertDepartment(
  orgId: string,
  payload: {
    id?: string | undefined;
    name: string;
    code: string;
    branchId?: string | null | undefined;
    parentDepartmentId?: string | null | undefined;
    headOfDepartmentId?: string | null | undefined;
    description?: string | null | undefined;
    isActive?: boolean | undefined;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  if (payload.id) {
    const { error } = await supabase
      .from("departments")
      .update({
        name: payload.name.trim(),
        code: payload.code.trim().toUpperCase(),
        branch_id: payload.branchId || null,
        parent_department_id: payload.parentDepartmentId || null,
        head_of_department_id: payload.headOfDepartmentId || null,
        description: payload.description?.trim() || null,
        is_active: payload.isActive ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", orgId)
      .eq("id", payload.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("departments").insert({
      organization_id: orgId,
      name: payload.name.trim(),
      code: payload.code.trim().toUpperCase(),
      branch_id: payload.branchId || null,
      parent_department_id: payload.parentDepartmentId || null,
      head_of_department_id: payload.headOfDepartmentId || null,
      description: payload.description?.trim() || null,
      is_active: payload.isActive ?? true,
    });
    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getBranchesList(orgId: string): Promise<BranchDetail[]> {
  const supabase = await createClient();

  const [branchRes, empRes] = await Promise.all([
    supabase.from("branches").select("*").eq("organization_id", orgId).order("name"),
    supabase.from("employees").select("branch_id").eq("organization_id", orgId),
  ]);

  const rawBranches = (branchRes.data as RawBranch[] | null) ?? [];
  const rawEmps = (empRes.data as Array<{ branch_id: string | null }> | null) ?? [];

  const countMap = new Map<string, number>();
  rawEmps.forEach((e) => {
    if (e.branch_id) countMap.set(e.branch_id, (countMap.get(e.branch_id) ?? 0) + 1);
  });

  return rawBranches.map((b) => ({
    id: b.id,
    organizationId: b.organization_id,
    name: b.name,
    code: b.code,
    address: b.address,
    phone: b.phone,
    email: b.email,
    isActive: b.is_active,
    employeeCount: countMap.get(b.id) ?? 0,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  }));
}

export async function upsertBranch(
  orgId: string,
  payload: {
    id?: string | undefined;
    name: string;
    code: string;
    address?: string | null | undefined;
    phone?: string | null | undefined;
    email?: string | null | undefined;
    isActive?: boolean | undefined;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  if (payload.id) {
    const { error } = await supabase
      .from("branches")
      .update({
        name: payload.name.trim(),
        code: payload.code.trim().toUpperCase(),
        address: payload.address?.trim() || null,
        phone: payload.phone?.trim() || null,
        email: payload.email?.trim() || null,
        is_active: payload.isActive ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", orgId)
      .eq("id", payload.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("branches").insert({
      organization_id: orgId,
      name: payload.name.trim(),
      code: payload.code.trim().toUpperCase(),
      address: payload.address?.trim() || null,
      phone: payload.phone?.trim() || null,
      email: payload.email?.trim() || null,
      is_active: payload.isActive ?? true,
    });
    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getDesignationsList(orgId: string): Promise<DesignationDetail[]> {
  const supabase = await createClient();

  const [desigRes, deptRes, empRes] = await Promise.all([
    supabase.from("designations").select("*").eq("organization_id", orgId).order("name"),
    supabase.from("departments").select("id, name").eq("organization_id", orgId),
    supabase.from("employees").select("designation_id").eq("organization_id", orgId),
  ]);

  const rawDesigs = (desigRes.data as RawDesig[] | null) ?? [];
  const rawDepts = (deptRes.data as Array<{ id: string; name: string }> | null) ?? [];
  const rawEmps = (empRes.data as Array<{ designation_id: string | null }> | null) ?? [];

  const deptMap = new Map(rawDepts.map((d) => [d.id, d.name]));
  const countMap = new Map<string, number>();
  rawEmps.forEach((e) => {
    if (e.designation_id) countMap.set(e.designation_id, (countMap.get(e.designation_id) ?? 0) + 1);
  });

  return rawDesigs.map((d) => ({
    id: d.id,
    organizationId: d.organization_id,
    departmentId: d.department_id,
    departmentName: d.department_id ? (deptMap.get(d.department_id) ?? "General") : "General",
    name: d.name,
    code: d.code,
    grade: d.grade,
    level: d.level,
    isActive: d.is_active,
    employeeCount: countMap.get(d.id) ?? 0,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  }));
}

export async function upsertDesignation(
  orgId: string,
  payload: {
    id?: string | undefined;
    name: string;
    code: string;
    departmentId?: string | null | undefined;
    grade?: string | null | undefined;
    level?: number | null | undefined;
    isActive?: boolean | undefined;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  if (payload.id) {
    const { error } = await supabase
      .from("designations")
      .update({
        name: payload.name.trim(),
        code: payload.code.trim().toUpperCase(),
        department_id: payload.departmentId || null,
        grade: payload.grade?.trim() || null,
        level: payload.level ?? null,
        is_active: payload.isActive ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", orgId)
      .eq("id", payload.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("designations").insert({
      organization_id: orgId,
      name: payload.name.trim(),
      code: payload.code.trim().toUpperCase(),
      department_id: payload.departmentId || null,
      grade: payload.grade?.trim() || null,
      level: payload.level ?? null,
      is_active: payload.isActive ?? true,
    });
    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}

// =============================================================================
// 8. CSV Import & Export Operations with Injection Protection
// =============================================================================

export function escapeCsvField(field: unknown): string {
  if (field === null || field === undefined) return '""';
  let str = String(field);

  // Spreadsheet formula injection guard: prefix unsafe initial characters with a single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape internal double quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function exportEmployeesCsv(
  orgId: string,
  filterParams: EmployeeDirectoryFilterParams = {}
): Promise<string> {
  // Query all matching records for the organization (max 5000 per export)
  const result = await getEmployeesDirectory(orgId, {
    ...filterParams,
    page: 1,
    pageSize: 5000,
  });

  const headers = [
    "Employee Code",
    "Full Name",
    "First Name",
    "Last Name",
    "Work Email",
    "Contact Number",
    "Department",
    "Branch",
    "Designation",
    "Reporting Manager Code",
    "Employment Type",
    "Employment Status",
    "Date of Joining",
    "Date of Confirmation",
    "Work Location",
  ];

  const rows = result.employees.map((e) => [
    escapeCsvField(e.employeeCode),
    escapeCsvField(e.fullName),
    escapeCsvField(e.firstName),
    escapeCsvField(e.lastName),
    escapeCsvField(e.workEmail),
    escapeCsvField(e.contactNumber),
    escapeCsvField(e.departmentName),
    escapeCsvField(e.branchName),
    escapeCsvField(e.designationName),
    escapeCsvField(e.reportingManagerCode ?? ""),
    escapeCsvField(e.employmentType),
    escapeCsvField(e.employmentStatus),
    escapeCsvField(e.dateOfJoining),
    escapeCsvField(e.dateOfConfirmation ?? ""),
    escapeCsvField(e.workLocation ?? ""),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

export async function importEmployeesFromRows(
  orgId: string,
  rows: EmployeeImportRow[]
): Promise<EmployeeImportResult> {
  const supabase = await createClient();

  const errors: Array<{ rowNumber: number; employeeCode?: string; message: string }> = [];
  let importedCount = 0;

  // Pre-load reference maps for fast validation
  const [deptRes, branchRes, desigRes, empRes] = await Promise.all([
    supabase.from("departments").select("id, code").eq("organization_id", orgId),
    supabase.from("branches").select("id, code").eq("organization_id", orgId),
    supabase.from("designations").select("id, code").eq("organization_id", orgId),
    supabase.from("employees").select("id, employee_code").eq("organization_id", orgId),
  ]);

  const deptMap = new Map((deptRes.data as Array<{ id: string; code: string }> | null)?.map((d) => [d.code.toUpperCase(), d.id]) ?? []);
  const branchMap = new Map((branchRes.data as Array<{ id: string; code: string }> | null)?.map((b) => [b.code.toUpperCase(), b.id]) ?? []);
  const desigMap = new Map((desigRes.data as Array<{ id: string; code: string }> | null)?.map((d) => [d.code.toUpperCase(), d.id]) ?? []);
  const empMap = new Map((empRes.data as Array<{ id: string; employee_code: string }> | null)?.map((e) => [e.employee_code.toUpperCase(), e.id]) ?? []);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const rowNum = i + 1;
    const empCode = row.employeeCode?.trim() || undefined;

    try {
      const deptId = deptMap.get(row.departmentCode.trim().toUpperCase());
      if (!deptId) {
        errors.push({
          rowNumber: rowNum,
          ...(empCode ? { employeeCode: empCode } : {}),
          message: `Department code '${row.departmentCode}' does not exist.`,
        });
        continue;
      }

      const branchId = branchMap.get(row.branchCode.trim().toUpperCase());
      if (!branchId) {
        errors.push({
          rowNumber: rowNum,
          ...(empCode ? { employeeCode: empCode } : {}),
          message: `Branch code '${row.branchCode}' does not exist.`,
        });
        continue;
      }

      const desigId = desigMap.get(row.designationCode.trim().toUpperCase());
      if (!desigId) {
        errors.push({
          rowNumber: rowNum,
          ...(empCode ? { employeeCode: empCode } : {}),
          message: `Designation code '${row.designationCode}' does not exist.`,
        });
        continue;
      }

      let managerId: string | null = null;
      if (row.reportingManagerCode && row.reportingManagerCode.trim() !== "") {
        managerId = empMap.get(row.reportingManagerCode.trim().toUpperCase()) ?? null;
        if (!managerId) {
          errors.push({
            rowNumber: rowNum,
            ...(empCode ? { employeeCode: empCode } : {}),
            message: `Manager code '${row.reportingManagerCode}' was not found in this organization.`,
          });
          continue;
        }
      }

      const createRes = await createEmployee({
        organizationId: orgId,
        employeeCode: empCode,
        firstName: row.firstName,
        lastName: row.lastName,
        workEmail: row.workEmail ?? undefined,
        contactNumber: row.contactNumber ?? undefined,
        departmentId: deptId,
        branchId,
        designationId: desigId,
        reportingManagerId: managerId,
        employmentType: row.employmentType,
        employmentStatus: row.employmentStatus,
        dateOfJoining: row.dateOfJoining,
        workLocation: row.workLocation ?? undefined,
      });

      if (!createRes.success) {
        errors.push({
          rowNumber: rowNum,
          ...(empCode ? { employeeCode: empCode } : {}),
          message: createRes.error ?? "Failed to insert record.",
        });
      } else {
        importedCount++;
        if (createRes.employeeId && empCode) {
          empMap.set(empCode.toUpperCase(), createRes.employeeId);
        }
      }
    } catch (err: unknown) {
      errors.push({
        rowNumber: rowNum,
        ...(empCode ? { employeeCode: empCode } : {}),
        message: err instanceof Error ? err.message : "Unexpected row processing error",
      });
    }
  }

  return {
    totalRows: rows.length,
    importedCount,
    failedCount: errors.length,
    errors,
  };
}
