# 11 — Deployment Architecture

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## Production Deployment Topology

```mermaid
graph TD
    subgraph UsersInternet ["End Users & Clients"]
        WebUsers["Web Browsers (Edge / Chrome / Safari / Firefox)"]
        MobileUsers["Android Devices (in.gietpoly.ems APK) [Planned]"]
        DesktopUsers["Windows Workstations (Tauri .msi / .exe) [Planned]"]
    end

    subgraph EdgeNetwork ["Edge Delivery Network (Vercel / Cloudflare)"]
        EdgeDNS["DNS & SSL Termination (HTTPS / TLS 1.3)"]
        EdgeMiddleware["Next.js Edge Middleware (Session Validation & Portal Routing)"]
        StaticAssets["Static Asset CDN (JS Chunks, CSS, Fonts, Icons)"]
    end

    subgraph ApplicationCluster ["Next.js Server Runtime (Node.js 20+)"]
        AppServer["Next.js 15 Server (SSR / Server Actions / API Routes)"]
    end

    subgraph SupabaseInfrastructure ["Supabase Managed Cloud / Self-Hosted Infrastructure"]
        KongGateway["API Gateway (Kong Reverse Proxy)"]
        GoTrueAuth["Supabase Auth Service (GoTrue)"]
        PostgresPrimary["PostgreSQL 15 Database (Primary Node)"]
        StorageEngine["Supabase Storage Engine (S3-compatible Object Store)"]
        RealtimeEngine["Supabase Realtime (WebSockets Engine)"]
    end

    WebUsers --> EdgeDNS
    MobileUsers -.-> EdgeDNS
    DesktopUsers -.-> EdgeDNS

    EdgeDNS --> StaticAssets
    EdgeDNS --> EdgeMiddleware
    EdgeMiddleware --> AppServer

    AppServer --> KongGateway
    KongGateway --> GoTrueAuth
    KongGateway --> PostgresPrimary
    KongGateway --> StorageEngine
    KongGateway --> RealtimeEngine
```

### Infrastructure Components
- **Hosting Tier:** Vercel / Node.js 20+ runtime for Next.js App Router.
- **Database & Storage Tier:** Supabase Cloud / Self-hosted PostgreSQL 15 with connection pooling (PgBouncer/Supavisor).
- **Security Protocols:** Strict HTTPS, HttpOnly Secure Cookies, Row Level Security (RLS).
