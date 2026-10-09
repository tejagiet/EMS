import { BarChart3, Database } from "lucide-react";
import React from "react";

export interface UnavailableChartCardProps {
  title: string;
  description?: string;
  requiredPhase: number;
  domainModule: string;
  targetTables: string[];
  className?: string;
}

export function UnavailableChartCard({
  title,
  description,
  requiredPhase,
  domainModule,
  targetTables,
  className = "",
}: UnavailableChartCardProps) {
  return (
    <div
      className={`card ${className}`}
      style={{
        borderStyle: "dashed",
        backgroundColor: "var(--background)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div className="card-header">
        <div>
          <h4 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart3 size={18} style={{ color: "var(--text-muted)" }} />
            {title}
          </h4>
          {description && <p className="card-description">{description}</p>}
        </div>
        <span
          className="badge badge-warning"
          style={{ fontSize: "0.7rem", textTransform: "uppercase" }}
        >
          Phase {requiredPhase.toString()} Dependency
        </span>
      </div>

      <div
        style={{
          padding: "24px 16px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: "rgba(245, 158, 11, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent)",
          }}
        >
          <Database size={20} />
        </div>

        <div style={{ maxWidth: 360 }}>
          <h5 style={{ fontSize: "0.9rem", fontWeight: 600, margin: "0 0 4px" }}>
            Awaiting {domainModule} Migration
          </h5>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
            This analytics visualization requires database schema tables scheduled for Phase{" "}
            {requiredPhase.toString()}.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 6,
            marginTop: 4,
          }}
        >
          {targetTables.map((tbl) => (
            <code
              key={tbl}
              style={{
                fontSize: "0.72rem",
                padding: "2px 6px",
                borderRadius: 4,
                backgroundColor: "var(--card-bg)",
                border: "1px solid var(--border)",
              }}
            >
              {tbl}
            </code>
          ))}
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid var(--border)",
          paddingTop: 10,
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Integrity Rule: Zero fabricated data</span>
        <span>Status: Pending Phase {requiredPhase.toString()}</span>
      </div>
    </div>
  );
}
