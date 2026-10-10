# Administrator and Developer Manual — EMS

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## 1. Monorepo Structure & Package Management

EMS is managed with **pnpm workspaces**. Workspace dependencies are linked locally using `workspace:*`:
```
packages/
  types/              # Domain interfaces and enums
  validation/         # Zod schemas
  config/             # App configuration and constants
  feature-registry/   # Feature flags
  ui/                 # Shared UI primitives
  shared/             # Sanitizers and utility functions
apps/
  web/                # Next.js 15 Web application
  mobile/             # Expo SDK 52 mobile foundation
  desktop/            # Tauri v2 desktop foundation
```

### Essential Workspace Commands
```bash
# Install all dependencies with strict frozen lockfile
pnpm install

# Run Vitest test runner across the entire monorepo
pnpm test

# Run strict TypeScript compiler across all 9 workspaces
pnpm typecheck

# Run ESLint 9 across all packages and apps
pnpm lint

# Format code with Prettier
pnpm format
```

---

## 2. Managing Database Migrations

All schema changes must be applied via incremental SQL migrations in `supabase/migrations/`:
```
20261009000001_initial_schema.sql
20261009000002_rls_policies.sql
20261009000003_auth_triggers.sql
20261009000004_attendance_shifts_leave.sql
20261009000005_payroll_module.sql
20261009000006_recruitment_module.sql
20261009000007_phase7_enhancements.sql
20261009000008_phase8_operations_and_talent.sql
```

### Migration Guidelines
1. **Never alter an existing migration** once merged to `master`. Create a new numbered migration file.
2. **Always enable RLS** on new tables: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
3. **Always set search path empty** on security definer functions: `SET search_path = ''`.
4. **Always attach `set_updated_at()` trigger** to tables with `updated_at`.

---

## 3. User & Role Management via SQL

To grant a role to a user profile in a specific organization:
```sql
INSERT INTO public.user_roles (organization_id, profile_id, role_id, is_active)
SELECT 
  '00000001-0000-0000-0000-000000010001'::uuid, -- Organization UUID
  '<user-profile-uuid>'::uuid,
  r.id,
  true
FROM public.roles r
WHERE r.code = 'hr_manager'
ON CONFLICT (organization_id, profile_id, role_id) DO NOTHING;
```

---

## 4. Troubleshooting Common Issues

### Issue 1: "User is not a member of an active organization"
- **Cause:** User exists in `auth.users`, but profile does not have an `organization_id` assigned.
- **Solution:** Assign the user to an organization using the administrative procedure:
  ```sql
  SELECT public.assign_user_to_organization('<profile-uuid>', '<org-uuid>');
  ```

### Issue 2: "Illegal state transition from 'draft' to 'paid'"
- **Cause:** Attempting to disburse payroll directly without completing formal review and approval.
- **Solution:** Follow the sequential workflow: transition run from `draft` $\to$ `review` $\to$ `approved` $\to$ `paid`.

### Issue 3: "Cannot deactivate employee profile: Clearances pending"
- **Cause:** Offboarding case contains incomplete department checkpoints (e.g. pending laptop return).
- **Solution:** In the IT Assets or Offboarding portal, ensure all clearance items are marked `cleared` before finalizing exit.
