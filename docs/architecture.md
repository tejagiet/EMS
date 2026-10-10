# System Architecture Document — EMS

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## 1. Architectural Overview

The Employee Management System employs a **3-Tier Multi-Tenant Cloud Architecture** consisting of:
1. **Presentation & Edge Tier:** Next.js 15 Web Application with Edge Middleware routing guards, React 19 components, Tailwind CSS styles, and Lucide enterprise icons.
2. **Application & Business Logic Tier:** Next.js Server Components, Server Actions (`apps/web/lib/data/*`), and shared workspace packages (`@ems/*`).
3. **Data & Persistence Tier:** Supabase Managed PostgreSQL 15, Auth (GoTrue), Storage Engine, and transactional database triggers.

---

## 2. Multi-Platform Strategy

| Platform | Location | Framework & Stack | Implementation Status |
| :--- | :--- | :--- | :--- |
| **Web Portal** | `apps/web` | Next.js 15 (App Router), React 19, Tailwind CSS | **Fully Implemented & Verified** (34 routes compiled) |
| **Android Mobile** | `apps/mobile` | React Native, Expo SDK 52, Expo Router | **Architectural Foundation Stub** referencing `@ems/types`, `@ems/validation`, `@ems/config` |
| **Windows Desktop** | `apps/desktop` | Tauri v2, React, Vite, Rust Core | **Architectural Foundation Stub** referencing `@ems/types`, `@ems/validation`, `@ems/config` |

---

## 3. Web Application Directory Architecture

Inside `apps/web`:
```
apps/web/
├── app/
│   ├── auth/              # Auth callback & password reset routes
│   ├── login/             # Primary sign-in page with role detection
│   ├── forgot-password/   # Password recovery request page
│   ├── unauthorized/      # Access denied security boundary
│   ├── portal/            # Ten Enterprise Portals:
│   │   ├── super-admin/
│   │   ├── org-admin/
│   │   ├── hr/            # Includes /employees, /attendance, /leave, /shifts,
│   │   │                  #          /onboarding, /offboarding, /performance,
│   │   │                  #          /documents, /announcements
│   │   ├── recruitment/
│   │   ├── finance-payroll/
│   │   ├── manager/
│   │   ├── dept-head/
│   │   ├── it-assets/
│   │   ├── employee/
│   │   └── auditor/
│   ├── layout.tsx         # Root HTML layout with providers
│   └── page.tsx           # Institutional landing & portal gateway
├── components/            # Client component dashboards & tables
│   ├── employees/
│   ├── attendance/
│   ├── payroll/
│   ├── recruitment/
│   ├── operations/        # Onboarding, Offboarding, Assets, Performance, Docs
│   └── ui/                # Shell, Sidebar, Header, Breadcrumbs
├── lib/
│   ├── auth/              # session.ts, server.ts, client.ts (SSR cookie token auth)
│   └── data/              # Typed database access modules for each domain
└── middleware.ts          # Edge middleware session validation & route protection
```

---

## 4. Communication & Data Flow

1. **Client Request:** Browser requests `/portal/hr/employees`.
2. **Edge Middleware (`middleware.ts`):** Validates existence of session cookies (`sb-<project>-auth-token`). Unauthenticated requests are redirected to `/login?redirect=...`.
3. **Session Verification (`lib/auth/session.ts`):** Server Component invokes `loadAuthenticatedUserContext()`. Queries profile, roles, and organization status. `verifyPortalAccess()` confirms that the active user possesses permission to view the HR portal.
4. **Data Retrieval (`lib/data/employees.ts`):** Direct PostgreSQL query executed with Supabase SSR client. Postgres engine applies Row Level Security (RLS) policy `employees_select_member`, scoping rows strictly to the user's `organization_id`.
5. **Streaming Server Rendering:** Next.js renders HTML server-side and streams the rendered view to the client along with serialized server state.
6. **Client Mutation (Server Action):** When HR modifies employee status, form dispatches Server Action `updateEmployeeAction()`. Validates input against `employeeUpdateSchema`, executes Postgres UPDATE, writes to `employee_history`, and revalidates page path.

---

## 5. Security Integration Summary

- **Transport:** Enforced HTTPS with TLS 1.3.
- **Cookies:** HttpOnly, SameSite=Lax, Secure session tokens.
- **Data-Level Security:** Enforced PostgreSQL RLS using `public.is_org_member(organization_id)`.
- **Injection Defenses:** Prepared statements (PostgREST), Zod schema input validation, and CSV export formula-neutralization.
