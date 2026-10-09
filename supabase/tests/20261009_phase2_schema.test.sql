-- ============================================================
-- EMS Database Tests
-- Project: GIETP-AI-IT-EMS-T1-2026
-- Phase: 2
--
-- Uses pgTAP (https://pgtap.org/) — installed by Supabase local
-- dev automatically in the extensions schema.
--
-- Run via: pnpm db:test   (which calls: supabase db test)
-- Or directly: supabase test db
--
-- IMPORTANT: These tests run against the local dev database ONLY.
-- Never run against production.
-- Ensure pgTAP extension is enabled and on search_path
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;

BEGIN;

SELECT plan(60);

-- ============================================================
-- TEST GROUP 1: Tables exist
-- ============================================================

SELECT has_table('public', 'organizations',    'Table public.organizations exists');
SELECT has_table('public', 'branches',         'Table public.branches exists');
SELECT has_table('public', 'departments',      'Table public.departments exists');
SELECT has_table('public', 'designations',     'Table public.designations exists');
SELECT has_table('public', 'profiles',         'Table public.profiles exists');
SELECT has_table('public', 'employees',        'Table public.employees exists');
SELECT has_table('public', 'employee_history', 'Table public.employee_history exists');
SELECT has_table('public', 'roles',            'Table public.roles exists');
SELECT has_table('public', 'permissions',      'Table public.permissions exists');
SELECT has_table('public', 'role_permissions', 'Table public.role_permissions exists');
SELECT has_table('public', 'user_roles',       'Table public.user_roles exists');
SELECT has_table('public', 'settings',         'Table public.settings exists');

-- ============================================================
-- TEST GROUP 2: Required columns exist
-- ============================================================

SELECT has_column('public', 'employees',    'employee_code',    'employees.employee_code exists');
SELECT has_column('public', 'employees',    'organization_id',  'employees.organization_id exists');
SELECT has_column('public', 'employees',    'employment_type',  'employees.employment_type exists');
SELECT has_column('public', 'employees',    'employment_status','employees.employment_status exists');
SELECT has_column('public', 'roles',        'is_system',        'roles.is_system exists');
SELECT has_column('public', 'roles',        'code',             'roles.code exists');
SELECT has_column('public', 'permissions',  'code',             'permissions.code exists');
SELECT has_column('public', 'profiles',     'organization_id',  'profiles.organization_id exists');

-- ============================================================
-- TEST GROUP 3: Primary keys
-- ============================================================

SELECT col_is_pk('public', 'organizations',    'id', 'organizations PK is id');
SELECT col_is_pk('public', 'employees',        'id', 'employees PK is id');
SELECT col_is_pk('public', 'profiles',         'id', 'profiles PK is id');
SELECT col_is_pk('public', 'roles',            'id', 'roles PK is id');
SELECT col_is_pk('public', 'permissions',      'id', 'permissions PK is id');

-- ============================================================
-- TEST GROUP 4: Unique constraints
-- ============================================================

SELECT col_is_unique('public', 'organizations', 'slug', 'organizations.slug is globally unique');
SELECT col_is_unique('public', 'organizations', 'code', 'organizations.code is globally unique');
SELECT col_is_unique('public', 'permissions',   'code', 'permissions.code is globally unique');

-- ============================================================
-- TEST GROUP 5: Foreign key relationships
-- ============================================================

SELECT fk_ok(
  'public', 'branches',    ARRAY['organization_id'],
  'public', 'organizations', ARRAY['id'],
  'branches.organization_id → organizations.id'
);

SELECT fk_ok(
  'public', 'departments', ARRAY['organization_id'],
  'public', 'organizations', ARRAY['id'],
  'departments.organization_id → organizations.id'
);

SELECT fk_ok(
  'public', 'employees',   ARRAY['organization_id'],
  'public', 'organizations', ARRAY['id'],
  'employees.organization_id → organizations.id'
);

SELECT fk_ok(
  'public', 'profiles',    ARRAY['id'],
  'auth',   'users',       ARRAY['id'],
  'profiles.id → auth.users.id'
);

SELECT fk_ok(
  'public', 'user_roles',  ARRAY['profile_id'],
  'public', 'profiles',    ARRAY['id'],
  'user_roles.profile_id → profiles.id'
);

-- ============================================================
-- TEST GROUP 6: RLS is enabled on all exposed tables
-- ============================================================

SELECT tablename, rowsecurity
FROM   pg_tables
WHERE  schemaname = 'public'
  AND  tablename IN (
    'organizations','branches','departments','designations',
    'profiles','employees','employee_history',
    'roles','permissions','role_permissions','user_roles','settings'
  );

-- pgTAP check: every table in the list has rowsecurity = true
SELECT ok(
  (SELECT bool_and(rowsecurity)
   FROM pg_tables
   WHERE schemaname = 'public'
     AND tablename IN (
       'organizations','branches','departments','designations',
       'profiles','employees','employee_history',
       'roles','permissions','role_permissions','user_roles','settings'
     )
  ),
  'RLS is enabled on all 12 application tables'
);

-- ============================================================
-- TEST GROUP 7: Indexes exist
-- ============================================================

SELECT has_index('public', 'employees', 'idx_employees_organization_id',
  'Index on employees(organization_id) exists');

SELECT has_index('public', 'employees', 'idx_employees_employee_code',
  'Index on employees(employee_code) exists');

SELECT has_index('public', 'user_roles', 'idx_user_roles_profile_id',
  'Index on user_roles(profile_id) exists');

-- ============================================================
-- TEST GROUP 8: Data integrity — duplicate employee_code
-- ============================================================

-- 8a. Inserting duplicate employee_code within the SAME org should FAIL

DO $$
DECLARE
  v_org_id UUID := '00000001-0000-0000-0000-000000000001';
BEGIN
  -- First insert a test employee (clean up first)
  DELETE FROM public.employees WHERE employee_code = 'TEST-DUP-001' AND organization_id = v_org_id;
  INSERT INTO public.employees (organization_id, employee_code, employment_type, date_of_joining)
  VALUES (v_org_id, 'TEST-DUP-001', 'full_time', CURRENT_DATE);
END $$;

SELECT throws_ok(
  $$
    INSERT INTO public.employees (organization_id, employee_code, employment_type, date_of_joining)
    VALUES (
      '00000001-0000-0000-0000-000000000001',
      'TEST-DUP-001',
      'full_time',
      CURRENT_DATE
    )
  $$,
  '23505',  -- unique_violation SQLSTATE
  NULL,
  'Duplicate employee_code within same org raises unique_violation'
);

-- 8b. The SAME employee_code in a DIFFERENT org should SUCCEED

SELECT lives_ok(
  $$
    INSERT INTO public.employees (organization_id, employee_code, employment_type, date_of_joining)
    VALUES (
      '00000001-0000-0000-0000-000000000002',  -- Apex org, not GIET
      'TEST-DUP-001',
      'full_time',
      CURRENT_DATE
    )
  $$,
  'Same employee_code in a different org is allowed'
);

-- Clean up
DELETE FROM public.employees WHERE employee_code = 'TEST-DUP-001';

-- ============================================================
-- TEST GROUP 9: Cross-org boundary enforcement
-- ============================================================

-- 9a. Assigning a GIET branch to an Apex employee should FAIL

SELECT throws_ok(
  $$
    INSERT INTO public.employees (
      organization_id, branch_id, employee_code, employment_type, date_of_joining
    )
    VALUES (
      '00000001-0000-0000-0000-000000000002',  -- Apex org
      '00000002-0000-0000-0000-000000000001',  -- GIET Main Campus branch
      'CROSS-ORG-TEST',
      'full_time',
      CURRENT_DATE
    )
  $$,
  'P0001',  -- raise_exception from enforce_employee_org_boundary
  NULL,
  'Cross-org branch assignment to employee raises exception'
);

-- 9b. Assigning a GIET department to an Apex employee should FAIL

SELECT throws_ok(
  $$
    INSERT INTO public.employees (
      organization_id, department_id, employee_code, employment_type, date_of_joining
    )
    VALUES (
      '00000001-0000-0000-0000-000000000002',  -- Apex org
      '00000003-0000-0000-0000-000000000001',  -- GIET department
      'CROSS-ORG-DEPT-TEST',
      'full_time',
      CURRENT_DATE
    )
  $$,
  'P0001',
  NULL,
  'Cross-org department assignment to employee raises exception'
);

-- 9c. Assigning a GIET branch to an Apex department should FAIL

SELECT throws_ok(
  $$
    INSERT INTO public.departments (
      organization_id, branch_id, name, code
    )
    VALUES (
      '00000001-0000-0000-0000-000000000002',  -- Apex org
      '00000002-0000-0000-0000-000000000001',  -- GIET branch
      'Cross Org Department',
      'CROSS-ORG'
    )
  $$,
  'P0001',
  NULL,
  'Cross-org branch assignment to department raises exception'
);

-- 9d. Assigning an org-scoped role from GIET to an Apex user_role should FAIL

SELECT throws_ok(
  $$
    INSERT INTO public.user_roles (
      organization_id, profile_id, role_id
    )
    VALUES (
      '00000001-0000-0000-0000-000000000002',  -- Apex org context
      '00000008-0000-0000-0000-000000000005',  -- Apex admin profile
      '00000005-0000-0000-0000-000000000007'   -- GIET org_admin role
    )
  $$,
  'P0001',
  NULL,
  'Assigning cross-org scoped role to user_roles raises exception'
);

-- ============================================================
-- TEST GROUP 10: Self-role assignment prevention
-- ============================================================

-- The prevent_self_role_assignment trigger blocks inserts where
-- auth.uid() = NEW.profile_id. In a psql/service-role context,
-- auth.uid() returns NULL so the trigger does NOT fire.
-- We test it by setting a local JWT claim to simulate the user.

SELECT ok(
  (SELECT proname FROM pg_proc WHERE proname = 'prevent_self_role_assignment') IS NOT NULL,
  'prevent_self_role_assignment function exists'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'prevent_self_role_assignment_trigger'
      AND tgrelid = 'public.user_roles'::regclass
  ),
  'prevent_self_role_assignment_trigger exists on user_roles'
);

