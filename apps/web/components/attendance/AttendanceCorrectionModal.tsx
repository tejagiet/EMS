"use client";

import React, { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { submitAttendanceCorrectionAction } from "@/lib/data/attendance-actions";
import {
  encodeHandoverInReason,
  type AssignableColleague,
  type WorkHandover,
} from "@/lib/data/work-handover";
import { Users, ArrowRightLeft, FileText, CheckCircle2 } from "lucide-react";

interface AttendanceCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordId?: string | null;
  defaultDate?: string;
  colleagues?: AssignableColleague[];
}

export function AttendanceCorrectionModal({
  isOpen,
  onClose,
  recordId,
  defaultDate,
  colleagues = [],
}: AttendanceCorrectionModalProps) {
  const targetDate = defaultDate ?? new Date().toISOString().split("T")[0]!;
  const [date, setDate] = useState(targetDate);
  const [inTime, setInTime] = useState("09:00");
  const [outTime, setOutTime] = useState("18:00");
  const [reason, setReason] = useState("");
  
  // Work Delegation / Substitute Assignment State
  const [assignWork, setAssignWork] = useState(false);
  const [substituteId, setSubstituteId] = useState(colleagues[0]?.id ?? "");
  const [handoverTasks, setHandoverTasks] = useState("");
  const [handoverNotes, setHandoverNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (reason.trim().length < 5) {
      setError("Please provide a detailed justification for the adjustment (at least 5 characters).");
      return;
    }

    if (assignWork) {
      if (!substituteId) {
        setError("Please choose a substitute colleague from the dropdown to assign your duties.");
        return;
      }
      if (handoverTasks.trim().length < 5) {
        setError("Please specify the duties, lectures, or tasks you are assigning (at least 5 characters).");
        return;
      }
    }

    startTransition(async () => {
      const requestedIn = new Date(`${date}T${inTime}:00Z`).toISOString();
      const requestedOut = new Date(`${date}T${outTime}:00Z`).toISOString();

      let finalReason = reason.trim();
      if (assignWork && substituteId) {
        const selectedSub = colleagues.find((c) => c.id === substituteId);
        const handover: WorkHandover = {
          substituteId,
          substituteName: selectedSub?.name ?? "Colleague",
          substituteCode: selectedSub?.employeeCode,
          tasks: handoverTasks.trim(),
          notes: handoverNotes.trim(),
          status: "assigned",
        };
        finalReason = encodeHandoverInReason(finalReason, handover);
      }

      const formData = new FormData();
      if (recordId) formData.set("attendanceRecordId", recordId);
      formData.set("requestedClockIn", requestedIn);
      formData.set("requestedClockOut", requestedOut);
      formData.set("reason", finalReason);

      const res = await submitAttendanceCorrectionAction(null, formData);
      if (res.success) {
        onClose();
      } else {
        setError(res.error ?? "Failed to submit correction request.");
      }
    });
  };

  const colleagueOptions = colleagues.map((c) => ({
    label: `${c.name} (${c.employeeCode})${c.departmentName ? ` — ${c.departmentName}` : ""}`,
    value: c.id,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Attendance Adjustment"
      description="Submit a verified attendance adjustment or absence coverage request with work handover."
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {error && (
          <div
            style={{
              color: "var(--danger)",
              fontSize: "0.85rem",
              padding: "8px 12px",
              background: "rgba(239, 68, 68, 0.1)",
              borderRadius: 6,
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}
          >
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
            label="Adjusted Clock In (UTC)"
            type="time"
            value={inTime}
            onChange={(e) => setInTime(e.target.value)}
            required
          />
          <Input
            label="Adjusted Clock Out (UTC)"
            type="time"
            value={outTime}
            onChange={(e) => setOutTime(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
            Reason for Adjustment / Absence
          </label>
          <textarea
            className="form-input"
            rows={2}
            placeholder="State the reason for this attendance adjustment (e.g. absent on college duty, biometric server error, on-field duty)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </div>

        {/* Work Handover / Duty Delegation Accordion Card */}
        <div
          style={{
            border: "1px solid var(--border-color, #e2e8f0)",
            borderRadius: 8,
            padding: 12,
            backgroundColor: assignWork ? "rgba(37, 99, 235, 0.03)" : "transparent",
            transition: "all 0.2s ease",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.88rem",
              color: "var(--text-color, #1e293b)",
            }}
          >
            <input
              type="checkbox"
              checked={assignWork}
              onChange={(e) => setAssignWork(e.target.checked)}
              style={{ width: 16, height: 16, cursor: "pointer" }}
            />
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Users size={16} color="var(--primary, #2563eb)" />
              Assign Work / Duty Delegation to Colleague while Absent
            </span>
          </label>
          <p style={{ margin: "4px 0 0 24px", fontSize: "0.75rem", color: "var(--text-muted, #64748b)" }}>
            Delegate your classes, lab sessions, or operational tasks to a substitute colleague during your absence.
          </p>

          {assignWork && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10, paddingLeft: 4 }}>
              {colleagueOptions.length > 0 ? (
                <Select
                  label="Select Substitute Colleague"
                  options={colleagueOptions}
                  value={substituteId}
                  onChange={(e) => setSubstituteId(e.target.value)}
                  required
                />
              ) : (
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  No colleagues available for delegation in your organization.
                </div>
              )}

              <div>
                <label className="form-label" style={{ display: "block", marginBottom: 4, fontSize: "0.82rem" }}>
                  Assigned Work / Classes / Lab Tasks <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="e.g. Take Lecture 3: CS-201 Data Structures (Room 302), Supervise AI Lab Section B (02:00 PM - 04:30 PM)..."
                  value={handoverTasks}
                  onChange={(e) => setHandoverTasks(e.target.value)}
                  required={assignWork}
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.85rem" }}
                />
              </div>

              <Input
                label="Instructions & Reference Notes (Optional)"
                placeholder="e.g. Attendance register is in Department Locker 4. Slide deck shared via drive."
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
              />
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
          <Button variant="secondary" onClick={onClose} type="button" disabled={isPending}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isPending}>
            Submit Adjustment Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}
