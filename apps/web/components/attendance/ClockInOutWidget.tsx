"use client";

import React, { useState, useTransition, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { clockInAction, clockOutAction } from "@/lib/data/attendance-actions";
import type { ClockStatusResult } from "@/lib/data/attendance";
import { Clock, LogIn, LogOut, CheckCircle2, AlertCircle } from "lucide-react";

interface ClockInOutWidgetProps {
  initialStatus: ClockStatusResult;
  employeeName: string;
  onOpenCorrectionModal: () => void;
}

export function ClockInOutWidget({
  initialStatus,
  employeeName,
  onOpenCorrectionModal,
}: ClockInOutWidgetProps) {
  const [status, setStatus] = useState<ClockStatusResult>(initialStatus);
  const [notes, setNotes] = useState("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Live digital clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" }));

      if (status.activeRecord?.clockIn && !status.activeRecord.clockOut) {
        const inTime = new Date(status.activeRecord.clockIn).getTime();
        const diffMins = Math.max(0, Math.floor((now.getTime() - inTime) / 60000));
        setElapsedMinutes(diffMins);
      } else {
        setElapsedMinutes(status.activeRecord?.durationMinutes ?? 0);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [status.activeRecord]);

  const handleClockIn = () => {
    setFeedback(null);
    startTransition(async () => {
      const formData = new FormData();
      if (notes.trim()) formData.set("notes", notes.trim());

      const res = await clockInAction(null, formData);
      if (res.success) {
        setFeedback({
          type: "success",
          message: res.data?.isLate
            ? "Clocked in successfully (marked late based on assigned shift)."
            : "Clocked in successfully. Work session is now active.",
        });
        setStatus((prev) => ({
          ...prev,
          hasOpenSession: true,
          activeRecord: {
            id: "temp",
            organizationId: "",
            employeeId: "",
            shiftId: prev.assignedShift?.id ?? null,
            workDate: new Date().toISOString().split("T")[0]!,
            clockIn: new Date().toISOString(),
            clockOut: null,
            breakMinutes: 0,
            durationMinutes: 0,
            status: res.data?.isLate ? "late" : "present",
            isLate: Boolean(res.data?.isLate),
            isEarlyDeparture: false,
            isCorrected: false,
            correctionNotes: null,
            notes: notes.trim() || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }));
        setNotes("");
      } else {
        setFeedback({ type: "error", message: res.error ?? "Failed to clock in." });
      }
    });
  };

  const handleClockOut = () => {
    setFeedback(null);
    startTransition(async () => {
      const formData = new FormData();
      if (notes.trim()) formData.set("notes", notes.trim());

      const res = await clockOutAction(null, formData);
      if (res.success) {
        setFeedback({
          type: "success",
          message: `Clocked out successfully. Total recorded duration: ${res.data?.durationMinutes ?? 0} mins.`,
        });
        setStatus((prev) => ({
          ...prev,
          hasOpenSession: false,
          activeRecord: prev.activeRecord
            ? {
                ...prev.activeRecord,
                clockOut: new Date().toISOString(),
                durationMinutes: res.data?.durationMinutes ?? 0,
                isEarlyDeparture: Boolean(res.data?.isEarlyDeparture),
              }
            : null,
        }));
        setNotes("");
      } else {
        setFeedback({ type: "error", message: res.error ?? "Failed to clock out." });
      }
    });
  };

  const formatElapsed = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    return `${hours}h ${m}m`;
  };

  const isClockedIn = status.hasOpenSession;
  const shift = status.assignedShift;

  return (
    <Card>
      <CardHeader>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <CardTitle>Attendance Punch & Live Work Session</CardTitle>
            <CardDescription>
              Authenticated server-verified clocking for {employeeName}
            </CardDescription>
          </div>
          <Badge
            label={isClockedIn ? "SESSION ACTIVE" : status.activeRecord?.clockOut ? "SESSION COMPLETED" : "NOT CLOCKED IN"}
            variant={isClockedIn ? "success" : status.activeRecord?.clockOut ? "neutral" : "warning"}
            size="md"
          />
        </div>
      </CardHeader>
      <CardContent>
        {feedback && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: "0.88rem",
              background: feedback.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
              color: feedback.type === "success" ? "var(--success)" : "var(--danger)",
              border: `1px solid ${feedback.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            }}
          >
            {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.message}</span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {/* Live Clock Display */}
          <div
            style={{
              background: "var(--background)",
              padding: 20,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={16} /> Trusted Server Time
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 700, fontFamily: "monospace", color: "var(--primary)" }}>
              {currentTime || "--:--:--"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 6 }}>
              Active Session Duration: <strong>{formatElapsed(elapsedMinutes)}</strong>
            </div>
          </div>

          {/* Assigned Shift Context */}
          <div
            style={{
              background: "var(--background)",
              padding: 20,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              fontSize: "0.85rem",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ fontWeight: 600, color: "var(--foreground)", borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
              Assigned Shift: {shift ? shift.name : "Standard General Shift"}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Scheduled Hours:</span>
              <span>{shift ? `${shift.startTime.slice(0, 5)} – ${shift.endTime.slice(0, 5)}` : "09:00 – 18:00"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Late Grace Period:</span>
              <span>{shift ? `${shift.gracePeriodMinutes} mins` : "15 mins"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Shift Type:</span>
              <span>{shift?.isOvernight ? "Overnight (Midnight Cross)" : "Standard Day Shift"}</span>
            </div>
          </div>
        </div>

        {/* Punch Action Area */}
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="text"
            placeholder="Optional punch notes (e.g. Work location, client visit, project details)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isPending}
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              background: "var(--background)",
              color: "var(--foreground)",
              fontSize: "0.9rem",
              width: "100%",
              boxSizing: "border-box",
            }}
          />

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {!isClockedIn ? (
              <Button
                variant="primary"
                onClick={handleClockIn}
                isLoading={isPending}
                disabled={isPending || Boolean(status.activeRecord?.clockOut)}
              >
                <LogIn size={16} style={{ marginRight: 8 }} />
                Clock In Now
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={handleClockOut}
                isLoading={isPending}
                disabled={isPending}
              >
                <LogOut size={16} style={{ marginRight: 8 }} />
                Clock Out Now
              </Button>
            )}

            <Button
              variant="secondary"
              onClick={onOpenCorrectionModal}
              disabled={isPending}
            >
              Request Time Correction
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
