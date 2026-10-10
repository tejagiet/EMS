# Application Screenshot Guide & Live Verification Checklist — EMS

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## 1. Overview & Verification Protocol

The Employee Management System web application (`apps/web`) is fully compiled and ready to serve at `http://localhost:3000`. This guide details the 15 primary live views available for review evaluation.

To launch the live application for screenshot capture:
```bash
# Start the web application
pnpm dev:web
```
Access the application in your browser at `http://localhost:3000`.

---

## 2. Live Screenshot Verification Checklist

| ID | Screen / View Name | Live Route URL | Role Required | Key Elements to Verify |
| :---: | :--- | :--- | :--- | :--- |
| **SC-01** | **Landing & Gateway** | `http://localhost:3000` | Public | Institutional branding, quick portal cards, sign-in gateway button. |
| **SC-02** | **Authentication Screen** | `http://localhost:3000/login` | Public | Email and password inputs, role preview switcher, password recovery link. |
| **SC-03** | **Password Recovery** | `http://localhost:3000/forgot-password` | Public | Recovery email input, submission feedback, back-to-login link. |
| **SC-04** | **Organization Admin** | `http://localhost:3000/portal/org-admin` | `org_admin` | Organization metrics, branch inventory, department structure, designation grades. |
| **SC-05** | **Super Administrator** | `http://localhost:3000/portal/super-admin` | `super_admin` | Global multi-tenant listing, platform health status, tenant provisioning dialog. |
| **SC-06** | **HR Employee Directory**| `http://localhost:3000/portal/hr/employees` | `hr_manager` | Employee directory table, search, department filter, CSV export button. |
| **SC-07** | **HR Attendance Dashboard**| `http://localhost:3000/portal/hr/attendance` | `hr_manager` | Daily attendance log, shift roster, worked hours summary, anomaly tags. |
| **SC-08** | **HR Leave Oversight** | `http://localhost:3000/portal/hr/leave` | `hr_manager` | Leave request approvals, quota balance inspector, departmental leave calendar. |
| **SC-09** | **Recruitment Pipeline** | `http://localhost:3000/portal/recruitment` | `recruitment_manager` | Job postings, applicant pipeline kanban, interview scorecard modal. |
| **SC-10** | **Finance & Payroll Runs**| `http://localhost:3000/portal/finance-payroll`| `finance_payroll_manager` | Monthly payroll run table, status badges (`draft` to `paid`), payslip viewer. |
| **SC-11** | **Employee Self-Service** | `http://localhost:3000/portal/employee` | `employee` | Digital clock-in/out button, personal attendance history, my payslips. |
| **SC-12** | **Manager Team Portal** | `http://localhost:3000/portal/manager` | `manager` | Direct reports attendance status, pending leave approvals, team tasks. |
| **SC-13** | **IT Hardware Inventory** | `http://localhost:3000/portal/it-assets` | `it_assets_manager` | Asset inventory grid, device assignment modal, condition return dialog. |
| **SC-14** | **Onboarding / Offboarding**| `http://localhost:3000/portal/hr/onboarding` | `hr_manager` | Checklist progress meter, clearance checkpoints, account deactivation modal. |
| **SC-15** | **Compliance Auditor** | `http://localhost:3000/portal/auditor` | `auditor` | Read-only audit log, employee modification history, payroll journal. |

---

## 3. Capturing Guidelines for Evaluation

1. **Resolution:** Recommended resolution of 1920x1080 (1080p) or 1280x720 at 100% browser zoom.
2. **Format:** Save images in PNG or JPEG format in `docs/screenshots/` (e.g. `sc-01-landing.png`, `sc-06-employee-directory.png`).
3. **Data Integrity:** Use deterministic development seed data (`seed.sql`) featuring GIET Polytechnic College sample records. Never capture screenshots displaying confidential personal information.
