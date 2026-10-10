# Project Review Presentation Outline (16:9) — EMS

**Institution:** GIET Polytechnic College  
**Department:** Artificial Intelligence (AI) Department  
**Batch:** 2024–2027  
**Project Category:** Industrial Training Project  
**Team:** T-1  
**Team Lead:** Teja | **Team Members:** Ashok, Charan, Kula Shekhar, Jahnavi, Afsar  
**Publisher ID:** `GIETP-AI-IT-EMS-T1-2026` | **App ID:** `in.gietpoly.ems` | **Version:** 1.0.0  

---

## Slide 1: Title & Institutional Identification
- **Title:** Employee Management System (EMS)
- **Subtitle:** An Enterprise Multi-Tenant Workforce Operations & Human Capital Platform
- **Institution:** GIET Polytechnic College — Artificial Intelligence (AI) Department
- **Batch:** 2024–2027 | Industrial Training Project
- **Team ID:** Team T-1
- **Team Members:** Teja (Lead), Ashok, Charan, Kula Shekhar, Jahnavi, Afsar
- **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | Version: 1.0.0

---

## Slide 2: Abstract & Project Summary
- Comprehensive human resource management platform spanning recruitment to offboarding.
- Multi-tenant architecture with PostgreSQL Row Level Security (RLS) and 10 protected role portals.
- 100% automated test pass rate (100/100 tests in Vitest v5).
- Clean Next.js 15 production build compiling 34 routes.
- Engineered under strict TypeScript and ESLint standards across a 9-workspace monorepo.

---

## Slide 3: Problem Statement
- **Traditional Inefficiencies:** Fragmented spreadsheets, manual attendance registers, disjointed payroll calculations.
- **Data Inconsistencies:** Spreadsheets lack concurrent edit locking, leading to formula tampering and data loss.
- **Security Vulnerabilities:** Absence of row-level tenant boundaries and role-based permissions in legacy manual processes.
- **Compliance Gaps:** Inability to produce immutable audit logs for salary revisions, terminations, and attendance adjustments.

---

## Slide 4: Existing System vs. Proposed EMS
| Dimension | Existing Manual / Spreadsheet Process | Proposed EMS v1.0.0 Platform |
| :--- | :--- | :--- |
| **Data Storage** | Disconnected Excel files / Paper ledgers | Centralized PostgreSQL with Relational Constraints |
| **Multi-Tenancy** | None; risk of cross-tenant exposure | Database RLS with `is_org_member()` isolation |
| **Access Control** | Uncontrolled file sharing | 10 Portals governed by 22 granular permissions |
| **Workflows** | Verbal / Email approvals | Transactional RPC state machines with audit logs |
| **Payroll** | Manual formula calculations | Automated engine with duplicate run prevention |

---

## Slide 5: Project Objectives & Scope
- **Core Objectives:**
  - Build a scalable multi-tenant HR operations platform.
  - Implement 10 discrete user portals for specialized administrative and staff roles.
  - Automate the end-to-end employee lifecycle from recruitment to offboarding.
  - Guarantee zero cross-tenant data leakage via PostgreSQL Row Level Security.
- **Delivered Scope:** 8 database migrations, 35+ tables, 100 automated tests, responsive web application.

---

## Slide 6: Technology Stack & Monorepo Topology
- **Monorepo:** `pnpm workspace` linking 3 apps and 6 shared packages.
- **Frontend Tier:** Next.js 15 (App Router), React 19, Tailwind CSS, Lucide Icons.
- **Backend & Persistence Tier:** Supabase PostgreSQL 15, Supabase Auth (GoTrue), Supabase Storage.
- **Quality Assurance:** Vitest v5, TypeScript 5.5 (Strict Mode), ESLint 9.
- **Cross-Platform Stubs:** Expo SDK 52 (Android) and Tauri v2 (Windows Desktop).

---

