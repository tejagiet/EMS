import { getRolePermissions, PORTAL_ROLES } from "@ems/config";
import type {
  AuthenticatedUserContext,
  EmployeeProfileLink,
  Organization,
  OrganizationMembership,
  PermissionCode,
  PortalRole,
  UserProfile,
} from "@ems/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";

const ACTIVE_ORG_COOKIE = "ems_active_org_id";
const ACTIVE_ROLE_COOKIE = "ems_active_role";

interface DbProfile {
  id: string;
  organization_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: "male" | "female" | "other" | "prefer_not_to_say" | null;
  locale: string | null;
  timezone: string | null;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DbRole {
  code: string;
  name: string;
  is_system: boolean;
}

interface DbUserRole {
  id: string;
  organization_id: string;
  role_id: string;
  is_active: boolean;
  roles: DbRole | null;
}

interface DbOrganization {
  id: string;
  name: string;
  slug: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  website: string | null;
  is_active: boolean;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface DbEmployee {
  id: string;
  organization_id: string;
  profile_id: string | null;
  branch_id: string | null;
  department_id: string | null;
  designation_id: string | null;
  reporting_manager_id: string | null;
  employee_code: string;
  employment_type: "full_time" | "part_time" | "contract" | "intern" | "probation";
  employment_status: "active" | "inactive" | "terminated" | "resigned" | "on_leave" | "suspended";
  date_of_joining: string;
  work_email: string | null;
  work_phone: string | null;
  is_active: boolean;
}

/**
 * Loads the complete authenticated context on the server side.
 * Validates the session, profile, organization memberships, and permissions.
 */
export async function getCurrentUserContext(): Promise<AuthenticatedUserContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  // 1. Fetch Profile
  const profileResponse = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const profileData = profileResponse.data as DbProfile | null;

  const defaultName = (user.email ? user.email.split("@")[0] : null) ?? "User";
  const userMetaName = (user.user_metadata as { full_name?: string } | null)?.full_name;

