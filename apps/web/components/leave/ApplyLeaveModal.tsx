"use client";

import React, { useState, useTransition, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { submitLeaveRequestAction } from "@/lib/data/leave-actions";
import {
  encodeHandoverInReason,
  type AssignableColleague,
  type WorkHandover,
} from "@/lib/data/work-handover";
import type { LeaveBalanceSummary } from "@ems/types";
import { useRealtime } from "@/src/context/RealtimeContext";
import { Users, AlertTriangle } from "lucide-react";

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  balances: LeaveBalanceSummary[];
  colleagues?: AssignableColleague[];
}

export function ApplyLeaveModal({
  isOpen,
  onClose,
  balances,
  colleagues = [],
}: ApplyLeaveModalProps) {
  const { broadcastChange } = useRealtime();
  const [leaveTypeId, setLeaveTypeId] = useState(balances[0]?.leaveTypeId ?? "");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]!);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]!);
  const [totalDays, setTotalDays] = useState(1);
  const [reason, setReason] = useState("");

  // Work Delegation / Substitute Assignment State
  const [assignWork, setAssignWork] = useState(false);
  const [substituteId, setSubstituteId] = useState(colleagues[0]?.id ?? "");
  const [handoverTasks, setHandoverTasks] = useState("");
  const [handoverNotes, setHandoverNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedBalance = useMemo(
    () => balances.find((b) => b.leaveTypeId === leaveTypeId) ?? balances[0],
    [balances, leaveTypeId]
  );

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (val > endDate) {
      setEndDate(val);
      setTotalDays(1);
    } else {
      const diff = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(val).getTime()) / (1000 * 3600 * 24)) + 1);
      setTotalDays(diff);
    }
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    const diff = Math.max(1, Math.round((new Date(val).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24)) + 1);
    setTotalDays(diff);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedBalance && selectedBalance.isPaid && totalDays > selectedBalance.availableDays) {
      setError(`Requested days (${totalDays}) exceed your available balance (${selectedBalance.availableDays} days).`);
      return;
    }

    if (reason.trim().length < 5) {
      setError("Please provide a reason with at least 5 characters.");
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
      formData.set("leaveTypeId", leaveTypeId || selectedBalance?.leaveTypeId || "");
      formData.set("startDate", startDate);
      formData.set("endDate", endDate);
      formData.set("totalDays", String(totalDays));
      formData.set("reason", finalReason);

      const res = await submitLeaveRequestAction(null, formData);
      if (res.success) {
        await broadcastChange({
          table: "leave_requests",
          eventType: "INSERT",
          message: "New leave request submitted for authorization.",
        });
        onClose();
      } else {
        setError(res.error ?? "Failed to apply for leave.");
      }
    });
  };

  const leaveOptions = balances.map((b) => ({
    label: `${b.leaveTypeName} (${b.availableDays} days left)`,
    value: b.leaveTypeId,
  }));

  const colleagueOptions = colleagues.map((c) => ({
    label: `${c.name} (${c.employeeCode})${c.departmentName ? ` — ${c.departmentName}` : ""}`,
    value: c.id,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply for Leave"
      description="Submit an official leave request for supervisory authorization."
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

        {leaveOptions.length > 0 ? (
          <Select
            label="Leave Category"
            options={leaveOptions}
            value={leaveTypeId || leaveOptions[0]?.value || ""}
            onChange={(e) => setLeaveTypeId(e.target.value)}
            required
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 6,
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              color: "#b45309",
              fontSize: "0.85rem",
            }}
          >
            <AlertTriangle size={18} />
            <span>
              No leave policies configured yet for your department or organization. Please contact your HR administrator.
            </span>
          </div>
        )}

        {selectedBalance && (
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: -8, marginBottom: 6 }}>
            Available balance: <strong>{selectedBalance.availableDays} days</strong> (Accrued: {selectedBalance.accruedDays}, Used: {selectedBalance.usedDays}, Pending: {selectedBalance.pendingDays})
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            required
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            required
          />
        </div>

        <Input
          label="Total Requested Days"
          type="number"
          step="0.5"
          min="0.5"
          max="365"
          value={totalDays}
          onChange={(e) => setTotalDays(Number(e.target.value))}
          required
        />

        <div>
          <label className="form-label" style={{ display: "block", marginBottom: 6 }}>
            Reason for Leave
          </label>
          <textarea
            className="form-input"
            rows={2}
            placeholder="State the purpose of your leave (e.g. Family vacation, medical appointment, personal emergency)..."
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
            Assign your scheduled classes, lab sessions, or departmental duties to a substitute colleague while you are on leave.
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
                  placeholder="e.g. Conduct CS-301 Operating Systems lab, cover morning AI tutorial session..."
                  value={handoverTasks}
                  onChange={(e) => setHandoverTasks(e.target.value)}
                  required={assignWork}
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "0.85rem" }}
                />
              </div>

              <Input
                label="Instructions & Reference Notes (Optional)"
                placeholder="e.g. Student attendance register is on desk. Assignment solutions are uploaded in Google Classroom."
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
          <Button variant="primary" type="submit" isLoading={isPending} disabled={leaveOptions.length === 0}>
            Submit Leave Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}
