import { INSTITUTIONAL_METADATA } from "@ems/ui";
import React from "react";

export function InstitutionalHeader({ className = "" }: { className?: string }) {
  return (
    <header className={`institutional-banner ${className}`}>
      <h2>{INSTITUTIONAL_METADATA.institutionName}</h2>
      <p>
        {INSTITUTIONAL_METADATA.departmentName} · {INSTITUTIONAL_METADATA.batch} ·{" "}
        {INSTITUTIONAL_METADATA.projectCategory}
      </p>
      <div className="badge">{INSTITUTIONAL_METADATA.publisherId}</div>
    </header>
  );
}

export function InstitutionalFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`institutional-footer ${className}`}>
      <div className="footer-title">
        {INSTITUTIONAL_METADATA.institutionName} · {INSTITUTIONAL_METADATA.departmentName}
      </div>
      <div>
        {INSTITUTIONAL_METADATA.projectName} · {INSTITUTIONAL_METADATA.team} · Batch{" "}
        {INSTITUTIONAL_METADATA.batch} · {INSTITUTIONAL_METADATA.projectCategory}
      </div>
      <div
        style={{
          marginTop: 6,
          display: "flex",
          justifyContent: "center",
          gap: 16,
          fontSize: "0.75rem",
          color: "var(--text-muted)",
        }}
      >
        <span>
          Publisher ID: <code>{INSTITUTIONAL_METADATA.publisherId}</code>
        </span>
        <span>•</span>
        <span>
          Version: <code>v{INSTITUTIONAL_METADATA.version}</code>
        </span>
        <span>•</span>
        <a href="/about" style={{ textDecoration: "underline", color: "inherit" }}>
          About Project
        </a>
      </div>
    </footer>
  );
}
