-- Migration: 20261009000001_initial_schema
-- Description: Initial EMS schema — organizations, branches, departments,
--              designations, profiles, employees, history, roles, permissions,
--              role_permissions, user_roles, settings
-- Project: GIETP-AI-IT-EMS-T1-2026
-- Phase: 2

-- =============================================================================
-- SECTION 0: Utility trigger function — auto-update updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- SECTION 1: organizations
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT          NOT NULL,
  slug            TEXT          NOT NULL UNIQUE,
  code            TEXT          NOT NULL UNIQUE,
  address         TEXT,
  phone           TEXT,
  email           TEXT,
  logo_url        TEXT,
  website         TEXT,
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  settings        JSONB         NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_organizations_slug      ON public.organizations (slug);
CREATE INDEX IF NOT EXISTS idx_organizations_code      ON public.organizations (code);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON public.organizations (is_active);

CREATE OR REPLACE TRIGGER trg_organizations_set_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 2: branches
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.branches (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  name            TEXT          NOT NULL,
  code            TEXT          NOT NULL,
  address         TEXT,
  phone           TEXT,
  email           TEXT,
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_branches_org_code UNIQUE (organization_id, code),
  CONSTRAINT uq_branches_org_name UNIQUE (organization_id, name)
);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_branches_organization_id ON public.branches (organization_id);
CREATE INDEX IF NOT EXISTS idx_branches_is_active        ON public.branches (is_active);

