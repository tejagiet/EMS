-- Seed: development data only
-- Safe to re-run: uses ON CONFLICT DO NOTHING / DO UPDATE
-- DO NOT apply to production
-- Project: GIETP-AI-IT-EMS-T1-2026
--
-- Dev passwords for ALL seed users: DevPassword123!
-- (bcrypt-hashed inline — safe to commit)

-- ============================================================
-- FIXED UUID LEGEND
-- ============================================================
-- Organizations
--   00000001-0000-0000-0000-000000000001  GIET Polytechnic College
--   00000001-0000-0000-0000-000000000002  Apex Solutions Pvt Ltd
--
-- Branches (GIET)
--   00000002-0000-0000-0000-000000000001  GIET Main Campus
--   00000002-0000-0000-0000-000000000002  GIET Extension Centre
-- Branches (Apex)
--   00000002-0000-0000-0000-000000000003  Apex HQ
--   00000002-0000-0000-0000-000000000004  Apex Regional Office
--
-- Departments (GIET)
--   00000003-0000-0000-0000-000000000001  Computer Science & AI (GIET)
--   00000003-0000-0000-0000-000000000002  Electrical Engineering (GIET)
--   00000003-0000-0000-0000-000000000003  Administration (GIET)
-- Departments (Apex)
--   00000003-0000-0000-0000-000000000004  Engineering (Apex)
--   00000003-0000-0000-0000-000000000005  Human Resources (Apex)
--   00000003-0000-0000-0000-000000000006  Finance (Apex)
--
-- Designations (GIET)
--   00000004-0000-0000-0000-000000000001  Lecturer         code=LEC
--   00000004-0000-0000-0000-000000000002  Senior Lecturer  code=SR-LEC
--   00000004-0000-0000-0000-000000000003  Head of Dept     code=HOD
-- Designations (Apex)
--   00000004-0000-0000-0000-000000000004  Software Engineer  code=SWE
--   00000004-0000-0000-0000-000000000005  Senior Engineer    code=SR-SWE
--   00000004-0000-0000-0000-000000000006  Team Lead          code=TL
--
-- System Roles (organization_id = NULL, is_system = TRUE)
--   00000005-0000-0000-0000-000000000001  super_admin
--   00000005-0000-0000-0000-000000000002  admin
--   00000005-0000-0000-0000-000000000003  manager
--   00000005-0000-0000-0000-000000000004  employee
--   00000005-0000-0000-0000-000000000005  hr_manager
--   00000005-0000-0000-0000-000000000006  payroll_manager
-- Org Roles (is_system = FALSE)
--   00000005-0000-0000-0000-000000000007  org_admin (GIET)
--   00000005-0000-0000-0000-000000000008  org_admin (Apex)
--
-- Permissions
--   00000006-0000-0000-0000-0000000000NN  (see Section 6)
--
-- Auth Users / Profiles
--   00000008-0000-0000-0000-000000000001  admin@giet-polytechnic.edu
--   00000008-0000-0000-0000-000000000002  hr@giet-polytechnic.edu
--   00000008-0000-0000-0000-000000000003  emp1@giet-polytechnic.edu
--   00000008-0000-0000-0000-000000000004  manager@giet-polytechnic.edu
--   00000008-0000-0000-0000-000000000005  admin@apex-solutions.dev
--   00000008-0000-0000-0000-000000000006  hr@apex-solutions.dev
--   00000008-0000-0000-0000-000000000007  emp1@apex-solutions.dev
--   00000008-0000-0000-0000-000000000008  manager@apex-solutions.dev
--
-- Employees
--   00000009-0000-0000-0000-000000000001 .. 000000000008
-- ============================================================


-- ============================================================
-- SECTION 1: ORGANIZATIONS
-- ============================================================

INSERT INTO public.organizations (id, name, slug, code, address, email, is_active, created_at, updated_at)
VALUES
  (
    '00000001-0000-0000-0000-000000000001',
    'GIET Polytechnic College',
    'giet-polytechnic',
    'GIET',
    'Rajahmundry, Andhra Pradesh, India',
    'admin@giet-polytechnic.edu',
    TRUE, NOW(), NOW()
  ),
  (
    '00000001-0000-0000-0000-000000000002',
    'Apex Solutions Pvt Ltd',
    'apex-solutions',
    'APEX',
    'Hyderabad, Telangana, India',
    'admin@apex-solutions.dev',
    TRUE, NOW(), NOW()
  )
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- SECTION 2: BRANCHES
-- ============================================================

