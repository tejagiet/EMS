# 05 — Employee Lifecycle Flow

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## State Diagram: Complete Employee Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Applied: Candidate applies to Job Posting
    Applied --> Screening: Resume screened
    Screening --> Interviewing: Technical / HR Interview scheduled
    Interviewing --> Offered: Evaluation passed, Offer extended
    Offered --> OfferAccepted: Candidate accepts offer

    state "Onboarding Phase" as Onboarding {
        OfferAccepted --> Probation: Automated Handoff & Case Created
        Probation --> DocumentVerification: Upload government IDs & certificates
        DocumentVerification --> AssetAllocation: Allocate IT hardware
        AssetAllocation --> TasksCompleted: All mandatory checklist tasks done
    }

    TasksCompleted --> Active: Confirmed Employment (Full-Time / Contract)

    state "Active Employment Phase" as ActivePhase {
        Active --> AttendanceWork: Daily clock-in/out & work sessions
        AttendanceWork --> LeaveCycle: Annual & sick leave accruals
        LeaveCycle --> PerformanceReview: Biannual appraisal & rating (1.0-5.0)
        PerformanceReview --> PayrollDisbursal: Monthly salary calculation
        PayrollDisbursal --> Active
    }

    Active --> Resigned: Resignation submitted
    Active --> Terminated: Administrative termination

    state "Offboarding Phase" as Offboarding {
        Resigned --> ClearancePending: Offboarding Case initiated
        Terminated --> ClearancePending: Offboarding Case initiated
        ClearancePending --> ITAssetReturn: Laptop & equipment inspection
        ITAssetReturn --> FinanceClearance: Dues & expense settlement
        FinanceClearance --> HRExitInterview: Handover verification
    }

    HRExitInterview --> Deactivated: Final Exit Approved
    Deactivated --> [*]: User account deactivated, history archived
```

### Business Rules Enforced
1. **Onboarding Completion Guard:** Cannot confirm employee until 100% of required checklist tasks are marked `completed`.
2. **Offboarding Deactivation Guard:** Cannot deactivate employee profile until all departmental clearance items (IT, Finance, HR) are marked `cleared`.
