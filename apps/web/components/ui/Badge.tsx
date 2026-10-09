import React from "react";

export interface BadgeProps {
  label?: string;
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "neutral" | "info";
  size?: "sm" | "md";
  className?: string;
  icon?: React.ReactNode;
}

export function Badge({
  label,
  children,
  variant = "primary",
  size = "md",
  className = "",
  icon,
}: BadgeProps) {
  const sizeStyle =
    size === "sm"
      ? { fontSize: "0.68rem", padding: "1px 6px" }
      : { fontSize: "0.75rem", padding: "3px 8px" };

  const content = children ?? label ?? "";
  const variantClass = variant === "info" ? "badge-secondary" : `badge-${variant}`;

  return (
    <span className={`badge ${variantClass} ${className}`} style={sizeStyle}>
      {icon && <span style={{ marginRight: 4, display: "inline-flex" }}>{icon}</span>}
      {content}
    </span>
  );
}
