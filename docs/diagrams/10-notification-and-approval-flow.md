# 10 — Notification and Approval Flow

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## Notification Dispatch and Multi-Level Approvals

```mermaid
flowchart TD
    subgraph TriggerEvents ["System Trigger Events"]
        E1[Leave Application Submitted]
        E2[Attendance Regularization Requested]
        E3[Payroll Run Submitted for Review]
        E4[Asset Return Requested]
        E5[Institutional Announcement Published]
    end

    subgraph DispatchEngine ["Notification & Approval Dispatcher"]
        Triage{Event Triage}
        E1 & E2 & E3 & E4 & E5 --> Triage

        Triage -->|Workflow Approval| CreateApproval[Insert shared_approvals record]
        Triage -->|Broadcast Notice| CreateNotice[Insert announcements & notification_reads]

        CreateApproval --> TargetApprover[Determine Approver: Manager / Dept Head / Executive]
    end

    subgraph ApproverAction ["Approver Evaluation & Action"]
        TargetApprover --> ReviewConsole[Approver Reviews in Portal Console]
        ReviewConsole --> Decision{Decision}
        Decision -->|Approved| ExecAction[Execute Target Domain Action: Leave Approved / Payroll Approved]
        Decision -->|Rejected| RejAction[Update Status: Rejected with Reason]
        
        ExecAction --> NotifyRequester[Notify Employee / Submitter of Approval]
        RejAction --> NotifyRequester
    end

    subgraph AuditTrail ["Immutable Audit Trail"]
        ExecAction & RejAction --> WriteAudit[Log Decision, Timestamp, & Approver ID to Audit History]
    end
```

### Notification Types Handled
- Workflow approvals (`shared_approvals`)
- Personal notifications (`notifications`)
- Institutional announcements (`announcements`) with target audience filtering (`all`, `department`, `branch`)
