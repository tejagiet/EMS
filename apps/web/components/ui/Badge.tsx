import React from "react";

export interface BadgeProps {
  label: string;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "neutral";
  size?: "sm" | "md";
  className?: string;
  icon?: React.ReactNode;
}

export function Badge({
  label,
  variant = "primary",
  size = "md",
  className = "",
  icon,
}: BadgeProps) {
  const sizeStyle =
    size === "sm"
      ? { fontSize: "0.68rem", padding: "1px 6px" }
      : { fontSize: "0.75rem", padding: "3px 8px" };

  return (
    <span className={`badge badge-${variant} ${className}`} style={sizeStyle}>
      {icon && <span style={{ marginRight: 4, display: "inline-flex" }}>{icon}</span>}
      {label}
    </span>
  );
}
