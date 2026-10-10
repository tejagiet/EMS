# Software Requirements Specification (SRS) — EMS

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification document details the functional and non-functional requirements for the Employee Management System (EMS) v1.0.0.

### 1.2 Scope
EMS covers organization management, employee directory, attendance tracking, shift scheduling, leave approval, payroll processing, recruitment pipelines, onboarding/offboarding workflows, performance evaluations, IT hardware assets, document management, and compliance auditing.

---

## 2. Overall Description

### 2.1 User Roles and Personas
The system defines 10 discrete user roles with corresponding portal access:
1. **Super Administrator (`super_admin`):** Manages multi-tenant organizations, system-level configurations, and platform health.
2. **Organization Administrator (`org_admin`):** Configures organizational branches, departments, designations, and global organization settings.
3. **HR Manager (`hr_manager`):** Manages employee records, lifecycle transitions (onboarding, confirmation, offboarding), appraisals, documents, and notices.
4. **Recruitment Manager (`recruitment_manager`):** Publishes vacancies, screens candidates, schedules interviews, and extends offers.
5. **Finance & Payroll Manager (`finance_payroll_manager`):** Manages salary structures, executes payroll runs, reviews deductions, and issues payslips.
6. **Manager (`manager`):** Reviews attendance corrections, approves leave requests, delegates operational tasks, and conducts team reviews.
7. **Department Head (`dept_head`):** Department-wide staffing oversight, inter-branch coordination, and high-level approvals.
8. **IT & Assets Manager (`it_assets_manager`):** Manages hardware inventory, tracks assignments, records maintenance, and conducts return clearances.
9. **Employee (`employee`):** Self-service portal for clocking in/out, requesting leaves, viewing payslips, tracking tasks, and reading announcements.
10. **Compliance Auditor (`auditor`):** Read-only inspection of employee audit trails, payroll runs, and access logs.

---

## 3. Functional Requirements

### 3.1 Authentication & Session Management (FR-AUTH)
- **FR-AUTH-1:** User shall authenticate via verified email and password.
- **FR-AUTH-2:** System shall persist session state via secure, HttpOnly cookies using `@supabase/ssr`.
- **FR-AUTH-3:** System shall support password reset and recovery workflows via authenticated email links.
- **FR-AUTH-4:** System shall validate route navigation and redirect unauthenticated requests to `/login`.
- **FR-AUTH-5:** System shall prevent open redirects by sanitizing redirect URL targets.

### 3.2 Organization & Hierarchy Management (FR-ORG)
- **FR-ORG-1:** System shall support multiple independent organizations with complete data isolation.
- **FR-ORG-2:** System shall permit configuration of multiple branches per organization.
- **FR-ORG-3:** System shall permit configuration of hierarchical departments per organization/branch.
- **FR-ORG-4:** System shall prevent cross-organization assignments between branches, departments, and employees via database triggers.

### 3.3 Employee Management & Lifecycle (FR-EMP)
- **FR-EMP-1:** System shall maintain an employee directory with search, department filtering, and pagination.
- **FR-EMP-2:** System shall support CRUD operations on employee profiles with unique employee codes per organization.
- **FR-EMP-3:** System shall record changes to sensitive employee fields in an immutable `employee_history` table.
- **FR-EMP-4:** System shall support employee CSV export with formula-injection neutralization.

### 3.4 Attendance & Shifts (FR-ATT)
- **FR-ATT-1:** Employees shall be able to clock in and clock out to generate work sessions.
- **FR-ATT-2:** System shall calculate total worked hours, break duration, and overtime per work session.
- **FR-ATT-3:** System shall prevent concurrent overlapping active work sessions for the same employee.
- **FR-ATT-4:** Employees shall be able to view their monthly attendance calendar and history.

### 3.5 Leave Management (FR-LEV)
- **FR-LEV-1:** System shall maintain leave types (annual, sick, casual, maternity) and track balances.
- **FR-LEV-2:** Employees shall submit leave requests with date range and reason.
- **FR-LEV-3:** System shall validate that requested days do not exceed available balance.
- **FR-LEV-4:** Managers shall approve or reject leave requests with comments; approvals atomically update balances.

