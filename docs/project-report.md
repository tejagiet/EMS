# Complete Academic Project Report — Employee Management System (EMS)

```
================================================================================
                    GIET POLYTECHNIC COLLEGE
         DEPARTMENT OF ARTIFICIAL INTELLIGENCE (AI)
                       BATCH 2024–2027

                 INDUSTRIAL TRAINING PROJECT REPORT
                                ON
               EMPLOYEE MANAGEMENT SYSTEM (EMS)

                 Publisher ID: GIETP-AI-IT-EMS-T1-2026
                 Application ID: in.gietpoly.ems
                          Version: 1.0.0

                            TEAM T-1
                  Teja (Team Lead - Roll No. 2401)
                  Ashok (Team Member - Roll No. 2402)
                  Charan (Team Member - Roll No. 2403)
                  Kula Shekhar (Team Member - Roll No. 2404)
                  Jahnavi (Team Member - Roll No. 2405)
                  Afsar (Team Member - Roll No. 2406)

          Under the Academic Guidance of the Faculty Committee
                Department of Artificial Intelligence
                      GIET Polytechnic College
                             October 2026
================================================================================
```

---

## Table of Contents
1. [Chapter 1: Introduction](#chapter-1-introduction)
2. [Chapter 2: Existing System and Proposed System](#chapter-2-existing-system-and-proposed-system)
3. [Chapter 3: Requirements Analysis](#chapter-3-requirements-analysis)
4. [Chapter 4: System Architecture](#chapter-4-system-architecture)
5. [Chapter 5: Database Design](#chapter-5-database-design)
6. [Chapter 6: Module Description](#chapter-6-module-description)
7. [Chapter 7: Algorithms and Workflows](#chapter-7-algorithms-and-workflows)
8. [Chapter 8: Implementation](#chapter-8-implementation)
9. [Chapter 9: Security & Multi-Tenancy](#chapter-9-security--multi-tenancy)
10. [Chapter 10: Testing & Quality Assurance](#chapter-10-testing--quality-assurance)
11. [Chapter 11: Results and Live Screens](#chapter-11-results-and-live-screens)
12. [Chapter 12: Installation and Deployment](#chapter-12-installation-and-deployment)
13. [Chapter 13: Conclusion, Team Contributions and Future Scope](#chapter-13-conclusion-team-contributions-and-future-scope)

---

## Chapter 1: Introduction

### 1.1 Project Overview
The **Employee Management System (EMS)** is an enterprise-grade, multi-tenant human capital management (HCM) and workforce operations platform engineered by Team T-1 of the Artificial Intelligence Department at GIET Polytechnic College. The system provides a unified digital operational environment supporting the complete employee lifecycle from recruitment to offboarding.

### 1.2 Background and Motivation
In medium to large educational institutions and enterprises, workforce data is historically scattered across disparate departments. Attendance is recorded on biometric wall clocks or physical ledgers; leave forms are processed through paper slips; payroll is calculated in desktop spreadsheets; and talent recruitment is tracked via separate email threads. This fragmentation results in data discrepancies, communication bottlenecks, compliance liabilities, and security vulnerabilities. EMS addresses this by integrating all administrative and workforce operations into a single web and multi-platform solution.

### 1.3 Problem Statement
Manual and spreadsheet-based employee management systems present severe operational flaws:
1. **Lack of Data Isolation:** In multi-branch organizations, spreadsheets do not provide row-level access control, risking cross-department or cross-tenant exposure of confidential salary and personal records.
2. **Formula Injection & Tampering:** Spreadsheets are prone to accidental formula overwriting or deliberate formula injection attacks.
3. **Absence of Concurrency & Audit Trails:** When multiple administrators edit records simultaneously, revisions are lost and changes cannot be audited.
4. **Disjointed Workflows:** Recruitment does not automatically flow into onboarding; attendance does not automatically reconcile with payroll calculations.

### 1.4 Project Objectives
- Engineer a multi-tenant cloud application with native database-level isolation.
- Establish Role-Based Access Control (RBAC) across 10 specialized enterprise portals.
- Provide end-to-end automation for recruitment, onboarding, daily timeclocks, leave approvals, payroll, performance appraisals, IT hardware assets, and offboarding clearances.
- Maintain 100% test coverage and zero strict TypeScript compilation errors across all workspace packages.

### 1.5 Scope & Limitations
- **Implemented Scope:** Web portal (`apps/web`) with Next.js 15, React 19, Supabase PostgreSQL 15 (8 migrations, 35+ tables), 10 enterprise portals, and 100 automated Vitest tests.
- **Architectural Foundation Stubs:** Mobile (`apps/mobile`) and Desktop (`apps/desktop`) foundational stubs sharing monorepo packages.
- **Identified Limitations:** Physical biometric scanner hardware requires an on-premise IoT gateway; live bank disbursement currently produces validated payment files rather than executing direct banking API transfers.

---

## Chapter 2: Existing System and Proposed System

### 2.1 Existing System Analysis
The legacy workflow in many institutions relies on manual paper ledgers or standalone desktop spreadsheets:
- **Attendance:** Punch cards or manual attendance books compiled monthly by HR clerks.
- **Leave Requests:** Physical paper slips signed by immediate supervisors and submitted to HR.
- **Payroll:** Excel sheets with manually entered formulas calculating tax and allowances.
- **Recruitment:** Resumes received via email, tracked on ad-hoc spreadsheets.

### 2.2 Documented Limitations of the Existing System
- High administrative overhead and vulnerability to human error in loss-of-pay calculations.
- Absence of role-based security; anyone with spreadsheet access can view all compensation figures.
- Loss of historical records when spreadsheets are corrupted or overwritten.

### 2.3 Proposed EMS Architecture
EMS introduces a modern, centralized 3-tier architecture:
- **Client Tier:** Next.js 15 App Router web client with role-based routing and Tailwind CSS styling.
- **Application Tier:** Server Actions executing authenticated database mutations with Zod schema validation.
- **Persistence Tier:** PostgreSQL 15 with Row Level Security (RLS) guaranteeing tenant isolation.

### 2.4 Comparative Analysis
| Feature | Existing Manual / Spreadsheet Process | Proposed EMS v1.0.0 Platform |
| :--- | :--- | :--- |
| **Data Architecture** | Disconnected Excel files & physical registers | Centralized PostgreSQL relational database |
| **Security & Privacy** | None; unrestricted file access | Database-level RLS & 10 Role-Based Portals |
| **Attendance-to-Payroll**| Manual transcription by HR clerks | Automated synchronization of absence and overtime |
| **Audit Trails** | None | Append-only tables (`employee_history`, `task_activity_log`) |
| **Lifecycle Integration**| Fragmented handoffs between HR staff | Atomic transactional RPCs linking recruitment to exit |

---

## Chapter 3: Requirements Analysis

### 3.1 Functional Requirements
1. **Authentication & Session:** Secure email/password login, HttpOnly cookie sessions, password recovery, open-redirect defense.
2. **Organization & Hierarchy:** Multi-tenant organization support, multi-branch structures, department hierarchies, and designation grades (1–20).
3. **Employee Directory:** Search, department filtering, profile editing, and CSV exports with formula-injection neutralization.
4. **Attendance & Shifts:** Clock-in/out, work session logging, overtime calculations, break tracking, monthly calendars.
5. **Leave Management:** Leave types, annual quota balance tracking, supervisor approval workflows.
6. **Payroll Engine:** Base salary, allowances, statutory deductions, duplicate run prevention, sequential status workflow (`draft` $\to$ `review` $\to$ `approved` $\to$ `paid`), and payslip distribution.
7. **Recruitment & ATS:** Job vacancies, pipeline tracking, interview scorecards, offers, and candidate-to-employee handoff.
8. **Operations & Assets:** Onboarding checklists, offboarding clearances, hardware inventory (1 active assignment rule), and performance appraisals (1.0–5.0 rating scale).

### 3.2 Non-Functional Requirements
- **Security:** PostgreSQL Row Level Security enabled on all tables; cross-tenant assignment blocked by database triggers.
- **Performance:** Sub-500ms server response for rendered pages; indexed queries on foreign keys and employee codes.
- **Reliability:** ACID-compliant PostgreSQL transactions for critical financial and employment state transitions.

### 3.3 Hardware and Software Specifications
- **Development Platform:** Node.js v20+/v22+, pnpm v9+, TypeScript 5.5+.
- **Database Engine:** Supabase PostgreSQL 15.x.
- **Browser Compatibility:** Google Chrome 110+, Microsoft Edge 110+, Mozilla Firefox 110+, Apple Safari 16+.

---

## Chapter 4: System Architecture

### 4.1 Monorepo Topology
EMS is built inside a unified pnpm monorepo:
```
apps/
  web/          # Next.js 15 Web Application (App Router, Tailwind CSS, SSR Auth)
  mobile/       # Expo SDK 52 / React Native Mobile Foundation
  desktop/      # Tauri v2 / React Windows Foundation
packages/
  types/        # Canonical TypeScript types, interfaces, enums
  validation/   # Zod validation schemas
  config/       # Routes, portal role definitions, constants
  ui/           # Reusable Tailwind UI components (Button, Modal, StatCard, Table)
  shared/       # Utility helpers, sanitizers, date/currency formatters
  feature-registry/ # Dynamic feature flags
```

### 4.2 Application Flow
1. User authenticates via `/login`; Supabase Auth returns JWT stored in HttpOnly cookies.
2. Next.js Edge Middleware intercepts request and validates session token.
3. Server Component calls `verifyPortalAccess()` to authorize the user for the specific portal route.
4. Data Access Layer queries PostgreSQL; RLS policy `is_org_member(organization_id)` filters results.
5. UI renders responsive HTML server-side and streams interactive components to the client.

---

## Chapter 5: Database Design

### 5.1 Relational Schema & Entity Inventory
The database contains 35+ tables organized across 8 migrations:
- **Core Entities:** `organizations`, `branches`, `departments`, `designations`, `profiles`, `employees`, `roles`, `permissions`, `user_roles`.
- **Attendance & Leave:** `shifts`, `employee_shifts`, `attendance_records`, `work_sessions`, `leave_types`, `leave_balances`, `leave_requests`.
- **Compensation & Payroll:** `salary_structures`, `salary_components`, `employee_salaries`, `payroll_periods`, `payroll_runs`, `payroll_records`.
- **Recruitment:** `job_postings`, `job_applications`, `interviews`, `job_offers`.
- **Operations:** `onboarding_cases`, `onboarding_tasks`, `offboarding_cases`, `offboarding_clearance_items`, `assets`, `asset_assignments`, `performance_reviews`, `documents`, `announcements`.

### 5.2 Referential Integrity & Trigger Constraints
- All tables feature UUID primary keys generated by `gen_random_uuid()`.
- Foreign key `organization_id` strictly references `organizations(id)` with `ON DELETE RESTRICT`.
- Cross-Organization Triggers (`enforce_employee_org_boundary`, `enforce_department_branch_org_boundary`) prevent cross-tenant assignment of departments, branches, and designations.
- Self-Assignment triggers (`prevent_self_org_reassignment`, `prevent_self_role_assignment`) block unauthorized privilege escalation.

---

## Chapter 6: Module Description

### 6.1 Super Admin (`/portal/super-admin`)
Manages multi-tenant organization provisioning, global configuration, and infrastructure health monitoring.

### 6.2 Organization Admin (`/portal/org-admin`)
Configures organization branches, functional departments, designation grades (Levels 1–20), and corporate settings.

### 6.3 HR Manager (`/portal/hr`)
Oversees the complete employee directory, onboarding checklist progression, exit clearance workflows, performance appraisal cycles, and document verification.

### 6.4 Recruitment Manager (`/portal/recruitment`)
Publishes vacancies, tracks applicant pipelines, schedules interview evaluations, extends job offers, and invokes candidate-to-employee handoff.

### 6.5 Finance & Payroll Manager (`/portal/finance-payroll`)
Configures salary components, runs monthly payroll calculations, enforces sequential review workflows, locks approved payroll, and issues payslips.

### 6.6 Manager & Department Head (`/portal/manager`, `/portal/dept-head`)
Direct report oversight, team shift scheduling, leave approvals, operational task delegation, and cross-branch department coordination.

### 6.7 IT & Assets Manager (`/portal/it-assets`)
Manages hardware inventory, tracks device allocations (1-active-assignment constraint), inspects return conditions, and logs maintenance tickets.

### 6.8 Employee Self-Service (`/portal/employee`)
Timeclock clock-in/out, personal attendance logs, leave applications, downloadable digital payslips, assigned hardware receipts, and company announcements.

### 6.9 Compliance Auditor (`/portal/auditor`)
Read-only inspection of immutable employee history, task change logs, and payroll journals.

---

## Chapter 7: Algorithms and Workflows

### 7.1 Portal Authorization Algorithm
Evaluates session status, active organization membership, and portal role mappings to grant or block navigation.

### 7.2 Attendance Work Session & Overtime Algorithm
Calculates net hours worked: `(ClockOut - ClockIn) - BreakMinutes`. Decomposes total hours into standard shift hours (up to 8.0) and overtime hours.

### 7.3 Payroll Net Salary Calculation Algorithm
Computes Loss of Pay (LOP) from unexcused absences: `(BasicPay / PeriodDays) * AbsenceDays`. Gross pay is computed as effective basic plus allowances; Net pay is derived by deducting PF and statutory tax deductions.

### 7.4 Onboarding & Offboarding Completion Guard Algorithms
- `canCompleteOnboarding`: Prohibits onboarding case closure while required checklist tasks remain incomplete.
- `canCompleteOffboarding`: Prohibits employee profile deactivation while departmental clearances remain pending.

### 7.5 CSV Formula Injection Neutralization Algorithm
Prefixes cell content starting with `=`, `+`, `-`, `@`, `\t`, or `\r` with a single quote (`'`), ensuring spreadsheet applications render expressions as plain text.

---

## Chapter 8: Implementation

### 8.1 Shared Package Infrastructure
- `@ems/types`: TypeScript definitions for all 35+ models and 22 permission codes.
- `@ems/validation`: Zod schemas validating every client-server mutation.
- `@ems/ui`: Tailored accessible React primitives styled with Tailwind CSS.
- `@ems/shared`: Date, currency, redirect, and CSV sanitization helpers.

### 8.2 Server Actions & Data Layer
Database operations in `apps/web/lib/data/*` execute as Next.js Server Actions using `@supabase/ssr` with HttpOnly cookie sessions.

---

## Chapter 9: Security & Multi-Tenancy

### 9.1 Tenant Scoping via Row Level Security (RLS)
PostgreSQL policies enforce `USING (public.is_org_member(organization_id))`, guaranteeing tenant data separation at the database engine level.

### 9.2 SQL Injection & Hijacking Defenses
Prepared parameterized queries (via PostgREST) eliminate SQL injection. All SECURITY DEFINER functions declare `SET search_path = ''` to prevent search path hijacking.

### 9.3 Client-Side & Routing Security
- Open redirect protection via `sanitizeRedirectUrl()`.
- CSRF protection via SameSite cookies.
- XSS token protection via HttpOnly cookie storage.

---

## Chapter 10: Testing & Quality Assurance

### 10.1 Automated Vitest Test Suites
100 tests executed across 8 suites with a **100% pass rate (100 passed, 0 failed)**:
- `tests/multi-tenant-integration.test.ts` (11 tests)
- `tests/design-system-and-dashboards.test.ts` (9 tests)
- `tests/rbac-matrix.test.ts` (13 tests)
- `tests/phase8-operations-and-talent.test.ts` (13 tests)
- `tests/auth-validation.test.ts` (12 tests)
- `tests/payroll-and-recruitment.test.ts` (12 tests)
- `tests/attendance-and-leave.test.ts` (17 tests)
- `tests/security-guards.test.ts` (13 tests)

### 10.2 Strict Type Checking & Linting
- `pnpm typecheck`: 0 errors across all 9 workspaces.
- `pnpm lint`: 0 errors, 0 warnings.
- `pnpm --filter @ems/web build`: Clean production build compiling 34 routes.

---

## Chapter 11: Results and Live Screens

The running Next.js application provides 15 primary live operational interfaces:
- Public Landing & Gateway (`/`)
- User Authentication Screen (`/login`)
- Organization Admin Dashboard (`/portal/org-admin`)
- Super Admin Management Portal (`/portal/super-admin`)
- HR Employee Directory (`/portal/hr/employees`)
- HR Attendance & Shifts Console (`/portal/hr/attendance`)
- HR Leave Management Console (`/portal/hr/leave`)
- Recruitment & Applicant Tracking Pipeline (`/portal/recruitment`)
- Finance & Payroll Processing Console (`/portal/finance-payroll`)
- Employee Self-Service Workspace (`/portal/employee`)
- Team Manager Console (`/portal/manager`)
- IT Hardware Inventory Console (`/portal/it-assets`)
- Onboarding & Offboarding Lifecycle View (`/portal/hr/onboarding`)
- Compliance Auditor Portal (`/portal/auditor`)

Detailed capture procedures and checklists are documented in [`docs/screenshots/screenshot-guide.md`](file:///c:/Users/TEJA/Documents/Employee%20Management%20System%20-%20EMS/docs/screenshots/screenshot-guide.md).

---

## Chapter 12: Installation and Deployment

### 12.1 Quick Setup Runbook
```bash
# 1. Install dependencies across workspaces
pnpm install

# 2. Verify all quality gates
pnpm test
pnpm typecheck
pnpm lint

# 3. Compile production web application
pnpm --filter @ems/web build

# 4. Start production server
pnpm --filter @ems/web start
```

### 12.2 Production Hosting
Designed for cloud deployment on Vercel or AWS ECS connected to Supabase managed PostgreSQL with SSL/TLS 1.3 encryption.

---

## Chapter 13: Conclusion, Team Contributions and Future Scope

### 13.1 Verified Achievements
EMS v1.0.0 successfully delivers a full-featured, secure, multi-tenant human capital operations platform for GIET Polytechnic College. The solution replaces error-prone spreadsheets with an automated, auditable, and role-governed web application.

### 13.2 Team Contributions
The project was executed by Team T-1 under the guidance of the faculty review committee:
- **Teja (Team Lead):** Monorepo architecture, multi-tenant RLS design, system integration, security auditing.
- **Ashok:** Database migrations, PostgreSQL entity relationships, cross-organization triggers.
- **Charan:** Supabase Auth integration, session management, RBAC matrix, and portal access routing.
- **Kula Shekhar:** Attendance clock-in/out engine, shift policies, and leave approval workflows.
- **Jahnavi:** Payroll engine, salary structures, sequential run state machines, and payslip generation.
- **Afsar:** Operations modules (Onboarding, Offboarding, IT Assets, Documents, Announcements), and automated test suites.

### 13.3 Future Enhancements
1. **AI-Driven Predictive Analytics:** Machine learning models for employee attrition risk and shift demand forecasting.
2. **Biometric IoT Hardware Bridge:** Direct MQTT integration for on-premise fingerprint scanners.
3. **Multilingual Regionalization:** Telugu, Hindi, and Tamil language support for employee self-service interfaces.
4. **Direct Banking API Integrations:** Automated salary disbursement via corporate banking gateways.

---

*GIET Polytechnic College · Artificial Intelligence (AI) Department · Batch 2024–2027 · Team T-1 · Publisher ID: GIETP-AI-IT-EMS-T1-2026 · App ID: in.gietpoly.ems · Version 1.0.0*
