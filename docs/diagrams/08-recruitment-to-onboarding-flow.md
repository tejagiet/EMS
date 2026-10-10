# 08 — Recruitment-to-Onboarding Flow

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## Recruitment-to-Onboarding Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor Candidate
    actor Recruiter as Recruitment Manager
    actor Interviewer as Department Interviewer
    actor HR as HR Manager
    participant ATS as Recruitment Engine
    participant Onboarding as Onboarding Module
    participant DB as PostgreSQL Database

    Recruiter->>ATS: Publish Job Posting (Department, Vacancies, Salary Range)
    Candidate->>ATS: Submit Job Application with Resume & Portfolio
    ATS-->>Recruiter: Application logged (status: applied)
    Recruiter->>Interviewer: Schedule Technical / Domain Interview
    Interviewer->>ATS: Submit Evaluation Scorecard (Score, Feedback, Recommendation)
    
    alt Candidate Rejected
        Recruiter->>ATS: Update status: rejected
    else Candidate Recommended
        Recruiter->>ATS: Extend Job Offer (Base Salary, Joining Date, Terms)
        Candidate->>ATS: Accept Job Offer
        ATS->>DB: Trigger public.handoff_candidate_to_employee()
        DB->>DB: Create employee row (status: probation)
        DB->>Onboarding: Instantiate onboarding_case from template
        Onboarding->>DB: Clone standard onboarding_tasks (Checklist)
        Onboarding-->>HR: Notify HR of incoming new joiner onboarding case
    end
```

### Automation Details
- `handoff_candidate_to_employee()` is a PostgreSQL transactional function.
- It automatically seeds standard onboarding checklist tasks (e.g. Identity Verification, IT Equipment Allocation, Bank Details, Orientation).
