import { PORTAL_ROUTES } from "@ems/config";
import type {
  AuthenticatedUserContext,
  EmployeeProfileLink,
  Organization,
  OrganizationMembership,
  PortalRole,
  UserProfile,
} from "@ems/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import {
  isPortalAccessAllowed,
  isScopedContextReady,
  resolveScopedAccess,
  type ActiveOrganizationContext,
  type PortalAccessOptions,
  type RoleAssignmentAccessInput,
} from "./access";

export {
  isPortalAccessAllowed,
  isScopedContextReady,
  isValidRoleAssignment,
  resolveScopedAccess,
} from "./access";
export type {
  ActiveOrganizationContext,
  PortalAccessOptions,
  RoleAssignmentAccessInput,
  ScopedAccessResolution,
  ScopedAccessResolutionInput,
} from "./access";

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
  is_active: boolean;
}

interface DbUserRole {
  id: string;
  organization_id: string;
  role_id: string;
  is_active: boolean;
  expires_at: string | null;
  roles: DbRole | DbRole[] | null;
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

let cachedContextPromise: Promise<AuthenticatedUserContext | null> | null = null;
let lastCacheTime = 0;

export function clearUserContextCache() {
  cachedContextPromise = null;
  lastCacheTime = 0;
}

if (typeof window !== "undefined") {
  window.addEventListener("ems:refresh", clearUserContextCache);
}

/**
 * Loads the complete authenticated context.
 * Validates the session, profile, organization memberships, and permissions.
 * Memoized to prevent redundant DB roundtrips.
 */
export async function getCurrentUserContext(): Promise<AuthenticatedUserContext | null> {
  const now = Date.now();
  if (cachedContextPromise && now - lastCacheTime < 2500) {
    return cachedContextPromise;
  }
  lastCacheTime = now;
  cachedContextPromise = fetchCurrentUserContext();
  return cachedContextPromise;
}

async function fetchCurrentUserContext(): Promise<AuthenticatedUserContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  // 1. Fetch Profile. A missing profile is kept as a read-only, no-access
  // context instead of being treated as a new employee.
  const profileResponse = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profileData = profileResponse.data as DbProfile | null;
  const hasProfile = profileData !== null;

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

  // 2. Fetch User Role Assignments. Expiry and role activity are checked in
  // pure policy code below as well as by the query's is_active filter.
  const userRolesResponse = await supabase
    .from("user_roles")
    .select(
      `
      id,
       organization_id,
       role_id,
       is_active,
       expires_at,
       roles (
         code,
         name,
         is_system,
         is_active
       )
     `,
    )
    .eq("profile_id", user.id)
    .eq("is_active", true);

  const userRoleRows = (userRolesResponse.data as unknown as DbUserRole[] | null) ?? [];

  const roleAssignments: RoleAssignmentAccessInput[] = [];
  const getRelatedRole = (roles: DbRole | DbRole[] | null): DbRole | null =>
    Array.isArray(roles) ? (roles[0] ?? null) : roles;

  for (const row of userRoleRows) {
    const role = getRelatedRole(row.roles);
    roleAssignments.push({
      organizationId: row.organization_id,
      roleCode: role?.code ?? null,
      isActive: row.is_active === true,
      roleIsActive: role?.is_active === true,
      expiresAt: row.expires_at,
    });
  }

  // Self-heal active employees who are missing user_roles or profile organization links
  if (roleAssignments.length === 0) {
    try {
      const admin = createAdminClient();
      let { data: empRecord } = await admin
        .from("employees")
        .select("id, organization_id, is_active, first_name, last_name")
        .eq("profile_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (!empRecord && user.email) {
        const { data: empByEmail } = await admin
          .from("employees")
          .select("id, organization_id, is_active, first_name, last_name")
          .ilike("work_email", user.email)
          .eq("is_active", true)
          .maybeSingle();
        if (empByEmail) {
          await admin.from("employees").update({ profile_id: user.id }).eq("id", empByEmail.id);
          empRecord = empByEmail;
        }
      }

      if (empRecord && empRecord.organization_id) {
        await admin.from("profiles").upsert({
          id: user.id,
          email: user.email ?? "",
          full_name: `${empRecord.first_name || ""} ${empRecord.last_name || ""}`.trim() || "Employee",
          organization_id: empRecord.organization_id,
          is_active: true,
        });

        const { data: roleRow } = await admin
          .from("roles")
          .select("id")
          .eq("code", "employee")
          .eq("is_system", true)
          .maybeSingle();

        const empRoleId = roleRow?.id || "00000005-0000-0000-0000-000000000004";
        await admin.from("user_roles").upsert(
          {
            profile_id: user.id,
            organization_id: empRecord.organization_id,
            role_id: empRoleId,
            is_active: true,
          },
          { onConflict: "organization_id,profile_id,role_id" }
        );

        roleAssignments.push({
          organizationId: empRecord.organization_id,
          roleCode: "employee",
          isActive: true,
          roleIsActive: true,
          expiresAt: null,
        });
      }
    } catch (healErr) {
      console.warn("[session] Failed auto-healing employee role assignment:", healErr);
    }
  }

  // A role row without a profile row is not a usable membership, even if a
  // permissive query/RLS configuration happens to return it.
  const effectiveAssignments = hasProfile ? roleAssignments : [];

