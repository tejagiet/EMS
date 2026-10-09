-- Migration: 20261009000003_auth_triggers
-- Description: Auth user → profile sync, self-assignment prevention triggers,
--              privileged organization membership functions
-- Project: GIETP-AI-IT-EMS-T1-2026
-- Phase: 2

-- ============================================================
-- SECTION 1: Profile auto-creation trigger
-- Fires AFTER INSERT on auth.users to create a matching
-- public.profiles row for every new Supabase Auth user.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop before re-creating to keep migration idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
  'Auto-creates a public.profiles row whenever a new auth.users row is inserted. '
  'Falls back to email prefix when full_name is absent from raw_user_meta_data.';

-- ============================================================
-- SECTION 2: Prevent self-assignment of organization_id
-- A profile owner must NOT be able to change their own
-- organization_id directly. All org moves go through the
-- privileged assign_user_to_organization() function.
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_self_org_reassignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only block when the authenticated user is updating their own profile row
  IF auth.uid() = OLD.id AND NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
    RAISE EXCEPTION 'You cannot change your own organization membership. Contact an administrator.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_org_self_change ON public.profiles;

CREATE OR REPLACE TRIGGER prevent_profile_org_self_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_self_org_reassignment();

COMMENT ON FUNCTION public.prevent_self_org_reassignment() IS
  'BEFORE UPDATE guard on public.profiles. Raises insufficient_privilege when '
  'the authenticated user tries to change organization_id on their own profile row.';

-- ============================================================
-- SECTION 3: Prevent self-assignment of privileged roles
-- A user must NOT be able to INSERT a user_roles row whose
-- profile_id equals their own auth.uid().
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_self_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() = NEW.profile_id THEN
    RAISE EXCEPTION 'Users cannot assign roles to themselves. Contact an administrator.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_role_assignment_trigger ON public.user_roles;

CREATE OR REPLACE TRIGGER prevent_self_role_assignment_trigger
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_assignment();

COMMENT ON FUNCTION public.prevent_self_role_assignment() IS
  'BEFORE INSERT guard on public.user_roles. Prevents any user from granting '
  'a role to their own profile_id. Role grants must be performed by another user '
  'with sufficient privilege (e.g. admin via RLS-bypass function).';

-- ============================================================
-- SECTION 4: Privileged function — assign_user_to_organization
-- Administrators call this function to move a profile into an
-- organization. Bypasses the self-reassignment trigger because
-- the caller is a different user (or the function runs as
-- SECURITY DEFINER, which makes auth.uid() return the caller,
-- not the target profile). The explicit has_permission() check
-- ensures only authorized callers can use it.
-- ============================================================

CREATE OR REPLACE FUNCTION public.assign_user_to_organization(
  p_profile_id    uuid,
  p_organization_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Caller must hold the 'organizations:manage_members' permission
  IF NOT public.has_permission('organizations:manage_members') THEN
    RAISE EXCEPTION 'Insufficient privileges to manage organization membership.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.profiles
  SET organization_id = p_organization_id,
      updated_at      = NOW()
  WHERE id = p_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile % not found.', p_profile_id
      USING ERRCODE = 'no_data_found';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.assign_user_to_organization(uuid, uuid) IS
  'SECURITY DEFINER function that moves a profile into an organization. '
  'Requires the caller to hold the organizations:manage_members permission. '
  'This is the only sanctioned path for changing profile.organization_id.';

-- ============================================================
-- SECTION 5: Grant EXECUTE on helper functions
-- Expose helper functions to the authenticated role so that
-- RLS policies and application code can call them without
-- needing elevated privileges.
-- ============================================================

GRANT EXECUTE ON FUNCTION public.get_my_profile_id()                          TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_organization_id()                      TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(text)                          TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid)                           TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_user_to_organization(uuid, uuid)       TO authenticated;
