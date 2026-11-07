import { getRolePermissions, PORTAL_ROLES } from "@ems/config";
import type {
  AuthenticatedUserContext,
  Organization,
  PermissionCode,
  PortalRole,
} from "@ems/types";

/**
 * The small, server-loaded portion of a user_roles row needed to resolve a
 * scoped session.  Keeping this shape independent from Supabase makes the
 * security policy straightforward to exercise without a database client.
 */
export interface RoleAssignmentAccessInput {
  organizationId: string;
  roleCode: string | null;
  isActive: boolean;
  roleIsActive: boolean;
  expiresAt: string | null;
}

export interface ScopedAccessResolutionInput {
  assignments: readonly RoleAssignmentAccessInput[];
  requestedOrganizationId: string | null;
  profileOrganizationId: string | null;
  requestedRole: string | null;
  hasProfile: boolean;
  profileIsActive: boolean;
  hasOrganization: boolean;
  organizationIsActive: boolean;
  now?: Date;
}

export interface ScopedAccessResolution {
  activeOrganizationId: string | null;
  availableRoles: PortalRole[];
  activeRole: PortalRole;
  permissions: PermissionCode[];
}

export interface PortalAccessOptions {
  allowRoles?: readonly PortalRole[];
  permission?: PermissionCode;
}

/**
 * An assignment is usable only while both the assignment and the referenced
 * role are active, and while its optional expiry is still in the future.
 */
export function isValidRoleAssignment(
  assignment: RoleAssignmentAccessInput,
  now: Date = new Date(),
): assignment is RoleAssignmentAccessInput & { roleCode: PortalRole } {
  if (
    !assignment.organizationId ||
    assignment.isActive !== true ||
    assignment.roleIsActive !== true ||
    typeof assignment.roleCode !== "string" ||
    !PORTAL_ROLES.includes(assignment.roleCode as PortalRole)
  ) {
    return false;
  }

  if (assignment.expiresAt === null) {
    return true;
  }

  const expiresAt = Date.parse(assignment.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt > now.getTime();
}

/**
 * Resolve the organization and role from only the assignments that are
 * currently valid.  The requested role is deliberately evaluated after the
 * organization has been selected, so a role cookie from another organization
 * can never be carried into this scope.
 */
export function resolveScopedAccess(input: ScopedAccessResolutionInput): ScopedAccessResolution {
  const now = input.now ?? new Date();
  const validAssignments = input.hasProfile
    ? input.assignments.filter((assignment) => isValidRoleAssignment(assignment, now))
    : [];

  const organizationIds = Array.from(
    new Set(validAssignments.map((assignment) => assignment.organizationId)),
  );

  const activeOrganizationId =
    (input.requestedOrganizationId && organizationIds.includes(input.requestedOrganizationId)
      ? input.requestedOrganizationId
      : null) ??
    (input.profileOrganizationId && organizationIds.includes(input.profileOrganizationId)
      ? input.profileOrganizationId
      : null) ??
    (organizationIds[0] ?? null);

  const availableRoles: PortalRole[] = [];
  if (activeOrganizationId) {
    for (const assignment of validAssignments) {
      if (assignment.organizationId !== activeOrganizationId) continue;
      const role = assignment.roleCode;
      if (!availableRoles.includes(role)) {
        availableRoles.push(role);
      }
    }
  }

  const resolvedRole =
    input.requestedRole && availableRoles.includes(input.requestedRole as PortalRole)
      ? (input.requestedRole as PortalRole)
      : (availableRoles[0] ?? "employee");

  // A type-compatible fallback role must never grant anything.  This also
  // strips permissions from inactive profiles and organizations while keeping
  // the context shape stable for status/unauthorized pages.
  const canGrantPermissions =
    input.hasProfile &&
    input.profileIsActive &&
    input.hasOrganization &&
    input.organizationIsActive &&
    availableRoles.length > 0;
  const activeRole = canGrantPermissions ? resolvedRole : "employee";
  const permissions = canGrantPermissions ? [...getRolePermissions(resolvedRole)] : [];

  return {
    activeOrganizationId,
    availableRoles,
    activeRole,
    permissions,
  };
}

/**
 * Check that a context is backed by an active organization membership and an
 * active scoped role.  The permission check prevents the compatibility
 * fallback role from being treated as an authorization decision.
 */
export function isScopedContextReady(
  context: Pick<
    AuthenticatedUserContext,
    "profile" | "activeOrganization" | "memberships" | "activeRole" | "availableRoles" | "permissions"
  >,
): boolean {
  const activeOrganization = context.activeOrganization;
  if (!activeOrganization?.isActive || !context.profile.isActive) {
    return false;
  }

  const membership = context.memberships.find(
    (candidate) => candidate.organizationId === activeOrganization.id,
  );

  return Boolean(
    membership &&
      membership.roles.includes(context.activeRole) &&
      context.availableRoles.includes(context.activeRole) &&
      context.permissions.length > 0,
  );
}

/**
 * Shared portal authorization policy.  It never treats another available
 * role as the active portal: only the scoped active role, explicitly allowed
 * roles, or an active scoped super_admin can satisfy the role check.
 */
export function isPortalAccessAllowed(
  context: Pick<
    AuthenticatedUserContext,
    "profile" | "activeOrganization" | "memberships" | "activeRole" | "availableRoles" | "permissions"
  >,
  requiredRole: PortalRole,
  options: PortalAccessOptions = {},
): boolean {
  if (!isScopedContextReady(context)) {
    return false;
  }

  // Super Admin has global authority across all portals and features
  if (context.activeRole === "super_admin") {
    return true;
  }

  // Organization Admin has administrative authority over all organization portals and modules
  if (context.activeRole === "org_admin" && requiredRole !== "super_admin") {
    return true;
  }

  // If the user holds the required role in their assigned roles
  if (context.availableRoles.includes(requiredRole)) {
    return true;
  }

  // If a granular permission is required for the feature/page:
  // Any user holding that permission according to the Role-Permission Matrix is eligible!
  if (options.permission !== undefined) {
    if (context.permissions.includes(options.permission)) {
      return true;
    }
    if (
      context.activeRole === requiredRole ||
      Boolean(options.allowRoles?.includes(context.activeRole))
    ) {
      return true;
    }
    return false;
  }

  // If no granular permission is required (e.g. portal root overview pages), check role match
  return (
    context.activeRole === requiredRole ||
    Boolean(options.allowRoles?.includes(context.activeRole))
  );
}

export type ActiveOrganizationContext = AuthenticatedUserContext & {
  activeOrganization: Organization;
};
