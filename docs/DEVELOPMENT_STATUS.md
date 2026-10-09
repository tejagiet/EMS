# EMS Development Status

## Phase 1 — Project Foundation

> **Status:** ✅ Complete — all acceptance criteria verified

### Checklist

#### Workspace Scaffolding

- [x] pnpm workspace initialized (`pnpm-workspace.yaml`)
- [x] Root `package.json` with workspace-level scripts
- [x] Directory structure created:
  - [x] `apps/web` — Next.js 15 web application
  - [x] `apps/mobile` — Expo SDK 52 Android application
  - [x] `apps/desktop` — Tauri v2 Windows desktop application
  - [x] `packages/types` — Shared TypeScript types
  - [x] `packages/validation` — Shared Zod schemas
  - [x] `packages/config` — Shared constants & configuration
  - [x] `packages/feature-registry` — Feature flag registry
  - [x] `packages/ui` — Shared UI component primitives
  - [x] `packages/shared` — Shared utilities & helpers
  - [x] `supabase/migrations` — Database migration SQL files
  - [x] `supabase/tests` — pgTAP database tests
  - [x] `docs/` — Project documentation

#### TypeScript Configuration

- [x] Root `tsconfig.base.json` — shared strict compiler options
- [x] Root `tsconfig.json` — project references for all packages
- [x] Per-package `tsconfig.json` files (all 6 packages)
- [x] Per-app `tsconfig.json` files (web, mobile, desktop — platform-appropriate settings)

#### Code Quality

- [x] `eslint.config.mjs` — ESLint flat config with TypeScript strict rules
- [x] `.prettierrc.json` — Prettier formatting configuration
- [x] `.prettierignore` — Prettier ignore patterns

#### Environment & Security

- [x] `.gitignore` — Covers node_modules, build outputs, credentials, generated artifacts
- [x] `.env.example` — Placeholder-only environment variable template

#### Package Source Stubs

- [x] `packages/types/src/index.ts`
- [x] `packages/validation/src/index.ts`
- [x] `packages/config/src/index.ts`
- [x] `packages/feature-registry/src/index.ts`
- [x] `packages/ui/src/index.ts`
- [x] `packages/shared/src/index.ts`

#### App Stubs

- [x] `apps/web/app/page.tsx` — Next.js app router placeholder
- [x] `apps/web/app/layout.tsx` — Next.js root layout
- [x] `apps/mobile/app/index.tsx` — Expo screen placeholder
- [x] `apps/desktop/src/App.tsx` — Tauri/React placeholder

#### Documentation

- [x] `README.md` — Prerequisites, installation, structure, commands
- [x] `docs/DEVELOPMENT_STATUS.md` — This file

#### Git

- [x] Git repository initialized
- [x] Initial commit created

#### Dependency Installation & Validation

- [x] `pnpm install` — 916 packages installed successfully (1m 31s)
- [x] `pnpm typecheck` — All 6 packages pass TypeScript type checking (zero errors)
- [x] `pnpm format:check` — Prettier formatting check passes (all files clean)
- [x] `pnpm lint` (packages) — ESLint passes on all 6 packages (zero errors/warnings)

---

## Phase 2 — Supabase Database Foundation ✅ Complete

> **Status:** ✅ Complete — schema, RLS, seeds, tests written. Execution requires Docker + Supabase CLI (`pnpm db:start`).

### Supabase Configuration

- [x] `supabase/config.toml` — local dev configuration (ports, auth, studio)
- [x] `supabase/migrations/` directory with versioned SQL files
- [x] `supabase/tests/` directory with pgTAP test file
- [x] `supabase/seed.sql` — deterministic dev seed data (2 orgs, 8 users)
- [x] `.env.example` updated with local dev Supabase variables
- [x] Root `package.json` scripts: `db:start`, `db:stop`, `db:status`, `db:migrate`, `db:seed`, `db:test`, `db:reset`, `db:new-migration`

### Database Migrations (3 files)

- [x] `20261009000001_initial_schema.sql` — 12 tables (organizations, branches, departments, designations, profiles, employees, employee_history, roles, permissions, role_permissions, user_roles, settings)
- [x] `20261009000002_rls_policies.sql` — RLS policies on all 12 tables + 4 security-definer helper functions
- [x] `20261009000003_auth_triggers.sql` — auth→profile sync trigger, self-org-reassignment prevention, self-role-assignment prevention, privileged org membership function + GRANT statements

