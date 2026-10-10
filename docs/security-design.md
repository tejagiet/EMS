# Security Design & Audit Report — EMS

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## 1. Multi-Tenant Isolation Architecture

In EMS, multi-tenancy is enforced natively at the PostgreSQL storage engine layer rather than relying purely on application-level filtering:

### 1.1 Tenant Scoping via Row Level Security (RLS)
All database tables contain an `organization_id` foreign key referencing `organizations(id)`. Every operational table enables RLS:
```sql
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
```
Access is governed by the security definer function:
```sql
CREATE OR REPLACE FUNCTION public.is_org_member(p_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND organization_id = p_organization_id
      AND is_active = true
  );
$$;
```
Because `SET search_path = ''` is explicitly declared, attempts to inject malicious objects into the PostgreSQL search path are completely neutralized.

---

## 2. Cross-Organization Referential Integrity Defense

To prevent malicious or accidental association of employees, departments, or branches across different tenants, database trigger functions enforce organizational boundaries:

- `public.enforce_employee_org_boundary()`: Verifies that an employee's assigned `branch_id`, `department_id`, and `designation_id` share the employee's `organization_id`.
- `public.enforce_department_branch_org_boundary()`: Verifies that a department's linked `branch_id` belongs to the same organization.
- `public.enforce_user_role_org_scope()`: Verifies that assigned roles are either global system roles or belong to the identical organization.

---

## 3. Privilege Escalation Defenses

### 3.1 Self-Organization Reassignment Defense
A malicious actor could attempt to alter their profile's `organization_id` to infiltrate another tenant. The `public.prevent_self_org_reassignment()` trigger blocks this action:
```sql
IF auth.uid() = OLD.id AND NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
  RAISE EXCEPTION 'You cannot change your own organization membership.'
    USING ERRCODE = 'insufficient_privilege';
END IF;
```

### 3.2 Self-Role Assignment Defense
Users cannot grant themselves elevated permissions. The `public.prevent_self_role_assignment()` trigger blocks inserts where `auth.uid() = NEW.profile_id`.

---

## 4. Application-Layer Security Controls

### 4.1 Open Redirect Protection
User-supplied return URLs in `/login` and auth callbacks pass through [`sanitizeRedirectUrl()`](file:///c:/Users/TEJA/Documents/Employee%20Management%20System%20-%20EMS/packages/shared/src/index.ts#L43-L75):
- Absolute URLs (`https://evil.com`) are rejected and reset to `/portal`.
- Protocol-relative URLs (`//evil.com`) are rejected.
- Backslash injection paths (`/\evil.com`) are stripped.

### 4.2 CSV Formula Injection Defense
Data exported to CSV files can be exploited to execute formulas in Excel or Google Sheets. The `sanitizeCsv()` helper prefixes any cell starting with `=`, `+`, `-`, `@`, `\t`, or `\r` with a single quote (`'`), neutralizing executable expressions.

### 4.3 Cookie & Session Security
- Sessions are maintained using `@supabase/ssr` with HttpOnly, Secure, and SameSite=Lax flags.
- Client JavaScript cannot read raw auth tokens, preventing XSS-based session exfiltration.

---

## 5. Security Audit Verification Results

All security controls were tested and verified in automated Vitest suites:
- `tests/security-guards.test.ts`: 13/13 tests passed.
- `tests/multi-tenant-integration.test.ts`: 11/11 tests passed.
- `tests/rbac-matrix.test.ts`: 13/13 tests passed.

### Remaining Risks & Production Mitigations
- **Network Rate Limiting:** In production deployment, Cloudflare or Supabase API Gateway rate limiting should be enabled on `/login` and password reset routes to prevent brute-force attacks.
- **Biometric Device Handshake:** Physical biometric timeclocks should connect via an encrypted mutual-TLS (mTLS) IoT gateway when hardware attendance bridges are deployed.
