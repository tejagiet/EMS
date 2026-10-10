# 09 — Asset Assignment and Offboarding Flow

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## Hardware Asset Lifecycle & Offboarding Clearance Flow

```mermaid
flowchart TD
    subgraph AssetLife ["1. IT Asset Inventory & Assignment Lifecycle"]
        NewAsset[Asset Registered in Inventory] --> StatusAvail[Status: Available]
        StatusAvail --> ReqAssign[Assign Asset to Employee]
        ReqAssign --> GuardCheck{Guard: Single Active Assignment?}
        GuardCheck -->|Yes, Available| CreateAssign[Create asset_assignment & Set Asset: In Use]
        GuardCheck -->|No / Retired / Maintenance| BlockAssign[Error: Asset not available for assignment]
        CreateAssign --> InUse[Asset In Use by Employee]
        InUse --> RetReq[Employee Returns Asset]
        RetReq --> CondCheck[Inspect Hardware Condition: Excellent / Good / Damaged]
        CondCheck --> ReleaseAsset[Deactivate assignment & Set Asset: Available / Maintenance]
    end

    subgraph ExitClearance ["2. Offboarding Clearance & Deactivation"]
        ExitInit[HR initiates Employee Offboarding] --> GenClear[Auto-generate Clearance Checkpoints]
        GenClear --> CheckIT[IT Clearance: Hardware Asset Returns]
        GenClear --> CheckFin[Finance Clearance: Final Dues & Expenses]
        GenClear --> CheckHR[HR Clearance: Knowledge Transfer & ID Handover]
        
        ReleaseAsset -.->|Resolves| CheckIT

        CheckIT & CheckFin & CheckHR --> AllClear{All Checkpoints Cleared?}
        AllClear -->|Pending Items| BlockDeact[Deactivation Blocked: Clearances Pending]
        AllClear -->|100% Cleared| ExecuteDeact[Execute public.process_offboarding_decision]
        ExecuteDeact --> TerminateStatus[Set Employee: Terminated / Resigned]
        TerminateStatus --> RevokeAuth[Deactivate User Login & Role Grants]
    end
```

### Database Guarantees
- Single active assignment constraint enforced at database level.
- `public.process_offboarding_decision()` is atomic and prevents employee deactivation if any clearances remain pending.