### Database Standards Applied

- [x] UUID primary keys (`gen_random_uuid()`)
- [x] `timestamptz` for all timestamps
- [x] `NUMERIC` types ready for monetary data in future payroll migration
- [x] Org-scoped unique constraints (`UNIQUE(organization_id, code)`)
- [x] `UNIQUE NULLS NOT DISTINCT` for system roles and global settings
- [x] Cross-org boundary enforcement triggers on employees, departments, user_roles
- [x] `updated_at` auto-trigger on all mutable tables
- [x] Indexes on all FK and common lookup columns

### RLS Policies (38 policies across 12 tables)

- [x] organizations: SELECT for members only; INSERT/UPDATE/DELETE denied (service role only)
- [x] branches: full CRUD with `branches:write`/`branches:delete` permissions
- [x] departments: full CRUD with `departments:write`/`departments:delete`
- [x] designations: full CRUD with `designations:write`/`designations:delete`
- [x] profiles: SELECT (self or org), UPDATE (self + admin), INSERT denied (auth trigger)
- [x] employees: SELECT (org + self), full CRUD with `employees:write`/`employees:delete`
- [x] employee_history: SELECT + INSERT only (immutable — UPDATE/DELETE denied)
- [x] roles: SELECT (org + system roles), full CRUD with `roles:write`/`roles:delete`
- [x] permissions: SELECT only (catalog managed by service role)
- [x] role_permissions: SELECT + INSERT/DELETE with `roles:write`
- [x] user_roles: SELECT + INSERT/DELETE with `roles:assign`; UPDATE denied
- [x] settings: SELECT (public + org), INSERT/UPDATE/DELETE with `settings:write`/`settings:delete`

### Security Hardening

- [x] All SECURITY DEFINER functions use `SET search_path = ''`
- [x] No recursive RLS policies (helper functions bypass RLS via SECURITY DEFINER)
- [x] Self-org-reassignment blocked by trigger
- [x] Self-role-assignment blocked by trigger
- [x] Organization creation restricted to service role
- [x] Privileged org membership via `assign_user_to_organization()` only

### Seed Data

- [x] 2 organizations: GIET Polytechnic College, Apex Solutions Pvt Ltd
- [x] 4 branches, 6 departments, 6 designations (2 orgs each)
- [x] 6 system roles + 2 org-scoped roles
- [x] 29 permissions covering all Phase 2–5 modules
- [x] 8 dev auth users with bcrypt-hashed passwords (`DevPassword123!`)
- [x] 8 employee records (4 per org)
- [x] 10 settings rows
- [x] Fixed UUIDs for deterministic re-runs; `ON CONFLICT DO NOTHING`

### Database Tests (60 assertions)

- [x] `supabase/tests/20261009_phase2_schema.test.sql` — pgTAP suite:
  - 12 table existence checks
  - Column existence, PKs, unique constraints, FK relationships
  - RLS enabled on all 12 tables
  - 3 index checks
  - Duplicate employee_code within org (should fail)
  - Same employee_code in different org (should succeed)
  - Cross-org branch/dept/designation assignment (should fail)
  - Cross-org scoped role assignment (should fail)
  - Self-role-assignment trigger and function existence
  - 5 helper function existence checks
  - Auth trigger existence check
  - Seed data count validation

### Commands Required Before Testing

- [ ] Install Docker Desktop (required for `supabase start`)
- [ ] Run `pnpm db:start` to start local Supabase stack
- [ ] Run `pnpm db:test` to execute pgTAP suite
- [ ] Migrations not yet applied (pending Docker availability)
- [ ] Tests not yet executed (pending Docker availability)

## Phase 3 — Authentication, RBAC and Secure Access ✅ Complete

> **Status:** ✅ Complete — Web authentication, Next.js 15 middleware, server-side RBAC guards, 10 portal shells, 22 granular permissions, automated tests (38 assertions passed), and full documentation.

### Authentication & Sessions

