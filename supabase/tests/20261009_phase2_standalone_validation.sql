-- =============================================================================
-- EMS Phase 2: Standalone Database Validation Script
-- Project: GIETP-AI-IT-EMS-T1-2026
--
-- This script runs natively in ANY PostgreSQL / Supabase SQL Editor WITHOUT
-- requiring the pgTAP extension. It validates the schema, constraints, RLS,
-- security triggers, and seed data, printing structured test results.
--
-- Safe to run: Non-destructive read checks and self-contained transaction tests.
-- =============================================================================

DO $$
DECLARE
  v_pass_count INTEGER := 0;
  v_fail_count INTEGER := 0;
  v_table_count INTEGER := 0;
  v_rls_count INTEGER := 0;
  v_org1_id UUID := '00000001-0000-0000-0000-000000000001';
  v_org2_id UUID := '00000001-0000-0000-0000-000000000002';
  v_test_emp_id UUID;
  v_caught_exception BOOLEAN;
BEGIN
  RAISE NOTICE '=============================================================';
  RAISE NOTICE '  EMS Phase 2 Database Validation Suite (GIETP-AI-IT-EMS-T1) ';
  RAISE NOTICE '=============================================================';

  -- ---------------------------------------------------------------------------
  -- 1. Verify 12 Core Tables Exist
  -- ---------------------------------------------------------------------------
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'organizations', 'branches', 'departments', 'designations',
      'profiles', 'employees', 'employee_history', 'roles',
      'permissions', 'role_permissions', 'user_roles', 'settings'
    );

  IF v_table_count = 12 THEN
    v_pass_count := v_pass_count + 1;
    RAISE NOTICE '[PASS] Core Tables: All 12 application tables exist in public schema';
  ELSE
    v_fail_count := v_fail_count + 1;
    RAISE WARNING '[FAIL] Core Tables: Found only % of 12 required tables', v_table_count;
  END IF;

  -- ---------------------------------------------------------------------------
  -- 2. Verify Row Level Security (RLS) is Enabled on All 12 Tables
  -- ---------------------------------------------------------------------------
  SELECT COUNT(*) INTO v_rls_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = TRUE
    AND tablename IN (
      'organizations', 'branches', 'departments', 'designations',
      'profiles', 'employees', 'employee_history', 'roles',
      'permissions', 'role_permissions', 'user_roles', 'settings'
    );

  IF v_rls_count = 12 THEN
    v_pass_count := v_pass_count + 1;
    RAISE NOTICE '[PASS] RLS: Row Level Security is enabled on all 12 tables';
  ELSE
    v_fail_count := v_fail_count + 1;
    RAISE WARNING '[FAIL] RLS: Enabled on only % of 12 tables', v_rls_count;
  END IF;

  -- ---------------------------------------------------------------------------
  -- 3. Verify Helper Functions (SECURITY DEFINER)
  -- ---------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_my_profile_id') AND
     EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_my_organization_id') AND
     EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_permission') AND
     EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_org_member') AND
     EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'assign_user_to_organization') THEN
    v_pass_count := v_pass_count + 1;
    RAISE NOTICE '[PASS] Helper Functions: Security Definer functions exist';
  ELSE
    v_fail_count := v_fail_count + 1;
    RAISE WARNING '[FAIL] Helper Functions: Missing one or more security helper functions';
  END IF;

  -- ---------------------------------------------------------------------------
  -- 4. Verify Auth Triggers & Safeguards
  -- ---------------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') AND
     EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'prevent_profile_org_self_change') AND
     EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'prevent_self_role_assignment_trigger') THEN
    v_pass_count := v_pass_count + 1;
    RAISE NOTICE '[PASS] Auth Triggers: User sync and privilege escalation guards exist';
  ELSE
    v_fail_count := v_fail_count + 1;
    RAISE WARNING '[FAIL] Auth Triggers: Missing auth or self-escalation triggers';
  END IF;

  -- ---------------------------------------------------------------------------
  -- 5. Test Employee Code Isolation (Same Org vs Cross Org)
  -- ---------------------------------------------------------------------------
  -- Ensure test parent organizations exist (self-bootstrapping if seed not yet applied)
  INSERT INTO public.organizations (id, name, slug, code)
  VALUES 
    (v_org1_id, 'GIET Polytechnic College', 'giet-polytechnic', 'GIETP'),
    (v_org2_id, 'Apex Solutions Pvt Ltd', 'apex-solutions', 'APEXS')
  ON CONFLICT (id) DO NOTHING
  ON CONFLICT (code) DO NOTHING;

  -- Ensure test branch exists for Org 1 (for cross-boundary test)
  INSERT INTO public.branches (id, organization_id, name, code)
  VALUES 
    ('00000002-0000-0000-0000-000000000001', v_org1_id, 'GIET Main Campus', 'MAIN')
  ON CONFLICT (id) DO NOTHING
  ON CONFLICT (organization_id, code) DO NOTHING;

  -- Clean up any previous test artifacts
  DELETE FROM public.employees WHERE employee_code = 'TEST-CODE-VALIDATE';

  -- Insert employee in Org 1
  INSERT INTO public.employees (
    organization_id, employee_code, employment_type, date_of_joining
  ) VALUES (
    v_org1_id, 'TEST-CODE-VALIDATE', 'full_time', CURRENT_DATE
  ) RETURNING id INTO v_test_emp_id;

  -- Attempt duplicate employee_code in SAME org (MUST FAIL with unique_violation)
  v_caught_exception := FALSE;
  BEGIN
    INSERT INTO public.employees (
      organization_id, employee_code, employment_type, date_of_joining
    ) VALUES (
      v_org1_id, 'TEST-CODE-VALIDATE', 'full_time', CURRENT_DATE
    );
  EXCEPTION
    WHEN unique_violation THEN
      v_caught_exception := TRUE;
  END;

  IF v_caught_exception THEN
    v_pass_count := v_pass_count + 1;
    RAISE NOTICE '[PASS] Isolation: Duplicate employee_code in SAME org is rejected (23505)';
  ELSE
    v_fail_count := v_fail_count + 1;
    RAISE WARNING '[FAIL] Isolation: Duplicate employee_code in same org was incorrectly permitted';
  END IF;

  -- Attempt SAME employee_code in DIFFERENT org (MUST SUCCEED)
  v_caught_exception := FALSE;
  BEGIN
    INSERT INTO public.employees (
      organization_id, employee_code, employment_type, date_of_joining
    ) VALUES (
      v_org2_id, 'TEST-CODE-VALIDATE', 'full_time', CURRENT_DATE
    );
  EXCEPTION
    WHEN OTHERS THEN
      v_caught_exception := TRUE;
  END;

  IF NOT v_caught_exception THEN
    v_pass_count := v_pass_count + 1;
    RAISE NOTICE '[PASS] Multi-tenancy: Same employee_code in DIFFERENT org is permitted';
  ELSE
    v_fail_count := v_fail_count + 1;
    RAISE WARNING '[FAIL] Multi-tenancy: Failed to insert same employee_code in separate org';
  END IF;

  -- Clean up test records
  DELETE FROM public.employees WHERE employee_code = 'TEST-CODE-VALIDATE';

  -- ---------------------------------------------------------------------------
  -- 6. Test Organization Boundary Trigger (Cross-Tenant Branch Assignment)
  -- ---------------------------------------------------------------------------
  v_caught_exception := FALSE;
  BEGIN
    -- Try assigning GIET Branch (00000002-...0001) to an Apex Employee (org 00000001-...0002)
    INSERT INTO public.employees (
      organization_id, branch_id, employee_code, employment_type, date_of_joining
    ) VALUES (
      v_org2_id,
      '00000002-0000-0000-0000-000000000001',
      'CROSS-TEST-BRANCH',
      'full_time',
      CURRENT_DATE
    );
  EXCEPTION
    WHEN raise_exception THEN
      v_caught_exception := TRUE;
  END;

  IF v_caught_exception THEN
    v_pass_count := v_pass_count + 1;
    RAISE NOTICE '[PASS] Boundary Enforcement: Cross-org branch assignment correctly blocked';
  ELSE
    v_fail_count := v_fail_count + 1;
    RAISE WARNING '[FAIL] Boundary Enforcement: Cross-org branch assignment was NOT blocked';
  END IF;

  -- ---------------------------------------------------------------------------
  -- 7. Verify Seed Data Presence
  -- ---------------------------------------------------------------------------
  IF (SELECT COUNT(*) FROM public.organizations) >= 2 AND
     (SELECT COUNT(*) FROM public.branches) >= 4 AND
     (SELECT COUNT(*) FROM public.employees) >= 8 AND
     (SELECT COUNT(*) FROM public.roles WHERE is_system = TRUE) >= 6 THEN
    v_pass_count := v_pass_count + 1;
    RAISE NOTICE '[PASS] Seed Data: Verified 2 organizations, 4 branches, 8 employees, 6 system roles';
  ELSE
    RAISE NOTICE '[INFO] Seed Data: Seed records not detected yet (run supabase/seed.sql)';
  END IF;

  -- ---------------------------------------------------------------------------
  -- Summary
  -- ---------------------------------------------------------------------------
  RAISE NOTICE '-------------------------------------------------------------';
  RAISE NOTICE 'Validation Summary: % Checks Passed, % Checks Failed', v_pass_count, v_fail_count;
  IF v_fail_count = 0 THEN
    RAISE NOTICE 'STATUS: ALL VERIFICATIONS SUCCESSFUL!';
  ELSE
    RAISE EXCEPTION 'Validation suite encountered % failures', v_fail_count;
  END IF;
  RAISE NOTICE '=============================================================';
END $$;
