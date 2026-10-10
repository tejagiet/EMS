# Installation and Setup Guide — EMS

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## 1. Prerequisites

Before installing the EMS monorepo, verify the following tools are installed:
- **Node.js:** v20.x or v22.x LTS (`node --version`)
- **pnpm:** v9.x or higher (`pnpm --version` or enable via `corepack enable pnpm`)
- **Git:** v2.30+ (`git --version`)
- **Supabase CLI:** (Optional for local PostgreSQL development: `npx supabase --version`)

---

## 2. Repository Cloning & Dependency Installation

Clone the repository and install all workspace dependencies:
```bash
# Clone the repository
git clone https://github.com/giet-polytechnic/ems.git
cd ems

# Install dependencies across all 9 monorepo workspaces
pnpm install
```

---

## 3. Environment Variable Configuration

Create a `.env.local` file inside `apps/web/` (referencing the placeholder template `.env.example` in the project root):

```env
# Application URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase Connectivity
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Institutional Metadata
NEXT_PUBLIC_INSTITUTION_NAME="GIET Polytechnic College"
NEXT_PUBLIC_DEPARTMENT_NAME="Artificial Intelligence (AI) Department"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

> **Security Warning:** Never commit real secrets or production service keys to source control.

---

## 4. Supabase Database Initialization

### Option A: Hosted Supabase Project
1. Log into your Supabase Dashboard.
2. In the SQL Editor, apply the migrations sequentially from `supabase/migrations/`:
   - `20261009000001_initial_schema.sql`
   - `20261009000002_rls_policies.sql`
   - `20261009000003_auth_triggers.sql`
   - `20261009000004_attendance_shifts_leave.sql`
   - `20261009000005_payroll_module.sql`
   - `20261009000006_recruitment_module.sql`
   - `20261009000007_phase7_enhancements.sql`
   - `20261009000008_phase8_operations_and_talent.sql`
3. Apply development seed data from `supabase/seed.sql`.

### Option B: Local Supabase CLI
```bash
# Start local Supabase containers (Docker required)
pnpm db:start

# Reset and apply all migrations + seed data automatically
pnpm db:reset
```

---

## 5. Development Startup & Verification

```bash
# 1. Run unit and integration tests (100 tests)
pnpm test

# 2. Check strict TypeScript compilation across all packages
pnpm typecheck

# 3. Check linting standards
pnpm lint

# 4. Start Next.js web application
pnpm dev:web
```

The application will be accessible at `http://localhost:3000`.

---

## 6. Seed Accounts for Local Review

| Email | Default Role | Portal URL |
| :--- | :--- | :--- |
| `admin@giet-polytechnic.edu` | Organization Admin | `/portal/org-admin` |
| `hr@giet-polytechnic.edu` | HR Manager | `/portal/hr` |
| `manager@giet-polytechnic.edu` | Manager | `/portal/manager` |
| `emp1@giet-polytechnic.edu` | Employee | `/portal/employee` |
| `superadmin@ems-platform.internal` | Super Admin | `/portal/super-admin` |

*(Password for seeded development users: `DevPassword123!`)*
