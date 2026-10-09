import { AlertTriangle, FolderSearch, RefreshCw } from "lucide-react";
import React from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "No records found",
  description = "No matching items were found for the current query or active filters.",
  actionText,
  onAction,
  icon,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`empty-state ${className}`}
      style={{
        padding: "48px 24px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: "1px dashed var(--border)",
        borderRadius: 10,
        backgroundColor: "var(--background)",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          backgroundColor: "rgba(148, 163, 184, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          marginBottom: 16,
        }}
      >
        {icon ?? <FolderSearch size={24} />}
      </div>
      <h4
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          color: "var(--text-main)",
          marginBottom: 6,
        }}
      >
        {title}
      </h4>
      <p
        style={{
          fontSize: "0.85rem",
          color: "var(--text-muted)",
          maxWidth: 420,
          margin: "0 auto 16px",
        }}
      >
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Failed to load data",
  message = "An error occurred while communicating with the database. Please try again.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`alert alert-error ${className}`}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "20px",
        borderRadius: 10,
      }}
    >
      <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 4 }}>{title}</h4>
        <p style={{ fontSize: "0.85rem", marginBottom: 12, opacity: 0.9 }}>{message}</p>
        {onRetry && (
          <Button
            variant="danger"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw size={14} />}
            style={{ width: "auto" }}
          >
            Retry Query
          </Button>
        )}
      </div>
    </div>
  );
}
