# 03 — Authentication and Authorization Flow

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## Authentication and RBAC Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Authenticated User
    participant Browser as Browser Client
    participant Middleware as Next.js Middleware
    participant Auth as Supabase Auth (GoTrue)
    participant Session as Session Service (lib/auth)
    participant DB as PostgreSQL (RLS & Triggers)

    User->>Browser: Enters email and password at /login
    Browser->>Auth: signInWithPassword(credentials)
    Auth-->>Browser: Returns JWT Access & Refresh Tokens
    Browser->>Browser: Stores tokens in HttpOnly Secure Cookies

    User->>Browser: Navigates to /portal/:role
    Browser->>Middleware: HTTP Request with Session Cookies
    Middleware->>Auth: Validates JWT token
    alt Invalid or Expired Token
        Middleware-->>Browser: Redirect to /login?redirect=/portal/:role
    else Valid Token
        Middleware->>Session: loadAuthenticatedUserContext()
        Session->>DB: Query profiles, user_roles, organizations
        DB-->>Session: Returns active organization, roles & permission codes
        Session->>Session: verifyPortalAccess(userContext, requestedPortal)
        alt Unauthorized for Requested Role
            Session-->>Browser: Redirect to /unauthorized
        else Authorized
            Session-->>Middleware: Access Approved
            Middleware-->>Browser: Render Server Component with scoped data
        end
    end
```

### Key Security Gates
1. **HttpOnly Cookies:** Prevents XSS token exfiltration.
2. **`verifyPortalAccess()`:** Restricts portal access strictly to mapped roles.
3. **Database RLS:** Even if UI routing was bypassed, Postgres blocks data retrieval outside `is_org_member(organization_id)`.
