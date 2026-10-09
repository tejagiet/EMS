# EMS Phase 4 — Design System, Dashboards, and Analytics UI Specification

**Institution:** GIET Polytechnic College  
**Department:** Artificial Intelligence (AI) Department  
**Batch:** 2024–2027  
**Project:** Employee Management System (EMS)  
**Project Category:** Industrial Training Project  
**Team:** T-1  
**Publisher ID:** `GIETP-AI-IT-EMS-T1-2026`  
**Version:** 1.0.0  
**Phase:** 4 (Design System, Dashboards & Analytics UI)

---

## 1. Executive Summary

Phase 4 delivers an enterprise-grade SaaS design system, responsive application shell, and role-aware dashboards for the **Employee Management System (EMS)**. Built on Next.js 15 App Router, React 19, TypeScript, and Tailwind CSS, this implementation connects directly to the Supabase database foundation (Phases 2 & 3).

### Key Architectural Principles

1. **Zero Fabricated Metrics:** Every KPI card, chart, and roster displays real aggregated records from `organizations`, `branches`, `departments`, `designations`, `employees`, `employee_history`, `profiles`, `roles`, and `settings`.
2. **Transparent Dependency Notice:** Features awaiting future database schemas (Attendance Phase 5, Payroll Phase 6, Recruitment Postings Phase 7, Hardware IT Assets Phase 8) render clear, accessible `SchemaDependencyNotice` and `UnavailableChartCard` components documenting exact database requirements rather than displaying fabricated data.
3. **Institutional Identity:** Consistent branding across headers, footers, shell sidebars, and the public `/about` page attributing GIET Polytechnic College, AI Department, Team T-1, Batch 2024–2027, Publisher ID `GIETP-AI-IT-EMS-T1-2026`.
4. **Least-Privilege Role Separation:** Each of the 10 portal dashboards enforces strict boundary verification via server-side session evaluation (`verifyPortalAccess`). The Auditor portal is strictly read-only with no mutation capabilities.

---

## 2. Design System Tokens & Primitives

All foundational tokens are defined in `packages/ui` and mirrored into CSS custom properties in `apps/web/app/globals.css`:

### 2.1 Theme Palette

| Token              | Light Theme           | Dark Theme               | Purpose                                      |
| ------------------ | --------------------- | ------------------------ | -------------------------------------------- |
| `primary`          | `#1e3a8a` (GIET Navy) | `#3b82f6` (Vibrant Blue) | Brand primary, action highlights, active nav |
| `secondary`        | `#0284c7` (Tech Sky)  | `#38bdf8` (Bright Cyan)  | Secondary actions, badges, accents           |
| `background`       | `#f8fafc` (Slate 50)  | `#0f172a` (Slate 900)    | Root application canvas                      |
| `surface` / `card` | `#ffffff`             | `#1e293b` (Slate 800)    | Elevated cards, sidebars, headers            |
| `text-primary`     | `#0f172a` (Slate 900) | `#f8fafc` (Slate 50)     | High-contrast headings and body text         |
| `text-muted`       | `#64748b` (Slate 500) | `#94a3b8` (Slate 400)    | Secondary labels, descriptions, timestamps   |
| `border`           | `#e2e8f0` (Slate 200) | `#334155` (Slate 700)    | Clean container dividing lines               |
| `success`          | `#10b981` (Emerald)   | `#34d399` (Emerald 400)  | Active status, positive trends               |
| `warning`          | `#f59e0b` (Amber)     | `#fbbf24` (Amber 400)    | Pending approval, probation status           |
| `danger`           | `#ef4444` (Rose)      | `#f87171` (Rose 400)     | Deletion, termination, critical alerts       |

### 2.2 Reusable UI Components

