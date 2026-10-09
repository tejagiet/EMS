"use client";

import { signInAction } from "@/lib/auth/actions";
import { type SyntheticEvent, useState, useTransition } from "react";

interface LoginFormProps {
  initialMessage?: string | undefined;
  initialError?: string | undefined;
  redirectTo?: string | undefined;
}

export function LoginForm({ initialMessage, initialError, redirectTo }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(initialError);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signInAction(null, formData);
      if (result?.error) {
        setError(result.error);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {initialMessage && (
        <div className="alert alert-success" role="status">
          {initialMessage === "signed_out" && "You have been successfully signed out."}
          {initialMessage === "password_updated" &&
            "Your password has been updated. Please sign in."}
          {initialMessage !== "signed_out" &&
            initialMessage !== "password_updated" &&
            initialMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <input type="hidden" name="redirectTo" value={redirectTo ?? "/portal"} />

      <div className="form-group">
        <label className="form-label" htmlFor="email">
          Work Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="admin@giet-polytechnic.edu"
          className="form-input"
          disabled={isPending}
        />
        {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
      </div>

      <div className="form-group">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <label className="form-label" htmlFor="password" style={{ marginBottom: 0 }}>
            Password
          </label>
          <a href="/forgot-password" style={{ fontSize: "0.8rem" }}>
            Forgot password?
          </a>
        </div>
        <div className="password-input-wrapper">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••••••"
            className="form-input"
            disabled={isPending}
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => {
              setShowPassword(!showPassword);
            }}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
      </div>

      <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input id="rememberMe" name="rememberMe" type="checkbox" disabled={isPending} />
        <label
          htmlFor="rememberMe"
          style={{ fontSize: "0.875rem", color: "var(--text-muted)", cursor: "pointer" }}
        >
          Remember session on this device
        </label>
      </div>

      <button type="submit" className="btn btn-primary" disabled={isPending}>
        {isPending ? "Authenticating..." : "Sign In to EMS"}
      </button>

      {/* Development Quick Credentials */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: "1px solid var(--border)",
          fontSize: "0.8rem",
          color: "var(--text-muted)",
        }}
      >
        <strong style={{ display: "block", marginBottom: 4, color: "var(--text-main)" }}>
          Demo Test Accounts (Dev Password: DevPassword123!)
        </strong>
        <ul style={{ paddingLeft: 16, lineHeight: 1.6 }}>
          <li>
            GIET Super / Org Admin: <code>admin@giet-polytechnic.edu</code>
          </li>
          <li>
            GIET HR Manager: <code>hr@giet-polytechnic.edu</code>
          </li>
          <li>
            GIET Manager: <code>manager@giet-polytechnic.edu</code>
          </li>
          <li>
            GIET Employee: <code>emp1@giet-polytechnic.edu</code>
          </li>
          <li>
            Apex Org Admin: <code>admin@apex-solutions.dev</code>
          </li>
        </ul>
      </div>
    </form>
  );
}
