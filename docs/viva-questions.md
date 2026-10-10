# Viva Voce Preparation Guide — EMS

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 (Teja, Ashok, Charan, Kula Shekhar, Jahnavi, Afsar)  
**Publisher ID:** `GIETP-AI-IT-EMS-T1-2026` | **App ID:** `in.gietpoly.ems` | **Version:** 1.0.0

---

## 1. Project Overview & Background

### Q1: What is the primary objective of this project?
**Answer:** The primary objective of EMS is to provide an enterprise-grade, multi-tenant human capital and workforce operations platform that unifies employee records, attendance, leave approvals, payroll, recruitment, IT assets, and compliance auditing in a single secure web and multi-platform architecture.

### Q2: What institutional metadata identifies this project?
**Answer:** Developed at GIET Polytechnic College under the Artificial Intelligence (AI) Department for Batch 2024–2027 as an Industrial Training Project by Team T-1 with Publisher ID `GIETP-AI-IT-EMS-T1-2026` and Application Identifier `in.gietpoly.ems`.

### Q3: Why is a unified EMS necessary compared to traditional spreadsheet methods?
**Answer:** Spreadsheets suffer from lack of multi-user concurrency control, absence of row-level data isolation, risk of formula tampering, lack of immutable audit trails, and fragmented communications across departments. EMS eliminates these risks through database-level constraints and role-based portals.

### Q4: Who are the target users of this system?
**Answer:** It serves 10 distinct organizational personas: Super Administrators, Organization Admins, HR Managers, Recruitment Managers, Finance & Payroll Managers, Team Managers, Department Heads, IT Asset Managers, Employees, and Compliance Auditors.

---

## 2. Requirements & Business Logic

### Q5: What are the functional requirements for employee onboarding?
**Answer:** The system requires an accepted job offer to trigger candidate handoff, instantiates an onboarding case from a checklist template, and blocks completion until 100% of mandatory checklist items (e.g. Identity Verification, Hardware Allocation) are marked completed.

### Q6: What are the functional requirements for employee offboarding?
**Answer:** When an exit is initiated, the system creates department clearance checkpoints for IT, Finance, and HR. Final account deactivation and termination are strictly blocked until all clearance checkpoints are marked cleared.

### Q7: What non-functional security requirements were enforced?
**Answer:** Multi-tenant row-level security (RLS), prevention of privilege escalation (blocking self-role assignment and self-organization switching), open-redirect sanitization, and spreadsheet formula-injection mitigation.

---

## 3. System Architecture & Monorepo

### Q8: What monorepo architecture does the project use and why?
**Answer:** It uses a `pnpm workspace` monorepo containing 3 applications (`apps/web`, `apps/mobile`, `apps/desktop`) and 6 shared packages (`@ems/types`, `@ems/validation`, `@ems/config`, `@ems/ui`, `@ems/shared`, `@ems/feature-registry`). This ensures a single source of truth for types, validation, and design primitives.

### Q9: What is the division of responsibilities between Client Components and Server Components?
**Answer:** Next.js Server Components handle secure data retrieval, authentication checks, and server-side rendering without shipping business secrets to the client. Client Components (`"use client"`) manage interactive UI state, form interactions, modals, and tab navigation.

### Q10: What role does Next.js Edge Middleware play in EMS?
**Answer:** `middleware.ts` intercepts incoming HTTP requests, validates Supabase session cookies, refreshes expiring JWTs, and redirects unauthenticated users to `/login?redirect=...`.

---

## 4. React 19 & TypeScript

### Q11: What compiler settings are configured in `tsconfig.base.json`?
**Answer:** TypeScript strict mode is enabled (`"strict": true`), enforcing `"noImplicitAny"`, `"strictNullChecks"`, `"strictFunctionTypes"`, and `"skipLibCheck": true`.

### Q12: How are runtime validation and TypeScript compile-time types synchronized?
**Answer:** Using Zod schemas in `@ems/validation` and TypeScript `z.infer<typeof schema>` in `@ems/types`. This guarantees that compile-time interfaces match runtime validation rules exactly.