CREATE OR REPLACE TRIGGER trg_branches_set_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 3: departments
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.departments (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  branch_id             UUID          REFERENCES public.branches (id) ON DELETE SET NULL,
  parent_department_id  UUID          REFERENCES public.departments (id) ON DELETE SET NULL,
  name                  TEXT          NOT NULL,
  code                  TEXT          NOT NULL,
  description           TEXT,
  is_active             BOOLEAN       NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- Organization-scoped uniqueness
  CONSTRAINT uq_departments_org_code      UNIQUE (organization_id, code),
  -- branch_id is nullable; PostgreSQL UNIQUE treats NULLs as distinct by default,
  -- so (org, NULL, "Engineering") and (org, NULL, "Engineering") would still conflict
  -- on this composite key, which is the desired behavior.
  CONSTRAINT uq_departments_org_branch_name UNIQUE (organization_id, branch_id, name)

  -- NOTE: Cross-org boundary check (branch belongs to same organization) is
  -- enforced by the trigger public.enforce_department_branch_org_boundary()
  -- defined in SECTION 13 of this migration.
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_departments_organization_id      ON public.departments (organization_id);
CREATE INDEX IF NOT EXISTS idx_departments_branch_id            ON public.departments (branch_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent_department_id ON public.departments (parent_department_id);

CREATE OR REPLACE TRIGGER trg_departments_set_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 4: designations
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.designations (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  department_id   UUID          REFERENCES public.departments (id) ON DELETE SET NULL,
  name            TEXT          NOT NULL,
  code            TEXT          NOT NULL,
  grade           TEXT,
  level           INTEGER       CHECK (level >= 1 AND level <= 20),
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_designations_org_code UNIQUE (organization_id, code)
);

ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_designations_organization_id ON public.designations (organization_id);
CREATE INDEX IF NOT EXISTS idx_designations_department_id   ON public.designations (department_id);

CREATE OR REPLACE TRIGGER trg_designations_set_updated_at
  BEFORE UPDATE ON public.designations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 5: profiles
-- Maps Supabase Auth users (auth.users) to application-level profile data.
-- The primary key is the same UUID as auth.users.id.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID          PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  organization_id UUID          REFERENCES public.organizations (id) ON DELETE SET NULL,
  full_name       TEXT,
  avatar_url      TEXT,
  phone           TEXT,
  date_of_birth   DATE,
  gender          TEXT          CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  locale          TEXT          NOT NULL DEFAULT 'en',
  timezone        TEXT          NOT NULL DEFAULT 'UTC',
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  last_seen_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles (organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active        ON public.profiles (is_active);

CREATE OR REPLACE TRIGGER trg_profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 6: employees
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.employees (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  profile_id            UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  branch_id             UUID          REFERENCES public.branches (id) ON DELETE SET NULL,
  department_id         UUID          REFERENCES public.departments (id) ON DELETE SET NULL,
  designation_id        UUID          REFERENCES public.designations (id) ON DELETE SET NULL,
  reporting_manager_id  UUID          REFERENCES public.employees (id) ON DELETE SET NULL,
  employee_code         TEXT          NOT NULL,
  employment_type       TEXT          NOT NULL
                        CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern', 'probation')),
  employment_status     TEXT          NOT NULL DEFAULT 'active'
                        CHECK (employment_status IN ('active', 'inactive', 'terminated', 'resigned', 'on_leave', 'suspended')),
  date_of_joining       DATE          NOT NULL,
  date_of_confirmation  DATE,
  date_of_resignation   DATE,
  date_of_termination   DATE,
  notice_period_days    INTEGER       DEFAULT 30,
  work_email            TEXT,
  work_phone            TEXT,
  is_active             BOOLEAN       NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- The same employee_code may exist in a different organization
  CONSTRAINT uq_employees_org_employee_code UNIQUE (organization_id, employee_code)

  -- NOTE: Cross-org boundary checks (branch_id, department_id, designation_id
  -- must belong to the same organization_id) are enforced by the trigger
  -- public.enforce_employee_org_boundary() defined in SECTION 13.
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_employees_organization_id   ON public.employees (organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_profile_id        ON public.employees (profile_id);
CREATE INDEX IF NOT EXISTS idx_employees_department_id     ON public.employees (department_id);
CREATE INDEX IF NOT EXISTS idx_employees_designation_id    ON public.employees (designation_id);
CREATE INDEX IF NOT EXISTS idx_employees_employee_code     ON public.employees (employee_code);
CREATE INDEX IF NOT EXISTS idx_employees_employment_status ON public.employees (employment_status);
CREATE INDEX IF NOT EXISTS idx_employees_is_active         ON public.employees (is_active);

CREATE OR REPLACE TRIGGER trg_employees_set_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 7: employee_history
-- Immutable audit log — no updated_at column.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.employee_history (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  employee_id     UUID          NOT NULL REFERENCES public.employees (id) ON DELETE RESTRICT,
  changed_by      UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  field_name      TEXT          NOT NULL,
  old_value       TEXT,
  new_value       TEXT,
  change_reason   TEXT,
  effective_date  DATE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.employee_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_employee_history_employee_id     ON public.employee_history (employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_history_organization_id ON public.employee_history (organization_id);
CREATE INDEX IF NOT EXISTS idx_employee_history_created_at      ON public.employee_history (created_at);

-- =============================================================================
-- SECTION 8: roles
-- organization_id IS NULL indicates a built-in system role shared across all orgs.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.roles (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID          REFERENCES public.organizations (id) ON DELETE CASCADE,
  name            TEXT          NOT NULL,
  code            TEXT          NOT NULL,
  description     TEXT,
  is_system       BOOLEAN       NOT NULL DEFAULT false,
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- NULLS NOT DISTINCT ensures (NULL, 'admin') and (NULL, 'admin') are treated as
  -- duplicates for system roles, while org-scoped codes remain unique per org.
  CONSTRAINT uq_roles_org_code UNIQUE NULLS NOT DISTINCT (organization_id, code)
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_roles_organization_id ON public.roles (organization_id);
CREATE INDEX IF NOT EXISTS idx_roles_is_system        ON public.roles (is_system);

CREATE OR REPLACE TRIGGER trg_roles_set_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 9: permissions
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.permissions (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT          NOT NULL UNIQUE,   -- e.g. 'employees:read'
  name        TEXT          NOT NULL,
  description TEXT,
  module      TEXT          NOT NULL,          -- e.g. 'employees', 'payroll'
  action      TEXT          NOT NULL,          -- e.g. 'read', 'write', 'delete', 'approve'
  is_active   BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_permissions_module_action UNIQUE (module, action)
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE TRIGGER trg_permissions_set_updated_at
  BEFORE UPDATE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 10: role_permissions
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id       UUID          NOT NULL REFERENCES public.roles (id) ON DELETE CASCADE,
  permission_id UUID          NOT NULL REFERENCES public.permissions (id) ON DELETE CASCADE,
  granted_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  granted_by    UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,

  CONSTRAINT uq_role_permissions_role_permission UNIQUE (role_id, permission_id)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id       ON public.role_permissions (role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions (permission_id);

-- =============================================================================
-- SECTION 11: user_roles
-- Links a profile to a role within an organization scope.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  profile_id      UUID          NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role_id         UUID          NOT NULL REFERENCES public.roles (id) ON DELETE CASCADE,
  assigned_by     UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  assigned_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN       NOT NULL DEFAULT true,

  CONSTRAINT uq_user_roles_org_profile_role UNIQUE (organization_id, profile_id, role_id)

  -- NOTE: Cross-org scope check (role must be a system role OR belong to the
  -- same organization as user_roles.organization_id) is enforced by the trigger
  -- public.enforce_user_role_org_scope() defined in SECTION 13.
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_roles_profile_id      ON public.user_roles (profile_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_organization_id ON public.user_roles (organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id         ON public.user_roles (role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active       ON public.user_roles (is_active);

-- =============================================================================
-- SECTION 12: settings
-- Key-value store; organization_id IS NULL means a global/platform-level setting.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.settings (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID          REFERENCES public.organizations (id) ON DELETE CASCADE,
  key             TEXT          NOT NULL,
  value           JSONB         NOT NULL DEFAULT 'null',
  description     TEXT,
  is_public       BOOLEAN       NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- NULLS NOT DISTINCT so that (NULL, 'theme') is unique among global settings
  CONSTRAINT uq_settings_org_key UNIQUE NULLS NOT DISTINCT (organization_id, key)
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_settings_organization_id ON public.settings (organization_id);
CREATE INDEX IF NOT EXISTS idx_settings_key             ON public.settings (key);

CREATE OR REPLACE TRIGGER trg_settings_set_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 13: Cross-organization boundary enforcement triggers
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 13a. departments — branch_id must belong to the same organization
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_department_branch_org_boundary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.branch_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM   public.branches b
      WHERE  b.id              = NEW.branch_id
        AND  b.organization_id = NEW.organization_id
    ) THEN
      RAISE EXCEPTION
        'departments: branch_id % does not belong to organization_id %',
        NEW.branch_id, NEW.organization_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_departments_enforce_org_boundary
  BEFORE INSERT OR UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_department_branch_org_boundary();

-- ---------------------------------------------------------------------------
-- 13b. employees — branch_id, department_id, designation_id must belong
--      to the same organization as the employee record
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_employee_org_boundary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  -- Validate branch_id
  IF NEW.branch_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM   public.branches b
      WHERE  b.id              = NEW.branch_id
        AND  b.organization_id = NEW.organization_id
    ) THEN
      RAISE EXCEPTION
        'employees: branch_id % does not belong to organization_id %',
        NEW.branch_id, NEW.organization_id;
    END IF;
  END IF;

  -- Validate department_id
  IF NEW.department_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM   public.departments d
      WHERE  d.id              = NEW.department_id
        AND  d.organization_id = NEW.organization_id
    ) THEN
      RAISE EXCEPTION
        'employees: department_id % does not belong to organization_id %',
        NEW.department_id, NEW.organization_id;
    END IF;
  END IF;

  -- Validate designation_id
  IF NEW.designation_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM   public.designations des
      WHERE  des.id              = NEW.designation_id
        AND  des.organization_id = NEW.organization_id
    ) THEN
      RAISE EXCEPTION
        'employees: designation_id % does not belong to organization_id %',
        NEW.designation_id, NEW.organization_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_employees_enforce_org_boundary
  BEFORE INSERT OR UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.enforce_employee_org_boundary();

-- ---------------------------------------------------------------------------
-- 13c. user_roles — role must be a system role (organization_id IS NULL)
--      OR must belong to the same organization as the user_roles row
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_user_role_org_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   public.roles r
    WHERE  r.id = NEW.role_id
      AND (
        r.organization_id IS NULL                      -- system role — always allowed
        OR r.organization_id = NEW.organization_id     -- org-scoped role must match
      )
  ) THEN
    RAISE EXCEPTION
      'user_roles: role_id % does not belong to organization_id % and is not a system role',
      NEW.role_id, NEW.organization_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_user_roles_enforce_org_scope
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_user_role_org_scope();

-- =============================================================================
-- END OF MIGRATION: 20261009000001_initial_schema
-- =============================================================================