  const profile: UserProfile = profileData
    ? {
        id: profileData.id,
        organizationId: profileData.organization_id,
        fullName: profileData.full_name ?? defaultName,
        avatarUrl: profileData.avatar_url,
        phone: profileData.phone,
        dateOfBirth: profileData.date_of_birth,
        gender: profileData.gender,
        locale: profileData.locale ?? "en",
        timezone: profileData.timezone ?? "UTC",
        isActive: profileData.is_active,
        lastSeenAt: profileData.last_seen_at,
        createdAt: profileData.created_at,
        updatedAt: profileData.updated_at,
      }
    : {
        id: user.id,
        organizationId: null,
        fullName: userMetaName ?? defaultName,
        avatarUrl: null,
        phone: null,
        dateOfBirth: null,
        gender: null,
        locale: "en",
        timezone: "UTC",
        isActive: true,
        lastSeenAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

  // 2. Fetch User Role Assignments
  const userRolesResponse = await supabase
    .from("user_roles")
    .select(
      `
      id,
      organization_id,
      role_id,
      is_active,
      roles (
        code,
        name,
        is_system
      )
    `,
    )
    .eq("profile_id", user.id)
    .eq("is_active", true);

  const userRoleRows = (userRolesResponse.data as unknown as DbUserRole[] | null) ?? [];

  const availableRoles: PortalRole[] = [];
  const orgMap = new Map<string, PortalRole[]>();

  for (const row of userRoleRows) {
    const code = row.roles?.code as PortalRole | undefined;
    if (code && PORTAL_ROLES.includes(code)) {
      if (!availableRoles.includes(code)) {
        availableRoles.push(code);
      }
      const existing = orgMap.get(row.organization_id) ?? [];
      if (!existing.includes(code)) {
        existing.push(code);
      }
      orgMap.set(row.organization_id, existing);
    }
  }

  // Fallback default role if no roles assigned yet
  if (availableRoles.length === 0) {
    availableRoles.push("employee");
  }

  // 3. Resolve active organization ID from cookies or profile
  const cookieStore = await cookies();
  const requestedOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  const activeOrgId =
    requestedOrgId && orgMap.has(requestedOrgId)
      ? requestedOrgId
      : (profile.organizationId ?? orgMap.keys().next().value ?? null);

  // 4. Fetch Organization Details
  let activeOrganization: Organization | null = null;
  if (activeOrgId) {
    const orgResponse = await supabase
      .from("organizations")
      .select("*")
      .eq("id", activeOrgId)
      .single();

    const orgData = orgResponse.data as DbOrganization | null;
    if (orgData) {
      activeOrganization = {
        id: orgData.id,
        name: orgData.name,
        slug: orgData.slug,
        code: orgData.code,
        address: orgData.address,
        phone: orgData.phone,
        email: orgData.email,
        logoUrl: orgData.logo_url,
        website: orgData.website,
        isActive: orgData.is_active,
        settings: orgData.settings ?? {},
        createdAt: orgData.created_at,
        updatedAt: orgData.updated_at,
      };
    }
  }

  // Build Membership Array
  const memberships: OrganizationMembership[] = [];
  for (const [orgId, roles] of orgMap.entries()) {
    memberships.push({
      organizationId: orgId,
      organizationName:
        activeOrganization?.id === orgId
          ? activeOrganization.name
          : `Organization ${orgId.slice(0, 8)}`,
      organizationSlug:
        activeOrganization?.id === orgId ? activeOrganization.slug : orgId.slice(0, 8),
      roles,
      isDefault: orgId === activeOrgId,
    });
  }

  // 5. Resolve active portal role
  const requestedRole = cookieStore.get(ACTIVE_ROLE_COOKIE)?.value as PortalRole | undefined;
  const activeRole: PortalRole =
    requestedRole && availableRoles.includes(requestedRole)
      ? requestedRole
      : (availableRoles[0] ?? "employee");

  // 6. Resolve Permissions (derived from least-privilege matrix)
  const rolePerms = getRolePermissions(activeRole);
  const permissions: PermissionCode[] = [...rolePerms];

  // 7. Fetch Linked Employee record
  let linkedEmployee: EmployeeProfileLink | null = null;
  const empResponse = await supabase
    .from("employees")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();

  const empData = empResponse.data as DbEmployee | null;
  if (empData) {
    linkedEmployee = {
      id: empData.id,
      organizationId: empData.organization_id,
      profileId: empData.profile_id,
      branchId: empData.branch_id,
      departmentId: empData.department_id,
      designationId: empData.designation_id,
      reportingManagerId: empData.reporting_manager_id,
      employeeCode: empData.employee_code,
      employmentType: empData.employment_type,
      employmentStatus: empData.employment_status,
      dateOfJoining: empData.date_of_joining,
      workEmail: empData.work_email,
      workPhone: empData.work_phone,
      isActive: empData.is_active,
    };
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    profile,
    activeOrganization,
    memberships,
    activeRole,
    availableRoles,
    permissions,
    linkedEmployee,
    isAccountActive: profile.isActive,
  };
}

/**
 * Server-side gatekeeper function for portal pages.
 * Rejects unauthenticated users, inactive accounts, and unauthorized roles.
 */
export async function verifyPortalAccess(
  requiredRole: PortalRole,
): Promise<AuthenticatedUserContext> {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect(`/login?redirectTo=/portal/${requiredRole.replace(/_/g, "-")}`);
  }

  if (!context.isAccountActive) {
    redirect("/unauthorized?reason=inactive_account");
  }

  // Super admin can access all portals; others must hold the role or switch to it
  const isAuthorized =
    context.activeRole === "super_admin" ||
    context.activeRole === requiredRole ||
    context.availableRoles.includes(requiredRole);

  if (!isAuthorized) {
    redirect(`/unauthorized?reason=insufficient_role&target=${requiredRole}`);
  }

  return context;
}
