import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary caught error]:", error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--background, #f8fafc)",
            padding: 24,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: 520,
              width: "100%",
              backgroundColor: "#ffffff",
              border: "1px solid var(--border, #e2e8f0)",
              borderRadius: 12,
              padding: 32,
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontSize: "1.25rem", color: "var(--primary, #1e3a8a)", margin: "0 0 8px 0" }}>
              Something went wrong
            </h2>
            <p style={{ color: "var(--text-muted, #64748b)", fontSize: "0.9rem", margin: "0 0 20px 0" }}>
              {this.state.error?.message || "An unexpected error occurred while rendering the page."}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="btn btn-primary"
                style={{
                  padding: "8px 20px",
                  backgroundColor: "#1e3a8a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Reload Application
              </button>
              <a
                href="/"
                style={{
                  padding: "8px 20px",
                  backgroundColor: "#f1f5f9",
                  color: "#0f172a",
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Go to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
