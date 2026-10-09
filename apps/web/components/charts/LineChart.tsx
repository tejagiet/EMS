"use client";

import { LineChart as LineChartIcon, Table } from "lucide-react";
import React, { useMemo, useState } from "react";

export interface LineChartPoint {
  date: string;
  count: number;
  label?: string;
}

export interface LineChartProps {
  title: string;
  description?: string;
  data: LineChartPoint[];
  height?: number;
  emptyMessage?: string;
  className?: string;
}

export function LineChart({
  title,
  description,
  data,
  height = 240,
  emptyMessage = "No historical timeline data available for the current scope.",
  className = "",
}: LineChartProps) {
  const [filterPeriod, setFilterPeriod] = useState<"all" | "6m" | "1y">("all");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showTableView, setShowTableView] = useState(false);

  const filteredData = useMemo(() => {
    if (data.length === 0) return [];
    if (filterPeriod === "6m") return data.slice(-6);
    if (filterPeriod === "1y") return data.slice(-12);
    return data;
  }, [data, filterPeriod]);

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

  const maxValue = Math.max(...filteredData.map((d) => d.count), 1);
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;
  const chartWidth = Math.max(300, filteredData.length * 60 + paddingLeft + paddingRight);
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const points = filteredData.map((d, i) => {
    const x =
      paddingLeft +
      (filteredData.length > 1 ? (i / (filteredData.length - 1)) * plotWidth : plotWidth / 2);
    const y = paddingTop + plotHeight - (d.count / maxValue) * plotHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0
      ? `M ${String(pt.x)} ${String(pt.y)}`
      : `${acc} L ${String(pt.x)} ${String(pt.y)}`;
  }, "");

  const areaD =
    points.length > 0
      ? `${pathD} L ${String(points[points.length - 1]?.x)} ${String(paddingTop + plotHeight)} L ${String(points[0]?.x)} ${String(paddingTop + plotHeight)} Z`
      : "";

  return (
    <div className={`card ${className}`}>
      <div
        className="card-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <h4 className="card-title">{title}</h4>
          {description && <p className="card-description">{description}</p>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Date range filter buttons */}
          <div
            style={{
              display: "flex",
              borderRadius: 6,
              overflow: "hidden",
              border: "1px solid var(--border)",
            }}
          >
            {(["all", "1y", "6m"] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => {
                  setFilterPeriod(period);
                }}
                style={{
                  padding: "3px 8px",
                  fontSize: "0.72rem",
                  fontWeight: filterPeriod === period ? 700 : 500,
                  border: "none",
                  backgroundColor: filterPeriod === period ? "var(--primary)" : "var(--background)",
                  color: filterPeriod === period ? "#ffffff" : "var(--text-muted)",
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                {period}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setShowTableView(!showTableView);
            }}
            className="btn btn-secondary btn-sm"
            style={{ padding: "4px 8px", fontSize: "0.75rem", width: "auto" }}
          >
            {showTableView ? <LineChartIcon size={13} /> : <Table size={13} />}
          </button>
        </div>
      </div>

      {showTableView ? (
        <div className="table-wrapper" style={{ marginTop: 8 }}>
          <table className="ems-table">
            <thead>
              <tr>
                <th>Period / Date</th>
                <th style={{ textAlign: "right" }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.label ?? item.date}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ marginTop: 8 }}>
          <div style={{ width: "100%", height, overflowX: "auto" }}>
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${String(chartWidth)} ${String(height)}`}
              preserveAspectRatio="none"
              role="img"
              aria-label={`Line chart showing ${title}`}
            >
              <defs>
                <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Y Axis Gridlines */}
              {[0, 0.5, 1].map((pct, i) => {
                const y = paddingTop + plotHeight - pct * plotHeight;
                return (
                  <g key={i}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={chartWidth - paddingRight}
                      y2={y}
                      stroke="var(--border)"
                      strokeDasharray="3 3"
                      strokeWidth={1}
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 3}
                      fontSize={10}
                      fill="var(--text-muted)"
                      textAnchor="end"
                    >
                      {Math.round(pct * maxValue)}
                    </text>
                  </g>
                );
              })}

              {/* Area & Line */}
              {areaD && <path d={areaD} fill="url(#lineAreaGrad)" />}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#1e3a8a"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              )}

              {/* Points */}
              {points.map((pt, idx) => {
                const isHovered = hoveredIdx === idx;
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
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 4}
                      fill="#ffffff"
                      stroke="#1e3a8a"
                      strokeWidth={2}
                    />
                    <text
                      x={pt.x}
                      y={height - 10}
                      fontSize={10}
                      fill="var(--text-muted)"
                      textAnchor="middle"
                    >
                      {pt.label ?? pt.date}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {hoveredIdx !== null && filteredData[hoveredIdx] && (
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
              }}
            >
              <span>
                Period:{" "}
                <strong>{filteredData[hoveredIdx].label ?? filteredData[hoveredIdx].date}</strong>
              </span>
              <span>
                Count: <strong>{filteredData[hoveredIdx].count}</strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
