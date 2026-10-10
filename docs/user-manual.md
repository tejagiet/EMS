# User Manual — EMS Portals

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## 1. Getting Started

### 1.1 Logging In
1. Navigate to `http://localhost:3000/login` in your web browser.
2. Enter your corporate email and password.
3. Click **Sign In**. The system will verify your credentials, determine your assigned portal role, and redirect you to your designated portal.
4. If you have forgotten your password, click **Forgot password?** to receive a secure reset link.

---

## 2. Role-Specific User Guides

### 2.1 Employee Self-Service (`/portal/employee`)
- **Daily Timeclock:** Click the **Clock In** button upon beginning your work shift. When departing, click **Clock Out** to record your session hours.
- **Attendance History:** Review your daily attendance history, logged break durations, and overtime entries.
- **Leave Requests:** Click **Request Leave**, select the leave type (Annual, Sick, Casual), specify the date range and reason, and click **Submit Request**. Monitor the approval status in your leave table.
- **Payslips:** Access the **Payslips** section to view and download your monthly digital salary slips.
- **Assigned Hardware:** Review all company IT equipment (laptops, monitors) currently issued to you.
- **Notice Board:** Read official organizational announcements and updates.

### 2.2 HR Manager Portal (`/portal/hr`)
- **Employee Directory (`/portal/hr/employees`):** Search employees by name or code, filter by department and branch, view employment records, and export directory data to CSV.
- **Attendance Oversight (`/portal/hr/attendance`):** Monitor organization-wide daily attendance logs, identify absenteeism, and review supervisor shift assignments.
- **Leave Oversight (`/portal/hr/leave`):** Review pending leave requests, check departmental coverage, and monitor employee leave balances.
- **Onboarding (`/portal/hr/onboarding`):** Track incoming new hires, review required checklist tasks (document verification, equipment allocation), and confirm probation completion.
- **Offboarding (`/portal/hr/offboarding`):** Initiate employee exit workflows, track multi-department clearances (IT, Finance, HR), and execute final account deactivation.
- **Performance (`/portal/hr/performance`):** Monitor appraisal cycles, set institutional goals, and review manager evaluations on the 1.0–5.0 rating scale.
- **Documents & Announcements:** Verify uploaded credentials and broadcast institutional notices.

### 2.3 Recruitment Manager Portal (`/portal/recruitment`)
- **Job Postings:** Create new job vacancies with title, department, description, and salary bounds.
- **Applicant Pipeline:** Track candidates across pipeline stages (`applied`, `screening`, `interview`, `offered`, `hired`, `rejected`).
- **Interview Scheduling:** Assign interviewers, specify interview dates, and review candidate scorecards.
- **Job Offers & Onboarding:** Extend job offers; upon candidate acceptance, trigger automated handoff to the employee onboarding pipeline.

### 2.4 Finance & Payroll Manager Portal (`/portal/finance-payroll`)
- **Salary Structures:** Configure base salaries, HRA, DA, travel allowances, and provident fund deduction rules.
- **Payroll Runs:** Create a monthly payroll run for a specific year and month. The system automatically reconciles attendance and unpaid leaves.
- **Approval Workflow:** Review draft calculations, submit for executive review, and approve the run.
- **Payslips & Disbursement:** Once approved, generate digital payslips and record salary payment disbursement.

### 2.5 Manager Portal (`/portal/manager`)
- **Direct Reports:** View attendance and current shift status of direct reporting team members.
- **Leave Approvals:** Review leave applications submitted by your team and approve or reject with comments.
- **Task Delegation:** Create, assign, and track operational tasks for team members.

### 2.6 Department Head Portal (`/portal/dept-head`)
- **Department Roster:** Monitor staffing levels across branches for your functional department.
- **Cross-Branch Approvals:** Review inter-branch transfers, resource allocations, and department leave quotas.

### 2.7 IT & Assets Manager Portal (`/portal/it-assets`)
- **Hardware Inventory:** Register new computing hardware with serial numbers, asset tags, and model information.
- **Asset Allocation:** Assign available hardware to employees (system enforces 1 active assignment per device).
- **Condition Inspection & Returns:** Process asset returns, evaluate hardware condition (Good, Damaged, Fair), and log maintenance tickets.

### 2.8 Organization Administrator Portal (`/portal/org-admin`)
- **Organization Hierarchy:** Manage physical branches, departments, sub-departments, and designations.
- **Designation Levels:** Configure hierarchy grades from Level 1 to Level 20.
- **Settings:** Configure organization-wide settings, work hours, and holiday calendars.

### 2.9 Super Administrator Portal (`/portal/super-admin`)
- **Tenant Management:** Provision new tenant organizations with unique codes and slugs.
- **System Monitoring:** Review system-level error logs, tenant growth, and platform health.

### 2.10 Compliance Auditor Portal (`/portal/auditor`)
- **Read-Only Inspection:** Review immutable audit logs (`employee_history`, `task_activity_log`, `payroll_records`).
- **Regulatory Reporting:** Verify that compensation changes and terminations followed standard approval workflows.