- **`Button`**: Accessible buttons with variant styles (`primary`, `secondary`, `outline`, `danger`, `ghost`), loading states with animated spinners, and disabled focus prevention.
- **`Card`**: Structured cards with `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter`.
- **`Badge`**: Status chips with variant tokens (`primary`, `secondary`, `success`, `warning`, `danger`, `neutral`).
- **`MetricCard`**: Standardized KPI metric display with title, value, change indicator, drilldown link, and schema-pending badges.
- **`Input` & `Select`**: Fully accessible form inputs with label association and validation error handling.
- **`DataTable`**: Generic, typed tabular component with column sorting, pagination controls, loading skeletons, and empty state fallbacks.
- **`SearchFilterBar`**: Integrated search text input, dynamic dropdown filters, and clear-filters action.
- **`Modal` & `ConfirmDialog`**: Accessible modal overlays with Escape key dismissal, backdrop click prevention, and focus trapping.
- **`Toast` & `ToastProvider`**: Context-driven floating notification system with auto-dismissal.
- **`Skeleton`**: Skeleton loaders for metric cards, tables, charts, and content panels.
- **`ThemeProvider` & `ThemeToggle`**: Client-side theme switching toggling the `.dark` class with `localStorage` persistence.
- **`InstitutionalHeader` & `InstitutionalFooter`**: Dedicated layout elements presenting institutional details and publisher credentials.

---

## 3. Application Shell (`AppShell`)

The EMS Application Shell (`apps/web/components/shell/AppShell.tsx`) provides an enterprise layout:

- **Collapsible Sidebar**: Desktop sidebar toggles between 260px expanded and 72px icon-only rail with smooth transitions.
- **Mobile Navigation**: Slide-out drawer with responsive backdrop on viewports below 1024px.
- **Top Header**: Includes breadcrumbs, organization switcher for multi-tenant accounts, role navigation switcher, notification panel with unread badge counter, theme toggle, and authenticated user profile menu.
- **Sign Out Action**: Server-action driven sign-out invalidating Supabase sessions.

---

## 4. Role-Aware Portal Dashboards

Ten specialized dashboards are implemented under `/portal`:

1. **Super Admin (`/portal/super-admin`)**: Platform-level health, total organizations, total user profiles, system roles, and tenant directory table.
2. **Organization Admin (`/portal/org-admin`)**: Organization headcount, branch locations, departments, designations, real-time department headcount distribution bar chart, and recent audit history.
3. **HR Manager (`/portal/hr`)**: Headcount breakdown (probation, contract, active), monthly hiring trends, employment type distribution, and live employee roster with search, filter, and pagination (`HrDirectoryTable`).
4. **Recruitment Manager (`/portal/recruitment`)**: Department capacity analysis, open organizational designations list, and transparent Phase 7 requisitions schema notice.
5. **Finance & Payroll Manager (`/portal/finance-payroll`)**: Department salary-grade distribution chart, active employee payroll base count, and transparent Phase 6 payroll ledger notice.
6. **Reporting Manager (`/portal/manager`)**: Direct reports headcount, team roster table, and direct report attendance/leave notice (Phase 5).
7. **Department Head (`/portal/dept-head`)**: Functional department personnel roster, active staff metrics, and departmental shift notice (Phase 5).
8. **IT & Assets Manager (`/portal/it-assets`)**: User accounts, tenant IT settings inspection table (`settings` table), and transparent Phase 8 hardware inventory notice.
9. **Employee Self-Service (`/portal/employee`)**: Personal employment profile, assigned manager, department, designation, and attendance/leave balances notices (Phase 5).
10. **Auditor Portal (`/portal/auditor`)**: Read-only institutional compliance dashboard, immutable audit logs (`employee_history`), active roles and organizations, with least-privilege enforcement (zero edit/delete actions).

---

## 5. Verification & Quality Assurance

All automated quality gates pass:

- **Typecheck:** `pnpm typecheck` passed with 0 errors across all 9 workspaces.
- **Linter:** `pnpm lint` passed with 0 warnings and 0 errors across all 9 workspaces.
- **Format:** `pnpm format:check` passed with 100% compliance.
- **Unit/Integration Tests:** `pnpm test` (Vitest) passed 4 test suites and 47 tests.
- **Production Build:** `pnpm --filter @ems/web build` compiled all 21 routes successfully.
