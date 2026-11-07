"use client";

import { BarChart3, Table, TrendingUp, Users } from "lucide-react";
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
  xAxisLabel = "Category",
  yAxisLabel = "Count",
  height = 260,
  emptyMessage = "No distribution data available for the current scope.",
  className = "",
}: BarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showTableView, setShowTableView] = useState(false);

  // Modern corporate palette with gradient definitions
  const PALETTE = [
    { from: "#3b82f6", to: "#1d4ed8", glow: "rgba(59, 130, 246, 0.35)", text: "#2563eb" },
    { from: "#10b981", to: "#047857", glow: "rgba(16, 185, 129, 0.35)", text: "#059669" },
    { from: "#8b5cf6", to: "#6d28d9", glow: "rgba(139, 92, 246, 0.35)", text: "#7c3aed" },
    { from: "#f59e0b", to: "#d97706", glow: "rgba(245, 158, 11, 0.35)", text: "#d97706" },
    { from: "#ec4899", to: "#be185d", glow: "rgba(236, 72, 153, 0.35)", text: "#db2777" },
    { from: "#06b6d4", to: "#0e7490", glow: "rgba(6, 182, 212, 0.35)", text: "#0891b2" },
    { from: "#f97316", to: "#c2410c", glow: "rgba(249, 115, 22, 0.35)", text: "#ea580c" },
    { from: "#64748b", to: "#334155", glow: "rgba(100, 116, 139, 0.35)", text: "#475569" },
  ];

  if (data.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <div>
            <h4 className="card-title">{title}</h4>
            {description && <p className="card-description">{description}</p>}
          </div>
        </div>
        <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--text-muted)" }}>
          <BarChart3 size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <p style={{ margin: 0, fontWeight: 500 }}>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);
  const topCategory = [...data].sort((a, b) => b.value - a.value)[0];

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
      {/* Header with Title and Mode Switcher */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>
              {title}
            </h4>
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
              {data.length} {data.length === 1 ? "unit" : "units"}
            </span>
          </div>
          {description && (
            <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
              {description}
            </p>
          )}
        </div>

        {/* View Switcher Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              display: "inline-flex",
              backgroundColor: "var(--background)",
              padding: 3,
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          >
            <button
              type="button"
              onClick={() => setShowTableView(false)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                fontSize: "0.75rem",
                fontWeight: 600,
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                backgroundColor: !showTableView ? "var(--surface)" : "transparent",
                color: !showTableView ? "var(--primary)" : "var(--text-muted)",
                boxShadow: !showTableView ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <BarChart3 size={13} />
              <span>Chart</span>
            </button>
            <button
              type="button"
              onClick={() => setShowTableView(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                fontSize: "0.75rem",
                fontWeight: 600,
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                backgroundColor: showTableView ? "var(--surface)" : "transparent",
                color: showTableView ? "var(--primary)" : "var(--text-muted)",
                boxShadow: showTableView ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Table size={13} />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick KPI Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 12,
        }}
      >
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            backgroundColor: "var(--background)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: "rgba(59, 130, 246, 0.12)",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users size={16} />
          </div>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Volume
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)" }}>
              {totalValue}
            </div>
          </div>
        </div>

        {topCategory && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              backgroundColor: "var(--background)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp size={16} />
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Lead Segment
              </div>
              <div
                style={{
                  fontSize: "0.92rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={topCategory.label}
              >
                {topCategory.label} ({topCategory.value})
              </div>
            </div>
          </div>
        )}
      </div>

      {showTableView ? (
        /* Accessible Data Table View */
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              fontSize: "0.85rem",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left" }}>
                <th style={{ padding: "10px 8px", color: "var(--text-muted)", fontWeight: 600 }}>
                  {xAxisLabel}
                </th>
                <th style={{ padding: "10px 8px", color: "var(--text-muted)", fontWeight: 600, textAlign: "right" }}>
                  {yAxisLabel}
                </th>
                <th style={{ padding: "10px 8px", color: "var(--text-muted)", fontWeight: 600, width: "35%" }}>
                  Distribution Share
                </th>
                <th style={{ padding: "10px 8px", color: "var(--text-muted)", fontWeight: 600, textAlign: "right" }}>
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => {
                const paletteItem = PALETTE[idx % PALETTE.length]!;
                const pct = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
                return (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <td style={{ padding: "10px 8px", fontWeight: 600, color: "var(--text)" }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: 10,
                          height: 10,
                          borderRadius: 3,
                          background: `linear-gradient(135deg, ${paletteItem.from}, ${paletteItem.to})`,
                          marginRight: 8,
                          verticalAlign: "middle",
                        }}
                      />
                      {item.label}
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 700, color: "var(--text)" }}>
                      {item.value}
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <div
                        style={{
                          height: 8,
                          width: "100%",
                          backgroundColor: "var(--background)",
                          borderRadius: 4,
                          overflow: "hidden",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${paletteItem.from}, ${paletteItem.to})`,
                            borderRadius: 4,
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right", color: "var(--text-muted)", fontWeight: 600 }}>
                      {pct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Modern Responsive Visual Column Chart */
        <div>
          <div
            style={{
              position: "relative",
              height,
              width: "100%",
              display: "flex",
              alignItems: "flex-end",
              paddingTop: 36,
              paddingBottom: 28,
              borderBottom: "2px solid var(--border)",
              boxSizing: "border-box",
            }}
          >
            {/* Horizontal Grid lines */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                bottom: 28,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                pointerEvents: "none",
              }}
            >
              {[1, 0.75, 0.5, 0.25, 0].map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-muted)",
                      width: 24,
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                      fontWeight: 500,
                    }}
                  >
                    {Math.round(step * maxValue)}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      backgroundColor: "var(--border)",
                      opacity: i === 4 ? 0.8 : 0.4,
                      borderTop: i !== 4 ? "1px dashed var(--border)" : "none",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Bars Column Container */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-around",
                width: "100%",
                height: "100%",
                paddingLeft: 36,
                zIndex: 1,
                boxSizing: "border-box",
              }}
            >
              {data.map((item, idx) => {
                const paletteItem = PALETTE[idx % PALETTE.length]!;
                const heightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                const sharePercent = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
                const isHovered = hoveredIdx === idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    style={{
                      flex: 1,
                      maxWidth: Math.max(48, Math.min(84, 600 / data.length)),
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      cursor: "pointer",
                      position: "relative",
                      transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      transform: isHovered ? "translateY(-4px)" : "none",
                    }}
                  >
                    {/* Value Badge on top of Bar */}
                    <div
                      style={{
                        marginBottom: 6,
                        padding: "2px 7px",
                        borderRadius: 12,
                        backgroundColor: isHovered ? paletteItem.to : "var(--background)",
                        border: `1px solid ${isHovered ? paletteItem.to : "var(--border)"}`,
                        color: isHovered ? "#ffffff" : "var(--text)",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        boxShadow: isHovered ? `0 4px 10px ${paletteItem.glow}` : "0 1px 2px rgba(0,0,0,0.05)",
                        transition: "all 0.15s ease",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {item.value}
                    </div>

                    {/* Gradient Bar */}
                    <div
                      style={{
                        width: "80%",
                        height: `${Math.max(6, heightPercent)}%`,
                        background: `linear-gradient(180deg, ${paletteItem.from} 0%, ${paletteItem.to} 100%)`,
                        borderRadius: "6px 6px 0 0",
                        boxShadow: isHovered
                          ? `0 8px 16px ${paletteItem.glow}`
                          : `0 2px 6px rgba(0,0,0,0.06)`,
                        transition: "height 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {/* Top shine accent highlight */}
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 3,
                          backgroundColor: "rgba(255, 255, 255, 0.45)",
                        }}
                      />
                    </div>

                    {/* Label underneath */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: -24,
                        textAlign: "center",
                        width: "120%",
                        fontSize: "0.74rem",
                        fontWeight: isHovered ? 700 : 500,
                        color: isHovered ? "var(--text)" : "var(--text-muted)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        transition: "color 0.15s ease",
                      }}
                      title={`${item.label} (${item.value})`}
                    >
                      {item.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Floating Detail Strip */}
          <div
            style={{
              marginTop: 34,
              padding: "10px 16px",
              borderRadius: 8,
              backgroundColor: "var(--background)",
              border: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.82rem",
            }}
          >
            {hoveredIdx !== null && data[hoveredIdx] ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: PALETTE[hoveredIdx % PALETTE.length]!.to,
                      boxShadow: `0 0 6px ${PALETTE[hoveredIdx % PALETTE.length]!.glow}`,
                    }}
                  />
                  <span style={{ fontWeight: 700, color: "var(--text)" }}>
                    {data[hoveredIdx]!.label}
                  </span>
                </div>
                <div>
                  <strong style={{ color: "var(--primary)", fontSize: "0.95rem" }}>
                    {data[hoveredIdx]!.value}
                  </strong>{" "}
                  <span style={{ color: "var(--text-muted)" }}>
                    ({totalValue > 0 ? ((data[hoveredIdx]!.value / totalValue) * 100).toFixed(1) : "0"}% of workforce)
                  </span>
                </div>
              </>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", width: "100%", textAlign: "center" }}>
                Hover over any column to inspect unit proportion and exact workforce quota
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