INSERT INTO public.branches (id, organization_id, name, code, is_active, created_at, updated_at)
VALUES
  -- GIET branches
  ('00000002-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000001', 'GIET Main Campus',      'GIET-MAIN', TRUE, NOW(), NOW()),
  ('00000002-0000-0000-0000-000000000002', '00000001-0000-0000-0000-000000000001', 'GIET Extension Centre', 'GIET-EXT',  TRUE, NOW(), NOW()),
  -- Apex branches
  ('00000002-0000-0000-0000-000000000003', '00000001-0000-0000-0000-000000000002', 'Apex HQ',              'APEX-HQ',   TRUE, NOW(), NOW()),
  ('00000002-0000-0000-0000-000000000004', '00000001-0000-0000-0000-000000000002', 'Apex Regional Office', 'APEX-REG',  TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- SECTION 3: DEPARTMENTS
-- ============================================================

INSERT INTO public.departments (id, organization_id, branch_id, name, code, is_active, created_at, updated_at)
VALUES
  -- GIET departments (Main Campus branch)
  ('00000003-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0000-000000000001', 'Computer Science & AI', 'CS-AI', TRUE, NOW(), NOW()),
  ('00000003-0000-0000-0000-000000000002', '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0000-000000000001', 'Electrical Engineering', 'EE',   TRUE, NOW(), NOW()),
  -- GIET Administration in Extension Centre
  ('00000003-0000-0000-0000-000000000003', '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0000-000000000002', 'Administration',        'ADMIN', TRUE, NOW(), NOW()),
  -- Apex departments (HQ branch)
  ('00000003-0000-0000-0000-000000000004', '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0000-000000000003', 'Engineering',           'ENG',   TRUE, NOW(), NOW()),
  ('00000003-0000-0000-0000-000000000005', '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0000-000000000003', 'Human Resources',       'HR',    TRUE, NOW(), NOW()),
  -- Apex Finance in Regional Office
  ('00000003-0000-0000-0000-000000000006', '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0000-000000000004', 'Finance',               'FIN',   TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- SECTION 4: DESIGNATIONS
-- code is org-unique; level 1=junior, 3=senior
-- ============================================================

INSERT INTO public.designations (id, organization_id, name, code, level, is_active, created_at, updated_at)
VALUES
  -- GIET designations
  ('00000004-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000001', 'Lecturer',           'LEC',    1, TRUE, NOW(), NOW()),
  ('00000004-0000-0000-0000-000000000002', '00000001-0000-0000-0000-000000000001', 'Senior Lecturer',    'SR-LEC', 2, TRUE, NOW(), NOW()),
  ('00000004-0000-0000-0000-000000000003', '00000001-0000-0000-0000-000000000001', 'Head of Department', 'HOD',    3, TRUE, NOW(), NOW()),
  -- Apex designations
  ('00000004-0000-0000-0000-000000000004', '00000001-0000-0000-0000-000000000002', 'Software Engineer',  'SWE',    1, TRUE, NOW(), NOW()),
  ('00000004-0000-0000-0000-000000000005', '00000001-0000-0000-0000-000000000002', 'Senior Engineer',    'SR-SWE', 2, TRUE, NOW(), NOW()),
  ('00000004-0000-0000-0000-000000000006', '00000001-0000-0000-0000-000000000002', 'Team Lead',          'TL',     3, TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- SECTION 5: SYSTEM ROLES
-- System roles: organization_id = NULL, is_system = TRUE
-- Org roles:    organization_id = <org>, is_system = FALSE
-- ============================================================

INSERT INTO public.roles (id, organization_id, name, code, description, is_system, is_active, created_at, updated_at)
VALUES
  -- System-wide roles
  ('00000005-0000-0000-0000-000000000001', NULL, 'Super Administrator', 'super_admin',     'Full system access across all organizations', TRUE, TRUE, NOW(), NOW()),
  ('00000005-0000-0000-0000-000000000002', NULL, 'Administrator',       'admin',           'Organization administrator',                  TRUE, TRUE, NOW(), NOW()),
  ('00000005-0000-0000-0000-000000000003', NULL, 'Manager',             'manager',         'Department or team manager',                  TRUE, TRUE, NOW(), NOW()),
  ('00000005-0000-0000-0000-000000000004', NULL, 'Employee',            'employee',        'Standard employee access',                    TRUE, TRUE, NOW(), NOW()),
  ('00000005-0000-0000-0000-000000000005', NULL, 'HR Manager',          'hr_manager',      'HR module full access',                       TRUE, TRUE, NOW(), NOW()),
  ('00000005-0000-0000-0000-000000000006', NULL, 'Payroll Manager',     'payroll_manager', 'Payroll module full access',                  TRUE, TRUE, NOW(), NOW()),
  -- Org-scoped admin roles
  ('00000005-0000-0000-0000-000000000007', '00000001-0000-0000-0000-000000000001', 'Org Admin', 'org_admin', 'GIET org administrator', FALSE, TRUE, NOW(), NOW()),
  ('00000005-0000-0000-0000-000000000008', '00000001-0000-0000-0000-000000000002', 'Org Admin', 'org_admin', 'Apex org administrator', FALSE, TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- SECTION 6: PERMISSIONS
-- code is the unique identifier used in RLS policies.
-- module + action together are also unique (per schema constraint).
-- ============================================================

INSERT INTO public.permissions (id, code, name, description, module, action, is_active, created_at, updated_at)
VALUES
  -- employees
  ('00000006-0000-0000-0000-000000000001', 'employees:read',             'View Employees',          'View employee records',            'employees',     'read',   TRUE, NOW(), NOW()),
  ('00000006-0000-0000-0000-000000000002', 'employees:write',            'Create/Update Employees', 'Create and update employee records','employees',     'write',  TRUE, NOW(), NOW()),
  ('00000006-0000-0000-0000-000000000003', 'employees:delete',           'Delete Employees',        'Delete employee records',          'employees',     'delete', TRUE, NOW(), NOW()),
  -- departments
  ('00000006-0000-0000-0000-000000000004', 'departments:read',           'View Departments',        'View departments',                 'departments',   'read',   TRUE, NOW(), NOW()),
  ('00000006-0000-0000-0000-000000000005', 'departments:write',          'Manage Departments',      'Create and update departments',    'departments',   'write',  TRUE, NOW(), NOW()),
  ('00000006-0000-0000-0000-000000000006', 'departments:delete',         'Delete Departments',      'Delete departments',               'departments',   'delete', TRUE, NOW(), NOW()),
  -- branches
  ('00000006-0000-0000-0000-000000000007', 'branches:read',              'View Branches',           'View branches',                    'branches',      'read',   TRUE, NOW(), NOW()),
  ('00000006-0000-0000-0000-000000000008', 'branches:write',             'Manage Branches',         'Create and update branches',       'branches',      'write',  TRUE, NOW(), NOW()),
  ('00000006-0000-0000-0000-000000000009', 'branches:delete',            'Delete Branches',         'Delete branches',                  'branches',      'delete', TRUE, NOW(), NOW()),
  -- designations
  ('00000006-0000-0000-0000-000000000010', 'designations:read',          'View Designations',       'View designations',                'designations',  'read',   TRUE, NOW(), NOW()),
  ('00000006-0000-0000-0000-000000000011', 'designations:write',         'Manage Designations',     'Create and update designations',   'designations',  'write',  TRUE, NOW(), NOW()),
  ('00000006-0000-0000-0000-000000000012', 'designations:delete',        'Delete Designations',     'Delete designations',              'designations',  'delete', TRUE, NOW(), NOW()),
  -- roles
  ('00000006-0000-0000-0000-000000000013', 'roles:read',                 'View Roles',              'View roles and permissions',       'roles',         'read',   TRUE, NOW(), NOW()),
  ('00000006-0000-0000-0000-000000000014', 'roles:write',                'Manage Roles',            'Create and update roles',          'roles',         'write',  TRUE, NOW(), NOW()),
  ('00000006-0000-0000-0000-000000000015', 'roles:delete',               'Delete Roles',            'Delete roles',                     'roles',         'delete', TRUE, NOW(), NOW()),
  ('00000006-0000-0000-0000-000000000016', 'roles:assign',               'Assign Roles',            'Assign roles to users',            'roles',         'assign', TRUE, NOW(), NOW()),
  -- payroll
  ('00000006-0000-0000-0000-000000000017', 'payroll:read',               'View Payroll',            'View payroll records',             'payroll',       'read',   TRUE, NOW(), NOW()),
  ('00000006-0000-0000-0000-000000000018', 'payroll:write',              'Manage Payroll',          'Process and manage payroll',       'payroll',       'write',  TRUE, NOW(), NOW()),
  -- attendance
  ('00000006-0000-0000-0000-000000000019', 'attendance:read',            'View Attendance',         'View attendance records',          'attendance',    'read',   TRUE, NOW(), NOW()),
  ('00000006-0000-0000-0000-000000000020', 'attendance:write',           'Manage Attendance',       'Manage attendance records',        'attendance',    'write',  TRUE, NOW(), NOW()),
  -- leave
  ('00000006-0000-0000-0000-000000000021', 'leave:read',                 'View Leave',              'View leave requests',              'leave',         'read',   TRUE, NOW(), NOW()),
  ('00000006-0000-0000-0000-000000000022', 'leave:write',                'Manage Leave',            'Approve or reject leave requests', 'leave',         'write',  TRUE, NOW(), NOW()),
  -- settings
  ('00000006-0000-0000-0000-000000000023', 'settings:read',              'View Settings',           'View system settings',             'settings',      'read',   TRUE, NOW(), NOW()),
  ('00000006-0000-0000-0000-000000000024', 'settings:write',             'Manage Settings',         'Manage system settings',           'settings',      'write',  TRUE, NOW(), NOW()),
  ('00000006-0000-0000-0000-000000000025', 'settings:delete',            'Delete Settings',         'Delete settings keys',             'settings',      'delete', TRUE, NOW(), NOW()),
  -- organizations
  ('00000006-0000-0000-0000-000000000026', 'organizations:read',         'View Organizations',      'View organization records',        'organizations', 'read',   TRUE, NOW(), NOW()),
  ('00000006-0000-0000-0000-000000000027', 'organizations:manage_members','Manage Org Members',     'Add/remove org membership',        'organizations', 'manage', TRUE, NOW(), NOW()),
  -- profiles
  ('00000006-0000-0000-0000-000000000028', 'profiles:read',              'View Profiles',           'View user profiles',               'profiles',      'read',   TRUE, NOW(), NOW()),
  ('00000006-0000-0000-0000-000000000029', 'profiles:write',             'Manage Profiles',         'Manage user profiles',             'profiles',      'write',  TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- SECTION 7: ROLE ↔ PERMISSION ASSIGNMENTS
-- super_admin / admin: all permissions
-- hr_manager: employees (all), attendance, leave, profiles (read)
-- payroll_manager: payroll (all), employees (read)
-- manager: employees (read), attendance (all), leave (all), departments (read)
-- employee: attendance (read), leave (read+write), profiles (read)
-- ============================================================

INSERT INTO public.role_permissions (id, role_id, permission_id, granted_at)
VALUES
  -- super_admin: all 29 permissions
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000001', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000002', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000003', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000004', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000005', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000006', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000007', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000008', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000009', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000010', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000011', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000012', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000013', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000014', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000015', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000016', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000017', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000018', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000019', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000020', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000021', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000022', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000023', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000024', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000025', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000026', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000027', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000028', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000001', '00000006-0000-0000-0000-000000000029', NOW()),

  -- admin: all 29 permissions
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000001', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000002', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000003', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000004', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000005', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000006', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000007', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000008', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000009', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000010', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000011', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000012', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000013', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000014', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000015', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000016', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000017', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000018', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000019', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000020', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000021', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000022', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000023', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000024', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000025', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000026', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000027', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000028', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000002', '00000006-0000-0000-0000-000000000029', NOW()),

  -- hr_manager: employees (all), attendance, leave, profiles (read)
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000005', '00000006-0000-0000-0000-000000000001', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000005', '00000006-0000-0000-0000-000000000002', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000005', '00000006-0000-0000-0000-000000000003', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000005', '00000006-0000-0000-0000-000000000019', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000005', '00000006-0000-0000-0000-000000000020', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000005', '00000006-0000-0000-0000-000000000021', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000005', '00000006-0000-0000-0000-000000000022', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000005', '00000006-0000-0000-0000-000000000028', NOW()),

  -- payroll_manager: payroll (all), employees (read)
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000006', '00000006-0000-0000-0000-000000000001', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000006', '00000006-0000-0000-0000-000000000017', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000006', '00000006-0000-0000-0000-000000000018', NOW()),

  -- manager: employees (read), attendance (all), leave (all), departments (read)
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000003', '00000006-0000-0000-0000-000000000001', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000003', '00000006-0000-0000-0000-000000000004', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000003', '00000006-0000-0000-0000-000000000019', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000003', '00000006-0000-0000-0000-000000000020', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000003', '00000006-0000-0000-0000-000000000021', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000003', '00000006-0000-0000-0000-000000000022', NOW()),

  -- employee: attendance (read), leave (read+write), profiles (read)
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000004', '00000006-0000-0000-0000-000000000019', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000004', '00000006-0000-0000-0000-000000000021', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000004', '00000006-0000-0000-0000-000000000022', NOW()),
  (gen_random_uuid(), '00000005-0000-0000-0000-000000000004', '00000006-0000-0000-0000-000000000028', NOW())
ON CONFLICT ON CONSTRAINT uq_role_permissions_role_permission DO NOTHING;


-- ============================================================
-- SECTION 8: AUTH USERS (local dev only)
-- NOTE: Inserting directly into auth.users is ONLY supported
--       in Supabase local dev (supabase start + seed.sql).
--       NEVER apply this section in production.
--       All users share password: DevPassword123!
--       The handle_new_user() trigger will auto-create a
--       profiles row; we upsert in Section 9 to set full details.
-- ============================================================

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES
  -- GIET users
  ('00000008-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'admin@giet-polytechnic.edu',    crypt('DevPassword123!', gen_salt('bf')),
   NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"GIET Admin User"}',
   FALSE, '', '', '', ''),

  ('00000008-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'hr@giet-polytechnic.edu',       crypt('DevPassword123!', gen_salt('bf')),
   NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"GIET HR Manager User"}',
   FALSE, '', '', '', ''),

  ('00000008-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'emp1@giet-polytechnic.edu',     crypt('DevPassword123!', gen_salt('bf')),
   NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"GIET Employee One"}',
   FALSE, '', '', '', ''),

  ('00000008-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'manager@giet-polytechnic.edu',  crypt('DevPassword123!', gen_salt('bf')),
   NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"GIET Manager User"}',
   FALSE, '', '', '', ''),

  -- Apex users
  ('00000008-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'admin@apex-solutions.dev',      crypt('DevPassword123!', gen_salt('bf')),
   NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Apex Admin User"}',
   FALSE, '', '', '', ''),

  ('00000008-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'hr@apex-solutions.dev',         crypt('DevPassword123!', gen_salt('bf')),
   NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Apex HR Manager User"}',
   FALSE, '', '', '', ''),

  ('00000008-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'emp1@apex-solutions.dev',       crypt('DevPassword123!', gen_salt('bf')),
   NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Apex Employee One"}',
   FALSE, '', '', '', ''),

  ('00000008-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'manager@apex-solutions.dev',    crypt('DevPassword123!', gen_salt('bf')),
   NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Apex Manager User"}',
   FALSE, '', '', '', '')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- SECTION 9: PROFILES
