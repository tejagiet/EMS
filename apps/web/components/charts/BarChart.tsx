"use client";

import { BarChart3, Table } from "lucide-react";
import React, { useState } from "react";

export interface BarChartDataPoint {
  label: string;
  value: number;
  color?: string;
  secondaryValue?: number;
}

export interface BarChartProps {
  title: string;
  description?: string;
  data: BarChartDataPoint[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
  emptyMessage?: string;
  className?: string;
}

export function BarChart({
  title,
  description,
  data,
  xAxisLabel,
  yAxisLabel,
  height = 240,
  emptyMessage = "No distribution data available for the current scope.",
  className = "",
}: BarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showTableView, setShowTableView] = useState(false);

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

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);

  const defaultColors = [
    "#1e3a8a",
    "#0284c7",
    "#0d9488",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#10b981",
    "#64748b",
  ];

  return (
    <div className={`card ${className}`}>
      <div className="card-header" style={{ marginBottom: 12 }}>
        <div>
          <h4 className="card-title">{title}</h4>
          {description && <p className="card-description">{description}</p>}
        </div>

        <button
          type="button"
          onClick={() => {
            setShowTableView(!showTableView);
          }}
          className="btn btn-secondary btn-sm"
          style={{ padding: "4px 8px", fontSize: "0.75rem", width: "auto" }}
          title={showTableView ? "Switch to chart view" : "Switch to accessible table view"}
          aria-label={showTableView ? "Show chart" : "Show table"}
        >
          {showTableView ? (
            <>
              <BarChart3 size={13} />
              <span>Chart</span>
            </>
          ) : (
            <>
              <Table size={13} />
              <span>Table</span>
            </>
          )}
        </button>
      </div>

      {showTableView ? (
        <div className="table-wrapper" style={{ marginTop: 8 }}>
          <table className="ems-table">
            <thead>
              <tr>
                <th>{xAxisLabel ?? "Category"}</th>
                <th style={{ textAlign: "right" }}>{yAxisLabel ?? "Count"}</th>
                <th style={{ textAlign: "right" }}>Share (%)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => {
                const share = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : "0.0";
                return (
                  <tr key={idx}>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor:
                            item.color ?? defaultColors[idx % defaultColors.length] ?? "#1e3a8a",
                          marginRight: 8,
                        }}
                      />
                      {item.label}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{item.value}</td>
                    <td style={{ textAlign: "right", color: "var(--text-muted)" }}>{share}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ marginTop: 8 }}>
          {/* SVG Bar Chart */}
          <div style={{ width: "100%", height, position: "relative" }}>
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${String(data.length * 60 + 40)} ${String(height)}`}
              preserveAspectRatio="none"
              style={{ overflow: "visible" }}
              role="img"
              aria-label={`Bar chart showing ${title}`}
            >
              {/* Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = height - 30 - pct * (height - 50);
                return (
                  <g key={i}>
                    <line
                      x1={35}
                      y1={y}
                      x2={data.length * 60 + 35}
                      y2={y}
                      stroke="var(--border)"
                      strokeDasharray="3 3"
                      strokeWidth={1}
                    />
                    <text x={28} y={y + 3} fontSize={10} fill="var(--text-muted)" textAnchor="end">
                      {Math.round(pct * maxValue)}
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {data.map((item, idx) => {
                const barWidth = 32;
                const x = 45 + idx * 60;
                const barHeight = Math.max(4, (item.value / maxValue) * (height - 50));
                const y = height - 30 - barHeight;
                const isHovered = hoveredIdx === idx;
                const color = item.color ?? defaultColors[idx % defaultColors.length] ?? "#1e3a8a";

                return (
                  <g
                    key={idx}
                    onMouseEnter={() => {
                      setHoveredIdx(idx);
                    }}
                    onMouseLeave={() => {
                      setHoveredIdx(null);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx={4}
                      fill={color}
                      opacity={hoveredIdx === null || isHovered ? 1 : 0.6}
                      style={{ transition: "all 0.15s ease" }}
                    />
                    {/* Category Label */}
                    <text
                      x={x + barWidth / 2}
                      y={height - 12}
                      fontSize={10}
                      fill="var(--text-muted)"
                      textAnchor="middle"
                      style={{ pointerEvents: "none" }}
                    >
                      {item.label.length > 8 ? `${item.label.slice(0, 7)}…` : item.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Hover Details Banner */}
          {hoveredIdx !== null && data[hoveredIdx] && (
            <div
              style={{
                marginTop: 8,
                padding: "6px 12px",
                borderRadius: 6,
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
                fontSize: "0.8rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 600 }}>{data[hoveredIdx].label}:</span>
              <span>
                <strong>{data[hoveredIdx].value}</strong> employees (
                {totalValue > 0 ? ((data[hoveredIdx].value / totalValue) * 100).toFixed(1) : "0.0"}
                %)
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
