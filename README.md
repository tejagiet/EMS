# Employee Management System (EMS)

> A cross-platform employee management system built as a pnpm monorepo supporting **Next.js web**, **Expo Android**, **Tauri Windows desktop**, and **Supabase**.

---

## Prerequisites

| Tool                             | Required Version | Install                                                       |
| -------------------------------- | ---------------- | ------------------------------------------------------------- |
| **Node.js**                      | ≥ 20.0.0         | [nodejs.org](https://nodejs.org)                              |
| **pnpm**                         | ≥ 9.0.0          | `npm install -g pnpm`                                         |
| **Git**                          | Any recent       | [git-scm.com](https://git-scm.com)                            |
| **Rust** (desktop only)          | stable           | `rustup.rs`                                                   |
| **Android Studio** (mobile only) | Latest stable    | [developer.android.com](https://developer.android.com/studio) |

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
│   ├── migrations/   # SQL migration files
│   └── tests/        # pgTAP database tests
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

### Root (run from workspace root)

| Command              | Description                                      |
| -------------------- | ------------------------------------------------ |
| `pnpm dev`           | Start web app dev server                         |
| `pnpm dev:web`       | Start Next.js dev server                         |
| `pnpm dev:mobile`    | Start Expo dev server                            |
| `pnpm dev:desktop`   | Start Tauri dev server                           |
| `pnpm build`         | Build all apps and packages                      |
| `pnpm build:web`     | Build Next.js web app                            |
| `pnpm build:mobile`  | Build Expo Android app (requires EAS)            |
| `pnpm build:desktop` | Build Tauri desktop app                          |
| `pnpm lint`          | Run ESLint across all packages                   |
| `pnpm lint:fix`      | Run ESLint with auto-fix                         |
| `pnpm typecheck`     | Run TypeScript type checking across all packages |
| `pnpm test`          | Run tests across all packages                    |
| `pnpm test:ci`       | Run tests in CI mode (verbose)                   |
| `pnpm format`        | Format all files with Prettier                   |
| `pnpm format:check`  | Check Prettier formatting                        |
| `pnpm clean`         | Clean all build outputs and prune pnpm store     |

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

| Variable                        | Used By      | Description                        |
| ------------------------------- | ------------ | ---------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | web          | Supabase project URL               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web          | Supabase anon key (public)         |
| `SUPABASE_SERVICE_ROLE_KEY`     | web (server) | Supabase service role key (secret) |
| `EXPO_PUBLIC_SUPABASE_URL`      | mobile       | Supabase URL for Expo              |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | mobile       | Supabase anon key for Expo         |
| `TAURI_PRIVATE_KEY`             | desktop      | Tauri update signing key           |
| `NODE_ENV`                      | all          | Runtime environment                |

> ⚠️ Never commit `.env.local` or any file containing real credentials.

---

## Technology Stack

| Layer           | Technology            | Version        |
| --------------- | --------------------- | -------------- |
| Web             | Next.js               | ^15.0.0        |
| Mobile          | Expo / React Native   | SDK ~52 / 0.76 |
| Desktop         | Tauri                 | v2             |
| Backend         | Supabase (PostgreSQL) | Latest         |
| Language        | TypeScript            | ^5.5.0         |
| Validation      | Zod                   | ^3.23.0        |
| Package Manager | pnpm                  | ^9.0.0         |
| Linting         | ESLint (flat config)  | ^9.0.0         |
| Formatting      | Prettier              | ^3.3.0         |

---

## Development Status

See [docs/DEVELOPMENT_STATUS.md](./docs/DEVELOPMENT_STATUS.md) for the full phase-by-phase progress tracker.

**Current phase:** Phase 1 — Project Foundation ✅

---

## Contributing

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make changes following the ESLint and Prettier rules
3. Run `pnpm typecheck && pnpm lint && pnpm format:check` before committing
4. Open a pull request

---

## License

Private — All rights reserved.
