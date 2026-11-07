"use client";

import React from "react";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";

export function SignupForm() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        className="alert alert-warning"
        role="alert"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: 16,
          borderRadius: 8,
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          color: "#b45309",
        }}
      >
        <ShieldAlert size={22} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong style={{ display: "block", fontSize: "0.95rem", marginBottom: 4 }}>
            Public Self-Registration Disabled
          </strong>
          <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.5, color: "var(--foreground)" }}>
            In compliance with institutional governance and strict security policy (GIET Polytechnic
            College), open self-registration is closed.
          </p>
        </div>
      </div>

      <div
        style={{
          padding: 16,
          borderRadius: 8,
          backgroundColor: "var(--table-stripe, #f8fafc)",
          border: "1px solid var(--border)",
          fontSize: "0.85rem",
          lineHeight: 1.6,
          color: "var(--text-muted)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: "var(--primary)", fontWeight: 600 }}>
          <Lock size={15} />
          <span>How to obtain portal access:</span>
        </div>
        <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
          <li>
            <strong>New Faculty & Staff</strong>: Your account and initial password are provisioned directly by the Institutional HR or Organization Administrator upon onboarding.
          </li>
          <li>
            <strong>Job Candidates</strong>: Selected candidates are automatically issued employee credentials when your job offer is finalized.
          </li>
          <li>
            <strong>Existing Personnel</strong>: If you forgot your password or need credential assistance, use the Password Recovery option or contact IT Support.
          </li>
        </ul>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
        <a href="/login" className="btn btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <ArrowLeft size={16} /> Return to Sign In
        </a>
        <a href="/forgot-password" className="btn btn-secondary" style={{ textAlign: "center" }}>
          Forgot Password?
        </a>
      </div>
    </div>
  );
}