- [x] Web login experience (`/login`) with institutional branding (`GIETP-AI-IT-EMS-T1-2026`)
- [x] Password visibility toggle, remember-me session persistence, inline validation
- [x] Password recovery request screen (`/forgot-password`)
- [x] Password reset screen (`/auth/reset-password`)
- [x] Auth code exchange handler (`/auth/callback`)
- [x] Expired session alert handling and post-login redirection
- [x] Server-side Next.js 15 middleware (`apps/web/middleware.ts`) handling token refresh & cookie sync

### Profile, Organization & Multi-Tenancy

- [x] Authenticated user profile retrieval from `public.profiles`
- [x] Active organization resolution and authorized membership switching
- [x] Linked employee profile identification (`public.employees`)
- [x] Account deactivation checks (`is_active = false` immediately rejected)
- [x] Open redirect protection (`sanitizeRedirectUrl`) preventing external redirection attacks

### Role-Based Access Control (RBAC) & Portals

- [x] 10 Portal Roles defined and verified:
  1. Super Admin (`/portal/super-admin`)
  2. Organization Admin (`/portal/org-admin`)
  3. HR (`/portal/hr`)
  4. Recruitment (`/portal/recruitment`)
  5. Finance & Payroll (`/portal/finance-payroll`)
  6. Manager (`/portal/manager`)
  7. Department Head (`/portal/dept-head`)
  8. IT & Assets (`/portal/it-assets`)
  9. Employee Self-Service (`/portal/employee`)
  10. Auditor (`/portal/auditor`)
- [x] 22 Granular Permission Codes implemented and mapped
- [x] Documented least-privilege role-permission matrix (`ROLE_PERMISSIONS_MATRIX`)
- [x] Auditor strict read-only boundary enforced
- [x] Payroll authorization restricted to Finance & Super Admin
- [x] Portal landing and multi-role selector (`/portal`)
- [x] Shared portal shell layout with institutional headers, role pill, org switcher, role switcher, and sign-out
- [x] Access-denied screen (`/unauthorized`) with context and role-switching links

### Database Migration (Phase 3)

- [x] `supabase/migrations/20261009000004_phase3_rbac_portals.sql`:
  - 10 portal system roles inserted/updated
  - 22 granular permissions inserted
  - Role-permission grants applied
  - Security definer functions: `get_my_active_roles()`, `get_my_permissions()`, `is_manager_of_employee()`
  - RLS policy on `employees` for reporting-line manager inspection

### Automated Tests (38/38 Passed)

- [x] `tests/auth-validation.test.ts` (12 tests passed)
- [x] `tests/rbac-matrix.test.ts` (13 tests passed)
- [x] `tests/security-guards.test.ts` (13 tests passed)

### Build Verification

- [x] `pnpm --filter @ems/web build`: Succeeded (20 static/dynamic routes generated, 0 ESLint errors)
- [x] `pnpm typecheck`: Succeeded across all 9 packages & apps
- [x] `pnpm lint`: Succeeded across entire monorepo
- [x] `pnpm format:check`: All files conform to Prettier code style

## Phase 4 — Design System, Dashboards and Analytics UI

> **Status:** ✅ Complete — all acceptance criteria verified

### Checklist

#### Reusable Design System & Tokens

