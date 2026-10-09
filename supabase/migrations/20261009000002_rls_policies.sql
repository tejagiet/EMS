-- Migration: 20261009000002_rls_policies
-- Description: Row Level Security policies and security-definer helper functions
-- Project: GIETP-AI-IT-EMS-T1-2026
-- Phase: 2
-- IMPORTANT: All helper functions use SECURITY DEFINER with SET search_path = ''
--            to prevent search_path injection attacks.

-- =============================================================================
-- SECTION 1: HELPER FUNCTIONS (SECURITY DEFINER)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1.1  public.get_my_profile_id()
--      Returns the UUID of the currently authenticated user's profile row.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id FROM public.profiles WHERE id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- 1.2  public.get_my_organization_id()
--      Returns the organization_id from the current user's profile.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- 1.3  public.has_permission(p_permission_code text)
--      Returns TRUE if the authenticated user holds the given permission code
--      via any active, non-expired role assignment in their current organization.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_permission(p_permission_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions perm   ON perm.id = rp.permission_id
    WHERE ur.profile_id      = auth.uid()
      AND ur.organization_id = (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
          )
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      AND perm.code      = p_permission_code
      AND perm.is_active = true
  );
$$;

-- -----------------------------------------------------------------------------
-- 1.4  public.is_org_member(p_organization_id uuid)
--      Returns TRUE if the authenticated user is an active member of the
--      specified organization.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_org_member(p_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id              = auth.uid()
      AND organization_id = p_organization_id
      AND is_active       = true
  );
$$;


-- =============================================================================
-- SECTION 2: RLS POLICIES
-- =============================================================================
-- Naming convention: {table}_{action}_{who}
-- All INSERT/UPDATE policies also carry a WITH CHECK clause where required.
-- Tables not granted an explicit policy for an operation are DENIED by default
-- because RLS is already enabled on every table (done in migration 001).
-- =============================================================================


-- =============================================================================
-- 2.1  organizations
-- =============================================================================
-- INSERT / UPDATE / DELETE: intentionally omitted — denied by default.
-- Organization creation and modification are privileged operations performed
-- exclusively via the service role (e.g., admin edge functions).

DROP POLICY IF EXISTS organizations_select_member ON public.organizations;
CREATE POLICY organizations_select_member
  ON public.organizations
  FOR SELECT
  USING (public.is_org_member(id));


-- =============================================================================
-- 2.2  branches
-- =============================================================================

DROP POLICY IF EXISTS branches_select_member    ON public.branches;
DROP POLICY IF EXISTS branches_insert_writer    ON public.branches;
DROP POLICY IF EXISTS branches_update_writer    ON public.branches;
DROP POLICY IF EXISTS branches_delete_deleter   ON public.branches;

CREATE POLICY branches_select_member
  ON public.branches
  FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY branches_insert_writer
  ON public.branches
  FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id)
    AND public.has_permission('branches:write')
  );

CREATE POLICY branches_update_writer
  ON public.branches
  FOR UPDATE
  USING (
    public.is_org_member(organization_id)
    AND public.has_permission('branches:write')
  )
  WITH CHECK (
    public.is_org_member(organization_id)
    AND public.has_permission('branches:write')
  );

CREATE POLICY branches_delete_deleter
  ON public.branches
  FOR DELETE
  USING (
    public.is_org_member(organization_id)
    AND public.has_permission('branches:delete')
  );


-- =============================================================================
-- 2.3  departments
-- =============================================================================

DROP POLICY IF EXISTS departments_select_member   ON public.departments;
DROP POLICY IF EXISTS departments_insert_writer   ON public.departments;
DROP POLICY IF EXISTS departments_update_writer   ON public.departments;
DROP POLICY IF EXISTS departments_delete_deleter  ON public.departments;

CREATE POLICY departments_select_member
  ON public.departments
  FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY departments_insert_writer
  ON public.departments
  FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id)
    AND public.has_permission('departments:write')
  );

CREATE POLICY departments_update_writer
  ON public.departments
  FOR UPDATE
  USING (
    public.is_org_member(organization_id)
    AND public.has_permission('departments:write')
  )
  WITH CHECK (
    public.is_org_member(organization_id)
    AND public.has_permission('departments:write')
  );

CREATE POLICY departments_delete_deleter
  ON public.departments
  FOR DELETE
  USING (
    public.is_org_member(organization_id)
    AND public.has_permission('departments:delete')
  );


-- =============================================================================
-- 2.4  designations
-- =============================================================================

