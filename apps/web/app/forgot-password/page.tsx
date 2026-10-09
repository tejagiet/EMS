"use client";

import { forgotPasswordAction } from "@/lib/auth/actions";
import { type SyntheticEvent, useState, useTransition } from "react";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await forgotPasswordAction(null, formData);
      if (result.success) {
        setSuccess(true);
      } else if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <main className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Password Recovery</h1>
          <p>Enter your verified work email address to receive recovery instructions</p>
        </div>

        {success ? (
          <div>
            <div className="alert alert-success" role="status">
              Password recovery instructions have been sent to your email. Please check your inbox
              and spam folder.
            </div>
            <a href="/login" className="btn btn-secondary" style={{ marginTop: 12 }}>
              Back to Sign In
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="alert alert-error" role="alert">
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Registered Work Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="user@giet-polytechnic.edu"
                className="form-input"
                disabled={isPending}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? "Sending instructions..." : "Send Recovery Link"}
            </button>

            <div style={{ marginTop: 16, textAlign: "center" }}>
              <a href="/login" style={{ fontSize: "0.875rem" }}>
                ← Remember your password? Return to login
              </a>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
