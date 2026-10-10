# 06 — Attendance and Leave Approval Flow

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## Attendance & Leave Workflow

```mermaid
flowchart TD
    subgraph AttendanceEngine ["1. Attendance Logging & Tracking"]
        EmpIn[Employee clicks Clock In] --> ValLoc{Validate Geofence & Shift IP}
        ValLoc -->|Valid| LogIn[Insert attendance_records & start work_sessions]
        ValLoc -->|Invalid| FlagIn[Log anomaly with warning flag]
        LogIn --> ActiveWork[Work Session in Progress]
        ActiveWork --> EmpOut[Employee clicks Clock Out]
        EmpOut --> CalcHours[Compute duration, breaks & overtime]
        CalcHours --> CloseSession[Update work_sessions & attendance_records]
    end

    subgraph LeaveEngine ["2. Leave Request & Approval Flow"]
        LeaveReq[Employee submits Leave Request] --> CheckBal{Check Available Balance}
        CheckBal -->|Insufficient| RejectBal[Reject Request immediately]
        CheckBal -->|Sufficient| CreateReq[Insert leave_requests with status: pending]
        CreateReq --> NotifyMgr[Notify Direct Reporting Manager]
        NotifyMgr --> MgrReview{Manager Decision}
        MgrReview -->|Approved| DeductBal[Update request status: approved & deduct balance]
        MgrReview -->|Rejected| RejReq[Update request status: rejected with reason]
        DeductBal --> SyncCalendar[Sync to Organization Monthly Calendar]
    end

    CloseSession --> Reconcile[Monthly Attendance Summary]
    SyncCalendar --> Reconcile
    Reconcile --> PayrollInput[Feeds into Monthly Payroll Engine]
```

### Key Validations
- **Single Active Session:** Employees cannot clock in while an active work session exists without clocking out.
- **Leave Balance Isolation:** Annual leave, sick leave, and casual leave balances are strictly tracked per employee per calendar year.