### 3.6 Payroll Engine (FR-PAY)
- **FR-PAY-1:** System shall support configurable salary structures with base pay, allowances, and statutory deductions.
- **FR-PAY-2:** System shall prevent duplicate payroll runs for the same organization, month, and year.
- **FR-PAY-3:** Payroll runs shall enforce a sequential status machine: `draft` $\to$ `review` $\to$ `approved` $\to$ `paid`.
- **FR-PAY-4:** System shall lock payroll records as immutable once approved.
- **FR-PAY-5:** Employees shall be able to view and print digital payslips for finalized runs.

### 3.7 Recruitment & Applicant Tracking (FR-REC)
- **FR-REC-1:** Recruiters shall publish job vacancies with job details, department, and salary ranges.
- **FR-REC-2:** System shall track applicants through pipeline stages: applied, screening, interview, offer, hired, rejected.
- **FR-REC-3:** Interviewers shall record structured interview evaluation scorecards (rating, notes, recommendation).
- **FR-REC-4:** System shall extend job offers and, upon acceptance, execute transactional handoff to create employee and onboarding case.

### 3.8 Operations & Talent (FR-OPS)
- **FR-OPS-1:** System shall track onboarding cases with required checklist items; cases cannot close while required items remain incomplete.
- **FR-OPS-2:** System shall track offboarding cases with department clearances (IT, Finance, HR); employees cannot be deactivated until all clearances are cleared.
- **FR-OPS-3:** System shall track IT hardware inventory with a strict 1-active-assignment constraint per device.
- **FR-OPS-4:** System shall support performance review cycles with 1.0–5.0 rating scale bounds.
- **FR-OPS-5:** System shall manage company documents with category classifications and administrative verification status.
- **FR-OPS-6:** System shall broadcast announcements with audience targeting (`all`, `department`, `branch`).

---

## 4. Non-Functional Requirements

### 4.1 Security Requirements
- **NFR-SEC-1:** All operational database tables must have Row Level Security (RLS) enabled.
- **NFR-SEC-2:** Database triggers must prevent users from changing their own organization or granting themselves roles.
- **NFR-SEC-3:** All external inputs to Server Actions must be validated via shared Zod schemas.
- **NFR-SEC-4:** Passwords must be hashed using bcrypt/Argon2 via Supabase Auth GoTrue.

### 4.2 Reliability & Data Integrity
- **NFR-REL-1:** Primary and foreign key relationships must maintain strict referential integrity.
- **NFR-REL-2:** Audit trails (`employee_history`, `task_activity_log`) must be append-only and immutable.

### 4.3 Performance
- **NFR-PER-1:** Server-rendered Next.js pages must achieve sub-500ms initial response on broadband networks.
- **NFR-PER-2:** Database queries must utilize indexed columns (e.g., `organization_id`, `employee_code`, `status`).

### 4.4 Portability & Monorepo Structure
- **NFR-POR-1:** Codebase must be managed under a pnpm monorepo with clean separation between shared logic (`packages/*`) and applications (`apps/*`).
- **NFR-POR-2:** Web application must run cross-browser on Chromium, Gecko, and WebKit rendering engines.

---

## 5. Software & Hardware Specifications

### 5.1 Development Environment
- **Operating System:** Windows 10/11, macOS, or Linux.
- **Runtime:** Node.js v20.x or v22.x LTS.
- **Package Manager:** pnpm 9.x.
- **Database:** Supabase PostgreSQL 15.
- **Language:** TypeScript 5.5+ (Strict Mode).

### 5.2 Client Requirements
- **Web Client:** Any modern web browser supporting ECMAScript 2022+ (Google Chrome 110+, Microsoft Edge 110+, Mozilla Firefox 110+, Apple Safari 16+).
- **Display Resolution:** Optimized for responsive viewports (1280x720 minimum recommended for enterprise dashboards).
