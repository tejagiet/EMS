import React from "react";

export function Skeleton({
  width = "100%",
  height = "20px",
  className = "",
  style,
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        ...style,
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="card" style={{ padding: 20 }}>
      <Skeleton width="40%" height="16px" style={{ marginBottom: 12 }} />
      <Skeleton width="80%" height="32px" style={{ marginBottom: 16 }} />
      <Skeleton width="60%" height="14px" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="table-wrapper" style={{ padding: 16 }}>
      <Skeleton width="100%" height="32px" style={{ marginBottom: 12 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} width="100%" height="24px" style={{ marginBottom: 8 }} />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="card" style={{ padding: 24 }}>
      <Skeleton width="30%" height="20px" style={{ marginBottom: 16 }} />
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 180 }}>
        <Skeleton width="15%" height="60%" />
        <Skeleton width="15%" height="80%" />
        <Skeleton width="15%" height="45%" />
        <Skeleton width="15%" height="95%" />
        <Skeleton width="15%" height="70%" />
        <Skeleton width="15%" height="30%" />
      </div>
    </div>
  );
}
