import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";

export interface DepartmentDistributionItem {
  category: string;
  count: number;
  percentage?: number;
}

export interface EmploymentTypeDistributionItem {
  label: string;
  value: number;
}

export interface MonthlyJoiningTrendItem {
  date: string;
  count: number;
  label?: string;
}

export interface EmployeeDirectoryItem {
  id: string;
  employeeCode: string;
  fullName: string;
  workEmail: string | null;
  departmentName: string;
  designationName: string;
  branchName: string;
  employmentType: string;
  employmentStatus: string;
  dateOfJoining: string;
}

export interface AuditHistoryItem {
  id: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changeReason: string | null;
  effectiveDate: string | null;
  createdAt: string;
  employeeCode: string;
}

export interface SettingItem {
  id: string;
  organizationId: string | null;
  key: string;
  value: unknown;
}

export interface RoleItem {
  id: string;
  organizationId: string | null;
  name: string;
  code: string;
  isSystem: boolean;
}

export interface OrgItem {
  id: string;
  name: string;
  code: string;
  slug: string;
  isActive: boolean;
  is_active?: boolean;
  createdAt: string;
  created_at?: string;
}

export interface DeptItem {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface BranchItem {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface DesigItem {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  grade: string | null;
  level: number | null;
  isActive: boolean;
}

interface RawOrg {
  id: string;
  name: string;
  code: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

interface RawDept {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  is_active: boolean;
}

interface RawBranch {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  is_active: boolean;
}

interface RawDesig {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  grade: string | null;
  level: number | null;
  is_active: boolean;
}

interface RawEmp {
  id: string;
  organization_id: string;
  employee_code: string;
  employment_type: string;
  employment_status: string;
  date_of_joining: string;
  work_email: string | null;
  department_id: string | null;
  designation_id: string | null;
  branch_id: string | null;
  reporting_manager_id: string | null;
  profile_id: string | null;
}

interface RawHist {
  id: string;
  organization_id: string;
  employee_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_reason: string | null;
  effective_date: string | null;
  created_at: string;
}

interface RawProfile {
  id: string;
  full_name: string | null;
  is_active: boolean;
}

interface RawSetting {
  id: string;
  organization_id: string | null;
  key: string;
  value: unknown;
}

interface RawRole {
  id: string;
  organization_id: string | null;
  name: string;
  code: string;
  is_system: boolean;
}

/**
 * Super Admin platform-level analytics
 */
export async function getSuperAdminAnalytics() {
  const supabase = createAdminClient();

  const [orgsRes, profilesRes, rolesRes] = await Promise.all([
    supabase.from("organizations").select("*"),
    supabase.from("profiles").select("*", { count: "exact" }),
    supabase.from("roles").select("*", { count: "exact" }),
  ]);

  const rawOrgs = (orgsRes.data as RawOrg[] | null) ?? [];
  const orgs: OrgItem[] = rawOrgs.map((o) => ({
    id: o.id,
    name: o.name,
    code: o.code,
    slug: o.slug,
    isActive: o.is_active,
    is_active: o.is_active,
    createdAt: o.created_at,
    created_at: o.created_at,
  }));

  const totalOrgs = orgs.length;
  const activeOrgs = orgs.filter((o) => o.isActive).length;
  const totalUsers = profilesRes.count ?? 0;
  const totalSystemRoles = rolesRes.count ?? 0;

  return {
    totalOrgs,
    activeOrgs,
    inactiveOrgs: totalOrgs - activeOrgs,
    totalUsers,
    totalSystemRoles,
    organizations: orgs,
  };
}

/**
 * Organization Admin scoped analytics
 */
export async function getOrgAdminAnalytics(orgId: string) {
  const supabase = createAdminClient();

  const [empRes, deptRes, branchRes, desigRes, histRes] = await Promise.all([
    supabase.from("employees").select("*").eq("organization_id", orgId),
    supabase.from("departments").select("*").eq("organization_id", orgId),
    supabase.from("branches").select("*").eq("organization_id", orgId),
    supabase.from("designations").select("*").eq("organization_id", orgId),
    supabase
      .from("employee_history")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const rawEmp = (empRes.data as RawEmp[] | null) ?? [];
  const rawDept = (deptRes.data as RawDept[] | null) ?? [];
  const rawBranch = (branchRes.data as RawBranch[] | null) ?? [];
  const rawDesig = (desigRes.data as RawDesig[] | null) ?? [];
  const rawHist = (histRes.data as RawHist[] | null) ?? [];

  const departments: DeptItem[] = rawDept.map((d) => ({
    id: d.id,
    organizationId: d.organization_id,
    name: d.name,
    code: d.code,
    isActive: d.is_active,
  }));

  const branches: BranchItem[] = rawBranch.map((b) => ({
    id: b.id,
    organizationId: b.organization_id,
    name: b.name,
    code: b.code,
    isActive: b.is_active,
  }));

  const designations: DesigItem[] = rawDesig.map((d) => ({
    id: d.id,
    organizationId: d.organization_id,
    name: d.name,
    code: d.code,
    grade: d.grade,
    level: d.level,
    isActive: d.is_active,
  }));

  const totalEmployees = rawEmp.length;
  const activeEmployees = rawEmp.filter((e) => e.employment_status === "active").length;
  const onLeave = rawEmp.filter((e) => e.employment_status === "on_leave").length;
  const probation = rawEmp.filter((e) => e.employment_type === "probation").length;

  const deptMap = new Map<string, string>();
  departments.forEach((d) => {
    deptMap.set(d.id, d.name);
  });

  const deptCounts = new Map<string, number>();
  rawEmp.forEach((e) => {
    const deptName = e.department_id
      ? (deptMap.get(e.department_id) ?? "Unassigned")
      : "Unassigned";
    deptCounts.set(deptName, (deptCounts.get(deptName) ?? 0) + 1);
  });

  const departmentDistribution: DepartmentDistributionItem[] = Array.from(deptCounts.entries()).map(
    ([category, count]) => ({
      category,
      count,
      percentage: totalEmployees > 0 ? Number(((count / totalEmployees) * 100).toFixed(1)) : 0,
    }),
  );

  const empMap = new Map<string, string>();
  rawEmp.forEach((e) => {
    empMap.set(e.id, e.employee_code);
  });

  const recentHistory: AuditHistoryItem[] = rawHist.map((h) => ({
    id: h.id,
    fieldName: h.field_name,
    oldValue: h.old_value,
    newValue: h.new_value,
    changeReason: h.change_reason,
    effectiveDate: h.effective_date,
    createdAt: h.created_at,
    employeeCode: empMap.get(h.employee_id) ?? "Unknown",
  }));

  return {
    totalEmployees,
    activeEmployees,
    onLeave,
    probation,
    totalDepartments: departments.length,
    totalBranches: branches.length,
    totalDesignations: designations.length,
    departments,
    branches,
    designations,
    departmentDistribution,
    recentHistory,
  };
}

/**
 * HR Manager analytics and employee directory
 */
export async function getHrAnalytics(orgId: string) {
  const supabase = createAdminClient();

  const [empRes, deptRes, branchRes, desigRes, profileRes] = await Promise.all([
    supabase
      .from("employees")
      .select("*")
      .eq("organization_id", orgId)
      .order("date_of_joining", { ascending: false }),
    supabase.from("departments").select("*").eq("organization_id", orgId),
    supabase.from("branches").select("*").eq("organization_id", orgId),
    supabase.from("designations").select("*").eq("organization_id", orgId),
    supabase.from("profiles").select("*"),
  ]);

  const rawEmp = (empRes.data as RawEmp[] | null) ?? [];
  const rawDept = (deptRes.data as RawDept[] | null) ?? [];
  const rawBranch = (branchRes.data as RawBranch[] | null) ?? [];
  const rawDesig = (desigRes.data as RawDesig[] | null) ?? [];
  const rawProfiles = (profileRes.data as RawProfile[] | null) ?? [];

  const deptMap = new Map(rawDept.map((d) => [d.id, d.name]));
  const branchMap = new Map(rawBranch.map((b) => [b.id, b.name]));
  const desigMap = new Map(rawDesig.map((d) => [d.id, d.name]));
  const profileMap = new Map(rawProfiles.map((p) => [p.id, p.full_name]));

  // Employment Type distribution
  const typeCounts = new Map<string, number>();
  rawEmp.forEach((e) => {
    const typeLabel = e.employment_type.replace(/_/g, " ").toUpperCase();
    typeCounts.set(typeLabel, (typeCounts.get(typeLabel) ?? 0) + 1);
  });

  const employmentTypeDistribution: EmploymentTypeDistributionItem[] = Array.from(
    typeCounts.entries(),
  ).map(([label, value]) => ({ label, value }));

  // Monthly joining trend
  const monthCounts = new Map<string, number>();
  rawEmp.forEach((e) => {
    if (e.date_of_joining) {
      const monthKey = e.date_of_joining.slice(0, 7); // YYYY-MM
      monthCounts.set(monthKey, (monthCounts.get(monthKey) ?? 0) + 1);
    }
  });

  const monthlyJoiningTrend: MonthlyJoiningTrendItem[] = Array.from(monthCounts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count, label: date }));

  // Full formatted employee directory
  const directory: EmployeeDirectoryItem[] = rawEmp.map((e) => ({
    id: e.id,
    employeeCode: e.employee_code,
    fullName: (e.profile_id ? profileMap.get(e.profile_id) : null) ?? `Employee ${e.employee_code}`,
    workEmail: e.work_email,
    departmentName: e.department_id ? (deptMap.get(e.department_id) ?? "Unassigned") : "Unassigned",
    designationName: e.designation_id
      ? (desigMap.get(e.designation_id) ?? "Unassigned")
      : "Unassigned",
    branchName: e.branch_id ? (branchMap.get(e.branch_id) ?? "Main Branch") : "Main Branch",
    employmentType: e.employment_type,
    employmentStatus: e.employment_status,
    dateOfJoining: e.date_of_joining,
  }));

  // Department distribution
  const deptCounts = new Map<string, number>();
  rawEmp.forEach((e) => {
    const name = e.department_id ? (deptMap.get(e.department_id) ?? "Unassigned") : "Unassigned";
    deptCounts.set(name, (deptCounts.get(name) ?? 0) + 1);
  });

  const departmentDistribution = Array.from(deptCounts.entries()).map(([category, count]) => ({
    category,
    count,
  }));

  return {
    totalEmployees: rawEmp.length,
    activeEmployees: rawEmp.filter((e) => e.employment_status === "active").length,
    probationCount: rawEmp.filter((e) => e.employment_type === "probation").length,
    contractCount: rawEmp.filter((e) => e.employment_type === "contract").length,
    employmentTypeDistribution,
    monthlyJoiningTrend,
    departmentDistribution,
    directory,
  };
}

/**
 * Recruitment Manager analytics
 */
export async function getRecruitmentAnalytics(orgId: string) {
  const supabase = createAdminClient();

  const [deptRes, desigRes, empRes] = await Promise.all([
    supabase.from("departments").select("*").eq("organization_id", orgId),
    supabase.from("designations").select("*").eq("organization_id", orgId),
    supabase.from("employees").select("*").eq("organization_id", orgId),
  ]);

  const rawDept = (deptRes.data as RawDept[] | null) ?? [];
  const rawDesig = (desigRes.data as RawDesig[] | null) ?? [];
  const rawEmp = (empRes.data as RawEmp[] | null) ?? [];

  const deptMap = new Map(rawDept.map((d) => [d.id, d.name]));
  const deptStaff = new Map<string, number>();
  rawEmp.forEach((e) => {
    const name = e.department_id ? (deptMap.get(e.department_id) ?? "Unassigned") : "Unassigned";
    deptStaff.set(name, (deptStaff.get(name) ?? 0) + 1);
  });

  const departmentCapacity = rawDept.map((d) => ({
    departmentName: d.name,
    currentStaff: deptStaff.get(d.id) ?? 0,
  }));

  return {
    totalDepartments: rawDept.length,
    totalDesignations: rawDesig.length,
    currentHeadcount: rawEmp.length,
    designationsList: rawDesig.map((d) => ({
      id: d.id,
      organizationId: d.organization_id,
      name: d.name,
      code: d.code,
      grade: d.grade,
      level: d.level,
      isActive: d.is_active,
    })),
    departmentCapacity,
  };
}

/**
 * Finance & Payroll Manager analytics
 */
export async function getFinancePayrollAnalytics(orgId: string) {
  const supabase = createAdminClient();

  const [empRes, deptRes, desigRes] = await Promise.all([
    supabase.from("employees").select("*").eq("organization_id", orgId),
    supabase.from("departments").select("*").eq("organization_id", orgId),
    supabase.from("designations").select("*").eq("organization_id", orgId),
  ]);

  const rawEmp = (empRes.data as RawEmp[] | null) ?? [];
  const rawDept = (deptRes.data as RawDept[] | null) ?? [];
  const rawDesig = (desigRes.data as RawDesig[] | null) ?? [];

  const activeSalariedCount = rawEmp.filter((e) => e.employment_status === "active").length;

  const deptMap = new Map(rawDept.map((d) => [d.id, d.name]));
  const deptPayroll = new Map<string, number>();
  rawEmp.forEach((e) => {
    const name = e.department_id ? (deptMap.get(e.department_id) ?? "Unassigned") : "Unassigned";
    deptPayroll.set(name, (deptPayroll.get(name) ?? 0) + 1);
  });

  const departmentBreakdown = Array.from(deptPayroll.entries()).map(([deptName, count]) => ({
    departmentName: deptName,
    count,
  }));

  return {
    activeSalariedCount,
    totalEmployees: rawEmp.length,
    totalDesignations: rawDesig.length,
    designationGrades: rawDesig.map((d) => ({
      id: d.id,
      name: d.name,
      grade: d.grade,
      level: d.level,
    })),
    departmentBreakdown,
  };
}

export interface TeamMemberItem {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string | null;
  department: string;
  designation: string;
  status: string;
  joiningDate: string;
}

/**
 * Reporting Manager analytics (Direct Reports)
 */
export async function getManagerAnalytics(orgId: string, managerEmployeeId: string | null) {
  const supabase = createAdminClient();

  if (!managerEmployeeId) {
    return {
      directReportsCount: 0,
      teamMembers: [] as TeamMemberItem[],
    };
  }

  const [teamRes, deptRes, desigRes, profileRes] = await Promise.all([
    supabase
      .from("employees")
      .select("*")
      .eq("organization_id", orgId)
      .eq("reporting_manager_id", managerEmployeeId),
    supabase.from("departments").select("*").eq("organization_id", orgId),
    supabase.from("designations").select("*").eq("organization_id", orgId),
    supabase.from("profiles").select("*"),
  ]);

  const rawTeam = (teamRes.data as RawEmp[] | null) ?? [];
  const rawDept = (deptRes.data as RawDept[] | null) ?? [];
  const rawDesig = (desigRes.data as RawDesig[] | null) ?? [];
  const rawProfiles = (profileRes.data as RawProfile[] | null) ?? [];

  const deptMap = new Map(rawDept.map((d) => [d.id, d.name]));
  const desigMap = new Map(rawDesig.map((d) => [d.id, d.name]));
  const profileMap = new Map(rawProfiles.map((p) => [p.id, p.full_name]));

  const teamMembers: TeamMemberItem[] = rawTeam.map((m) => ({
    id: m.id,
    employeeCode: m.employee_code,
    fullName: (m.profile_id ? profileMap.get(m.profile_id) : null) ?? `Employee ${m.employee_code}`,
    email: m.work_email,
    department: m.department_id ? (deptMap.get(m.department_id) ?? "General") : "General",
    designation: m.designation_id ? (desigMap.get(m.designation_id) ?? "Member") : "Member",
    status: m.employment_status,
    joiningDate: m.date_of_joining,
  }));

  return {
    directReportsCount: rawTeam.length,
    teamMembers,
  };
}

export interface DeptMemberItem {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string | null;
  designation: string;
  status: string;
  joiningDate: string;
}

/**
 * Department Head analytics
 */
export async function getDeptHeadAnalytics(orgId: string, departmentId: string | null) {
  const supabase = createAdminClient();

  if (!departmentId) {
    return {
      departmentHeadcount: 0,
      departmentMembers: [] as DeptMemberItem[],
    };
  }

  const [membersRes, desigRes, profileRes] = await Promise.all([
    supabase
      .from("employees")
      .select("*")
      .eq("organization_id", orgId)
      .eq("department_id", departmentId),
    supabase.from("designations").select("*").eq("organization_id", orgId),
    supabase.from("profiles").select("*"),
  ]);

  const rawMembers = (membersRes.data as RawEmp[] | null) ?? [];
  const rawDesig = (desigRes.data as RawDesig[] | null) ?? [];
  const rawProfiles = (profileRes.data as RawProfile[] | null) ?? [];

  const desigMap = new Map(rawDesig.map((d) => [d.id, d.name]));
  const profileMap = new Map(rawProfiles.map((p) => [p.id, p.full_name]));

  const departmentMembers: DeptMemberItem[] = rawMembers.map((m) => ({
    id: m.id,
    employeeCode: m.employee_code,
    fullName: (m.profile_id ? profileMap.get(m.profile_id) : null) ?? `Employee ${m.employee_code}`,
    email: m.work_email,
    designation: m.designation_id ? (desigMap.get(m.designation_id) ?? "Specialist") : "Specialist",
    status: m.employment_status,
    joiningDate: m.date_of_joining,
  }));

  return {
    departmentHeadcount: rawMembers.length,
    departmentMembers,
  };
}

/**
 * IT & Assets Admin analytics
 */
export async function getItAssetsAnalytics(orgId: string) {
  const supabase = createAdminClient();

  const [profilesRes, deptsRes, branchesRes, settingsRes] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact" }).eq("organization_id", orgId),
    supabase.from("departments").select("*").eq("organization_id", orgId),
    supabase.from("branches").select("*").eq("organization_id", orgId),
    supabase.from("settings").select("*").eq("organization_id", orgId),
  ]);

