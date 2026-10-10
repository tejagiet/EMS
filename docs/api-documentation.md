# API and Server Operations Documentation — EMS

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## 1. Overview

EMS utilizes **Next.js 15 Server Actions** and typed database modules in `apps/web/lib/data/*` rather than unauthenticated public REST endpoints. All operations authenticate the incoming request using the HTTP cookie session context.

---

## 2. Server Action Operations

### 2.1 Authentication & Session
- `signInAction(formData)`: Validates credentials, executes Supabase Auth `signInWithPassword`, sets session cookies.
- `signOutAction()`: Clears active session cookies and redirects to `/login`.
- `requestPasswordResetAction(email)`: Dispatches password recovery link.
- `updatePasswordAction(newPassword)`: Updates authenticated user password.

### 2.2 Employee Management (`apps/web/lib/data/employees.ts`)
- `getEmployees(params)`: Retrieves paginated employees with department, branch, and status filtering.
- `getEmployeeById(id)`: Retrieves single employee profile, reporting manager, and salary details.
- `createEmployeeAction(data)`: Validates via `employeeCreateSchema`, creates employee row, records audit entry.
- `updateEmployeeAction(id, data)`: Validates via `employeeUpdateSchema`, updates employee, records delta in `employee_history`.

### 2.3 Attendance & Work Sessions (`apps/web/lib/data/attendance.ts`)
- `clockInAction(location)`: Creates new attendance record and initiates active `work_sessions` row.
- `clockOutAction()`: Calculates worked hours, computes break time and overtime, closes `work_sessions` row.
- `getMonthlyAttendance(employeeId, year, month)`: Returns 30-day calendar attendance summary.

### 2.4 Leave Management (`apps/web/lib/data/leave.ts`)
- `submitLeaveRequestAction(data)`: Validates balance; creates pending `leave_requests` entry.
- `processLeaveApprovalAction(requestId, decision, comments)`: Updates status to `approved`/`rejected`; deducts quota balance if approved.

### 2.5 Payroll Operations (`apps/web/lib/data/payroll.ts`)
- `generatePayrollRunAction(year, month)`: Generates monthly payroll run; checks duplicate run constraint; computes allowances and deductions.
- `transitionPayrollStatusAction(runId, targetStatus)`: Enforces workflow transition (`draft` $\to$ `review` $\to$ `approved` $\to$ `paid`).
- `getPayslipById(recordId)`: Returns itemized payslip breakdown for employee digital view or printing.

### 2.6 Operations & Talent Management (`apps/web/lib/data/`)
- `completeOnboardingCaseAction(caseId)`: Invokes PostgreSQL RPC `complete_onboarding_case()`, ensuring 100% of required tasks are completed.
- `processOffboardingDecisionAction(caseId)`: Invokes PostgreSQL RPC `process_offboarding_decision()`, requiring all department clearances before deactivation.
- `assignAssetAction(assetId, employeeId)`: Allocates hardware asset, verifying availability and single-assignment constraint.
- `returnAssetAction(assignmentId, condition)`: Returns hardware device, logs condition, updates status.
- `submitPerformanceReviewAction(data)`: Submits appraisal with 1.0–5.0 rating scale enforcement.

---

## 3. Database RPC Signatures

```sql
-- Handoff candidate to employee & instantiate onboarding
SELECT public.handoff_candidate_to_employee(
  p_application_id UUID,
  p_employee_code TEXT,
  p_joining_date DATE
);

-- Complete onboarding case
SELECT public.complete_onboarding_case(
  p_case_id UUID
);

-- Process employee offboarding decision & account deactivation
SELECT public.process_offboarding_decision(
  p_case_id UUID,
  p_decision TEXT -- 'confirmed_termination' or 'confirmed_resignation'
);

-- Assign hardware asset to employee
SELECT public.assign_asset(
  p_asset_id UUID,
  p_employee_id UUID,
  p_notes TEXT
);

-- Return hardware asset
SELECT public.return_asset(
  p_assignment_id UUID,
  p_condition TEXT -- 'excellent', 'good', 'fair', 'damaged'
);
```
