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

## Phase 3 — Core Business Modules _(not started)_

- [ ] Employee CRUD
- [ ] Department management
- [ ] Role & permissions system
- [ ] Attendance tracking
- [ ] Leave management

## Phase 4 — Advanced Features _(not started)_

- [ ] Reporting & analytics
- [ ] Notifications
- [ ] File attachments
- [ ] Audit logging
- [ ] Export (PDF, CSV)

## Phase 5 — Production & Deployment _(not started)_

- [ ] CI/CD pipelines
- [ ] Production environment configuration
- [ ] Performance optimization
- [ ] Security audit
- [ ] Staging deployment
