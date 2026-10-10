# 07 — Payroll Processing Flow

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## State & Data Flow: Monthly Payroll Run

```mermaid
stateDiagram-v2
    [*] --> Draft: Finance Manager creates Payroll Run (Year, Month)
    
    state Draft {
        [*] --> FetchEligible: Query active employees in organization
        FetchEligible --> ApplySalaryStructure: Retrieve effective salary components
        ApplySalaryStructure --> DeductAbsences: Factor in unpaid leave & loss of pay
        DeductAbsences --> ComputeAllowances: Basic + HRA + DA + Special Allowances
        ComputeAllowances --> ComputeDeductions: Tax (TDS) + PF + ESI + Deductions
        ComputeDeductions --> GenerateDraftRecords: Compute Net Salary = Gross - Deductions
    }

    Draft --> Review: Submit for HR & Management Review
    Review --> Draft: Revisions requested / Adjustments needed
    Review --> Approved: Organization Executive Approves Run
    Review --> Void: Cancel Run

    state Approved {
        [*] --> LockRecords: Payroll records locked (immutable)
        LockRecords --> GeneratePayslips: Digital payslips created for all employees
    }

    Approved --> Paid: Salary disbursement recorded with transaction reference
    Paid --> [*]: Final state, archival in audit log
```

### Idempotency & Concurrency Rules
- **Unique Period Constraint:** Unique index on `(organization_id, period_year, period_month)` guarantees no duplicate runs can be spawned.
- **Sequential Gate:** Runs cannot transition directly from `draft` to `paid` without formal `review` and `approved` sign-offs.
- **Immutable Locking:** Once status is `approved` or `paid`, individual payroll line items cannot be modified.
