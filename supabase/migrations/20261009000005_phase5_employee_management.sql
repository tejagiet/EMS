-- Migration: 20261009000005_phase5_employee_management
-- Description: Phase 5 Schema Enhancements — emergency contacts, address, notes,
--              department head reference, employee code sequence generator,
--              circular management check, automated employee history audit trigger,
--              and unified dot-notation permission RLS policies.
-- Project: GIETP-AI-IT-EMS-T1-2026
-- Phase: 5

-- =============================================================================
-- SECTION 1: Schema Extensions on employees, departments, and organizations
-- =============================================================================

-- 1.1 Add emergency contact, address, notes, and work location to employees
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_number TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS work_location TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 1.2 Add head_of_department_id to departments
ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS head_of_department_id UUID REFERENCES public.employees (id) ON DELETE SET NULL;

-- 1.3 Add code_sequence to organizations settings or dedicated sequence tracking table
CREATE TABLE IF NOT EXISTS public.employee_code_sequences (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations (id) ON DELETE CASCADE,
  prefix          TEXT NOT NULL DEFAULT 'EMP',
  current_val     BIGINT NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.employee_code_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY employee_code_sequences_select_member
  ON public.employee_code_sequences
  FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY employee_code_sequences_manage
  ON public.employee_code_sequences
  FOR ALL
  USING (public.is_org_member(organization_id) AND (public.has_permission('employee.write') OR public.has_permission('organization.write')))
  WITH CHECK (public.is_org_member(organization_id) AND (public.has_permission('employee.write') OR public.has_permission('organization.write')));

-- =============================================================================
-- SECTION 2: Transactional Employee Code Generator Function
-- =============================================================================

CREATE OR REPLACE FUNCTION public.generate_next_employee_code(p_org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_prefix text := 'EMP';
  v_seq bigint;
  v_code text;
  v_org_code text;
BEGIN
  -- Get org code if available to prefix
  SELECT code INTO v_org_code FROM public.organizations WHERE id = p_org_id;
  IF v_org_code IS NOT NULL AND v_org_code <> '' THEN
    v_prefix := UPPER(v_org_code);
  END IF;

  -- Upsert sequence record and lock the row for atomicity
  INSERT INTO public.employee_code_sequences (organization_id, prefix, current_val, updated_at)
  VALUES (p_org_id, v_prefix, 1, NOW())
  ON CONFLICT (organization_id) DO UPDATE
    SET current_val = public.employee_code_sequences.current_val + 1,
        updated_at = NOW()
  RETURNING current_val, prefix INTO v_seq, v_prefix;

  -- Format as PREFIX-0001
  v_code := v_prefix || '-' || LPAD(v_seq::text, 4, '0');

  -- Ensure loop check in case of collision
  WHILE EXISTS (SELECT 1 FROM public.employees WHERE organization_id = p_org_id AND employee_code = v_code) LOOP
    UPDATE public.employee_code_sequences
    SET current_val = current_val + 1,
        updated_at = NOW()
    WHERE organization_id = p_org_id
    RETURNING current_val INTO v_seq;

    v_code := v_prefix || '-' || LPAD(v_seq::text, 4, '0');
  END LOOP;

  RETURN v_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_next_employee_code(uuid) TO authenticated;

-- =============================================================================
-- SECTION 3: Circular Reporting and Manager Validation Guard
-- =============================================================================

CREATE OR REPLACE FUNCTION public.validate_employee_relationships()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_curr_id uuid;
  v_visited uuid[];
BEGIN
  -- 1. Employee cannot be their own reporting manager
  IF NEW.reporting_manager_id IS NOT NULL AND NEW.id IS NOT NULL AND NEW.reporting_manager_id = NEW.id THEN
    RAISE EXCEPTION 'An employee cannot be their own reporting manager.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 2. Reporting manager must belong to the exact same organization
  IF NEW.reporting_manager_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.employees m
      WHERE m.id = NEW.reporting_manager_id
        AND m.organization_id = NEW.organization_id
    ) THEN
      RAISE EXCEPTION 'Reporting manager must belong to the same organization.'
        USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- 3. Cycle detection up the hierarchy
    v_curr_id := NEW.reporting_manager_id;
    v_visited := ARRAY[NEW.id];

    WHILE v_curr_id IS NOT NULL LOOP
      IF v_curr_id = ANY(v_visited) THEN
        RAISE EXCEPTION 'Circular reporting structure detected in manager assignment.'
          USING ERRCODE = 'check_violation';
      END IF;

      v_visited := array_append(v_visited, v_curr_id);

      SELECT reporting_manager_id INTO v_curr_id
      FROM public.employees
      WHERE id = v_curr_id;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_employees_validate_relationships ON public.employees;
CREATE TRIGGER trg_employees_validate_relationships
  BEFORE INSERT OR UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.validate_employee_relationships();

-- =============================================================================
-- SECTION 4: Automated Server-side Employment History Audit Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION public.audit_employee_field_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.employee_history (
      organization_id, employee_id, changed_by, field_name,
      old_value, new_value, change_reason, effective_date, created_at
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      v_actor_id,
      'employment_status',
      NULL,
      NEW.employment_status,
      'Initial employee creation',
      NEW.date_of_joining,
      NOW()
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Track Department Change
    IF OLD.department_id IS DISTINCT FROM NEW.department_id THEN
      INSERT INTO public.employee_history (
        organization_id, employee_id, changed_by, field_name,
        old_value, new_value, change_reason, effective_date, created_at
      ) VALUES (
        NEW.organization_id,
        NEW.id,
        v_actor_id,
        'department_id',
        OLD.department_id::text,
        NEW.department_id::text,
        'Department reassignment',
        CURRENT_DATE,
        NOW()
      );
    END IF;

    -- Track Branch Change
    IF OLD.branch_id IS DISTINCT FROM NEW.branch_id THEN
      INSERT INTO public.employee_history (
        organization_id, employee_id, changed_by, field_name,
        old_value, new_value, change_reason, effective_date, created_at
      ) VALUES (
        NEW.organization_id,
        NEW.id,
        v_actor_id,
        'branch_id',
        OLD.branch_id::text,
        NEW.branch_id::text,
        'Branch transfer',
        CURRENT_DATE,
        NOW()
      );
    END IF;

    -- Track Designation Change
    IF OLD.designation_id IS DISTINCT FROM NEW.designation_id THEN
      INSERT INTO public.employee_history (
        organization_id, employee_id, changed_by, field_name,
        old_value, new_value, change_reason, effective_date, created_at
      ) VALUES (
        NEW.organization_id,
        NEW.id,
        v_actor_id,
        'designation_id',
        OLD.designation_id::text,
        NEW.designation_id::text,
        'Designation or promotion change',
        CURRENT_DATE,
        NOW()
      );
    END IF;

    -- Track Reporting Manager Change
    IF OLD.reporting_manager_id IS DISTINCT FROM NEW.reporting_manager_id THEN
      INSERT INTO public.employee_history (
        organization_id, employee_id, changed_by, field_name,
        old_value, new_value, change_reason, effective_date, created_at
      ) VALUES (
        NEW.organization_id,
        NEW.id,
        v_actor_id,
        'reporting_manager_id',
        OLD.reporting_manager_id::text,
        NEW.reporting_manager_id::text,
        'Reporting manager change',
        CURRENT_DATE,
        NOW()
      );
    END IF;

    -- Track Employment Status Change
    IF OLD.employment_status IS DISTINCT FROM NEW.employment_status THEN
      INSERT INTO public.employee_history (
        organization_id, employee_id, changed_by, field_name,
        old_value, new_value, change_reason, effective_date, created_at
      ) VALUES (
        NEW.organization_id,
        NEW.id,
        v_actor_id,
        'employment_status',
        OLD.employment_status,
        NEW.employment_status,
        COALESCE(NEW.notes, 'Status change'),
        COALESCE(NEW.date_of_termination, NEW.date_of_resignation, CURRENT_DATE),
        NOW()
      );
    END IF;

    -- Track Employment Type Change
    IF OLD.employment_type IS DISTINCT FROM NEW.employment_type THEN
      INSERT INTO public.employee_history (
        organization_id, employee_id, changed_by, field_name,
        old_value, new_value, change_reason, effective_date, created_at
      ) VALUES (
        NEW.organization_id,
        NEW.id,
        v_actor_id,
        'employment_type',
        OLD.employment_type,
        NEW.employment_type,
        'Employment classification update',
        CURRENT_DATE,
        NOW()
      );
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_employees_audit_history ON public.employees;
CREATE TRIGGER trg_employees_audit_history
  AFTER INSERT OR UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.audit_employee_field_changes();

-- =============================================================================
-- SECTION 5: Update has_permission to Support Dot and Colon Notations
-- =============================================================================

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
      AND (
        perm.code = p_permission_code
        OR perm.code = REPLACE(p_permission_code, ':', '.')
        OR perm.code = REPLACE(p_permission_code, '.', ':')
      )
      AND perm.is_active = true
  );
$$;

-- =============================================================================
-- SECTION 6: Synchronize RLS Policies on employees, departments, branches
-- =============================================================================

-- 6.1 employees write policies using dot & colon aliases
DROP POLICY IF EXISTS employees_insert_writer ON public.employees;
CREATE POLICY employees_insert_writer
  ON public.employees
  FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id)
    AND (public.has_permission('employee.write') OR public.has_permission('employees:write'))
  );

