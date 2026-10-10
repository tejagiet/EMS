# Project Abstract — Employee Management System (EMS)

**Institution:** GIET Polytechnic College  
**Department:** Artificial Intelligence (AI) Department  
**Batch:** 2024–2027  
**Project Category:** Industrial Training Project  
**Team:** T-1  
**Team Lead:** Teja  
**Team Members:** Ashok, Charan, Kula Shekhar, Jahnavi and Afsar  
**Publisher ID:** `GIETP-AI-IT-EMS-T1-2026`  
**Application Identifier:** `in.gietpoly.ems`  
**Version:** 1.0.0  
**Copyright:** © 2026 GIET Polytechnic College — AI Department  

---

## Abstract

Modern enterprises, academic institutions, and growing industrial organizations require unified, secure, and transparent systems to manage human capital across the entire employment lifecycle. Traditional management mechanisms characterized by decentralized spreadsheets, fragmented attendance ledgers, disconnected payroll spreadsheets, and manual paper approvals lead to administrative overhead, data discrepancies, vulnerability to unauthorized modification, and compliance liabilities.

The **Employee Management System (EMS)** is an enterprise-grade, multi-tenant human resource and workforce operations platform engineered by Team T-1 of the Artificial Intelligence Department at GIET Polytechnic College as an Industrial Training Project. The solution is architected as a modern TypeScript monorepo powered by **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS**, and **Supabase PostgreSQL 15**.

The platform incorporates comprehensive operational modules spanning:
1. **Multi-Tenant Administration:** Dedicated organization partitioning, branch structures, departments, and designations.
2. **Role-Based Access Control (RBAC):** Ten protected enterprise portals serving distinct organizational roles (`super_admin`, `org_admin`, `hr_manager`, `recruitment_manager`, `finance_payroll_manager`, `manager`, `dept_head`, `it_assets_manager`, `employee`, and `auditor`) governed by 22 canonical permission codes and PostgreSQL Row Level Security (RLS).
3. **Talent Acquisition & Recruitment:** Job vacancy publishing, candidate applicant tracking, interview scorecards, formal job offers, and automated candidate-to-employee handoff.
4. **Operations & Workforce Management:** Daily timeclock recording, shift assignments, leave balances and approval workflows, operational task boards, performance appraisals (1.0–5.0 rating scale), digital document management, and targeted organizational announcements.
5. **IT Asset Inventory:** Hardware equipment tracking, allocation constraints (1 active assignment per device), return condition inspections, and maintenance records.
6. **Payroll & Compensation Engine:** Configurable salary components, period generation, absence reconciliations, sequential review workflows (`draft` $\to$ `review` $\to$ `approved` $\to$ `paid`), and payslip distribution.
7. **Security & Compliance:** Database-level cross-tenant foreign key boundary triggers, self-assignment prevention triggers, CSV formula-injection sanitization, open-redirect protection, and an immutable auditor portal.

The application has undergone complete integration testing and security auditing, achieving a **100% automated pass rate (100/100 tests across 8 test suites)** in Vitest, **0 TypeScript compiler errors** under strict mode across all 9 workspaces, **0 ESLint code quality issues**, and a verified Next.js 15 production build compiling **34 optimized routes**. EMS v1.0.0 provides a resilient, modular, and audit-compliant foundation ready for institutional deployment.

---

**Keywords:** Employee Management System, Multi-Tenancy, Row Level Security, Role-Based Access Control, Next.js 15, React 19, Supabase PostgreSQL, Human Capital Management, Industrial Training Project, GIET Polytechnic College.
