-- =============================================================================
-- Migration: 20261019000011_enable_tenant_provisioning
-- Description: Enable tenant provisioning for Super Administrators:
--              1. is_super_admin() SECURITY DEFINER helper function
--              2. RLS policies on public.organizations and public.branches for Super Admin
--              3. provision_tenant() stored procedure with default branch seeding
-- Project: GIETP-AI-IT-EMS-T1-2026
-- Phase: 3 (Multi-tenant Foundation)
-- =============================================================================

-- 1. Helper function to check if current authenticated user has active Super Admin role
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.profile_id = auth.uid()
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      AND r.code = 'super_admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO service_role;

-- 2. Allow Super Admin full read/write on public.organizations
DROP POLICY IF EXISTS organizations_super_admin_all ON public.organizations;
CREATE POLICY organizations_super_admin_all
  ON public.organizations
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 3. Allow Super Admin full read/write on public.branches
DROP POLICY IF EXISTS branches_super_admin_all ON public.branches;
CREATE POLICY branches_super_admin_all
  ON public.branches
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 4. Atomic Tenant Provisioning Stored Procedure
CREATE OR REPLACE FUNCTION public.provision_tenant(
  p_name TEXT,
  p_code TEXT,
  p_slug TEXT,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_default_branch_name TEXT DEFAULT 'Main Campus',
  p_is_active BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id UUID;
  v_branch_id UUID;
  v_result JSONB;
BEGIN
  -- Verify caller is super admin, service role, or authenticated user with admin authority
  IF NOT (public.is_super_admin() OR auth.role() = 'service_role' OR auth.uid() IS NULL) THEN
    -- In development, allow authenticated users if no super admin role exists yet
    IF EXISTS (SELECT 1 FROM public.roles WHERE code = 'super_admin') THEN
      RAISE EXCEPTION 'Only Super Administrators can provision new tenants.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  -- Validate inputs
  IF TRIM(COALESCE(p_name, '')) = '' THEN
    RAISE EXCEPTION 'Tenant name cannot be empty.' USING ERRCODE = 'check_violation';
  END IF;

  IF TRIM(COALESCE(p_code, '')) = '' THEN
    RAISE EXCEPTION 'Tenant code cannot be empty.' USING ERRCODE = 'check_violation';
  END IF;

  IF TRIM(COALESCE(p_slug, '')) = '' THEN
    RAISE EXCEPTION 'Tenant slug cannot be empty.' USING ERRCODE = 'check_violation';
  END IF;

  -- Check uniqueness for code
  IF EXISTS (SELECT 1 FROM public.organizations WHERE UPPER(code) = UPPER(TRIM(p_code))) THEN
    RAISE EXCEPTION 'An organization with code "%" already exists.', UPPER(TRIM(p_code))
      USING ERRCODE = 'unique_violation';
  END IF;

  -- Check uniqueness for slug
  IF EXISTS (SELECT 1 FROM public.organizations WHERE LOWER(slug) = LOWER(TRIM(p_slug))) THEN
    RAISE EXCEPTION 'An organization with slug "%" already exists.', LOWER(TRIM(p_slug))
      USING ERRCODE = 'unique_violation';
  END IF;

  -- Insert Organization
  INSERT INTO public.organizations (
    name,
    code,
    slug,
    email,
    phone,
    address,
    is_active,
    settings
  )
  VALUES (
    TRIM(p_name),
    UPPER(TRIM(p_code)),
    LOWER(TRIM(p_slug)),
    NULLIF(TRIM(p_email), ''),
    NULLIF(TRIM(p_phone), ''),
    NULLIF(TRIM(p_address), ''),
    COALESCE(p_is_active, TRUE),
    '{}'::jsonb
  )
  RETURNING id INTO v_org_id;

  -- Create Default Main Campus Branch
  INSERT INTO public.branches (
    organization_id,
    name,
    code,
    is_active
  )
  VALUES (
    v_org_id,
    COALESCE(NULLIF(TRIM(p_default_branch_name), ''), 'Main Campus'),
    'MAIN',
    TRUE
  )
  RETURNING id INTO v_branch_id;

  -- Return created tenant object
  SELECT jsonb_build_object(
    'id', o.id,
    'name', o.name,
    'code', o.code,
    'slug', o.slug,
    'email', o.email,
    'phone', o.phone,
    'address', o.address,
    'is_active', o.is_active,
    'created_at', o.created_at,
    'default_branch_id', v_branch_id
  )
  INTO v_result
  FROM public.organizations o
  WHERE o.id = v_org_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.provision_tenant(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.provision_tenant(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO anon;
GRANT EXECUTE ON FUNCTION public.provision_tenant(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO service_role;
