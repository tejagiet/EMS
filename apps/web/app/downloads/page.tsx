import { InstitutionalFooter } from "@/components/ui/InstitutionalHeader";
import { Download, Monitor, CheckCircle, Shield, Laptop, Cpu, HardDrive } from "lucide-react";
import Link from "next/link";

export default function DownloadsPage() {
  return (
    <div className="landing-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="landing-nav">
        <div className="landing-container landing-nav-inner">
          <Link className="landing-brand" href="/" aria-label="EMS home">
            <span className="landing-brand-mark" aria-hidden="true" style={{ padding: 0, overflow: "hidden" }}>
              <img
                src="/logo.jpg"
                alt="EMS Logo"
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }}
              />
            </span>
            <span className="landing-brand-copy">
              <strong>EMS</strong>
              <span>Employee Management System</span>
            </span>
          </Link>

          <nav className="landing-nav-links" aria-label="Primary navigation">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/downloads" style={{ color: "#2563eb", fontWeight: 600 }}>Windows App</Link>
          </nav>

          <Link className="btn btn-primary landing-nav-cta" href="/login">
            Sign in
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, padding: "3rem 1rem", background: "#f8fafc" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, background: "#dbeafe", color: "#1d4ed8", fontSize: "0.875rem", fontWeight: 600, marginBottom: "1rem" }}>
              <Monitor size={16} /> Official Desktop Release v1.0.0
            </div>
            <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.75rem", letterSpacing: "-0.025em" }}>
              Download EMS for Windows
            </h1>
            <p style={{ fontSize: "1.125rem", color: "#64748b", maxWidth: 600, margin: "0 auto" }}>
              Experience lightning-fast performance, native desktop shortcuts, secure local storage, and uninterrupted real-time workspace access.
            </p>
          </div>

          {/* Primary Download Card */}
          <div style={{ background: "#ffffff", borderRadius: 20, padding: "2.5rem", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)", border: "1px solid #e2e8f0", marginBottom: "3rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1rem" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                    <Laptop size={28} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>EMS Desktop for Windows</h2>
                    <span style={{ fontSize: "0.875rem", color: "#64748b" }}>Version 1.0.0 (x64) · 92.7 MB</span>
                  </div>
                </div>

                <p style={{ color: "#475569", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                  Standalone Windows installer packaged with all dependencies, automatic secure database connectivity, desktop notifications, and zero browser tab clutter.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#334155", fontSize: "0.875rem" }}>
                    <CheckCircle size={16} color="#16a34a" /> Self-contained desktop application with desktop & start menu shortcuts
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#334155", fontSize: "0.875rem" }}>
                    <CheckCircle size={16} color="#16a34a" /> Live sync with Supabase PostgreSQL cloud backend
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#334155", fontSize: "0.875rem" }}>
                    <CheckCircle size={16} color="#16a34a" /> Role-based access control across all 10 enterprise portals
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#334155", fontSize: "0.875rem" }}>
                    <Shield size={16} color="#2563eb" /> Clean, optimized package under 100 MB for instant installation
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  <a
                    href="/downloads/EMS-Desktop-Setup.exe"
                    download="EMS-Desktop-Setup.exe"
                    className="btn btn-primary btn-lg"
                    style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 28px", fontSize: "1rem", borderRadius: 12, textDecoration: "none", background: "#2563eb", color: "#ffffff", fontWeight: 600 }}
                  >
                    <Download size={20} /> Download Windows (.exe)
                  </a>
                  <a
                    href="/downloads/EMS-Desktop-Setup-1.0.0.exe"
                    download="EMS-Desktop-Setup-1.0.0.exe"
                    className="btn btn-secondary"
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 20px", fontSize: "0.875rem", borderRadius: 12, textDecoration: "none", background: "#f1f5f9", color: "#334155", fontWeight: 500, border: "1px solid #cbd5e1" }}
                  >
                    Mirror v1.0.0 (92.7 MB)
                  </a>
                </div>
              </div>

              {/* System Requirements Sidebox */}
              <div style={{ background: "#f8fafc", borderRadius: 16, padding: "1.75rem", border: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", marginBottom: "1rem" }}>System Requirements</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Monitor size={18} color="#64748b" />
                    <div>
                      <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>Operating System</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Windows 10 / Windows 11 (64-bit)</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Cpu size={18} color="#64748b" />
                    <div>
                      <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>Processor</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Intel Core / AMD Ryzen (x64)</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <HardDrive size={18} color="#64748b" />
                    <div>
                      <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>Storage & Memory</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>350 MB disk space · 4 GB RAM</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0", fontSize: "0.75rem", color: "#64748b" }}>
                  <strong>Installation Instructions:</strong>
                  <ol style={{ paddingLeft: "1.25rem", margin: "0.5rem 0 0 0", lineHeight: 1.5 }}>
                    <li>Click <em>Download Windows (.exe)</em> above.</li>
                    <li>Open <code>EMS-Desktop-Setup.exe</code> once finished.</li>
                    <li>Follow the setup wizard to create shortcuts and launch EMS!</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <InstitutionalFooter />
    </div>
  );
}