-- The handle_new_user() trigger auto-creates a bare profiles row.
-- We upsert here to set organization_id and full_name explicitly.
-- ============================================================

INSERT INTO public.profiles (id, full_name, organization_id, is_active, created_at, updated_at)
VALUES
  -- GIET profiles
  ('00000008-0000-0000-0000-000000000001', 'GIET Admin User',      '00000001-0000-0000-0000-000000000001', TRUE, NOW(), NOW()),
  ('00000008-0000-0000-0000-000000000002', 'GIET HR Manager User', '00000001-0000-0000-0000-000000000001', TRUE, NOW(), NOW()),
  ('00000008-0000-0000-0000-000000000003', 'GIET Employee One',    '00000001-0000-0000-0000-000000000001', TRUE, NOW(), NOW()),
  ('00000008-0000-0000-0000-000000000004', 'GIET Manager User',    '00000001-0000-0000-0000-000000000001', TRUE, NOW(), NOW()),
  -- Apex profiles
  ('00000008-0000-0000-0000-000000000005', 'Apex Admin User',      '00000001-0000-0000-0000-000000000002', TRUE, NOW(), NOW()),
  ('00000008-0000-0000-0000-000000000006', 'Apex HR Manager User', '00000001-0000-0000-0000-000000000002', TRUE, NOW(), NOW()),
  ('00000008-0000-0000-0000-000000000007', 'Apex Employee One',    '00000001-0000-0000-0000-000000000002', TRUE, NOW(), NOW()),
  ('00000008-0000-0000-0000-000000000008', 'Apex Manager User',    '00000001-0000-0000-0000-000000000002', TRUE, NOW(), NOW())
