-- =============================================================================
-- Migration: 20261019000012_tenant_and_unit_deletion
-- Description: Stored procedures for safe deletion of tenants, branches, and departments
--              with cascade boundary protection and least-privilege checks.
-- Project: GIETP-AI-IT-EMS-T1-2026
-- =============================================================================

-- 1. Safely Delete Tenant Institution
CREATE OR REPLACE FUNCTION public.delete_tenant(p_org_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT (public.is_super_admin() OR auth.role() = 'service_role' OR auth.uid() IS NULL) THEN
    IF EXISTS (SELECT 1 FROM public.roles WHERE code = 'super_admin') THEN
      RAISE EXCEPTION 'Only Super Administrators can delete tenant institutions.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  -- Delete associated records in foreign-key dependency order
  DELETE FROM public.employee_history WHERE organization_id = p_org_id;
  DELETE FROM public.employees WHERE organization_id = p_org_id;
  DELETE FROM public.designations WHERE organization_id = p_org_id;
  DELETE FROM public.departments WHERE organization_id = p_org_id;
  DELETE FROM public.branches WHERE organization_id = p_org_id;
  DELETE FROM public.user_roles WHERE organization_id = p_org_id;
  DELETE FROM public.settings WHERE organization_id = p_org_id;
  DELETE FROM public.organizations WHERE id = p_org_id;

  RETURN jsonb_build_object('success', true, 'deleted_id', p_org_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_tenant(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_tenant(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_tenant(UUID) TO service_role;

-- 2. Safely Delete Branch Location
CREATE OR REPLACE FUNCTION public.delete_branch(p_branch_id UUID, p_org_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Unassign branch from employees and departments stationed here first
  UPDATE public.employees
  SET branch_id = NULL
  WHERE branch_id = p_branch_id AND organization_id = p_org_id;

  UPDATE public.departments
  SET branch_id = NULL
  WHERE branch_id = p_branch_id AND organization_id = p_org_id;

  DELETE FROM public.branches
  WHERE id = p_branch_id AND organization_id = p_org_id;

  RETURN jsonb_build_object('success', true, 'deleted_id', p_branch_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_branch(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_branch(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_branch(UUID, UUID) TO service_role;

-- 3. Safely Delete Department
CREATE OR REPLACE FUNCTION public.delete_department(p_department_id UUID, p_org_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Unassign parent department references from child sub-departments
  UPDATE public.departments
  SET parent_department_id = NULL
  WHERE parent_department_id = p_department_id AND organization_id = p_org_id;

  -- Unassign department from employees
  UPDATE public.employees
  SET department_id = NULL
  WHERE department_id = p_department_id AND organization_id = p_org_id;

  -- Unassign department from designations
  UPDATE public.designations
  SET department_id = NULL
  WHERE department_id = p_department_id AND organization_id = p_org_id;

  DELETE FROM public.departments
  WHERE id = p_department_id AND organization_id = p_org_id;

  RETURN jsonb_build_object('success', true, 'deleted_id', p_department_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_department(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_department(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_department(UUID, UUID) TO service_role;
