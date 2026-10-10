# System Design Specification — EMS

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## 1. Architectural Style & Design Decisions

### 1.1 Monorepo Architecture
EMS is designed as a **modular pnpm workspace monorepo**. This structure eliminates code duplication, allows sharing of TypeScript types, validation logic, and UI design primitives across all applications, and guarantees single-source-of-truth definitions:

```
Employee Management System (EMS)/
├── apps/
│   ├── web/               # Next.js 15 App Router Web Application [Production Implemented]
│   ├── mobile/            # Expo SDK 52 / React Native Mobile Foundation [Foundation Stub]
│   └── desktop/           # Tauri v2 / React Windows Foundation [Foundation Stub]
├── packages/
│   ├── types/             # Canonical TypeScript Interfaces & Enums
│   ├── validation/        # Shared Zod Validation Schemas
│   ├── config/            # Portal Routes, Role Definitions, Constants
│   ├── feature-registry/  # Runtime Feature Flags
│   ├── ui/                # Shared Tailwind UI Component Primitives
│   └── shared/            # Utility Functions, Sanitizers, Security Helpers
└── supabase/
    ├── migrations/        # 8 Numbered Schema Migrations
    └── seed.sql           # Deterministic Development Seed Data
```

### 1.2 Separation of Concerns
- **Presentational Tier:** React 19 Client Components (`"use client"`) handle interactive state, form animations, tab navigation, and modal dialogues.
- **Server Tier:** Next.js Server Components and Server Actions (`"use server"`) authenticate incoming sessions via cookie tokens and execute typed business transactions.
- **Data & Security Tier:** PostgreSQL 15 handles relational constraints, transactional triggers, and data-level isolation via Row Level Security (RLS).

---

## 2. Component Design & Shared Packages

### 2.1 `@ems/types`
Defines canonical contracts:
- `PortalRole`: 10 strictly typed roles (`super_admin`, `org_admin`, `hr_manager`, `recruitment_manager`, `finance_payroll_manager`, `manager`, `dept_head`, `it_assets_manager`, `employee`, `auditor`).
- `PERMISSION_CODES`: Exactly 22 granular capability codes (`organization.read`, `organization.write`, `employee.read`, `employee.write`, `attendance.self`, `attendance.read`, `attendance.manage`, `leave.self`, `leave.read`, `leave.manage`, `payroll.read`, `payroll.write`, `payroll.process`, `recruitment.read`, `recruitment.write`, `asset.read`, `asset.manage`, `document.read`, `document.write`, `audit.read`, `settings.read`, `settings.write`).
- Entity interfaces for all 35+ database models.

### 2.2 `@ems/validation`
Exports strict Zod schemas matching every mutation:
- Authentication: `signInSchema`, `resetPasswordSchema`.
- Employees: `employeeCreateSchema`, `employeeUpdateSchema`.
- Operations: `onboardingCaseCreateSchema`, `offboardingInitiateSchema`, `assetCreateSchema`, `performanceGoalSchema`, `performanceReviewSubmitSchema`.

### 2.3 `@ems/ui`
Provides uniform, accessible design primitives built with Tailwind CSS:
- `Button`: Primary, secondary, outline, danger variants with loading states.
- `Modal`: Accessible dialog wrapper with keyboard dismiss (`Escape`) and backdrop lock.
- `StatCard`: Enterprise metric visualization widget with title, numeric value, subtitle, and icon.
- `Table`: Responsive tabular grid with header styling, empty state, and zebra striping.
- `Badge`: Status tags with semantic color coding (active, pending, rejected, approved).

---

## 3. Database Design Patterns

### 3.1 Multi-Tenant Tenant Isolation Pattern
Every table containing organization data includes a foreign key:
```sql
organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT
```
Row Level Security is enabled on every table:
```sql
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY employees_select_member ON public.employees
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));
```

### 3.2 Security Definer Helper Functions
All helper functions execute with empty search paths to mitigate search-path hijacking attacks:
```sql
CREATE OR REPLACE FUNCTION public.is_org_member(p_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND organization_id = p_organization_id
      AND is_active = true
  );
$$;
```

---

## 4. Error Handling & Resilience Strategy

1. **Form-Level Validation:** React Hook Form coupled with `@ems/validation` Zod resolvers catches invalid data before dispatch.
2. **Action-Level Error Formatting:** Server actions return structured result tuples: `{ success: boolean; data?: T; error?: string }`.
3. **Database-Level Exception Trapping:** PostgreSQL trigger functions throw descriptive SQL exceptions with specific error codes (e.g., `ERRCODE = 'insufficient_privilege'`).
4. **Boundary Fallbacks:** Next.js `error.tsx` and `not-found.tsx` boundaries catch unexpected exceptions without terminating the server session.