ON CONFLICT (id) DO UPDATE
  SET full_name       = EXCLUDED.full_name,
      organization_id = EXCLUDED.organization_id,
      updated_at      = NOW();


-- ============================================================
-- SECTION 10: USER ROLE ASSIGNMENTS
-- NOTE: The prevent_self_role_assignment trigger fires on INSERT
-- to user_roles when auth.uid() = profile_id. In seed context
-- (executed via psql / service role, not an authenticated JWT),
-- auth.uid() returns NULL, so the trigger does NOT fire and
-- seed inserts proceed safely.
-- ============================================================

INSERT INTO public.user_roles (id, profile_id, role_id, organization_id, assigned_at, is_active)
VALUES
  -- GIET role assignments
  (gen_random_uuid(), '00000008-0000-0000-0000-000000000001', '00000005-0000-0000-0000-000000000002', '00000001-0000-0000-0000-000000000001', NOW(), TRUE),  -- admin
  (gen_random_uuid(), '00000008-0000-0000-0000-000000000001', '00000005-0000-0000-0000-000000000007', '00000001-0000-0000-0000-000000000001', NOW(), TRUE),  -- org_admin (GIET)
  (gen_random_uuid(), '00000008-0000-0000-0000-000000000002', '00000005-0000-0000-0000-000000000005', '00000001-0000-0000-0000-000000000001', NOW(), TRUE),  -- hr_manager
  (gen_random_uuid(), '00000008-0000-0000-0000-000000000003', '00000005-0000-0000-0000-000000000004', '00000001-0000-0000-0000-000000000001', NOW(), TRUE),  -- employee
  (gen_random_uuid(), '00000008-0000-0000-0000-000000000004', '00000005-0000-0000-0000-000000000003', '00000001-0000-0000-0000-000000000001', NOW(), TRUE),  -- manager
  -- Apex role assignments
  (gen_random_uuid(), '00000008-0000-0000-0000-000000000005', '00000005-0000-0000-0000-000000000002', '00000001-0000-0000-0000-000000000002', NOW(), TRUE),  -- admin
  (gen_random_uuid(), '00000008-0000-0000-0000-000000000005', '00000005-0000-0000-0000-000000000008', '00000001-0000-0000-0000-000000000002', NOW(), TRUE),  -- org_admin (Apex)
  (gen_random_uuid(), '00000008-0000-0000-0000-000000000006', '00000005-0000-0000-0000-000000000005', '00000001-0000-0000-0000-000000000002', NOW(), TRUE),  -- hr_manager
  (gen_random_uuid(), '00000008-0000-0000-0000-000000000007', '00000005-0000-0000-0000-000000000004', '00000001-0000-0000-0000-000000000002', NOW(), TRUE),  -- employee
  (gen_random_uuid(), '00000008-0000-0000-0000-000000000008', '00000005-0000-0000-0000-000000000003', '00000001-0000-0000-0000-000000000002', NOW(), TRUE)   -- manager
