# Module Documentation — EMS

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## Overview

This document describes the functional modules implemented in EMS v1.0.0, detailing their purpose, data inputs, business processing, outputs, required permissions, and database interactions.

---

## 1. Super Admin Module
- **Route:** `/portal/super-admin`
- **Role Required:** `super_admin`
- **Purpose:** Platform infrastructure administration, multi-tenant organization provisioning, and global telemetry.
- **Inputs:** Organization name, slug, code, contact information, subscription parameters.
- **Processing:** Provisions organization row, sets up initial admin profile, seeds default roles.
- **Outputs:** Tenant dashboard, system metrics, audit logs.
- **Permissions:** Full system access (`organization.write`, `settings.write`, etc.).

---

## 2. Organization Administration Module
- **Route:** `/portal/org-admin`
- **Role Required:** `org_admin`
- **Purpose:** Configuration of organizational structures, physical branches, departments, designations, and corporate settings.
- **Inputs:** Branch details, department names and parent relationships, designation levels (1–20).
- **Processing:** Validates uniqueness of codes within the organization; enforces cross-org boundary triggers.
- **Outputs:** Organizational charts, branch lists, department trees.
- **Permissions:** `organization.read`, `organization.write`, `settings.write`.

---

## 3. HR & Employee Management Module
- **Route:** `/portal/hr/employees`
- **Role Required:** `hr_manager`
- **Purpose:** Comprehensive management of employee profiles, employment status, reporting relationships, and history.
- **Inputs:** Employee code, profile information, department, branch, designation, joining date, status.
- **Processing:** Validates employee code uniqueness per tenant; automatically creates audit entries in `employee_history` upon update.
- **Outputs:** Employee directory table, detailed profile view, CSV export.
- **Permissions:** `employee.read`, `employee.write`.

---

## 4. Recruitment & Applicant Tracking Module
- **Route:** `/portal/recruitment`
- **Role Required:** `recruitment_manager`
- **Purpose:** Vacancy advertising, applicant screening, interview evaluation, and job offer generation.
- **Inputs:** Job posting requirements, candidate contact data, resumes, interview scores, offer letters.
- **Processing:** Pipeline state machine (`applied` $\to$ `screening` $\to$ `interview` $\to$ `offered` $\to$ `hired`/`rejected`); transactional handoff RPC `handoff_candidate_to_employee()`.
- **Outputs:** Pipeline kanban/table, interview scorecards, job offers, automated employee record creation.
- **Permissions:** `recruitment.read`, `recruitment.write`.

---

## 5. Attendance & Shifts Module
- **Route:** `/portal/hr/attendance`, `/portal/hr/shifts`
- **Role Required:** `hr_manager`, `manager`, `employee`
- **Purpose:** Work shift scheduling, daily clock-in/out recording, duration calculation, and attendance regularizations.
- **Inputs:** Geolocation, IP address, timestamp, break intervals.
- **Processing:** Computes total hours worked, breaks, overtime, and late arrivals; validates single active session.
- **Outputs:** Daily logs, attendance summaries, monthly calendars, anomaly alerts.
- **Permissions:** `attendance.self`, `attendance.read`, `attendance.manage`.

---

## 6. Leave Management Module
- **Route:** `/portal/hr/leave`
- **Role Required:** `hr_manager`, `manager`, `employee`
- **Purpose:** Leave quota tracking, leave request submission, supervisor approvals, and calendar synchronization.
- **Inputs:** Leave category, start date, end date, reason.
- **Processing:** Checks available quota balance; dispatches approval task to reporting manager; deducts balance upon approval.
- **Outputs:** Personal balance cards, leave history, departmental leave calendar.
- **Permissions:** `leave.self`, `leave.read`, `leave.manage`.

---

## 7. Finance & Payroll Module
- **Route:** `/portal/finance-payroll`
- **Role Required:** `finance_payroll_manager`
- **Purpose:** Salary component configuration, monthly payroll run calculation, approvals, and payslip generation.
- **Inputs:** Basic pay, HRA, DA, allowances, tax deductions, unpaid leave count.
- **Processing:** Idempotent run generator; status machine (`draft` $\to$ `review` $\to$ `approved` $\to$ `paid`); immutable locking upon approval.
- **Outputs:** Payroll summary table, salary disbursement report, downloadable digital payslips.
- **Permissions:** `payroll.read`, `payroll.write`, `payroll.process`.

---

## 8. Onboarding & Offboarding Module
- **Route:** `/portal/hr/onboarding`, `/portal/hr/offboarding`
- **Role Required:** `hr_manager`
- **Purpose:** Structured new hire onboarding checklists and systematic employee exit clearance management.
- **Inputs:** Checklist tasks, clearance checkpoints (IT, Finance, HR).
- **Processing:** 
  - Onboarding: Prohibits case completion until all required tasks are marked completed.
  - Offboarding: Enforces clearance sign-offs before atomic account deactivation via `process_offboarding_decision()`.
- **Outputs:** Onboarding progress meters, exit clearance status, employee deactivation audit.
- **Permissions:** `employee.manage`, `employee.write`.

---

## 9. IT Hardware Assets Module
- **Route:** `/portal/it-assets`
- **Role Required:** `it_assets_manager`
- **Purpose:** Enterprise hardware equipment tracking, allocation to staff, return condition inspection, and maintenance logs.
- **Inputs:** Device serial number, asset tag, model, assignment dates, condition notes.
- **Processing:** Enforces single active assignment constraint; blocks assignment of retired/under-maintenance assets.
- **Outputs:** Asset inventory grid, assignment receipts, maintenance history.
- **Permissions:** `asset.read`, `asset.manage`.

---

## 10. Performance, Tasks, Documents & Announcements
- **Route:** `/portal/hr/performance`, `/portal/hr/documents`, `/portal/hr/announcements`, `/portal/employee`
- **Role Required:** `hr_manager`, `manager`, `employee`
- **Purpose:** Biannual performance appraisals with 1.0–5.0 rating scale, operational task delegation, verified document repository, and institutional bulletins.
- **Inputs:** Goals, review ratings, task statuses, document uploads, announcement notices.
- **Processing:** Validates appraisal rating boundaries; verifies document categories; records read receipts.
- **Outputs:** Appraisal summaries, task audit logs, verified documents, notice cards.
- **Permissions:** `employee.read`, `document.read`, `document.write`.

---

## 11. Compliance Auditor Module
- **Route:** `/portal/auditor`
- **Role Required:** `auditor`
- **Purpose:** Read-only portal for regulatory compliance and audit trail review.
- **Inputs:** Date range, organization filter.
- **Processing:** Reads `employee_history`, `task_activity_log`, and `payroll_records`; mutation actions are structurally blocked.
- **Outputs:** Audit logs, payroll variance summaries, security access records.
- **Permissions:** `audit.read`, `employee.read`, `payroll.read`.
