# Limitations and Future Scope — EMS

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## 1. Verified Achievements

EMS v1.0.0 delivers a fully functional, production-ready web platform supporting:
- Multi-tenant data isolation via PostgreSQL Row Level Security (RLS) across 35+ tables.
- 10 protected enterprise portals mapped to specific organizational roles.
- Complete business pipelines: Recruitment $\to$ Candidate Handoff $\to$ Onboarding $\to$ Attendance $\to$ Leaves $\to$ Payroll $\to$ Appraisals $\to$ Assets $\to$ Offboarding.
- 100/100 automated test pass rate across 8 comprehensive Vitest suites.
- Strict TypeScript compile without errors (0 errors across 9 workspaces).
- Next.js 15 production build compiling 34 routes.

---

## 2. Documented Current Limitations

To maintain academic and technical integrity, the following limitations are explicitly documented:

### 2.1 Native Mobile and Desktop Platform Compilation
- While `apps/mobile` (Expo SDK 52) and `apps/desktop` (Tauri v2) exist in the monorepo and share TypeScript types, validation, and config, native Android binary generation (APK/AAB via Expo EAS) and native Windows desktop installer generation (`.msi` via Rust cargo) require platform-specific cloud build pipelines not run in the local web test environment.
- The web portal (`apps/web`) is responsive across desktop and mobile viewports, serving as the primary production interface.

### 2.2 Physical Biometric Device Integration
- Daily attendance clock-in/out is currently executed through web-based geo/IP clocking. Direct hardware integration with physical biometric fingerprint scanners (e.g., ZKTeco / Morpho devices) requires an on-premise IoT webhook gateway, which remains a hardware-dependent future scope item.

### 2.3 Direct Bank Payment Gateway Integration
- The payroll module computes complete salary slips, gross earnings, and statutory deductions, but bank disbursement currently outputs payment transaction files rather than executing direct live API transfers via banking gateways (e.g. RazorpayX / ICICI Corporate API).

---

## 3. Future Scope and Enhancements

### 3.1 AI-Powered Workforce Analytics
- Leverage the AI Department's core competencies to implement predictive attrition modeling, employee sentiment analysis from appraisal text, and automated workforce shift demand forecasting using machine learning models.

### 3.2 Biometric Hardware IoT Bridge
- Develop an open-source MQTT / HTTP IoT daemon to sync physical biometric wall-mounted scanners directly into Supabase `attendance_records` in real time.

### 3.3 Multi-Lingual Regional Support
- Extend `@ems/config` to support regional language localization (e.g., Telugu, Hindi, Tamil) for employee self-service timeclocks and mobile screens.

### 3.4 Direct Automated Tax Filing
- Introduce automated generation of statutory regulatory returns (e.g. Form 16, Provident Fund ECR text files, ESI monthly returns).
