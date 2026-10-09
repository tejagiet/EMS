"use client";

import { resetPasswordAction } from "@/lib/auth/actions";
import { type SyntheticEvent, useState, useTransition } from "react";

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await resetPasswordAction(null, formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <main className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Set New Password</h1>
          <p>Choose a secure password complying with institutional policy</p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="newPassword">
              New Password
            </label>
            <div className="password-input-wrapper">
              <input
                id="newPassword"
                name="newPassword"
                type={showPassword ? "text" : "password"}
                required
                placeholder="At least 8 characters with upper, lower, and digit"
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
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Repeat your new password"
              className="form-input"
              disabled={isPending}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? "Updating password..." : "Update Password & Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