### Q13: What UI component primitives are defined in `@ems/ui`?
**Answer:** Reusable primitives including `Button` (with variants and loading spinners), `Modal` (accessible dialog with Escape key dismiss), `StatCard` (kpi metric cards), `Table` (responsive tabular grids), and `Badge` (semantic status tags).

---

## 5. Supabase & PostgreSQL

### Q14: How many database migrations were created and what is their sequencing?
**Answer:** 8 numbered migrations:
1. `000001`: Core schema (orgs, branches, departments, profiles, employees, roles).
2. `000002`: RLS policies and security-definer helper functions.
3. `000003`: Auth user sync trigger and self-assignment defense triggers.
4. `000004`: Shifts, attendance records, work sessions, and leave balances.
5. `000005`: Salary structures, payroll runs, and itemized records.
6. `000006`: Recruitment job postings, applications, interviews, and offers.
7. `000007`: Cross-module candidate handoff RPC and transactional payslip approvals.
8. `000008`: Onboarding, offboarding, performance reviews, IT assets, documents, and announcements.

### Q15: What primary key strategy is used across the database?
**Answer:** UUIDv4 generated natively by `gen_random_uuid()` for all application entities, ensuring globally unique keys across tenants without ID sequence collision.

### Q16: How does Supabase Auth integrate with application profiles?
**Answer:** `profiles.id` references `auth.users(id)` with `ON DELETE CASCADE`. The trigger `handle_new_user()` automatically creates a profile row in `public.profiles` whenever an auth record is created.

---

## 6. Authentication & RBAC

### Q17: How is portal routing protected against unauthorized access?
**Answer:** Server Components call `verifyPortalAccess(userContext, requestedPortal)`. This checks the user's active organization status and confirms they hold the role mapped to that portal before rendering the page.

### Q18: What are the 10 portal roles in EMS?
**Answer:** `super_admin`, `org_admin`, `hr_manager`, `recruitment_manager`, `finance_payroll_manager`, `manager`, `dept_head`, `it_assets_manager`, `employee`, and `auditor`.

### Q19: How many canonical permissions exist in the RBAC matrix?
**Answer:** Exactly 22 canonical permission codes defined in `@ems/types` (e.g. `employee.read`, `employee.write`, `payroll.process`, `asset.manage`, `audit.read`).

---

## 7. Row Level Security & Multi-Tenant Isolation

### Q20: How does PostgreSQL Row Level Security (RLS) enforce tenant isolation?
**Answer:** Every operational table enables RLS and applies policies with `USING (public.is_org_member(organization_id))`. Queries from a user in Tenant A cannot read or mutate records in Tenant B.

### Q21: What is a `SECURITY DEFINER` function and why is `SET search_path = ''` critical?
**Answer:** A `SECURITY DEFINER` function executes with the privileges of the function's creator rather than the calling user. Setting `search_path = ''` prevents search path injection attacks where a malicious user creates a duplicate table in a public schema to hijack privileged queries.

### Q22: How does the system prevent cross-organization foreign key corruption?
**Answer:** Triggers like `enforce_employee_org_boundary()` verify before insert/update that an employee's assigned department, branch, and designation all belong to the employee's organization.

### Q23: How is privilege self-escalation prevented?
**Answer:** Trigger `prevent_self_role_assignment()` aborts any attempt where `auth.uid() = NEW.profile_id`, and `prevent_self_org_reassignment()` blocks users from changing their own `organization_id`.

---

## 8. Attendance & Leave Workflows

### Q24: How does the attendance clock-in mechanism prevent concurrent sessions?
**Answer:** The system checks for existing active `work_sessions` where `clock_out` is NULL. An employee cannot clock in again until their active session is clocked out.

