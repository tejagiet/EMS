"use client";

import React, { useState } from "react";

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

  if (data.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <div>
            <h4 className="card-title">{title}</h4>
            {description && <p className="card-description">{description}</p>}
          </div>
        </div>
        <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)" }}>
          {emptyMessage}
        </div>
      </div>
    );
  }

  const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);

  const defaultColors = [
    "#1e3a8a",
    "#0284c7",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ef4444",
    "#64748b",
  ];

  const radius = size / 2;
  const strokeWidth = 26;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  let cumulativePercent = 0;

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <div>
          <h4 className="card-title">{title}</h4>
          {description && <p className="card-description">{description}</p>}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          flexWrap: "wrap",
          gap: 20,
          padding: "12px 0",
        }}
      >
        {/* SVG Donut */}
        <div style={{ position: "relative", width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${String(size)} ${String(size)}`}
            role="img"
            aria-label={`Donut chart for ${title}`}
          >
            {/* Background track */}
            <circle
              cx={radius}
              cy={radius}
              r={normalizedRadius}
              stroke="var(--border)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {data.map((slice, idx) => {
              const percent = totalValue > 0 ? slice.value / totalValue : 0;
              const strokeDashoffset = circumference - percent * circumference;
              const rotation = cumulativePercent * 360 - 90;
              cumulativePercent += percent;

              const isHovered = hoveredIdx === idx;
              const color = slice.color ?? defaultColors[idx % defaultColors.length] ?? "#1e3a8a";

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
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                  }}
                  fill="transparent"
                  onMouseEnter={() => {
                    setHoveredIdx(idx);
                  }}
                  onMouseLeave={() => {
                    setHoveredIdx(null);
                  }}
                />
              );
            })}
          </svg>

          {/* Center text */}
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
            <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-main)" }}>
              {hoveredIdx !== null && data[hoveredIdx] ? data[hoveredIdx].value : totalValue}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {hoveredIdx !== null && data[hoveredIdx] ? data[hoveredIdx].label : centerLabel}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140 }}>
          {data.map((item, idx) => {
            const share = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : "0.0";
            const color = item.color ?? defaultColors[idx % defaultColors.length] ?? "#1e3a8a";
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => {
                  setHoveredIdx(idx);
                }}
                onMouseLeave={() => {
                  setHoveredIdx(null);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  padding: "2px 6px",
                  borderRadius: 4,
                  backgroundColor: isHovered ? "var(--table-hover)" : "transparent",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      color: isHovered ? "var(--text-main)" : "var(--text-muted)",
                      fontWeight: isHovered ? 600 : 400,
                    }}
                  >
                    {item.label}
                  </span>
                </div>
                <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                  {item.value} ({share}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