## Slide 7: System Architecture (3-Tier)
- **Presentation Tier:** Next.js 15 Server & Client Components rendering responsive dashboards.
- **Application Logic Tier:** Next.js Server Actions and Edge Middleware validating sessions via `@supabase/ssr`.
- **Database Engine Tier:** PostgreSQL 15 running Row Level Security policies, SECURITY DEFINER functions, and boundary triggers.
- *Visual:* [High-Level Architecture Diagram (docs/diagrams/01-high-level-system-architecture.md)](file:///c:/Users/TEJA/Documents/Employee%20Management%20System%20-%20EMS/docs/diagrams/01-high-level-system-architecture.md).

---

## Slide 8: Database Design & Entity Relationships
- 35+ Relational Tables with UUIDv4 primary keys and `timestamptz` timestamps.
- Foreign key `organization_id` on every operational table.
- Core relationship clusters:
  - Organizations $\to$ Branches $\to$ Departments $\to$ Designations $\to$ Employees
  - Employees $\to$ Attendance, Leaves, Payroll Records, Assets, History
  - Recruitment $\to$ Job Postings $\to$ Applications $\to$ Interviews $\to$ Offers
- *Visual:* [ER Diagram (docs/diagrams/04-database-er-diagram.md)](file:///c:/Users/TEJA/Documents/Employee%20Management%20System%20-%20EMS/docs/diagrams/04-database-er-diagram.md).

---

## Slide 9: User Roles & Access Control (RBAC)
- **10 Dedicated Portals:**
  - Super Admin (`/portal/super-admin`), Organization Admin (`/portal/org-admin`)
  - HR Manager (`/portal/hr`), Recruitment (`/portal/recruitment`)
  - Finance & Payroll (`/portal/finance-payroll`), Team Manager (`/portal/manager`)
  - Department Head (`/portal/dept-head`), IT & Assets (`/portal/it-assets`)
  - Employee Self-Service (`/portal/employee`), Compliance Auditor (`/portal/auditor`)
- **22 Canonical Permissions:** Strict capability enforcement at routing and data levels.

---

## Slide 10: Recruitment to Onboarding Lifecycle
- Vacancy Publishing $\to$ Candidate Application $\to$ Screening.
- Interview Scheduling with structured scorecard evaluations.
- Job Offer Extension & Acceptance.
- Transactional handoff RPC `handoff_candidate_to_employee()`:
  - Instantiates employee profile in probation status.
  - Spawns onboarding case with standard checklist tasks.
  - Blocks probation completion until all mandatory checklist items are completed.

---

## Slide 11: Daily Attendance, Shifts & Leaves
- **Digital Timeclock:** Clock-in / clock-out with work session tracking and duration computation.
- **Break & Overtime Engine:** Computes net worked hours, separates standard hours from overtime.
- **Leave Management:** Annual quota balance validation; supervisor review and atomic deduction upon approval.
- **Calendar Synchronization:** Monthly view of attendance status, leaves, and holidays.

---

## Slide 12: Payroll & Compensation Engine
- **Salary Structures:** Basic Pay, HRA, DA, Special Allowances, and PF Deductions.
- **Idempotent Payroll Runs:** Database unique constraints prevent duplicate runs for the same period.
- **Sequential State Machine:** `draft` $\to$ `review` $\to$ `approved` $\to$ `paid`.
- **Immutable Locking:** Approved payroll line items cannot be mutated.
- **Payslips:** Itemized digital payslips available to employees.

---

## Slide 13: Operations, IT Assets & Talent Management
- **Hardware Assets:** Device inventory with serial numbers; strict 1-active-assignment constraint.
- **Appraisals:** Performance cycles with 1.0–5.0 rating scale bounds.
- **Documents:** Credential uploads with administrative verification status.
- **Offboarding Clearances:** IT asset returns, Finance settlement, HR sign-off required prior to atomic account deactivation.

---

## Slide 14: Security Design & Multi-Tenant Audit
- **Tenant Isolation:** PostgreSQL RLS using `public.is_org_member(organization_id)`.
- **Integrity Triggers:** Cross-organization foreign key assignments strictly rejected.
- **Privilege Escalation Defense:** Self-role assignment and self-organization reassignment blocked by database triggers.
- **Input Sanitization:** CSV formula-injection neutralization (`=`, `+`, `-`, `@`) and open-redirect sanitization.

---

## Slide 15: Quality Assurance & Test Verification
- **Automated Tests:** 100/100 tests passed across 8 Vitest suites (100% pass rate).
- **TypeScript Strict Mode:** 0 compiler errors across 9 workspaces (`pnpm typecheck`).
- **Code Linting:** 0 errors and 0 warnings (`pnpm lint`).
- **Production Build:** Clean Next.js 15 build with 34 compiled routes (`pnpm --filter @ems/web build`).

---

## Slide 16: Limitations & Future Scope
- **Current Limitations:**
  - Physical biometric scanners require an IoT device gateway.
  - Native Android (APK) and Windows (.msi) require platform toolchains.
  - Direct banking disbursement outputs export files rather than live banking APIs.
- **Future Scope:**
  - AI-driven attrition risk prediction and workforce scheduling.
  - MQTT IoT bridge for wall-mounted biometric scanners.
  - Multilingual regional localization (Telugu, Hindi, Tamil).

---

## Slide 17: Conclusion
- EMS v1.0.0 delivers a robust, secure, and production-tested human resource platform for GIET Polytechnic College.
- Complete business coverage from recruitment through daily attendance, payroll, and offboarding.
- Multi-tenant security verified at the database engine level.
- Meets all academic and technical industrial training standards for Batch 2024–2027.

---

## Slide 18: Team Contributions & Q&A
- **Team Lead:** Teja — Architecture, Multi-Tenant Security, Monorepo Setup & Integration.
- **Team Members:**
  - Ashok — Database Schema, RLS Policies & Migrations.
  - Charan — Authentication, RBAC & Portal Access Routing.
  - Kula Shekhar — Attendance, Shifts & Leave Management.
  - Jahnavi — Payroll Engine & Payslip Generation.
  - Afsar — Operations, IT Assets, Documents & Testing.
- **Open for Questions & Discussion:** Thank you to the Faculty Review Committee!