ON CONFLICT ON CONSTRAINT uq_user_roles_org_profile_role DO NOTHING;


-- ============================================================
-- SECTION 11: EMPLOYEES
-- employee_code is org-unique (same code can exist in diff org).
-- ============================================================

INSERT INTO public.employees (
  id, organization_id, profile_id, branch_id, department_id, designation_id,
  employee_code, employment_type, employment_status,
  date_of_joining, work_email, is_active, created_at, updated_at
)
VALUES
  -- GIET employees
  ('00000009-0000-0000-0000-000000000001',
   '00000001-0000-0000-0000-000000000001', '00000008-0000-0000-0000-000000000001',
   '00000002-0000-0000-0000-000000000001', '00000003-0000-0000-0000-000000000003', '00000004-0000-0000-0000-000000000003',
   'GIET-0001', 'full_time', 'active', '2020-01-10', 'admin@giet-polytechnic.edu', TRUE, NOW(), NOW()),

  ('00000009-0000-0000-0000-000000000002',
   '00000001-0000-0000-0000-000000000001', '00000008-0000-0000-0000-000000000002',
   '00000002-0000-0000-0000-000000000001', '00000003-0000-0000-0000-000000000003', '00000004-0000-0000-0000-000000000002',
   'GIET-0002', 'full_time', 'active', '2021-04-01', 'hr@giet-polytechnic.edu', TRUE, NOW(), NOW()),

  ('00000009-0000-0000-0000-000000000003',
   '00000001-0000-0000-0000-000000000001', '00000008-0000-0000-0000-000000000003',
   '00000002-0000-0000-0000-000000000001', '00000003-0000-0000-0000-000000000001', '00000004-0000-0000-0000-000000000001',
   'GIET-0003', 'full_time', 'active', '2022-08-15', 'emp1@giet-polytechnic.edu', TRUE, NOW(), NOW()),

  ('00000009-0000-0000-0000-000000000004',
   '00000001-0000-0000-0000-000000000001', '00000008-0000-0000-0000-000000000004',
   '00000002-0000-0000-0000-000000000001', '00000003-0000-0000-0000-000000000002', '00000004-0000-0000-0000-000000000003',
   'GIET-0004', 'full_time', 'active', '2019-03-20', 'manager@giet-polytechnic.edu', TRUE, NOW(), NOW()),

  -- Apex employees
  ('00000009-0000-0000-0000-000000000005',
   '00000001-0000-0000-0000-000000000002', '00000008-0000-0000-0000-000000000005',
   '00000002-0000-0000-0000-000000000003', '00000003-0000-0000-0000-000000000004', '00000004-0000-0000-0000-000000000006',
   'APEX-0001', 'full_time', 'active', '2018-07-01', 'admin@apex-solutions.dev', TRUE, NOW(), NOW()),

  ('00000009-0000-0000-0000-000000000006',
   '00000001-0000-0000-0000-000000000002', '00000008-0000-0000-0000-000000000006',
   '00000002-0000-0000-0000-000000000003', '00000003-0000-0000-0000-000000000005', '00000004-0000-0000-0000-000000000005',
   'APEX-0002', 'full_time', 'active', '2020-09-15', 'hr@apex-solutions.dev', TRUE, NOW(), NOW()),

  ('00000009-0000-0000-0000-000000000007',
   '00000001-0000-0000-0000-000000000002', '00000008-0000-0000-0000-000000000007',
   '00000002-0000-0000-0000-000000000003', '00000003-0000-0000-0000-000000000004', '00000004-0000-0000-0000-000000000004',
   'APEX-0003', 'full_time', 'active', '2023-01-09', 'emp1@apex-solutions.dev', TRUE, NOW(), NOW()),

  ('00000009-0000-0000-0000-000000000008',
   '00000001-0000-0000-0000-000000000002', '00000008-0000-0000-0000-000000000008',
   '00000002-0000-0000-0000-000000000003', '00000003-0000-0000-0000-000000000004', '00000004-0000-0000-0000-000000000006',
   'APEX-0004', 'full_time', 'active', '2017-05-22', 'manager@apex-solutions.dev', TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- SECTION 12: SETTINGS (key-value per organization)
-- ============================================================

INSERT INTO public.settings (id, organization_id, key, value, description, is_public, created_at, updated_at)
VALUES
  (gen_random_uuid(), '00000001-0000-0000-0000-000000000001', 'timezone',              '"Asia/Kolkata"',  'Default timezone',          FALSE, NOW(), NOW()),
  (gen_random_uuid(), '00000001-0000-0000-0000-000000000001', 'date_format',           '"DD/MM/YYYY"',    'Display date format',        TRUE,  NOW(), NOW()),
  (gen_random_uuid(), '00000001-0000-0000-0000-000000000001', 'currency',              '{"code":"INR","symbol":"₹"}', 'Currency config', TRUE, NOW(), NOW()),
  (gen_random_uuid(), '00000001-0000-0000-0000-000000000001', 'working_days_per_week', '5',               'Working days per week',      TRUE,  NOW(), NOW()),
  (gen_random_uuid(), '00000001-0000-0000-0000-000000000001', 'working_hours_per_day', '8',               'Working hours per day',      TRUE,  NOW(), NOW()),

  (gen_random_uuid(), '00000001-0000-0000-0000-000000000002', 'timezone',              '"Asia/Kolkata"',  'Default timezone',          FALSE, NOW(), NOW()),
  (gen_random_uuid(), '00000001-0000-0000-0000-000000000002', 'date_format',           '"DD/MM/YYYY"',    'Display date format',        TRUE,  NOW(), NOW()),
  (gen_random_uuid(), '00000001-0000-0000-0000-000000000002', 'currency',              '{"code":"INR","symbol":"₹"}', 'Currency config', TRUE, NOW(), NOW()),
  (gen_random_uuid(), '00000001-0000-0000-0000-000000000002', 'working_days_per_week', '5',               'Working days per week',      TRUE,  NOW(), NOW()),
  (gen_random_uuid(), '00000001-0000-0000-0000-000000000002', 'working_hours_per_day', '9',               'Working hours per day',      TRUE,  NOW(), NOW())
ON CONFLICT ON CONSTRAINT uq_settings_org_key DO NOTHING;


-- ============================================================
-- SECTION 13: SALARY STRUCTURES (Phase 7 Development Seed)
-- ============================================================

INSERT INTO public.salary_structures (
  id, organization_id, employee_id, base_salary, currency,
  payment_frequency, allowances, deductions, effective_from, is_active, notes, created_at, updated_at
)
VALUES
  -- GIET Employees
  ('0000000c-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000001', '00000009-0000-0000-0000-000000000001',
   60000.00, 'INR', 'monthly',
   '[{"code":"HRA","name":"House Rent Allowance","amount":18000.00,"type":"fixed"},{"code":"SPECIAL","name":"Special Academic Allowance","amount":12000.00,"type":"fixed"}]'::jsonb,
   '[{"code":"PF","name":"Provident Fund","amount":7200.00,"type":"fixed"},{"code":"PT","name":"Professional Tax","amount":200.00,"type":"fixed"}]'::jsonb,
   '2024-01-01', true, 'Faculty leadership pay scale', NOW(), NOW()),

  ('0000000c-0000-0000-0000-000000000002', '00000001-0000-0000-0000-000000000001', '00000009-0000-0000-0000-000000000002',
   48000.00, 'INR', 'monthly',
   '[{"code":"HRA","name":"House Rent Allowance","amount":14400.00,"type":"fixed"},{"code":"SPECIAL","name":"Special Allowance","amount":9600.00,"type":"fixed"}]'::jsonb,
   '[{"code":"PF","name":"Provident Fund","amount":5760.00,"type":"fixed"},{"code":"PT","name":"Professional Tax","amount":200.00,"type":"fixed"}]'::jsonb,
   '2024-01-01', true, 'Senior HR payroll scale', NOW(), NOW()),

  ('0000000c-0000-0000-0000-000000000003', '00000001-0000-0000-0000-000000000001', '00000009-0000-0000-0000-000000000003',
   40000.00, 'INR', 'monthly',
   '[{"code":"HRA","name":"House Rent Allowance","amount":12000.00,"type":"fixed"},{"code":"SPECIAL","name":"Special Allowance","amount":8000.00,"type":"fixed"}]'::jsonb,
   '[{"code":"PF","name":"Provident Fund","amount":4800.00,"type":"fixed"},{"code":"PT","name":"Professional Tax","amount":200.00,"type":"fixed"}]'::jsonb,
   '2024-01-01', true, 'Lecturer compensation structure', NOW(), NOW()),

  ('0000000c-0000-0000-0000-000000000004', '00000001-0000-0000-0000-000000000001', '00000009-0000-0000-0000-000000000004',
   70000.00, 'INR', 'monthly',
   '[{"code":"HRA","name":"House Rent Allowance","amount":21000.00,"type":"fixed"},{"code":"SPECIAL","name":"HOD Allowance","amount":14000.00,"type":"fixed"}]'::jsonb,
   '[{"code":"PF","name":"Provident Fund","amount":8400.00,"type":"fixed"},{"code":"PT","name":"Professional Tax","amount":200.00,"type":"fixed"}]'::jsonb,
   '2024-01-01', true, 'Department Head compensation structure', NOW(), NOW()),

  -- Apex Employees
  ('0000000c-0000-0000-0000-000000000005', '00000001-0000-0000-0000-000000000002', '00000009-0000-0000-0000-000000000005',
   75000.00, 'INR', 'monthly',
   '[{"code":"HRA","name":"House Rent Allowance","amount":22500.00,"type":"fixed"},{"code":"SPECIAL","name":"Special Allowance","amount":15000.00,"type":"fixed"}]'::jsonb,
   '[{"code":"PF","name":"Provident Fund","amount":9000.00,"type":"fixed"},{"code":"PT","name":"Professional Tax","amount":200.00,"type":"fixed"}]'::jsonb,
   '2024-01-01', true, 'Apex executive salary structure', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- SECTION 14: RECRUITMENT SEED DATA (Phase 7 Development Seed)
-- ============================================================

INSERT INTO public.job_postings (
  id, organization_id, department_id, designation_id,
  title, code, description, requirements, location,
  employment_type, vacancy_count, min_salary, max_salary, status, created_at, updated_at
)
VALUES
  ('0000000e-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000001',
   '00000003-0000-0000-0000-000000000001', '00000004-0000-0000-0000-000000000001',
   'Assistant Professor - Artificial Intelligence', 'JOB-GIET-AI-01',
   'Conduct lectures and laboratory coursework in AI, Neural Networks and Machine Learning.',
   'M.Tech or Ph.D in Computer Science / AI with prior academic teaching experience.',
   'GIET Main Campus', 'full_time', 2, 45000.00, 75000.00, 'published', NOW(), NOW()),

  ('0000000e-0000-0000-0000-000000000002', '00000001-0000-0000-0000-000000000001',
   '00000003-0000-0000-0000-000000000001', '00000004-0000-0000-0000-000000000002',
   'Senior AI Laboratory Instructor', 'JOB-GIET-AI-02',
   'Manage practical lab setups, GPU clusters, and student projects.',
   'B.Tech / MCA in Computer Science with Python & Linux proficiency.',
   'GIET Main Campus', 'full_time', 1, 35000.00, 50000.00, 'published', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.candidates (
  id, organization_id, job_posting_id, first_name, last_name, email, phone, stage, source, created_at, updated_at
)
VALUES
  ('0000000f-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000001',
   '0000000e-0000-0000-0000-000000000001', 'Ramesh', 'Sharma', 'ramesh.sharma.test@gmail.com',
   '+91 98480 12345', 'interview', 'direct', NOW(), NOW()),

  ('0000000f-0000-0000-0000-000000000002', '00000001-0000-0000-0000-000000000001',
   '0000000e-0000-0000-0000-000000000001', 'Priya', 'Rao', 'priya.rao.candidate@gmail.com',
   '+91 98480 54321', 'offer', 'direct', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.job_offers (
  id, candidate_id, organization_id, job_posting_id,
  department_id, designation_id, offered_salary, joining_date, status, created_at, updated_at
)
VALUES
  ('00000010-0000-0000-0000-000000000001', '0000000f-0000-0000-0000-000000000002',
   '00000001-0000-0000-0000-000000000001', '0000000e-0000-0000-0000-000000000001',
   '00000003-0000-0000-0000-000000000001', '00000004-0000-0000-0000-000000000001',
   62000.00, '2026-11-01', 'accepted', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.interviews (
  id, candidate_id, organization_id, job_posting_id,
  interview_type, scheduled_at, duration_minutes, interviewer_name, status, created_at, updated_at
)
VALUES
  ('00000011-0000-0000-0000-000000000001', '0000000f-0000-0000-0000-000000000001',
   '00000001-0000-0000-0000-000000000001', '0000000e-0000-0000-0000-000000000001',
   'technical', NOW() + INTERVAL '2 days', 60, 'Dr. K. Srinivas (HOD AI)', 'scheduled', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- SECTION 15: PHASE 8 OPERATIONS & TALENT SEED DATA
-- ============================================================

-- 15.1 Onboarding Checklist Template
INSERT INTO public.onboarding_checklist_templates (
  id, organization_id, name, description, is_default, items, is_active, created_at, updated_at
)
VALUES
  ('00000012-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000001',
   'Standard Faculty & Staff Onboarding Template',
   'Standard checklist for newly hired academic and technical staff members.',
   true,
   '[
     {"title": "Verify Educational Credentials & Identity Documents", "description": "HR team checks original degree certificates and Aadhaar card.", "category": "documentation", "assigned_role": "hr", "is_required": true, "days_due": 3},
     {"title": "Provision Campus Email & Active Directory Credentials", "description": "IT administrator creates institutional email and portal login.", "category": "it_setup", "assigned_role": "it", "is_required": true, "days_due": 2},
     {"title": "Allocate Workstation Laptop & Peripherals", "description": "Issue configured laptop with AI software environments.", "category": "it_setup", "assigned_role": "it", "is_required": true, "days_due": 4},
     {"title": "Department Orientation & Curriculum Briefing", "description": "HOD conducts orientation on teaching load and research labs.", "category": "manager", "assigned_role": "manager", "is_required": true, "days_due": 7},
     {"title": "Bank Account & PF Details Submission", "description": "Employee provides salary account details for direct deposit.", "category": "general", "assigned_role": "employee", "is_required": true, "days_due": 5}
   ]'::jsonb,
   true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 15.2 IT Assets
INSERT INTO public.assets (
  id, organization_id, asset_tag, serial_number, name, category,
  manufacturer, model, purchase_date, warranty_expiry, location,
  status, condition, specifications, created_at, updated_at
)
VALUES
  ('00000013-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000001',
   'AST-GIET-LT-001', 'PF2ABC01', 'Lenovo ThinkPad T14 Gen 3', 'laptop',
   'Lenovo', 'ThinkPad T14', '2025-06-15', '2028-06-15', 'AI Department Lab',
   'assigned', 'excellent', '{"cpu": "Intel Core i7", "ram": "32GB", "storage": "1TB SSD"}'::jsonb,
   NOW(), NOW()),

  ('00000013-0000-0000-0000-000000000002', '00000001-0000-0000-0000-000000000002',
   'AST-GIET-WS-002', 'DL-WS-8902', 'Dell Precision 3660 AI Workstation', 'desktop',
   'Dell', 'Precision 3660', '2025-08-10', '2028-08-10', 'Deep Learning Lab',
   'available', 'good', '{"cpu": "Intel Xeon", "gpu": "RTX 4090 24GB", "ram": "64GB"}'::jsonb,
   NOW(), NOW()),

  ('00000013-0000-0000-0000-000000000003', '00000001-0000-0000-0000-000000000001',
   'AST-GIET-MN-003', 'MN-4K-2701', 'Dell UltraSharp 27" 4K Monitor', 'monitor',
   'Dell', 'U2723QE', '2025-09-01', '2028-09-01', 'Faculty Room 204',
   'available', 'excellent', '{"resolution": "3840x2160", "panel": "IPS Black"}'::jsonb,
   NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 15.3 Asset Assignment
INSERT INTO public.asset_assignments (
  id, organization_id, asset_id, employee_id, assigned_by,
  assigned_date, return_due_date, is_active, notes, created_at, updated_at
)
VALUES
  ('00000014-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000001',
   '00000013-0000-0000-0000-000000000001', '00000009-0000-0000-0000-000000000003',
   '00000008-0000-0000-0000-000000000001', '2026-01-10', '2027-01-10',
   true, 'Allocated for AI Department coursework and development.', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 15.4 Performance Cycle & Goals
INSERT INTO public.performance_cycles (
  id, organization_id, title, start_date, end_date, status, description, created_at, updated_at
)
VALUES
  ('00000015-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000001',
   'Academic Year 2026 Annual Faculty Review', '2026-01-01', '2026-12-31',
   'active', 'Annual evaluation cycle covering teaching efficacy, research papers, and institutional contribution.',
   NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.performance_goals (
  id, organization_id, cycle_id, employee_id, title, description,
  weight, target_date, progress_percent, status, created_at, updated_at
)
VALUES
  ('00000016-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000001',
   '00000015-0000-0000-0000-000000000001', '00000009-0000-0000-0000-000000000003',
   'Publish 2 Research Papers in Scopus/IEEE Journals',
   'Publish peer-reviewed research in applied AI or computer vision.',
   40.00, '2026-11-30', 50, 'in_progress', NOW(), NOW()),

  ('00000016-0000-0000-0000-000000000002', '00000001-0000-0000-0000-000000000001',
   '00000015-0000-0000-0000-000000000001', '00000009-0000-0000-0000-000000000003',
   'Maintain 95%+ Practical Lab Class Attendance & Student Rating',
   'Conduct scheduled AI lab sessions and guide diploma student capstones.',
   30.00, '2026-10-31', 80, 'in_progress', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 15.5 Announcements
INSERT INTO public.announcements (
  id, organization_id, title, body, author_id, status, target_type, priority,
  published_at, expires_at, created_at, updated_at
)
VALUES
  ('00000017-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000001',
   'GIET Polytechnic Annual Industrial AI Symposium 2026',
   'We are pleased to announce our annual student symposium on November 14, 2026. All faculty and staff are invited to register student capstone teams.',
   '00000008-0000-0000-0000-000000000001', 'published', 'all', 'high',
   NOW(), NOW() + INTERVAL '30 days', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 15.6 Employee Tasks
INSERT INTO public.employee_tasks (
  id, organization_id, title, description, creator_id, assignee_id,
  workflow_type, priority, status, start_date, due_date, created_at, updated_at
)
VALUES
  ('00000018-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000001',
   'Prepare Mid-Semester Laboratory Evaluation Roster',
   'Complete marking rubric for AI Diploma third-year lab coursework.',
   '00000008-0000-0000-0000-000000000004', '00000008-0000-0000-0000-000000000003',
   'general', 'high', 'open', '2026-10-10', '2026-10-25', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