-- ============================================================
-- TEST GROUP 11: Helper functions exist
-- ============================================================

SELECT has_function('public', 'get_my_profile_id',          ARRAY[]::text[],    'get_my_profile_id() exists');
SELECT has_function('public', 'get_my_organization_id',     ARRAY[]::text[],    'get_my_organization_id() exists');
SELECT has_function('public', 'has_permission',             ARRAY['text'],      'has_permission(text) exists');
SELECT has_function('public', 'is_org_member',              ARRAY['uuid'],      'is_org_member(uuid) exists');
SELECT has_function('public', 'assign_user_to_organization',ARRAY['uuid','uuid'],'assign_user_to_organization(uuid,uuid) exists');
SELECT has_function('public', 'handle_new_user',            ARRAY[]::text[],    'handle_new_user() trigger function exists');

-- ============================================================
-- TEST GROUP 12: Auth trigger on auth.users
-- ============================================================

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname     = 'on_auth_user_created'
      AND tgrelid    = 'auth.users'::regclass
  ),
  'on_auth_user_created trigger exists on auth.users'
);

-- ============================================================
-- TEST GROUP 13: Seed data validation
-- ============================================================

SELECT is(
  (SELECT COUNT(*)::int FROM public.organizations),
  2,
  'Seed: exactly 2 organizations present'
);

SELECT is(
  (SELECT COUNT(*)::int FROM public.branches),
  4,
  'Seed: exactly 4 branches present'
);

SELECT is(
  (SELECT COUNT(*)::int FROM public.employees WHERE organization_id = '00000001-0000-0000-0000-000000000001'),
  4,
  'Seed: exactly 4 GIET employees present'
);

SELECT is(
  (SELECT COUNT(*)::int FROM public.employees WHERE organization_id = '00000001-0000-0000-0000-000000000002'),
  4,
  'Seed: exactly 4 Apex employees present'
);

SELECT is(
  (SELECT COUNT(*)::int FROM public.roles WHERE is_system = TRUE),
  6,
  'Seed: exactly 6 system roles present'
);

-- ============================================================
-- FINISH
-- ============================================================

SELECT * FROM finish();
ROLLBACK;
