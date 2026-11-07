import { ArrowDownRight, ArrowUpRight, ChevronRight, Clock, Minus } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Skeleton } from "./Skeleton";

export interface MetricCardProps {
  label: string;
  value?: string | number | null;
  subtitle?: string;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string;
    isPositive?: boolean;
  };
  comparisonPeriod?: string;
  isLoading?: boolean;
  isUnavailable?: boolean;
  unavailableReason?: string;
  requiredPhase?: number;
  drillDownHref?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  value,
  subtitle,
  trend,
  comparisonPeriod,
  isLoading = false,
  isUnavailable = false,
  unavailableReason,
  requiredPhase,
  drillDownHref,
  icon,
  className = "",
}: MetricCardProps) {
  if (isLoading) {
    return (
      <div className={`metric-card ${className}`}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <Skeleton width="45%" height="16px" />
          <Skeleton width="24px" height="24px" style={{ borderRadius: "50%" }} />
        </div>
        <Skeleton width="60%" height="36px" style={{ marginBottom: 12 }} />
        <Skeleton width="75%" height="14px" />
      </div>
    );
  }

  if (isUnavailable) {
    return (
      <div
        className={`metric-card ${className}`}
        style={{ borderStyle: "dashed", opacity: 0.9, backgroundColor: "var(--background)" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 8,
          }}
        >
          <span className="metric-label">{label}</span>
          {requiredPhase && (
            <span
              className="badge badge-warning"
              style={{ fontSize: "0.68rem", textTransform: "uppercase" }}
            >
              Phase {requiredPhase.toString()}
            </span>
          )}
        </div>

        <div style={{ margin: "12px 0" }}>
          <span
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Clock size={16} />
            Schema Pending
          </span>
        </div>

        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
          {unavailableReason ?? "Awaiting future database module schema implementation."}
        </p>
      </div>
    );
  }

  const formattedValue = value !== undefined && value !== null ? value.toString() : "0";

  return (
    <div className={`metric-card ${className}`}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 6,
        }}
      >
        <span className="metric-label">{label}</span>
        {icon && (
          <div
            style={{
              padding: 6,
              borderRadius: 8,
              backgroundColor: "rgba(30, 58, 138, 0.08)",
              color: "var(--primary)",
              display: "flex",
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="metric-value">{formattedValue}</div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          marginTop: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {trend && (
            <span
              className={`badge ${
                trend.direction === "neutral"
                  ? "badge-neutral"
                  : trend.isPositive
                    ? "badge-success"
                    : "badge-danger"
              }`}
              style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: "0.72rem" }}
            >
              {trend.direction === "up" && <ArrowUpRight size={12} />}
              {trend.direction === "down" && <ArrowDownRight size={12} />}
              {trend.direction === "neutral" && <Minus size={12} />}
              {trend.value}
            </span>
          )}

          {comparisonPeriod && (
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              vs {comparisonPeriod}
            </span>
          )}

          {drillDownHref && (
            <Link
              href={drillDownHref}
              style={{
                fontSize: "0.78rem",
                color: "var(--primary)",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
                marginLeft: "auto",
              }}
            >
              Details <ChevronRight size={14} />
            </Link>
          )}
        </div>

        {subtitle && <span className="metric-subtext" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{subtitle}</span>}
      </div>
    </div>
  );
}
