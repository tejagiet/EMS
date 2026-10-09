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

## Phase 5 — Core HR: Attendance, Shifts and Leave Management _(upcoming)_

- [ ] Attendance tracking and check-in/out records
- [ ] Shift scheduling and allocation
- [ ] Leave types, leave applications, and approval workflows
- [ ] Leave ledger and balance accrual
