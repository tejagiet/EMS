"use client";

import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import React, { createContext, useCallback, useContext, useState } from "react";

export interface Toast {
  id: string;
  title?: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  durationMs?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `toast-${Date.now().toString()}-${Math.random().toString(36).slice(2, 6)}`;
      const newToast: Toast = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      const duration = toast.durationMs ?? 4000;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => {
          const icon =
            t.type === "success" ? (
              <CheckCircle size={18} style={{ color: "var(--success)" }} />
            ) : t.type === "warning" ? (
              <AlertTriangle size={18} style={{ color: "var(--warning)" }} />
            ) : t.type === "error" ? (
              <AlertCircle size={18} style={{ color: "var(--danger)" }} />
            ) : (
              <Info size={18} style={{ color: "var(--secondary)" }} />
            );

          return (
            <div key={t.id} className="toast-card">
              <span style={{ flexShrink: 0, marginTop: 1 }}>{icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {t.title && (
                  <h5 style={{ fontSize: "0.85rem", fontWeight: 700, margin: "0 0 2px" }}>
                    {t.title}
                  </h5>
                )}
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                  {t.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  removeToast(t.id);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: 2,
                }}
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