  const activeProfiles = profilesRes.count ?? 0;
  const rawDepts = (deptsRes.data as RawDept[] | null) ?? [];
  const rawBranches = (branchesRes.data as RawBranch[] | null) ?? [];
  const rawSettings = (settingsRes.data as RawSetting[] | null) ?? [];

  const itSettings: SettingItem[] = rawSettings.map((s) => ({
    id: s.id,
    organizationId: s.organization_id,
    key: s.key,
    value: s.value,
  }));

  return {
    activeProfilesCount: activeProfiles,
    provisioningDepartments: rawDepts.length,
    provisioningBranches: rawBranches.length,
    itSettings,
  };
}

/**
 * Employee self-service data
 */
export async function getEmployeeSelfDetails(employeeId: string) {
  const supabase = createAdminClient();

  const empRes = await supabase.from("employees").select("*").eq("id", employeeId).single();
  const emp = empRes.data as RawEmp | null;

  if (!emp) return null;

  const [deptRes, desigRes, branchRes, profileRes] = await Promise.all([
    emp.department_id
      ? supabase.from("departments").select("*").eq("id", emp.department_id).single()
      : Promise.resolve({ data: null }),
    emp.designation_id
      ? supabase.from("designations").select("*").eq("id", emp.designation_id).single()
      : Promise.resolve({ data: null }),
    emp.branch_id
      ? supabase.from("branches").select("*").eq("id", emp.branch_id).single()
      : Promise.resolve({ data: null }),
    emp.profile_id
      ? supabase.from("profiles").select("*").eq("id", emp.profile_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const dept = deptRes.data as RawDept | null;
  const desig = desigRes.data as RawDesig | null;
  const branch = branchRes.data as RawBranch | null;
  const profile = profileRes.data as RawProfile | null;

  return {
    id: emp.id,
    fullName: profile?.full_name ?? `Employee ${emp.employee_code}`,
    employeeCode: emp.employee_code,
    employmentType: emp.employment_type,
    employmentStatus: emp.employment_status,
    dateOfJoining: emp.date_of_joining,
    workEmail: emp.work_email,
    departmentName: dept?.name ?? "General",
    designationName: desig?.name ?? "Specialist",
    branchName: branch?.name ?? "Main Campus",
  };
}

/**
 * Auditor analytics (strictly read-only)
 */
export async function getAuditorAnalytics(orgId: string) {
  const supabase = createAdminClient();

  const [empRes, histRes, deptsRes, rolesRes, profileRes] = await Promise.all([
    supabase.from("employees").select("*").eq("organization_id", orgId),
    supabase
      .from("employee_history")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false }),
    supabase.from("departments").select("*").eq("organization_id", orgId),
    supabase.from("roles").select("*").eq("organization_id", orgId),
    supabase.from("profiles").select("*"),
  ]);

  const rawEmp = (empRes.data as RawEmp[] | null) ?? [];
  const rawHist = (histRes.data as RawHist[] | null) ?? [];
  const rawDept = (deptsRes.data as RawDept[] | null) ?? [];
  const rawRoles = (rolesRes.data as RawRole[] | null) ?? [];
  const rawProfiles = (profileRes.data as RawProfile[] | null) ?? [];

  const profileMap = new Map(rawProfiles.map((p) => [p.id, p.full_name]));
  const empMap = new Map(rawEmp.map((e) => [e.id, e.employee_code]));

  const auditTrail: AuditHistoryItem[] = rawHist.map((h) => ({
    id: h.id,
    fieldName: h.field_name,
    oldValue: h.old_value,
    newValue: h.new_value,
    changeReason: h.change_reason,
    effectiveDate: h.effective_date,
    createdAt: h.created_at,
    employeeCode: empMap.get(h.employee_id) ?? "Unknown",
  }));

  return {
    totalAuditRecords: rawHist.length,
    totalEmployeesTracked: rawEmp.length,
    departmentsCount: rawDept.length,
    rolesCount: rawRoles.length,
    auditTrail,
    roster: rawEmp.map((e) => ({
      id: e.id,
      employeeCode: e.employee_code,
      fullName:
        (e.profile_id ? profileMap.get(e.profile_id) : null) ?? `Employee ${e.employee_code}`,
      status: e.employment_status,
      type: e.employment_type,
      joiningDate: e.date_of_joining,
    })),
  };
}