DROP POLICY IF EXISTS designations_select_member   ON public.designations;
DROP POLICY IF EXISTS designations_insert_writer   ON public.designations;
DROP POLICY IF EXISTS designations_update_writer   ON public.designations;
DROP POLICY IF EXISTS designations_delete_deleter  ON public.designations;

CREATE POLICY designations_select_member
  ON public.designations
  FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY designations_insert_writer
  ON public.designations
  FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id)
    AND public.has_permission('designations:write')
  );

CREATE POLICY designations_update_writer
  ON public.designations
  FOR UPDATE
  USING (
    public.is_org_member(organization_id)
    AND public.has_permission('designations:write')
  )
  WITH CHECK (
    public.is_org_member(organization_id)
    AND public.has_permission('designations:write')
  );

CREATE POLICY designations_delete_deleter
  ON public.designations
  FOR DELETE
  USING (
    public.is_org_member(organization_id)
    AND public.has_permission('designations:delete')
  );


-- =============================================================================
-- 2.5  profiles
-- =============================================================================
-- INSERT: intentionally omitted — denied by default.
--   Profiles are created by the auth trigger defined in migration 003.
--
-- UPDATE (self): Users may update their own profile row.
--   NOTE: Changing organization_id via self-update is BLOCKED by a trigger
--   defined in migration 003 (prevent_profile_org_reassignment).
--
-- UPDATE (admin): Admins with 'profiles:write' may update any profile in
--   their organization.

DROP POLICY IF EXISTS profiles_select_self_or_org   ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self           ON public.profiles;
DROP POLICY IF EXISTS profiles_update_admin          ON public.profiles;

-- Combined SELECT: own profile OR same-org profile
CREATE POLICY profiles_select_self_or_org
  ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR public.is_org_member(organization_id)
  );

-- UPDATE own profile (self-service)
CREATE POLICY profiles_update_self
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
  -- Enforcement note: the trigger `prevent_profile_org_reassignment` in
  -- migration 003 raises an exception if organization_id is changed here.

-- UPDATE any profile in org (privileged)
CREATE POLICY profiles_update_admin
  ON public.profiles
  FOR UPDATE
  USING  (public.has_permission('profiles:write'))
  WITH CHECK (public.has_permission('profiles:write'));


-- =============================================================================
-- 2.6  employees
-- =============================================================================
-- Two SELECT policies: org-wide access for HR/managers + own record for
-- the employee themselves.

DROP POLICY IF EXISTS employees_select_member   ON public.employees;
DROP POLICY IF EXISTS employees_select_self     ON public.employees;
DROP POLICY IF EXISTS employees_insert_writer   ON public.employees;
DROP POLICY IF EXISTS employees_update_writer   ON public.employees;
DROP POLICY IF EXISTS employees_delete_deleter  ON public.employees;

CREATE POLICY employees_select_member
  ON public.employees
  FOR SELECT
  USING (public.is_org_member(organization_id));

-- Employees can always view their own record (even without extra permissions)
CREATE POLICY employees_select_self
  ON public.employees
  FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY employees_insert_writer
  ON public.employees
  FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id)
    AND public.has_permission('employees:write')
  );

CREATE POLICY employees_update_writer
  ON public.employees
  FOR UPDATE
  USING (
    public.is_org_member(organization_id)
    AND public.has_permission('employees:write')
  )
  WITH CHECK (
    public.is_org_member(organization_id)
    AND public.has_permission('employees:write')
  );

CREATE POLICY employees_delete_deleter
  ON public.employees
  FOR DELETE
  USING (
    public.is_org_member(organization_id)
    AND public.has_permission('employees:delete')
  );


-- =============================================================================
-- 2.7  employee_history
-- =============================================================================
-- UPDATE / DELETE: intentionally omitted — history rows are immutable.
-- Modifications to historical records must go through the service role only.

DROP POLICY IF EXISTS employee_history_select_member  ON public.employee_history;
DROP POLICY IF EXISTS employee_history_insert_writer  ON public.employee_history;

CREATE POLICY employee_history_select_member
  ON public.employee_history
  FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY employee_history_insert_writer
  ON public.employee_history
  FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id)
    AND public.has_permission('employees:write')
  );


-- =============================================================================
-- 2.8  roles
-- =============================================================================
-- System roles (organization_id IS NULL) are visible to all org members.

DROP POLICY IF EXISTS roles_select_member   ON public.roles;
DROP POLICY IF EXISTS roles_insert_writer   ON public.roles;
DROP POLICY IF EXISTS roles_update_writer   ON public.roles;
DROP POLICY IF EXISTS roles_delete_deleter  ON public.roles;