DROP POLICY IF EXISTS employees_update_writer ON public.employees;
CREATE POLICY employees_update_writer
  ON public.employees
  FOR UPDATE
  USING (
    public.is_org_member(organization_id)
    AND (public.has_permission('employee.write') OR public.has_permission('employees:write'))
  )
  WITH CHECK (
    public.is_org_member(organization_id)
    AND (public.has_permission('employee.write') OR public.has_permission('employees:write'))
  );

DROP POLICY IF EXISTS employees_delete_deleter ON public.employees;
CREATE POLICY employees_delete_deleter
  ON public.employees
  FOR DELETE
  USING (
    public.is_org_member(organization_id)
    AND (public.has_permission('employee.write') OR public.has_permission('employees:delete'))
  );

-- 6.2 branches write policies
DROP POLICY IF EXISTS branches_insert_writer ON public.branches;
CREATE POLICY branches_insert_writer
  ON public.branches
  FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id)
    AND (public.has_permission('organization.write') OR public.has_permission('branches:write'))
  );

DROP POLICY IF EXISTS branches_update_writer ON public.branches;
CREATE POLICY branches_update_writer
  ON public.branches
  FOR UPDATE
  USING (
    public.is_org_member(organization_id)
    AND (public.has_permission('organization.write') OR public.has_permission('branches:write'))
  )
  WITH CHECK (
    public.is_org_member(organization_id)
    AND (public.has_permission('organization.write') OR public.has_permission('branches:write'))
  );

