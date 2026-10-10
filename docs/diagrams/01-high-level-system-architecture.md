# 01 — High-Level System Architecture

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## Architecture Diagram

```mermaid
graph TD
    subgraph ClientLayer ["Client Applications Layer"]
        WebApp["Web App (Next.js 15 / React 19)\n[Implemented]"]
        MobileApp["Mobile App (Expo SDK 52 / React Native)\n[Foundation Stub]"]
        DesktopApp["Desktop App (Tauri v2 / React)\n[Foundation Stub]"]
    end

    subgraph MonorepoPackages ["Shared Workspace Packages Layer (@ems/*)"]
        PkgTypes["@ems/types\nTypes, Enums, Roles"]
        PkgVal["@ems/validation\nZod Schemas"]
        PkgConfig["@ems/config\nPortal Routes, Navigation"]
        PkgUI["@ems/ui\nDesign System Primitives"]
        PkgShared["@ems/shared\nSecurity, Helpers, Sanitizers"]
        PkgFeat["@ems/feature-registry\nFeature Flags"]
    end

    subgraph ServerLayer ["Server & Application Logic Layer (Next.js 15)"]
        ServerActions["Server Actions / Mutations\n(Authenticated Context)"]
        DataLayer["Data Access Layer\n(apps/web/lib/data/*)"]
        AuthMiddleware["Next.js Edge Middleware\n(Session Refresh & Route Guards)"]
    end

    subgraph SupabaseLayer ["Backend Infrastructure Layer (Supabase / PostgreSQL)"]
        SupaAuth["Supabase Auth\n(GoTrue Engine / JWT Cookies)"]
        SupaDb["PostgreSQL 15 Database\n(35+ Tables / Migrations 1-8)"]
        SupaRLS["Row Level Security (RLS)\n(is_org_member Scoping)"]
        SupaTriggers["PostgreSQL Triggers & RPCs\n(Org Boundary & Auto-Sync)"]
        SupaStorage["Supabase Storage\n(Documents, Avatars Bucket)"]
    end

    WebApp --> MonorepoPackages
    MobileApp -.-> MonorepoPackages
    DesktopApp -.-> MonorepoPackages

    WebApp --> AuthMiddleware
    AuthMiddleware --> SupaAuth
    WebApp --> ServerActions
    ServerActions --> DataLayer
    DataLayer --> SupaDb
    SupaDb --- SupaRLS
    SupaDb --- SupaTriggers
    DataLayer --> SupaStorage
```

### Legend & Notes
- **Solid lines:** Fully implemented and verified in v1.0.0.
- **Dashed lines:** Multi-platform foundation code referencing shared workspace libraries.
