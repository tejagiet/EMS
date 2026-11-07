"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock, Key, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { setupMyPasswordAction } from "@/lib/data/credentials";

interface EmployeeSecurityCardProps {
  workEmail?: string | null;
}

export function EmployeeSecurityCard({ workEmail }: EmployeeSecurityCardProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword.length < 6) {
      setFeedback({ type: "error", message: "Password must be at least 6 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", message: "Passwords do not match." });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await setupMyPasswordAction(newPassword);
      if (res.success) {
        setFeedback({
          type: "success",
          message: "Password updated successfully! Your new password is now active and registered with institutional administration.",
        });
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to update password." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Lock size={18} style={{ color: "var(--primary)" }} /> Portal Account Security & Password
            </CardTitle>
            <CardDescription>
              Set up or update your personal portal login password.
            </CardDescription>
          </div>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "3px 8px",
              borderRadius: 6,
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              color: "#059669",
              border: "1px solid rgba(16, 185, 129, 0.25)",
            }}
          >
            Admin Synchronized
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSavePassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {feedback && (
            <div
              className={`alert alert-${feedback.type === "success" ? "success" : "error"}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: 12,
                borderRadius: 6,
              }}
            >
              {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.message}</span>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--foreground)", display: "block", marginBottom: 6 }}>
                Your Login Email
              </label>
              <input
                type="text"
                disabled
                value={workEmail || "your.email@giet-polytechnic.edu"}
                className="form-input"
                style={{ backgroundColor: "var(--table-stripe, #f8fafc)", cursor: "not-allowed" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--foreground)", display: "block", marginBottom: 6 }}>
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="form-input"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    padding: 4,
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--foreground)", display: "block", marginBottom: 6 }}>
                Confirm New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                required
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, paddingTop: 8, borderTop: "1px dashed var(--border)" }}>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Changes take effect immediately for portal sign-in and are logged with institutional administration.
            </p>
            <Button type="submit" variant="primary" disabled={isSubmitting || !newPassword}>
              <Key size={14} style={{ marginRight: 6 }} />
              {isSubmitting ? "Updating..." : "Save New Password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
