# 02 — Multi-Platform Application Architecture

**Project:** Employee Management System (EMS)  
**Institution:** GIET Polytechnic College | Artificial Intelligence (AI) Department | Batch 2024–2027  
**Team:** T-1 | **Publisher ID:** GIETP-AI-IT-EMS-T1-2026 | **Version:** 1.0.0

---

## Diagram: Web, Android, and Windows Architecture

```mermaid
graph TD
    subgraph MonorepoRoot ["Monorepo Workspace Root (pnpm)"]
        SharedP["packages/ (types, validation, config, ui, shared, feature-registry)"]
    end

    subgraph PlatformWeb ["Web Application (apps/web) [Implemented & Verified]"]
        NextRouter["Next.js 15 App Router\n(/login, /portal/*)"]
        ReactUI["React 19 Server & Client Components\n(Tailwind CSS, Lucide Icons)"]
        NextActions["Next.js Server Actions\n(Database Operations & Business Logic)"]
        SsrAuth["@supabase/ssr Client\n(Cookie Session Management)"]
        NextRouter --> ReactUI
        ReactUI --> NextActions
        NextActions --> SsrAuth
    end

    subgraph PlatformMobile ["Mobile Application (apps/mobile) [Foundation Stub]"]
        ExpoRouter["Expo Router (SDK 52)\n(/app/index.tsx)"]
        ReactNativeUI["React Native Mobile UI\n(Native Primitives)"]
        MobileAuth["Mobile Supabase Client\n(SecureStore Token Storage)"]
        ExpoRouter --> ReactNativeUI
        ReactNativeUI -.-> MobileAuth
    end

    subgraph PlatformDesktop ["Desktop Application (apps/desktop) [Foundation Stub]"]
        TauriCore["Tauri v2 Core\n(Rust Bridge / WebView2)"]
        DesktopReact["React / Vite UI\n(src/App.tsx)"]
        DesktopAuth["Desktop Supabase Client\n(Local Encrypted Store)"]
        TauriCore --> DesktopReact
        DesktopReact -.-> DesktopAuth
    end

    SharedP --> PlatformWeb
    SharedP -.-> PlatformMobile
    SharedP -.-> PlatformDesktop

    SsrAuth --> SupabaseApi["Supabase Cloud / Local PostgreSQL API"]
    MobileAuth -.-> SupabaseApi
    DesktopAuth -.-> SupabaseApi
```

### Platform Maturity Matrix
- **Web (`apps/web`):** Complete, fully integrated with all 10 role portals, SSR session guards, 34 compiled production routes.
- **Mobile (`apps/mobile`):** Architectural foundation stub with Expo SDK 52 and React Native project references to shared packages.
- **Desktop (`apps/desktop`):** Architectural foundation stub with Tauri v2 configuration and React / Vite project references to shared packages.
