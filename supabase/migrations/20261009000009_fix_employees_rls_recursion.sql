-- =============================================================================
-- Migration: 20261009000009_fix_employees_rls_recursion
-- Description: Fix infinite recursion in public.employees RLS policy by
--              introducing SECURITY DEFINER helper function public.get_my_employee_ids()
-- Project: GIETP-AI-IT-EMS-T1-2026
-- Phase: 9 Hotfix
-- =============================================================================

-- 1. Create SECURITY DEFINER function to retrieve current user's employee IDs
--    Running as table owner / superuser bypasses RLS on public.employees,
--    preventing policy re-evaluation loop during query planning and execution.
CREATE OR REPLACE FUNCTION public.get_my_employee_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id FROM public.employees WHERE profile_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_employee_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_employee_ids() TO anon;
GRANT EXECUTE ON FUNCTION public.get_my_employee_ids() TO service_role;

-- 2. Update is_manager_of_employee to use the SECURITY DEFINER helper
CREATE OR REPLACE FUNCTION public.is_manager_of_employee(p_employee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.id = p_employee_id
      AND (
        e.reporting_manager_id IN (SELECT public.get_my_employee_ids())
        OR public.has_permission('employee.write')
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_manager_of_employee(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager_of_employee(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_manager_of_employee(uuid) TO service_role;

-- 3. Drop and recreate employees_select_manager_reporting without direct recursive subquery
DROP POLICY IF EXISTS employees_select_manager_reporting ON public.employees;

CREATE POLICY employees_select_manager_reporting
  ON public.employees
  FOR SELECT
  USING (
    public.is_org_member(organization_id)
    AND (
      profile_id = auth.uid()
      OR reporting_manager_id IN (SELECT public.get_my_employee_ids())
      OR public.has_permission('employee.read')
    )
  );
