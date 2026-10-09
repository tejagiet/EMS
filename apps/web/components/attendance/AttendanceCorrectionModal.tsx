"use client";

import React, { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { submitAttendanceCorrectionAction } from "@/lib/data/attendance-actions";

interface AttendanceCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordId?: string | null;
  defaultDate?: string;
}

export function AttendanceCorrectionModal({
  isOpen,
  onClose,
  recordId,
  defaultDate,
}: AttendanceCorrectionModalProps) {
  const targetDate = defaultDate ?? new Date().toISOString().split("T")[0]!;
  const [date, setDate] = useState(targetDate);
  const [inTime, setInTime] = useState("09:00");
  const [outTime, setOutTime] = useState("18:00");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (reason.trim().length < 5) {
      setError("Please provide a detailed reason (at least 5 characters).");
      return;
    }

    startTransition(async () => {
      const requestedIn = new Date(`${date}T${inTime}:00Z`).toISOString();
      const requestedOut = new Date(`${date}T${outTime}:00Z`).toISOString();

      const formData = new FormData();
      if (recordId) formData.set("attendanceRecordId", recordId);
      formData.set("requestedClockIn", requestedIn);
      formData.set("requestedClockOut", requestedOut);
      formData.set("reason", reason.trim());

      const res = await submitAttendanceCorrectionAction(null, formData);
      if (res.success) {
        onClose();
      } else {
        setError(res.error ?? "Failed to submit correction request.");
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Attendance Correction"
      description="Submit a verified adjustment for a missed clock-in or inaccurate shift timestamp."
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {error && (
          <div style={{ color: "var(--danger)", fontSize: "0.85rem", padding: "8px 12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: 6 }}>
            {error}
          </div>
        )}

        <Input
          label="Work Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input
            label="Corrected Clock In (UTC)"
            type="time"
            value={inTime}
            onChange={(e) => setInTime(e.target.value)}
            required
          />
          <Input
            label="Corrected Clock Out (UTC)"
            type="time"
            value={outTime}
            onChange={(e) => setOutTime(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
            Reason for Correction
          </label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Explain why the punch was missed or needs adjustment (e.g., biometric network error, on-site client duty)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
          <Button variant="secondary" onClick={onClose} type="button" disabled={isPending}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isPending}>
            Submit Correction Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}
