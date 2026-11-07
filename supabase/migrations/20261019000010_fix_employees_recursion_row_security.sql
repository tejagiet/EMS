-- =============================================================================
-- Migration: 20261019000010_fix_employees_recursion_row_security
-- Description: Completely eliminate RLS recursion on public.employees by:
--              1. Setting row_security = off inside SECURITY DEFINER helper
--              2. Splitting public.employees SELECT policies into non-recursive rules
-- Project: GIETP-AI-IT-EMS-T1-2026
-- =============================================================================

-- 1. Create SECURITY DEFINER function with row_security disabled during execution
CREATE OR REPLACE FUNCTION public.get_my_employee_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Disable RLS evaluation inside this helper to avoid circular policy planning
  PERFORM set_config('row_security', 'off', true);
  RETURN QUERY
  SELECT id FROM public.employees WHERE profile_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_employee_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_employee_ids() TO anon;
GRANT EXECUTE ON FUNCTION public.get_my_employee_ids() TO service_role;

-- 2. Drop monolithic policy and replace with discrete, clean policies
DROP POLICY IF EXISTS employees_select_manager_reporting ON public.employees;
DROP POLICY IF EXISTS employees_select_self ON public.employees;
DROP POLICY IF EXISTS employees_select_org_reader ON public.employees;
DROP POLICY IF EXISTS employees_select_manager ON public.employees;

-- Self-view policy (zero foreign recursion)
CREATE POLICY employees_select_self
  ON public.employees
  FOR SELECT
  USING (profile_id = auth.uid());

-- Organization wide reader policy (HR, Org Admin, Super Admin, Auditor, Dept Head)
CREATE POLICY employees_select_org_reader
  ON public.employees
  FOR SELECT
  USING (
    public.is_org_member(organization_id)
    AND public.has_permission('employee.read')
  );

-- Manager direct reports view policy
CREATE POLICY employees_select_manager
  ON public.employees
  FOR SELECT
  USING (
    public.is_org_member(organization_id)
    AND reporting_manager_id IN (SELECT public.get_my_employee_ids())
  );
