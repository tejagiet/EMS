import React from "react";

export function Card({
  children,
  className = "",
  style,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}) {
  return (
    <div id={id} className={`card ${className}`} style={style}>
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`card-header ${className}`} style={style}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <h3 className={`card-title ${className}`} style={style}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <p className={`card-description ${className}`} style={style}>
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`card-content ${className}`} style={style}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`card-footer ${className}`}
      style={{
        marginTop: 16,
        paddingTop: 12,
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