  // 3. Resolve the selected organization. The resolver only accepts an org
  // that has a valid role assignment; profile.organization_id is merely a
  // preference and never creates access by itself.
  const cookieStore = await cookies();
  const requestedOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null;
  const requestedRole = cookieStore.get(ACTIVE_ROLE_COOKIE)?.value ?? null;
  const preliminaryAccess = resolveScopedAccess({
    assignments: effectiveAssignments,
    requestedOrganizationId: requestedOrgId,
    profileOrganizationId: profile.organizationId,
    requestedRole,
    hasProfile,
    profileIsActive: profile.isActive,
    // Organization status is applied after the selected organization is
    // loaded. These preliminary values only resolve its id.
    hasOrganization: false,
    organizationIsActive: false,
  });
  const activeOrgId = preliminaryAccess.activeOrganizationId;

  // 4. Fetch Organization Details
  let activeOrganization: Organization | null = null;
  if (activeOrgId) {
    const orgResponse = await supabase
      .from("organizations")
      .select("*")
      .eq("id", activeOrgId)
      .maybeSingle();

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

  const orgMap = new Map<string, PortalRole[]>();
  for (const assignment of effectiveAssignments) {
    if (!assignment.organizationId) continue;
    const role = assignment.roleCode as PortalRole | null;
    if (!role) continue;
    const existing = orgMap.get(assignment.organizationId) ?? [];
    // Only assignments accepted by the same resolver may become memberships.
    const resolved = resolveScopedAccess({
      assignments: [assignment],
      requestedOrganizationId: assignment.organizationId,
      profileOrganizationId: null,
      requestedRole: null,
      hasProfile,
      profileIsActive: profile.isActive,
      hasOrganization: true,
      organizationIsActive: true,
    });
    if (!resolved.availableRoles.includes(role)) continue;
    if (!existing.includes(role)) existing.push(role);
    orgMap.set(assignment.organizationId, existing);
  }

  // Build memberships from valid, unexpired role assignments only. The
  // selected organization is the only one whose database details are loaded
  // here; other names remain intentionally non-authoritative placeholders.
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

  // 5. Resolve role and permissions again with the actual organization state.
  // This is the only permission-bearing resolution used in the context.
  const scopedAccess = resolveScopedAccess({
    assignments: effectiveAssignments,
    requestedOrganizationId: requestedOrgId,
    profileOrganizationId: profile.organizationId,
    requestedRole,
    hasProfile,
    profileIsActive: profile.isActive,
    hasOrganization: activeOrganization !== null,
    organizationIsActive: activeOrganization?.isActive === true,
  });

  const availableRoles = scopedAccess.availableRoles;
  const activeRole = scopedAccess.activeRole;
  const permissions = scopedAccess.permissions;

  // 6. Fetch Linked Employee record only inside the selected organization.
  let linkedEmployee: EmployeeProfileLink | null = null;
  if (activeOrganization) {
    const empResponse = await supabase
      .from("employees")
      .select("*")
      .eq("profile_id", user.id)
      .eq("organization_id", activeOrganization.id)
      .maybeSingle();

    const empData = empResponse.data as DbEmployee | null;
    if (empData && empData.organization_id === activeOrganization.id) {
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

async function requireActiveSessionContextFor(
  loginDestination?: string,
): Promise<ActiveOrganizationContext> {
  const context = await getCurrentUserContext();

  if (!context) {
    if (loginDestination) {
      redirect(`/login?redirectTo=${loginDestination}`);
    }
    redirect("/login");
  }

  if (!context.isAccountActive) {
    redirect("/unauthorized?reason=inactive_account");
  }

  // Check this before the missing-role branch so a disabled organization gets
  // its specific denial rather than being reported as pending assignment.
  if (context.activeOrganization && !context.activeOrganization.isActive) {
    redirect("/unauthorized?reason=inactive_organization");
  }

  if (!isScopedContextReady(context)) {
    redirect("/access-pending");
  }

  return context as ActiveOrganizationContext;
}

/**
 * Common gate for portal pages and portal actions that need a valid active
 * organization and scoped role. It keeps pending accounts out of the login
 * redirect loop and preserves the context's non-null organization type for
 * callers after the gate returns.
 */
export async function requireActiveSessionContext(): Promise<ActiveOrganizationContext> {
  return requireActiveSessionContextFor();
}

/**
 * Server-side gatekeeper function for portal pages and shared portal actions.
 * Role checks are evaluated against the active role in the selected
 * organization only; an available role in another organization is never an
 * authorization substitute.
 */
export async function verifyPortalAccess(
  requiredRole: PortalRole,
  options: PortalAccessOptions = {},
): Promise<ActiveOrganizationContext> {
  const context = await requireActiveSessionContextFor(PORTAL_ROUTES[requiredRole]);

  if (!isPortalAccessAllowed(context, requiredRole, options)) {
    const reason =
      options.permission !== undefined && !context.permissions.includes(options.permission)
        ? "insufficient_permission"
        : "insufficient_role";
    redirect(`/unauthorized?reason=${reason}&target=${requiredRole}`);
  }

  return context;
}

export { getCurrentUserContext as getActiveSessionContext };