### Q25: How are worked duration, break times, and overtime computed?
**Answer:** Net duration is computed as `(ClockOut - ClockIn) - BreakMinutes`. Hours up to the standard 8.0-hour shift are classified as regular hours; hours exceeding 8.0 are logged as overtime.

### Q26: What validation occurs during leave request submission?
**Answer:** The system verifies that the requested number of days does not exceed the employee's active quota balance in `leave_balances`. If approved by a manager, the balance is atomically deducted.

---

## 9. Payroll Engine & Compensation

### Q27: How does EMS prevent duplicate payroll runs?
**Answer:** The database enforces a unique constraint on `(organization_id, period_year, period_month)`, preventing concurrent or accidental duplicate payroll runs for the same period.

### Q28: What is the sequential state machine for a payroll run?
**Answer:** `draft` $\to$ `review` $\to$ `approved` $\to$ `paid`. Skipping states (e.g., jumping from `draft` to `paid`) is blocked by transition validation logic.

### Q29: What happens when a payroll run is approved?
**Answer:** All individual payroll line items are locked as immutable, digital payslips are generated for employee access, and the run is staged for financial disbursement.

### Q30: How is Loss of Pay (LOP) factored into payroll?
**Answer:** Unpaid absence days are counted from attendance/leave records; per-day pay is computed as `BasicPay / PeriodDays`; LOP is deducted from Basic Pay before calculating gross earnings.

---

## 10. Operations, Talent & Hardware Assets

### Q31: What rule governs IT hardware asset assignments?
**Answer:** An asset can have only 1 active assignment (`status: 'in_use'`). Reassigning an asset while in use or allocating retired/maintenance devices is blocked by `public.assign_asset()`.

### Q32: What scale is enforced for employee performance reviews?
**Answer:** The system strictly validates rating scores to fall between 1.0 and 5.0 in `@ems/validation` and database constraints.

### Q33: How does the system protect against CSV formula injection during exports?
**Answer:** `sanitizeCsv()` checks if cell strings begin with spreadsheet formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`) and prefixes them with a single quote (`'`), ensuring they render as plain text in Excel or Google Sheets.

---

## 11. Testing & Quality Assurance

### Q34: What automated test results were achieved?
**Answer:** 100 out of 100 tests passed across 8 Vitest suites with a 100% pass rate in approximately 1.32 seconds.

### Q35: What test suites are present in the repository?
**Answer:**
1. `tests/multi-tenant-integration.test.ts`
2. `tests/design-system-and-dashboards.test.ts`
3. `tests/rbac-matrix.test.ts`
4. `tests/phase8-operations-and-talent.test.ts`
5. `tests/auth-validation.test.ts`
6. `tests/payroll-and-recruitment.test.ts`
7. `tests/attendance-and-leave.test.ts`
8. `tests/security-guards.test.ts`

### Q36: Did `pnpm typecheck` and `pnpm lint` pass cleanly?
**Answer:** Yes, `pnpm typecheck` passed with 0 compiler errors across all 9 workspaces, and `pnpm lint` passed with 0 errors and 0 warnings.

---

## 12. Deployment & Practical Scenarios

### Q37: How is the web application compiled for production?
**Answer:** Using `pnpm --filter @ems/web build`, which compiles Next.js 15 pages into 34 production routes with optimized server and static bundles.

### Q38: How would you demonstrate cross-tenant isolation during a viva demo?
**Answer:** Log in as `admin@giet-polytechnic.edu`, view the employee directory (only GIET staff appear). Attempt to access an employee record with an Apex Solutions UUID; PostgreSQL RLS immediately returns a 404/Empty result.

### Q39: What are the current limitations of the system?
**Answer:** Direct physical biometric scanner hardware bridges require an IoT device gateway, mobile/desktop native binary generation requires cloud packaging toolchains (Expo EAS / Rust cargo), and bank transfers output export files rather than live banking APIs.

### Q40: What future enhancements are proposed?
**Answer:** AI-driven attrition risk prediction, automated shift schedule optimization, physical MQTT biometric IoT bridges, and multilingual user interfaces.
