import { AlertCircle, Calendar, Layers } from "lucide-react";
import React from "react";

export interface SchemaDependencyNoticeProps {
  moduleName: string;
  requiredPhase: number;
  description: string;
  plannedSchema?: string[];
  compact?: boolean;
}

export function SchemaDependencyNotice({
  moduleName,
  requiredPhase,
  description,
  plannedSchema,
  compact = false,
}: SchemaDependencyNoticeProps) {
  if (compact) {
    return (
      <div
        className="alert alert-warning"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          margin: 0,
          padding: "8px 12px",
          fontSize: "0.8rem",
        }}
      >
        <Calendar size={14} style={{ flexShrink: 0 }} />
        <span>
          <strong>{moduleName}:</strong> Scheduled for Phase {requiredPhase.toString()}.
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px dashed var(--border)",
        borderRadius: 8,
        padding: "16px 20px",
        backgroundColor: "var(--background)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Layers size={18} style={{ color: "var(--accent)" }} />
          <h4 style={{ fontSize: "0.95rem", fontWeight: 600, margin: 0 }}>
            {moduleName} — Awaiting Phase {requiredPhase.toString()} Schema
          </h4>
        </div>
        <span
          className="badge badge-warning"
          style={{ fontSize: "0.7rem", textTransform: "uppercase" }}
        >
          Phase {requiredPhase.toString()} Dependency
        </span>
      </div>

      <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>{description}</p>

      {plannedSchema && plannedSchema.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--text-muted)",
              display: "block",
              marginBottom: 4,
            }}
          >
            Target Database Tables:
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {plannedSchema.map((table) => (
              <code
                key={table}
                style={{
                  fontSize: "0.72rem",
                  padding: "2px 6px",
                  borderRadius: 4,
                  backgroundColor: "var(--card-bg)",
                  border: "1px solid var(--border)",
                }}
              >
                {table}
              </code>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          marginTop: 4,
        }}
      >
        <AlertCircle size={12} />
        <span>
          Metrics for this domain will populate automatically once the Phase{" "}
          {requiredPhase.toString()} migrations are applied.
        </span>
      </div>
    </div>
  );
}
