# Employee Management System (EMS)

> A cross-platform employee management system built as a pnpm monorepo supporting **Next.js web**, **Expo Android**, **Tauri Windows desktop**, and **Supabase**.

---

## Project Identity

- **Institution:** GIET Polytechnic College
- **Department:** Artificial Intelligence (AI) Department
- **Batch:** 2024–2027
- **Project:** Employee Management System (EMS)
- **Team:** T-1
- **Project Category:** Industrial Training Project
- **Publisher ID:** `GIETP-AI-IT-EMS-T1-2026`

---

## Prerequisites

| Tool                                | Required Version | Install                                                       |
| ----------------------------------- | ---------------- | ------------------------------------------------------------- |
| **Node.js**                         | ≥ 20.0.0         | [nodejs.org](https://nodejs.org)                              |
| **pnpm**                            | ≥ 9.0.0          | `npm install -g pnpm`                                         |
| **Docker Desktop** (Supabase local) | Latest stable    | [docker.com](https://www.docker.com/products/docker-desktop)  |
| **Git**                             | Any recent       | [git-scm.com](https://git-scm.com)                            |
| **Rust** (desktop only)             | stable           | `rustup.rs`                                                   |
| **Android Studio** (mobile only)    | Latest stable    | [developer.android.com](https://developer.android.com/studio) |

> **Node.js version in use:** v26.5.0  
> **pnpm version in use:** 9.15.9

---

## Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd "Employee Management System - EMS"

# 2. Install all workspace dependencies
pnpm install

# 3. Copy environment variables template
cp .env.example .env.local
# Fill in your values in .env.local (never commit this file)
```

---

## Database & Supabase Local Development

Local development runs via the Supabase CLI inside Docker. No production credentials are required.

### Starting Local Supabase Stack

```bash
# Requires Docker Desktop to be running
pnpm db:start
```

This boots PostgreSQL (port `54322`), Supabase Studio (port `54323`), REST API (port `54321`), and Inbucket email testing (port `54324`).

### Checking Service Status

```bash
pnpm db:status
```

Outputs local API URL, anon key, service role key, and database connection strings.

### Applying Migrations

```bash
pnpm db:migrate
```

Applies pending SQL migrations from `supabase/migrations/` to your local database.

### Creating a New Migration

```bash
pnpm db:new-migration <migration_name>
```

### Seeding Development Data

```bash
# Seed runs automatically on supabase db reset, or apply seed directly
pnpm db:seed
```

Seeds 2 deterministic test organizations (GIET Polytechnic College & Apex Solutions Pvt Ltd), 8 test users (all password: `DevPassword123!`), departments, designations, roles, permissions, and employees.

### Running Database Tests (pgTAP)

```bash
pnpm db:test
```

Runs the 60+ assertion test suite located at `supabase/tests/20261009_phase2_schema.test.sql` against the local database. Tests cover table structures, foreign keys, org isolation triggers, RLS policies, duplicate employee codes, and self-role elevation safeguards.

### Stopping Local Stack

```bash
pnpm db:stop
```

### Local Database Reset

> ⚠️ **CAUTION: DATA LOSS WARNING**  
> `pnpm db:reset` will completely destroy and rebuild the local database, re-running all migrations and seeding fresh data. Never run against staging or production.

```bash
pnpm db:reset
```

---

## Workspace Structure

```
Employee Management System - EMS/
├── apps/
│   ├── web/          # @ems/web     — Next.js 15 (App Router)
│   ├── mobile/       # @ems/mobile  — Expo SDK 52 (Android)
│   └── desktop/      # @ems/desktop — Tauri v2 + React (Windows)
├── packages/
│   ├── types/          # @ems/types          — Shared TypeScript types
│   ├── validation/     # @ems/validation     — Shared Zod schemas
│   ├── config/         # @ems/config         — Shared constants & config
│   ├── feature-registry/ # @ems/feature-registry — Feature flag registry
│   ├── ui/             # @ems/ui             — Shared UI primitives
│   └── shared/         # @ems/shared         — Shared utilities & helpers
├── supabase/
│   ├── config.toml   # Supabase local environment config
│   ├── seed.sql      # Deterministic local seed data
│   ├── migrations/   # Version-controlled SQL schema & RLS migrations
│   └── tests/        # pgTAP automated database tests
├── docs/             # Project documentation
├── .env.example      # Environment variable template
├── .gitignore
├── .prettierrc.json
├── eslint.config.mjs
├── package.json      # Root workspace manifest
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── tsconfig.json     # Root project references
```

---

## Available Commands

### Workspace Commands

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `pnpm dev`           | Start web app dev server                     |
| `pnpm dev:web`       | Start Next.js dev server                     |
| `pnpm dev:mobile`    | Start Expo dev server                        |
| `pnpm dev:desktop`   | Start Tauri dev server                       |
| `pnpm build`         | Build all apps and packages                  |
| `pnpm build:web`     | Build Next.js web app                        |
| `pnpm build:mobile`  | Build Expo Android app (requires EAS)        |
| `pnpm build:desktop` | Build Tauri desktop app                      |
| `pnpm lint`          | Run ESLint across all packages and apps      |
| `pnpm lint:fix`      | Run ESLint with auto-fix                     |
| `pnpm typecheck`     | Run TypeScript type checking across monorepo |
| `pnpm test`          | Run tests across all packages                |
| `pnpm test:ci`       | Run tests in CI mode (verbose)               |
| `pnpm format`        | Format all files with Prettier               |
| `pnpm format:check`  | Check Prettier formatting                    |
| `pnpm clean`         | Clean all build outputs and prune pnpm store |

### Database Commands (Supabase)

| Command                 | Description                                                    |
| ----------------------- | -------------------------------------------------------------- |
| `pnpm db:start`         | Start local Supabase containers (Docker)                       |
| `pnpm db:stop`          | Stop local Supabase containers                                 |
| `pnpm db:status`        | View local URLs, API keys, and connection credentials          |
| `pnpm db:migrate`       | Push and apply local database migrations                       |
| `pnpm db:new-migration` | Create a new timestamped migration file                        |
| `pnpm db:seed`          | Re-apply seed data to the local database                       |
| `pnpm db:test`          | Execute pgTAP automated tests against local database           |
| `pnpm db:reset`         | ⚠️ **Destructive:** Reset local database, re-migrate & re-seed |

### Filter by package

```bash
# Run a command only in a specific package/app
pnpm --filter @ems/web dev
pnpm --filter @ems/types build
pnpm --filter @ems/shared typecheck
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable                          | Used By      | Description                               |
| --------------------------------- | ------------ | ----------------------------------------- |
| `SUPABASE_LOCAL_URL`              | dev tools    | Local Supabase API gateway URL            |
| `SUPABASE_LOCAL_ANON_KEY`         | dev tools    | Local development anon public key         |
| `SUPABASE_LOCAL_SERVICE_ROLE_KEY` | dev tools    | Local service role key                    |
| `SUPABASE_LOCAL_DB_URL`           | dev tools    | Local PostgreSQL direct connection string |
| `NEXT_PUBLIC_SUPABASE_URL`        | web          | Supabase project URL (staging/prod)       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | web          | Supabase anon key (public)                |
| `SUPABASE_SERVICE_ROLE_KEY`       | web (server) | Supabase service role key (secret)        |
| `EXPO_PUBLIC_SUPABASE_URL`        | mobile       | Supabase URL for Expo                     |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`   | mobile       | Supabase anon key for Expo                |
| `TAURI_PRIVATE_KEY`               | desktop      | Tauri update signing key                  |
| `NODE_ENV`                        | all          | Runtime environment                       |

> ⚠️ Never commit `.env.local` or any file containing real credentials.

---

## Technology Stack

| Layer           | Technology            | Version        |
| --------------- | --------------------- | -------------- |
| Web             | Next.js               | ^15.0.0        |
| Mobile          | Expo / React Native   | SDK ~52 / 0.76 |
| Desktop         | Tauri                 | v2             |
| Backend         | Supabase (PostgreSQL) | ^2.120.0       |
| Language        | TypeScript            | ^5.5.0         |
| Validation      | Zod                   | ^3.23.0        |
| Package Manager | pnpm                  | ^9.0.0         |
| Linting         | ESLint (flat config)  | ^9.0.0         |
| Formatting      | Prettier              | ^3.3.0         |

---

## Development Status

See [docs/DEVELOPMENT_STATUS.md](./docs/DEVELOPMENT_STATUS.md) for the full phase-by-phase progress tracker.

**Current phase:** Phase 3 — Authentication, RBAC and Secure Access ✅

See [docs/AUTH_AND_RBAC.md](./docs/AUTH_AND_RBAC.md) for the complete authentication architecture, sequence diagrams, and RBAC matrix.

---

## Contributing

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make changes following the ESLint and Prettier rules
3. Run `pnpm typecheck && pnpm lint && pnpm format:check` before committing
4. Open a pull request

---

## License

Private — All rights reserved.