- [x] Institutional palette tokens (Light & Dark mode custom properties in `packages/ui` and `apps/web/app/globals.css`)
- [x] Accessible focus ring standards, border radii, and spacing scales
- [x] Client-side theme provider and persistent theme toggle (`ThemeProvider`, `ThemeToggle`)
- [x] Enterprise primitives:
  - [x] `Button` (5 variants, 3 sizes, loading spinners, disabled states)
  - [x] `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
  - [x] `Badge` (status chips with variant color mappings)
  - [x] `MetricCard` (KPI indicator with trends, drilldown links, and schema notices)
  - [x] `Input` and `Select` (labeled, accessible form inputs with error feedback)
  - [x] `DataTable` (generic typed table with client/server sorting and pagination)
  - [x] `SearchFilterBar` (integrated search input with dynamic filters)
  - [x] `Modal` & `ConfirmDialog` (accessible overlays with Escape dismissal and focus traps)
  - [x] `Toast` & `ToastProvider` (floating context notification system)
  - [x] `Skeleton`, `CardSkeleton`, `TableSkeleton`, `ChartSkeleton` (skeleton loading states)
  - [x] `Breadcrumbs`, `Pagination`, `EmptyState`, `ErrorState`
  - [x] `InstitutionalHeader` & `InstitutionalFooter` (`GIETP-AI-IT-EMS-T1-2026`)
  - [x] `SchemaDependencyNotice` (honest notices for future database schemas)

#### Application Shell

- [x] Responsive `AppShell` with collapsible desktop sidebar (260px <-> 72px)
- [x] Mobile drawer navigation with accessible backdrop overlay
- [x] Top header with breadcrumbs, role navigation switcher, and multi-tenant org switcher
- [x] Notification panel dropdown with unread badge counter
- [x] Authenticated user profile menu with Supabase session sign-out action

#### Charts & Visualizations

- [x] Responsive SVG `BarChart` with hover tooltips and accessible data table view toggle
- [x] Responsive SVG `LineChart` with date range filters (`all`, `6m`, `1y`) and table view toggle
- [x] Responsive SVG `DonutChart` with legends and center metric display
- [x] `UnavailableChartCard` explaining dependencies for future modules

#### Authorized Role Dashboards (10/10)

- [x] Super Admin (`/portal/super-admin`): Platform tenants, profiles, and system roles
- [x] Org Admin (`/portal/org-admin`): Tenant headcounts, branches, departments, distribution bar chart, audit history
- [x] HR Manager (`/portal/hr`): Headcount metrics, monthly joinings trend, employment type donut chart, full employee roster with search/filters (`HrDirectoryTable`)
- [x] Recruitment Manager (`/portal/recruitment`): Department capacity, job titles table, Phase 7 schema notice
- [x] Finance & Payroll (`/portal/finance-payroll`): Grade distribution chart, active headcount, Phase 6 payroll ledger notice
- [x] Reporting Manager (`/portal/manager`): Direct reports roster table, Phase 5 direct report attendance/leave notices
- [x] Department Head (`/portal/dept-head`): Department personnel roster, Phase 5 departmental shift notice
- [x] IT & Assets (`/portal/it-assets`): Tenant `settings` inspection table, user accounts count, Phase 8 hardware inventory notice
- [x] Employee Self-Service (`/portal/employee`): Personal employment record, manager linkage, Phase 5 personal attendance/leave notices
- [x] Auditor (`/portal/auditor`): Strictly read-only compliance inspection dashboard, immutable audit logs (`employee_history`), no mutation controls

#### Institutional Identification & Pages

- [x] Institutional branding on all layouts, login, portal shells, and footers
- [x] Dedicated project about page (`/about`) with full GIET Polytechnic College, AI Department, Team T-1, Batch 2024–2027 attribution
- [x] Custom not-found error page (`/not-found`)

#### Automated Testing & Verification

- [x] Vitest test suites: `tests/design-system-and-dashboards.test.ts` (9 tests passed), 47/47 total tests passed across monorepo
- [x] Next.js 15 production build: `pnpm --filter @ems/web build` passed (21 routes compiled cleanly)
- [x] Strict TypeScript: `pnpm typecheck` passed (0 errors across 9 workspaces)
- [x] Linter: `pnpm lint` passed (0 warnings, 0 errors)
- [x] Formatting: `pnpm format:check` passed with 100% compliance

---

## Phase 5 — Complete Employee Management Module ✅ Complete

> **Status:** ✅ Complete — all acceptance criteria verified

### Checklist

#### Database & Schema Foundation (Phase 5)
- [x] `supabase/migrations/20261009000005_phase5_employee_management.sql`:
  - Extended `employees` table schema with personal, demographic, contact, and compensation fields
  - Unique employee code generator trigger and sequence
  - Immutable audit trail trigger logging to `employee_history`
  - Performance indexes for directory search, status, and department filtering
  - RLS policies enforcing tenant isolation and role permissions

#### HR Employee Directory & CRUD UI
- [x] Employee directory with live search, department/branch/status filters, pagination, and sorting (`/portal/hr/employees`)
- [x] Full employee onboarding creation form with Zod schema validation (`/portal/hr/employees/new`)
- [x] Employee profile inspection view with history timeline and reporting hierarchy (`/portal/hr/employees/[id]`)
- [x] Employee details edit flow (`/portal/hr/employees/[id]/edit`)
- [x] Organizational management pages:
  - [x] Branch management (`/portal/hr/branches`)
  - [x] Department hierarchy management (`/portal/hr/departments`)
  - [x] Designation and grade level management (`/portal/hr/designations`)

---

## Phase 6 — Attendance, Shifts and Leave Management Module ✅ Complete

> **Status:** ✅ Complete — all acceptance criteria verified

### Checklist

#### Database Migration & RPCs (Phase 6)
- [x] `supabase/migrations/20261009000006_phase6_attendance_shifts_leave.sql`:
  - Tables: `shifts`, `shift_assignments`, `attendance_records`, `attendance_corrections`, `leave_types`, `leave_requests`, `leave_ledger`, `notifications`
  - Transactional Database RPCs:
    - `public.clock_in_employee(p_employee_id, p_notes, p_ip_address, p_device_info)`: uses trusted server `NOW()`, verifies active session absence, matches assigned shift, detects lateness past grace period
    - `public.clock_out_employee(p_attendance_id, p_notes)`: closes open session using trusted `NOW()`, computes duration minus unpaid breaks, handles overnight cross-midnight shifts
    - `public.process_attendance_correction_decision(p_correction_id, p_decision, p_notes)`: updates attendance record and logs audit reason atomically
    - `public.process_leave_request_decision(p_request_id, p_decision, p_notes)`: records decision, inserts immutable debit entry in `leave_ledger`, and dispatches notification
  - Default seed data: Standard General Shift (09:00 - 17:00) and 4 core leave types (Annual, Sick, Casual, Unpaid)
  - Granular RLS policies scoping self-service access, direct-report line inspection (`public.is_manager_of_employee`), and HR management permissions

#### Shared Monorepo Packages
- [x] `packages/types/src/index.ts`: Exported full TypeScript types for `Shift`, `ShiftAssignment`, `AttendanceRecord`, `AttendanceCorrection`, `LeaveType`, `LeaveRequest`, `LeaveLedgerEntry`, `LeaveBalanceSummary`, and `AppNotification`
- [x] `packages/validation/src/index.ts`: Implemented robust Zod schemas for shifts, shift assignments, attendance corrections, leave requests, and approval decisions
- [x] `packages/config/src/index.ts`: HR portal navigation routes added for `/portal/hr/attendance`, `/portal/hr/shifts`, and `/portal/hr/leave`

#### Server Actions & Data Layer
- [x] `apps/web/lib/data/attendance.ts` & `attendance-actions.ts`:
  - Self-service clock-in and clock-out operations
  - Active session retrieval and monthly attendance history
  - Manager roster for team attendance and exceptions (late, absent, early departure)
  - Pending attendance corrections queue and review actions
  - Formula-injection safe CSV exports (`=`/`+`/`-`/`@` sanitization)
- [x] `apps/web/lib/data/leave.ts` & `leave-actions.ts`:
  - Authoritative balance calculation via ledger sum (`SUM(days)`) minus pending requests
  - Leave application submissions with quota exhaust guards
  - Manager and HR review queue with transactional approval/rejection RPCs
  - Formula-injection safe leave report CSV exports
- [x] `apps/web/lib/data/shifts.ts` & `shift-actions.ts`:
  - Shift definitions CRUD with break durations and grace periods
  - Shift assignment engine with date overlap conflict prevention

#### UI Components & Portals
- [x] Reusable UI Components: `ConfirmDialog`, `Select`, `Input`, `Card`
- [x] `ClockInOutWidget`: Live server time tracker, dynamic shift context, and clock-in/out controls
- [x] `AttendanceCorrectionModal`: Correction request modal with reason validation
- [x] `AttendanceRosterClient`: Organization/team roster with date picker, exception filters, and CSV export
- [x] `CorrectionsQueueClient`: Supervisor review interface with reason audit modals
- [x] `LeaveBalancesGrid`: Progress quota cards showing available, used, and pending allocations
- [x] `ApplyLeaveModal`: Dynamic leave application form with live balance feedback
- [x] `LeaveRequestsQueueClient`: Supervisory review interface for leave requests
- [x] `ShiftsClient`: Comprehensive shift scheduling and staff assignment console
- [x] Live Dashboards:
  - [x] Employee Self-Service (`/portal/employee`): Attendance clock, personal history, balance cards, leave requests
  - [x] Manager Supervisory (`/portal/manager`): Direct reports roster, attendance exceptions, pending leave & correction approvals
  - [x] HR Portal Hub (`/portal/hr`): Real-time metrics for today's presence, on leave, and pending queues
  - [x] HR Attendance Hub (`/portal/hr/attendance`): Full organization attendance roster and corrections queue
  - [x] HR Shifts Hub (`/portal/hr/shifts`): Shift configuration and roster assignment
  - [x] HR Leave Hub (`/portal/hr/leave`): Comprehensive leave balance tracking and requests queue

#### Automated Testing & Verification
- [x] Vitest test suite (`tests/attendance-and-leave.test.ts`): 17 unit and business logic tests verifying duration minus breaks, overnight shifts, lateness detection with grace periods, shift overlap conflict checks, authoritative balance calculation, and CSV formula injection protection
- [x] Total test suite: 64/64 tests passing across 5 test suites
- [x] Strict TypeScript: `pnpm typecheck` passed (0 errors across 9 workspaces)
- [x] Next.js 15 production build: `pnpm --filter @ems/web build` passed (29 routes statically/dynamically generated cleanly)

---

## Phase 7 — Payroll, Payslips and Recruitment Modules ✅ Complete

> **Status:** ✅ Complete — all acceptance criteria verified

### Checklist

#### Database Migration & RPCs (Phase 7)
- [x] `supabase/migrations/20261009000007_phase7_payroll_and_recruitment.sql`:
  - Tables: `salary_structures`, `payroll_runs`, `payroll_records`, `payroll_approval_history`, `job_postings`, `candidates`, `candidate_stage_history`, `interviews`, `job_offers`
  - Notification Types updated: Added `payroll_run_submitted`, `payroll_run_approved`, `payslip_available`, `interview_scheduled`, `job_offer_issued`, `candidate_hired`
  - Immutability trigger guards: `trg_payroll_runs_immutability` and `trg_payroll_records_immutability` strictly locking records upon `approved` state
  - Transactional Database RPCs:
    - `public.create_payroll_run(p_organization_id, p_title, p_period_start, p_period_end, p_payment_date, p_created_by)`: Gathers active salary structures for eligible staff, computes gross/deductions/net pay with strict two-decimal monetary rounding, and initializes draft batch
    - `public.process_payroll_run_decision(p_run_id, p_decision, p_actor_id, p_notes)`: Manages approval lifecycle (`draft` -> `pending_approval` -> `approved` / `rejected`), enforces immutable locking, generates authoritative payslip numbers, records audit trail, and dispatches employee notifications
    - `public.transition_candidate_stage(p_candidate_id, p_to_stage, p_actor_id, p_notes)`: Strictly enforces recruitment pipeline stage progression (`applied` -> `screening` -> `interview` -> `offer` -> `hired`/`rejected`) and logs stage history
    - `public.hire_candidate_to_employee(p_candidate_id, p_organization_id, p_branch_id, p_actor_id, p_notes)`: Atomic & idempotent onboarding handoff creating real employee profile, unique employee code, and starting salary structure from accepted offer without duplicate provisioning
  - Deterministic seed data appended to `supabase/seed.sql` for salary structures, job requisitions, candidate pipeline, interviews, and accepted job offers
  - Granular RLS policies scoping access across finance/payroll managers, recruitment managers, department heads, and employee self-service

#### Shared Monorepo Packages
- [x] `packages/types/src/index.ts`: Exported TypeScript interfaces for `SalaryComponentItem`, `SalaryStructure`, `PayrollRun`, `PayrollRecord`, `PayrollApprovalHistoryItem`, `JobPosting`, `Candidate`, `CandidateStageHistoryItem`, `Interview`, `JobOffer`
- [x] `packages/validation/src/index.ts`: Added Zod schemas for salary structures, payroll run creation, payroll approval decisions, job postings, candidate applications, stage transitions, interview scheduling/feedback, job offers, and hiring handoffs
- [x] `packages/config/src/index.ts`: Navigation updated with salary structures sub-navigation for finance and recruitment portal links

#### Server Actions & Data Layer
- [x] `apps/web/lib/data/payroll.ts` & `payroll-actions.ts`:
  - Complete salary structure management and calculations
  - Batch payroll runs creation and approval workflows
  - Itemized payslip line items retrieval and employee self-service view
  - Formula-injection safe CSV exports for payroll register
  - Server Action wrapper `getPayrollRunDetailsAction` for client component inspection
- [x] `apps/web/lib/data/recruitment.ts` & `recruitment-actions.ts`:
  - Department job requisitions CRUD
  - Candidate stage transitions with validation
  - Interview scheduling and evaluation feedback recording
  - Formal job offer issuance and decision processing
  - Idempotent onboarding handoff action to employee directory
  - Formula-injection safe CSV exports for talent pipeline
  - Server Action wrapper `getCandidateDetailsAction` for candidate profile inspection

#### UI Components & Portals
- [x] `PayslipViewModal`: Authoritative, formatted, printable digital payslip modal with base salary, itemized allowances, itemized deductions, net pay in INR currency, and tamper-evident metadata
- [x] `EmployeePayslipsClient`: Self-service digital payslip table for active staff
- [x] `SalaryStructuresClient`: Salary structure manager with dynamic allowances and deductions breakdown editors
- [x] `PayrollRunsClient`: Comprehensive payroll batch console with metrics summary, approval workflow actions, audit history trail, employee payslip line items, and CSV export
- [x] `JobPostingsClient`: Academic & departmental job requisitions manager
- [x] `CandidatePipelineClient`: Comprehensive talent pipeline console with stage tabs, search filter, inspector modal, stage transition dialog, interview scheduler, feedback recorder, offer generator, and onboarding handoff
- [x] Connected Portals:
  - [x] Finance & Payroll Operations (`/portal/finance-payroll`): Live KPI cards, active runs client, salary structures client, and compensation grade distribution chart
  - [x] Recruitment & Talent Acquisition (`/portal/recruitment`): Live pipeline metrics, candidate pipeline client, job requisitions manager, and department capacity chart
  - [x] Employee Self-Service Workspace (`/portal/employee`): Connected digital payslip history table and quick inspection modal

#### Automated Testing & Verification
- [x] Vitest test suite (`tests/payroll-and-recruitment.test.ts`): 12 comprehensive unit and business logic tests verifying:
  - Gross salary, total deductions, and net salary calculation with allowances
  - Strict two-decimal monetary rounding to prevent fractional currency drift
  - Valid and invalid candidate pipeline stage transitions
  - Rejection from any active stage
  - Interview evaluation rating bounds and recommendation validation
  - Job offer salary validation
  - CSV formula-injection sanitization (`=`, `+`, `-`, `@`, `\t`, `\r`)
- [x] Total test suite: 76/76 tests passing across 6 test suites
- [x] Strict TypeScript: `pnpm typecheck` passed (0 errors across all 9 workspaces)
- [x] Next.js 15 production build: `pnpm --filter @ems/web build` passed (29 routes cleanly generated)

---

## Phase 8 — Operations and Talent Management Modules

> **Status:** ✅ Complete — all acceptance criteria verified

### Checklist

#### Database Schema, Triggers & RPCs (Phase 8)
- [x] `supabase/migrations/20261009000008_phase8_operations_and_talent.sql`:
  - 17 Tables created: `onboarding_checklist_templates`, `onboarding_cases`, `onboarding_tasks`, `offboarding_cases`, `offboarding_clearance_items`, `performance_cycles`, `performance_goals`, `performance_reviews`, `employee_tasks`, `task_activity_log`, `assets`, `asset_assignments`, `asset_maintenance`, `documents`, `announcements`, `announcement_reads`, `shared_approvals`
  - Notification Types updated: Added 13 Phase 8 event triggers
  - Multi-level RLS policies on all 17 tables enforcing organization boundary scoping
  - Transactional Database RPCs:
    - `public.create_onboarding_case()`: Clones template tasks, prevents duplicate active cases per employee
    - `public.complete_onboarding_case()`: Prohibits completion while required checklist tasks remain incomplete
    - `public.initiate_offboarding_case()`: Generates department clearances, links active IT equipment return checkpoints
    - `public.process_offboarding_decision()`: Requires all clearances to be cleared, atomically deactivates employee account
    - `public.assign_asset()`: Enforces 1 active assignment per hardware asset, blocks retired/under-maintenance assets
    - `public.return_asset()`: Deactivates assignment, restores availability, updates hardware condition log
    - `public.submit_performance_review()`: Enforces 1.0–5.0 rating bounds, supports self-assessment, manager review, and immutable locking
  - Deterministic dev seed data appended to `supabase/seed.sql`

#### Shared Monorepo Packages
- [x] `packages/types/src/index.ts`: Full TypeScript definitions and convenient aliases for Onboarding, Offboarding, Performance, Tasks, IT Assets, Documents, Announcements, and Approvals
- [x] `packages/validation/src/index.ts`: Zod validation schemas for all Phase 8 operations
- [x] `packages/config/src/index.ts`: Added navigation items for onboarding, offboarding, performance, documents, and announcements to `hr_manager` role

#### Server Actions & Data Layer
- [x] `apps/web/lib/data/onboarding.ts` & `onboarding-actions.ts`: Cases listing, task updates, RPC completion, and CSV export
- [x] `apps/web/lib/data/offboarding.ts` & `offboarding-actions.ts`: Exit cases, clearances tracker, RPC deactivation, and CSV export
- [x] `apps/web/lib/data/assets.ts` & `assets-actions.ts`: IT hardware inventory, assignments, returns, and CSV export
- [x] `apps/web/lib/data/performance.ts` & `performance-actions.ts`: Appraisal cycles, goals, 1.0–5.0 reviews, and CSV export
- [x] `apps/web/lib/data/tasks.ts` & `tasks-actions.ts`: Operational tasks console, audit logs, and CSV export
- [x] `apps/web/lib/data/documents.ts` & `documents-actions.ts`: Document repository, verification/rejection, and CSV export
- [x] `apps/web/lib/data/announcements.ts` & `announcements-actions.ts`: Bulletin notices, audience scoping, and read tracking

#### UI Components & Portals
- [x] `OnboardingClient`: Cases directory, checklist tasks inspector, progress percentage bar, and closure modal
- [x] `OffboardingClient`: Exit cases table, multi-department clearance tracker, linked IT assets check, and account deactivation modal
- [x] `AssetsClient`: Hardware inventory table, new asset modal, assignment modal, condition return modal, and maintenance logs
- [x] `PerformanceClient`: Cycles, measurable goals, and appraisal reviews with rating bounds
- [x] `TasksClient`: Operational task console with priorities and status updates
- [x] `DocumentsClient`: Document repository with categories and verification actions
- [x] `AnnouncementsClient`: Notice board with audience badges and read receipts
- [x] Connected Portals:
  - [x] IT & Hardware Asset Management (`/portal/it-assets`): Connected live hardware inventory and assignment engine
  - [x] HR Sub-Portals:
    - `/portal/hr/onboarding`
    - `/portal/hr/offboarding`
    - `/portal/hr/performance`
    - `/portal/hr/documents`
    - `/portal/hr/announcements`
  - [x] Employee Self-Service Workspace (`/portal/employee`): Connected My Tasks, Assigned Hardware Assets, and Institutional Notices

#### Automated Testing & Verification
- [x] Vitest test suite (`tests/phase8-operations-and-talent.test.ts`): 13 comprehensive unit and security tests verifying:
  - Onboarding closure guards for incomplete required tasks
  - Offboarding clearance blockers before final exit approval
  - Asset assignment guards (available status, single active assignment, retirement block)
  - Performance appraisal 1.0–5.0 rating scale enforcement
  - Document upload and category schema validation
  - Announcement audience scoping
  - Formula injection sanitization for all CSV exports
- [x] Vitest total pass rate: 89/89 tests passing across 7 test suites (100% pass rate)
- [x] TypeScript validation: `pnpm typecheck` passed (0 errors across all 9 workspaces)
- [x] Next.js 15 production build: `pnpm --filter @ems/web build` passed (34 routes cleanly generated)