DROP POLICY IF EXISTS branches_delete_deleter ON public.branches;
CREATE POLICY branches_delete_deleter
  ON public.branches
  FOR DELETE
  USING (
    public.is_org_member(organization_id)
    AND (public.has_permission('organization.write') OR public.has_permission('branches:delete'))
  );

-- 6.3 departments write policies
DROP POLICY IF EXISTS departments_insert_writer ON public.departments;
CREATE POLICY departments_insert_writer
  ON public.departments
  FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id)
    AND (public.has_permission('organization.write') OR public.has_permission('departments:write'))
  );

DROP POLICY IF EXISTS departments_update_writer ON public.departments;
CREATE POLICY departments_update_writer
  ON public.departments
  FOR UPDATE
  USING (
    public.is_org_member(organization_id)
    AND (public.has_permission('organization.write') OR public.has_permission('departments:write'))
  )
  WITH CHECK (
    public.is_org_member(organization_id)
    AND (public.has_permission('organization.write') OR public.has_permission('departments:write'))
  );

DROP POLICY IF EXISTS departments_delete_deleter ON public.departments;
CREATE POLICY departments_delete_deleter
  ON public.departments
  FOR DELETE
  USING (
    public.is_org_member(organization_id)
    AND (public.has_permission('organization.write') OR public.has_permission('departments:delete'))
  );

-- 6.4 designations write policies
DROP POLICY IF EXISTS designations_insert_writer ON public.designations;
CREATE POLICY designations_insert_writer
  ON public.designations
  FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id)
    AND (public.has_permission('organization.write') OR public.has_permission('designations:write'))
  );

DROP POLICY IF EXISTS designations_update_writer ON public.designations;
CREATE POLICY designations_update_writer
  ON public.designations
  FOR UPDATE
  USING (
    public.is_org_member(organization_id)
    AND (public.has_permission('organization.write') OR public.has_permission('designations:write'))
  )
  WITH CHECK (
    public.is_org_member(organization_id)
    AND (public.has_permission('organization.write') OR public.has_permission('designations:write'))
  );

DROP POLICY IF EXISTS designations_delete_deleter ON public.designations;
CREATE POLICY designations_delete_deleter
  ON public.designations
  FOR DELETE
  USING (
    public.is_org_member(organization_id)
    AND (public.has_permission('organization.write') OR public.has_permission('designations:delete'))
  );
