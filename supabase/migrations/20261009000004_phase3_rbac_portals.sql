-- Migration: 20261009000004_phase3_rbac_portals
-- Description: Phase 3 RBAC foundation — Ten Portal Roles, 22 granular dot-notation
--              permissions, complete least-privilege matrix, and enhanced RLS policies.
-- Project: GIETP-AI-IT-EMS-T1-2026
-- Phase: 3

-- =============================================================================
-- SECTION 1: Ensure Ten Portal System Roles Exist
-- =============================================================================

INSERT INTO public.roles (id, organization_id, name, code, description, is_system, is_active, created_at, updated_at)
VALUES
  -- 1. Super Admin
  (
    '00000005-0000-0000-0000-000000000001',
    NULL,
    'Super Administrator',
    'super_admin',
    'Global administrative authority over platform infrastructure and tenants',
    TRUE, TRUE, NOW(), NOW()
  ),
  -- 2. Organization Admin
  (
    '00000005-0000-0000-0000-000000000002',
    NULL,
    'Organization Administrator',
    'org_admin',
    'Tenant administrator managing organization units, policies, and memberships',
    TRUE, TRUE, NOW(), NOW()
  ),
  -- 3. HR Manager
  (
    '00000005-0000-0000-0000-000000000005',
    NULL,
    'HR Manager',
    'hr_manager',
    'Employee records lifecycle, organizational hierarchy, and attendance oversight',
    TRUE, TRUE, NOW(), NOW()
  ),
  -- 4. Recruitment Manager
  (
    '00000005-0000-0000-0000-000000000010',
    NULL,
    'Recruitment Manager',
    'recruitment_manager',
    'Job openings, candidate pipelines, interviews, and employee onboarding',
    TRUE, TRUE, NOW(), NOW()
  ),
  -- 5. Finance and Payroll Manager
  (
    '00000005-0000-0000-0000-000000000006',
    NULL,
    'Finance and Payroll Manager',
    'finance_payroll_manager',
    'Compensation structures, salary processing, disbursement, and tax ledgers',
    TRUE, TRUE, NOW(), NOW()
  ),
  -- 6. Manager
  (
    '00000005-0000-0000-0000-000000000003',
    NULL,
    'Manager',
    'manager',
    'Direct reporting-line supervisory portal for attendance, leaves, and approvals',
    TRUE, TRUE, NOW(), NOW()
  ),
  -- 7. Department Head
  (
    '00000005-0000-0000-0000-000000000011',
    NULL,
    'Department Head',
    'dept_head',
    'Department operational planning, departmental staff overview, and authorizations',
    TRUE, TRUE, NOW(), NOW()
  ),
  -- 8. IT and Assets Manager
  (
    '00000005-0000-0000-0000-000000000012',
    NULL,
    'IT and Assets Manager',
    'it_assets_manager',
    'Hardware, equipment tracking, software licenses, and asset allocation',
    TRUE, TRUE, NOW(), NOW()
  ),
  -- 9. Employee
  (
    '00000005-0000-0000-0000-000000000004',
    NULL,
    'Employee Self-Service',
    'employee',
    'Personal profile, leave applications, attendance clocking, and payslip access',
    TRUE, TRUE, NOW(), NOW()
  ),
  -- 10. Auditor
  (
    '00000005-0000-0000-0000-000000000013',
    NULL,
    'Auditor',
    'auditor',
    'Read-only inspection of organizational logs, audit ledgers, and compliance reports',
    TRUE, TRUE, NOW(), NOW()
  )
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      code = EXCLUDED.code,
      description = EXCLUDED.description,
      is_system = EXCLUDED.is_system,
      updated_at = NOW();

-- =============================================================================
-- SECTION 2: Granular Dot-Notation Permissions (22 Required Codes)
-- =============================================================================

