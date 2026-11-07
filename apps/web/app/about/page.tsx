import { InstitutionalFooter } from "@/components/ui/InstitutionalHeader";
import { INSTITUTIONAL_METADATA } from "@ems/ui";
import { ArrowLeft, Database, Layers, Shield } from "lucide-react";
import Link from "next/link";
import React from "react";

export const metadata = {
  title: "About EMS | Project Information",
};

export default function AboutPage(): React.JSX.Element {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <main
        style={{ flex: 1, maxWidth: 900, margin: "0 auto", padding: "40px 20px", width: "100%" }}
      >
        <div style={{ marginBottom: 24 }}>
          <Link
            href="/portal"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.85rem",
              color: "var(--primary)",
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            <ArrowLeft size={16} /> Back to Portal
          </Link>

          <h1
            style={{
              fontSize: "2.2rem",
              fontWeight: 800,
              color: "var(--primary)",
              margin: "0 0 8px",
            }}
          >
            {INSTITUTIONAL_METADATA.projectName}
          </h1>
          <p style={{ fontSize: "1.1rem", color: "var(--text-muted)", margin: 0 }}>
            {INSTITUTIONAL_METADATA.institutionName} · {INSTITUTIONAL_METADATA.departmentName}
          </p>
        </div>

        {/* Project Metadata Card */}
        <div
          className="card"
          style={{
            borderLeft: "5px solid var(--accent)",
            marginBottom: 32,
            padding: 24,
          }}
        >
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 16 }}>
            Institutional Identification
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
              fontSize: "0.9rem",
            }}
          >
            <div>
              <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.78rem" }}>
                Institution
              </span>
              <strong>{INSTITUTIONAL_METADATA.institutionName}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.78rem" }}>
                Department
              </span>
              <strong>{INSTITUTIONAL_METADATA.departmentName}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.78rem" }}>
                Academic Batch
              </span>
              <strong>{INSTITUTIONAL_METADATA.batch}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.78rem" }}>
                Project Category
              </span>
              <strong>{INSTITUTIONAL_METADATA.projectCategory}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.78rem" }}>
                Engineering Team
              </span>
              <strong>{INSTITUTIONAL_METADATA.team}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.78rem" }}>
                Publisher Identification
              </span>
              <code>{INSTITUTIONAL_METADATA.publisherId}</code>
            </div>
          </div>
        </div>

        {/* System Architecture Highlights */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>Architectural Pillars</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            <div className="card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                  color: "var(--primary)",
                }}
              >
                <Shield size={20} />
                <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>RBAC & Tenancy</h3>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                Ten specialized institutional portal shells, 22 granular dot-notation permissions,
                and strict Row-Level Security isolation.
              </p>
            </div>

            <div className="card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                  color: "var(--secondary)",
                }}
              >
                <Database size={20} />
                <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
                  Supabase PostgreSQL
                </h3>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                Version-controlled schema migrations, SECURITY DEFINER functions, and deterministic
                test seed data.
              </p>
            </div>

            <div className="card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                  color: "var(--accent)",
                }}
              >
                <Layers size={20} />
                <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>Design System</h3>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                Comprehensive light/dark enterprise design system, responsive SVG charting,
                accessible data tables, and modal workflows.
              </p>
            </div>
          </div>
        </div>
      </main>

      <InstitutionalFooter />
    </div>
  );
}
