# Algorithms and Workflows Specification — EMS

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## 1. Authentication and Portal Access Verification

### Algorithm: Portal Route Authorization (`verifyPortalAccess`)
```
ALGORITHM VerifyPortalAccess(UserContext, RequestedPortal)
  INPUT:
    UserContext: { userId, roles, activeOrganization, profile }
    RequestedPortal: string (e.g., "hr", "finance-payroll", "auditor")
  OUTPUT:
    boolean: true if allowed, false if rejected

  IF UserContext IS NULL OR UserContext.userId IS NULL THEN
    RETURN FALSE
  END IF

  IF UserContext.profile.isActive == FALSE THEN
    RETURN FALSE
  END IF

  // Super Admin can access all portals except employee-only private spaces
  IF "super_admin" IN UserContext.roles THEN
    RETURN TRUE
  END IF

  // Map portal route to required role
  RequiredRole = GetRequiredRoleForPortal(RequestedPortal)

  IF RequiredRole IN UserContext.roles THEN
    RETURN TRUE
  END IF

  RETURN FALSE
END ALGORITHM
```

---

## 2. Attendance Worked Duration and Break Calculation

### Algorithm: Work Session Duration Computation
```
ALGORITHM CalculateAttendanceHours(CheckInTime, CheckOutTime, BreakMinutes)
  INPUT:
    CheckInTime: Timestamp (UTC)
    CheckOutTime: Timestamp (UTC)
    BreakMinutes: Integer
  OUTPUT:
    TotalHours: Float
    RegularHours: Float
    OvertimeHours: Float

  TotalElapsedMinutes = (CheckOutTime - CheckInTime) in minutes
  NetWorkedMinutes = Max(0, TotalElapsedMinutes - BreakMinutes)
  TotalHours = NetWorkedMinutes / 60.0

  STANDARD_SHIFT_HOURS = 8.0

  IF TotalHours > STANDARD_SHIFT_HOURS THEN
    RegularHours = STANDARD_SHIFT_HOURS
    OvertimeHours = TotalHours - STANDARD_SHIFT_HOURS
  ELSE
    RegularHours = TotalHours
    OvertimeHours = 0.0
  END IF

  RETURN { TotalHours, RegularHours, OvertimeHours }
END ALGORITHM
```

---

## 3. Payroll Calculation Algorithm

### Algorithm: Monthly Net Pay Calculation
```
ALGORITHM ComputeMonthlyPayroll(Employee, SalaryStructure, PeriodDays, UnpaidAbsenceDays)
  INPUT:
    Employee: { id, departmentId, designationId }
    SalaryStructure: { basicPay, hra, da, specialAllowance, pfPercentage, taxRate }
    PeriodDays: Integer (e.g. 30)
    UnpaidAbsenceDays: Integer
  OUTPUT:
    PayrollRecord: { grossPay, totalDeductions, netPay }

  // 1. Loss of Pay Calculation
  PerDayRate = SalaryStructure.basicPay / PeriodDays
  LossOfPay = PerDayRate * UnpaidAbsenceDays
  EffectiveBasic = Max(0, SalaryStructure.basicPay - LossOfPay)

  // 2. Gross Earnings Calculation
  GrossPay = EffectiveBasic + SalaryStructure.hra + SalaryStructure.da + SalaryStructure.specialAllowance

  // 3. Deductions Calculation
  PF_Deduction = EffectiveBasic * (SalaryStructure.pfPercentage / 100.0)
  Tax_Deduction = GrossPay * (SalaryStructure.taxRate / 100.0)
  TotalDeductions = PF_Deduction + Tax_Deduction

  // 4. Net Salary Calculation
  NetPay = Max(0, GrossPay - TotalDeductions)

  RETURN { GrossPay, TotalDeductions, NetPay }
END ALGORITHM
```

---

## 4. Onboarding Completion Guard Algorithm

### Algorithm: `canCompleteOnboarding`
```
ALGORITHM CanCompleteOnboarding(Tasks)
  INPUT:
    Tasks: List of { id, isRequired, status }
  OUTPUT:
    CanComplete: Boolean
    IncompleteCount: Integer

  IncompleteRequired = Filter(Tasks, task => task.isRequired == TRUE AND task.status != "completed")
  IncompleteCount = Length(IncompleteRequired)

  IF IncompleteCount == 0 THEN
    RETURN { CanComplete: TRUE, IncompleteCount: 0 }
  ELSE
    RETURN { CanComplete: FALSE, IncompleteCount: IncompleteCount }
  END IF
END ALGORITHM
```

---

## 5. Offboarding Deactivation Guard Algorithm

### Algorithm: `canCompleteOffboarding`
```
ALGORITHM CanCompleteOffboarding(ClearanceCheckpoints)
  INPUT:
    ClearanceCheckpoints: List of { department, status }
  OUTPUT:
    CanDeactivate: Boolean
    PendingCount: Integer

  PendingItems = Filter(ClearanceCheckpoints, item => item.status != "cleared")
  PendingCount = Length(PendingItems)

  IF PendingCount == 0 THEN
    RETURN { CanDeactivate: TRUE, PendingCount: 0 }
  ELSE
    RETURN { CanDeactivate: FALSE, PendingCount: PendingCount }
  END IF
END ALGORITHM
```

---

## 6. Formula Injection Neutralization Algorithm

### Algorithm: `sanitizeCsv` (Excel & Sheets Remote Injection Defense)
```
ALGORITHM SanitizeCsv(CellValue)
  INPUT:
    CellValue: Any
  OUTPUT:
    SanitizedString: String

  IF CellValue IS NULL OR CellValue IS UNDEFINED THEN
    RETURN ""
  END IF

  Str = String(CellValue).Replace('"', '""')

  // Check if starts with spreadsheet formula trigger characters: = + - @ \t \r
  IF Str StartsWith AnyOf('=', '+', '-', '@', '\t', '\r') THEN
    Str = "'" + Str  // Prefix with single quote to force plain text treatment
  END IF

  RETURN '"' + Str + '"'
END ALGORITHM
```