INSERT INTO public.permissions (id, code, name, description, module, action, is_active, created_at, updated_at)
VALUES
  -- organization
  (gen_random_uuid(), 'organization.read',  'Read Organization',   'View organization profile and settings',      'organization', 'read',    TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'organization.write', 'Write Organization',  'Update organization units, branches, depts',  'organization', 'write',   TRUE, NOW(), NOW()),
  -- employee
  (gen_random_uuid(), 'employee.read',      'Read Employees',      'View organization employee records',          'employee',     'read',    TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'employee.write',     'Write Employees',     'Create and update employee directory records','employee',     'write',   TRUE, NOW(), NOW()),
  -- attendance
  (gen_random_uuid(), 'attendance.self',    'Self Attendance',     'Clock in/out and view personal attendance',   'attendance',   'self',    TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'attendance.read',    'Read Attendance',     'View team or departmental attendance rosters','attendance',   'read',    TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'attendance.manage',  'Manage Attendance',   'Adjust and approve staff attendance records', 'attendance',   'manage',  TRUE, NOW(), NOW()),
  -- leave
  (gen_random_uuid(), 'leave.self',         'Self Leave',          'Submit and monitor personal leave requests',  'leave',        'self',    TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'leave.read',         'Read Leave',          'View team or organizational leave requests',  'leave',        'read',    TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'leave.approve',      'Approve Leave',       'Authorize or reject leave applications',      'leave',        'approve', TRUE, NOW(), NOW()),
  -- payroll
  (gen_random_uuid(), 'payroll.read',       'Read Payroll',        'Inspect salary structures and compensation',  'payroll',      'read',    TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'payroll.write',      'Write Payroll',       'Process payroll entries and deductions',      'payroll',      'write',   TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'payroll.approve',    'Approve Payroll',     'Authorize final salary disbursement cycles',  'payroll',      'approve', TRUE, NOW(), NOW()),
  -- recruitment
  (gen_random_uuid(), 'recruitment.read',   'Read Recruitment',    'View job postings and candidate pipelines',   'recruitment',  'read',    TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'recruitment.write',  'Write Recruitment',   'Post job openings, screen and hire candidates','recruitment', 'write',   TRUE, NOW(), NOW()),
  -- asset
  (gen_random_uuid(), 'asset.read',         'Read Assets',         'View IT hardware inventory and allocations',  'asset',        'read',    TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'asset.manage',       'Manage Assets',       'Register, assign and maintain company assets','asset',        'manage',  TRUE, NOW(), NOW()),
  -- document
  (gen_random_uuid(), 'document.read',      'Read Documents',      'View company documents and policies',         'document',     'read',    TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'document.write',     'Write Documents',     'Upload and manage organizational documents',  'document',     'write',   TRUE, NOW(), NOW()),
  -- report
  (gen_random_uuid(), 'report.read',        'Read Reports',        'Generate and view organizational analytics',  'report',       'read',    TRUE, NOW(), NOW()),
  -- audit
  (gen_random_uuid(), 'audit.read',         'Read Audit Logs',     'Inspect compliance trail and activity logs',  'audit',        'read',    TRUE, NOW(), NOW()),
  -- role
  (gen_random_uuid(), 'role.manage',        'Manage Roles',        'Assign and revoke organization user roles',   'role',         'manage',  TRUE, NOW(), NOW())
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      module = EXCLUDED.module,
      action = EXCLUDED.action,
      updated_at = NOW();

-- =============================================================================
-- SECTION 3: Populate Role-Permission Matrix (Least Privilege Grants)
-- =============================================================================

-- Helper procedure to grant permission by codes safely
CREATE OR REPLACE PROCEDURE public.grant_role_permission(
  p_role_code text,
  p_permission_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role_id uuid;
  v_perm_id uuid;
BEGIN
  SELECT id INTO v_role_id FROM public.roles WHERE code = p_role_code AND organization_id IS NULL LIMIT 1;
  SELECT id INTO v_perm_id FROM public.permissions WHERE code = p_permission_code LIMIT 1;

  IF v_role_id IS NOT NULL AND v_perm_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at)
    VALUES (gen_random_uuid(), v_role_id, v_perm_id, NOW())
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
END;
$$;

-- 1. Super Admin: All 22 permissions
DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN SELECT code FROM public.permissions WHERE code LIKE '%.%' LOOP
    CALL public.grant_role_permission('super_admin', p.code);
  END LOOP;
END $$;