CREATE POLICY roles_select_member
  ON public.roles
  FOR SELECT
  USING (
    organization_id IS NULL
    OR public.is_org_member(organization_id)
  );

CREATE POLICY roles_insert_writer
  ON public.roles
  FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id)
    AND public.has_permission('roles:write')
  );

CREATE POLICY roles_update_writer
  ON public.roles
  FOR UPDATE
  USING (
    public.is_org_member(organization_id)
    AND public.has_permission('roles:write')
  )
  WITH CHECK (
    public.is_org_member(organization_id)
    AND public.has_permission('roles:write')
  );

-- Deletion is only allowed for non-system roles
CREATE POLICY roles_delete_deleter
  ON public.roles
  FOR DELETE
  USING (
    NOT is_system
    AND public.is_org_member(organization_id)
    AND public.has_permission('roles:delete')
  );


-- =============================================================================
-- 2.9  permissions
-- =============================================================================
-- INSERT / UPDATE / DELETE: intentionally omitted — service role only.
-- Permission codes are a privileged, system-managed catalogue.

DROP POLICY IF EXISTS permissions_select_authenticated ON public.permissions;

CREATE POLICY permissions_select_authenticated
  ON public.permissions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);


-- =============================================================================
-- 2.10  role_permissions
-- =============================================================================
-- UPDATE: intentionally omitted — modify via DELETE + INSERT instead.

DROP POLICY IF EXISTS role_permissions_select_authenticated ON public.role_permissions;
DROP POLICY IF EXISTS role_permissions_insert_writer        ON public.role_permissions;
DROP POLICY IF EXISTS role_permissions_delete_writer        ON public.role_permissions;

CREATE POLICY role_permissions_select_authenticated
  ON public.role_permissions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY role_permissions_insert_writer
  ON public.role_permissions
  FOR INSERT
  WITH CHECK (public.has_permission('roles:write'));

CREATE POLICY role_permissions_delete_writer
  ON public.role_permissions
  FOR DELETE
  USING (public.has_permission('roles:write'));


-- =============================================================================
-- 2.11  user_roles
-- =============================================================================
-- UPDATE: intentionally omitted — changes to is_active or expiry are done by
--   deleting and re-inserting the row, or by an admin using the service role.
--
-- INSERT note: Self-assignment of privileged roles is BLOCKED by the trigger
--   `prevent_self_privilege_escalation` defined in migration 003.

DROP POLICY IF EXISTS user_roles_select_member   ON public.user_roles;
DROP POLICY IF EXISTS user_roles_insert_assigner ON public.user_roles;
DROP POLICY IF EXISTS user_roles_delete_assigner ON public.user_roles;

CREATE POLICY user_roles_select_member
  ON public.user_roles
  FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY user_roles_insert_assigner
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id)
    AND public.has_permission('roles:assign')
  );
  -- Enforcement note: the trigger `prevent_self_privilege_escalation` in
  -- migration 003 raises an exception if a user attempts to grant themselves
  -- a privileged role.

CREATE POLICY user_roles_delete_assigner
  ON public.user_roles
  FOR DELETE
  USING (
    public.is_org_member(organization_id)
    AND public.has_permission('roles:assign')
  );


-- =============================================================================
-- 2.12  settings
-- =============================================================================
-- Combined SELECT: public settings (is_public = true), or org-scoped /
--   global settings if the user belongs to that org (or setting is global).

DROP POLICY IF EXISTS settings_select_member   ON public.settings;
DROP POLICY IF EXISTS settings_insert_writer   ON public.settings;
DROP POLICY IF EXISTS settings_update_writer   ON public.settings;
DROP POLICY IF EXISTS settings_delete_deleter  ON public.settings;

CREATE POLICY settings_select_member
  ON public.settings
  FOR SELECT
  USING (
    is_public = true
    OR organization_id IS NULL
    OR public.is_org_member(organization_id)
  );

CREATE POLICY settings_insert_writer
  ON public.settings
  FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id)
    AND public.has_permission('settings:write')
  );

CREATE POLICY settings_update_writer
  ON public.settings
  FOR UPDATE
  USING (
    public.is_org_member(organization_id)
    AND public.has_permission('settings:write')
  )
  WITH CHECK (
    public.is_org_member(organization_id)
    AND public.has_permission('settings:write')
  );

CREATE POLICY settings_delete_deleter
  ON public.settings
  FOR DELETE
  USING (
    public.is_org_member(organization_id)
    AND public.has_permission('settings:delete')
  );
