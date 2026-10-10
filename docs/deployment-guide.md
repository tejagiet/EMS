# Production Deployment Guide — EMS

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## 1. Production Architecture Overview

In production, the EMS web application (`apps/web`) is deployed to a high-availability cloud provider (e.g., Vercel or AWS ECS/Node.js) communicating with a managed Supabase PostgreSQL instance.

---

## 2. Production Pre-Flight Checklist

Before deploying:
- [ ] Run `pnpm test` to confirm all 100 tests pass.
- [ ] Run `pnpm typecheck` to confirm 0 TypeScript compiler errors.
- [ ] Run `pnpm lint` to confirm zero lint issues.
- [ ] Ensure all 8 migrations are applied to production Supabase.
- [ ] Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are configured in production environment variables.
- [ ] Change default development passwords and revoke test user privileges.

---

## 3. Production Build & Execution

### Building the Web Application
```bash
# Build the production Next.js bundle
pnpm --filter @ems/web build
```
Verification evidence:
- 34 routes compiled and statically optimized.
- First load JS shared by all routes: ~103 kB.
- Edge Middleware size: 94.6 kB.

### Running in Production (Node.js Environment)
```bash
# Start Next.js production server
pnpm --filter @ems/web start
```
By default, the server binds to port 3000.

---

## 4. Vercel Cloud Deployment

1. Connect the Git repository to Vercel.
2. Set **Root Directory** to `apps/web`.
3. Set **Framework Preset** to Next.js.
4. Configure Build Command:
   ```bash
   pnpm --filter @ems/web build
   ```
5. Configure Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`

---

## 5. Database Backup and Rollback Strategy

### Daily Logical Backups
```bash
# Export schema and data using Supabase CLI
npx supabase db dump -f backup_$(date +%Y%m%d).sql
```

### Rollback Procedure
If a production issue occurs:
1. Revert Git deployment to previous stable tag:
   ```bash
   git checkout tags/v1.0.0 -b hotfix-rollback
   ```
2. Re-run `pnpm --filter @ems/web build` and deploy.
3. If database changes must be rolled back, apply corresponding rollback SQL scripts prepared for each migration.