-- 2. Organization Admin
CALL public.grant_role_permission('org_admin', 'organization.read');
CALL public.grant_role_permission('org_admin', 'organization.write');
CALL public.grant_role_permission('org_admin', 'employee.read');
CALL public.grant_role_permission('org_admin', 'employee.write');
CALL public.grant_role_permission('org_admin', 'attendance.self');
CALL public.grant_role_permission('org_admin', 'attendance.read');
CALL public.grant_role_permission('org_admin', 'attendance.manage');
CALL public.grant_role_permission('org_admin', 'leave.self');
CALL public.grant_role_permission('org_admin', 'leave.read');
CALL public.grant_role_permission('org_admin', 'leave.approve');
CALL public.grant_role_permission('org_admin', 'payroll.read');
CALL public.grant_role_permission('org_admin', 'recruitment.read');
CALL public.grant_role_permission('org_admin', 'asset.read');
CALL public.grant_role_permission('org_admin', 'asset.manage');
CALL public.grant_role_permission('org_admin', 'document.read');
CALL public.grant_role_permission('org_admin', 'document.write');
CALL public.grant_role_permission('org_admin', 'report.read');
CALL public.grant_role_permission('org_admin', 'audit.read');
CALL public.grant_role_permission('org_admin', 'role.manage');

-- 3. HR Manager
CALL public.grant_role_permission('hr_manager', 'organization.read');
CALL public.grant_role_permission('hr_manager', 'employee.read');
CALL public.grant_role_permission('hr_manager', 'employee.write');
CALL public.grant_role_permission('hr_manager', 'attendance.self');
CALL public.grant_role_permission('hr_manager', 'attendance.read');
CALL public.grant_role_permission('hr_manager', 'attendance.manage');
CALL public.grant_role_permission('hr_manager', 'leave.self');
CALL public.grant_role_permission('hr_manager', 'leave.read');
CALL public.grant_role_permission('hr_manager', 'leave.approve');
CALL public.grant_role_permission('hr_manager', 'recruitment.read');
CALL public.grant_role_permission('hr_manager', 'document.read');
CALL public.grant_role_permission('hr_manager', 'document.write');
CALL public.grant_role_permission('hr_manager', 'report.read');

-- 4. Recruitment Manager
CALL public.grant_role_permission('recruitment_manager', 'organization.read');
CALL public.grant_role_permission('recruitment_manager', 'employee.read');
CALL public.grant_role_permission('recruitment_manager', 'recruitment.read');
CALL public.grant_role_permission('recruitment_manager', 'recruitment.write');
CALL public.grant_role_permission('recruitment_manager', 'document.read');
CALL public.grant_role_permission('recruitment_manager', 'report.read');

-- 5. Finance and Payroll Manager
CALL public.grant_role_permission('finance_payroll_manager', 'organization.read');
CALL public.grant_role_permission('finance_payroll_manager', 'employee.read');
CALL public.grant_role_permission('finance_payroll_manager', 'payroll.read');
CALL public.grant_role_permission('finance_payroll_manager', 'payroll.write');
CALL public.grant_role_permission('finance_payroll_manager', 'payroll.approve');
CALL public.grant_role_permission('finance_payroll_manager', 'report.read');
CALL public.grant_role_permission('finance_payroll_manager', 'document.read');

-- 6. Manager
CALL public.grant_role_permission('manager', 'organization.read');
CALL public.grant_role_permission('manager', 'employee.read');
CALL public.grant_role_permission('manager', 'attendance.self');
CALL public.grant_role_permission('manager', 'attendance.read');
CALL public.grant_role_permission('manager', 'attendance.manage');
CALL public.grant_role_permission('manager', 'leave.self');
CALL public.grant_role_permission('manager', 'leave.read');
CALL public.grant_role_permission('manager', 'leave.approve');
CALL public.grant_role_permission('manager', 'report.read');

-- 7. Department Head
CALL public.grant_role_permission('dept_head', 'organization.read');
CALL public.grant_role_permission('dept_head', 'employee.read');
CALL public.grant_role_permission('dept_head', 'attendance.self');
CALL public.grant_role_permission('dept_head', 'attendance.read');
CALL public.grant_role_permission('dept_head', 'attendance.manage');
CALL public.grant_role_permission('dept_head', 'leave.self');
CALL public.grant_role_permission('dept_head', 'leave.read');
CALL public.grant_role_permission('dept_head', 'leave.approve');
CALL public.grant_role_permission('dept_head', 'asset.read');
CALL public.grant_role_permission('dept_head', 'report.read');
CALL public.grant_role_permission('dept_head', 'document.read');

