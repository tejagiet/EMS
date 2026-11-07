"use client";

import React, { useState } from "react";
import { PieChart as PieChartIcon } from "lucide-react";

export interface DonutSegment {
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartProps {
  title: string;
  description?: string;
  data: DonutSegment[];
  centerLabel?: string;
  size?: number;
  emptyMessage?: string;
  className?: string;
}

export function DonutChart({
  title,
  description,
  data,
  centerLabel = "Total",
  size = 200,
  emptyMessage = "No proportional distribution available.",
  className = "",
}: DonutChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const defaultColors = [
    "#3b82f6",
    "#10b981",
    "#8b5cf6",
    "#f59e0b",
    "#ec4899",
    "#06b6d4",
    "#f97316",
    "#64748b",
  ];

  if (data.length === 0) {
    return (
      <div
        className={`card ${className}`}
        style={{
          padding: 24,
          background: "var(--surface)",
          borderRadius: "var(--radius-lg, 12px)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="card-header">
          <div>
            <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>
              {title}
            </h4>
            {description && (
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                {description}
              </p>
            )}
          </div>
        </div>
        <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--text-muted)" }}>
          <PieChartIcon size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <p style={{ margin: 0, fontWeight: 500 }}>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);
  const radius = size / 2;
  const strokeWidth = 28;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  let cumulativePercent = 0;

  return (
    <div
      className={`card ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 24,
        background: "var(--surface)",
        borderRadius: "var(--radius-lg, 12px)",
        border: "1px solid var(--border)",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "1px solid var(--border)",
          paddingBottom: 14,
        }}
      >
        <div>
          <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>
            {title}
          </h4>
          {description && (
            <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
              {description}
            </p>
          )}
        </div>
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 12,
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            color: "var(--primary)",
          }}
        >
          {totalValue} total
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          flexWrap: "wrap",
          gap: 24,
          padding: "8px 0",
        }}
      >
        {/* SVG Donut */}
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${String(size)} ${String(size)}`}
            role="img"
            aria-label={`Donut chart for ${title}`}
            style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.06))" }}
          >
            {/* Background track */}
            <circle
              cx={radius}
              cy={radius}
              r={normalizedRadius}
              stroke="var(--border)"
              strokeWidth={strokeWidth}
              fill="transparent"
              opacity={0.5}
            />

            {data.map((slice, idx) => {
              const percent = totalValue > 0 ? slice.value / totalValue : 0;
              const strokeDashoffset = circumference - percent * circumference;
              const rotation = cumulativePercent * 360 - 90;
              cumulativePercent += percent;

              const isHovered = hoveredIdx === idx;
              const color = slice.color ?? defaultColors[idx % defaultColors.length] ?? "#3b82f6";

              return (
                <circle
                  key={idx}
                  cx={radius}
                  cy={radius}
                  r={normalizedRadius}
                  stroke={color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${String(circumference)} ${String(circumference)}`}
                  style={{
                    strokeDashoffset,
                    transform: `rotate(${String(rotation)}deg)`,
                    transformOrigin: "50% 50%",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    opacity: hoveredIdx === null || isHovered ? 1 : 0.6,
                  }}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>

          {/* Center text readout */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontSize: "1.6rem",
                fontWeight: 800,
                color: "var(--text)",
                lineHeight: 1.1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {hoveredIdx !== null && data[hoveredIdx] ? data[hoveredIdx].value : totalValue}
            </span>
            <span
              style={{
                fontSize: "0.74rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                maxWidth: 100,
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {hoveredIdx !== null && data[hoveredIdx] ? data[hoveredIdx].label : centerLabel}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 160 }}>
          {data.map((item, idx) => {
            const share = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : "0.0";
            const color = item.color ?? defaultColors[idx % defaultColors.length] ?? "#3b82f6";
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  padding: "6px 10px",
                  borderRadius: 6,
                  backgroundColor: isHovered ? "var(--background)" : "transparent",
                  border: isHovered ? "1px solid var(--border)" : "1px solid transparent",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      backgroundColor: color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      color: isHovered ? "var(--text)" : "var(--text-muted)",
                      fontWeight: isHovered ? 700 : 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span style={{ fontWeight: 700, color: "var(--text)" }}>{item.value}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", minWidth: 42, textAlign: "right" }}>
                    {share}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