-- 8. IT and Assets Manager
CALL public.grant_role_permission('it_assets_manager', 'organization.read');
CALL public.grant_role_permission('it_assets_manager', 'employee.read');
CALL public.grant_role_permission('it_assets_manager', 'asset.read');
CALL public.grant_role_permission('it_assets_manager', 'asset.manage');
CALL public.grant_role_permission('it_assets_manager', 'report.read');

-- 9. Employee Self-Service
CALL public.grant_role_permission('employee', 'organization.read');
CALL public.grant_role_permission('employee', 'attendance.self');
CALL public.grant_role_permission('employee', 'leave.self');
CALL public.grant_role_permission('employee', 'document.read');

-- 10. Auditor (Strict Read-Only)
CALL public.grant_role_permission('auditor', 'organization.read');
CALL public.grant_role_permission('auditor', 'employee.read');
CALL public.grant_role_permission('auditor', 'attendance.read');
CALL public.grant_role_permission('auditor', 'leave.read');
CALL public.grant_role_permission('auditor', 'payroll.read');
CALL public.grant_role_permission('auditor', 'asset.read');
CALL public.grant_role_permission('auditor', 'document.read');
CALL public.grant_role_permission('auditor', 'report.read');
CALL public.grant_role_permission('auditor', 'audit.read');

-- Clean up helper procedure
DROP PROCEDURE IF EXISTS public.grant_role_permission(text, text);

-- =============================================================================
-- SECTION 4: Helper Functions for Authenticated RBAC Resolution
-- =============================================================================

-- 4.1 Get All Active Roles for Authenticated User in Selected Organization
CREATE OR REPLACE FUNCTION public.get_my_active_roles(p_org_id uuid DEFAULT NULL)
RETURNS TABLE (
  role_id uuid,
  role_code text,
  role_name text,
  is_system boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT DISTINCT
    r.id,
    r.code,
    r.name,
    r.is_system
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.profile_id = auth.uid()
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    AND (
      p_org_id IS NULL
      OR ur.organization_id = p_org_id
      OR r.code = 'super_admin'
    );
$$;

-- 4.2 Get All Active Permissions for Authenticated User in Selected Organization
CREATE OR REPLACE FUNCTION public.get_my_permissions(p_org_id uuid DEFAULT NULL)
RETURNS TABLE (
  permission_code text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT DISTINCT
    p.code
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  JOIN public.role_permissions rp ON rp.role_id = r.id
  JOIN public.permissions p ON p.id = rp.permission_id
  WHERE ur.profile_id = auth.uid()
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    AND p.is_active = true
    AND (
      p_org_id IS NULL
      OR ur.organization_id = p_org_id
      OR r.code = 'super_admin'
    );
$$;

-- 4.3 Check Reporting Line Hierarchy (For Manager Portal Access)
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
        -- Directly reported to manager's linked employee record
        e.reporting_manager_id IN (
          SELECT mgr.id FROM public.employees mgr WHERE mgr.profile_id = auth.uid()
        )
        -- Or user holds executive/admin role
        OR public.has_permission('employee.write')
      )
  );
$$;

-- Grant EXECUTE to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_active_roles(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_permissions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager_of_employee(uuid) TO authenticated;

-- =============================================================================
-- SECTION 5: Enhanced Row Level Security Policies
-- =============================================================================

-- Ensure manager reporting-line employee selection is permitted
DROP POLICY IF EXISTS employees_select_manager_reporting ON public.employees;
CREATE POLICY employees_select_manager_reporting
  ON public.employees
  FOR SELECT
  USING (
    public.is_org_member(organization_id)
    AND (
      profile_id = auth.uid()
      OR reporting_manager_id IN (SELECT m.id FROM public.employees m WHERE m.profile_id = auth.uid())
      OR public.has_permission('employee.read')
    )
  );
