"use client";

import React, { useState, useTransition, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { submitLeaveRequestAction } from "@/lib/data/leave-actions";
import type { LeaveBalanceSummary } from "@ems/types";

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  balances: LeaveBalanceSummary[];
}

export function ApplyLeaveModal({
  isOpen,
  onClose,
  balances,
}: ApplyLeaveModalProps) {
  const [leaveTypeId, setLeaveTypeId] = useState(balances[0]?.leaveTypeId ?? "");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]!);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]!);
  const [totalDays, setTotalDays] = useState(1);
  const [reason, setReason] = useState("");
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

    startTransition(async () => {
      const formData = new FormData();
      formData.set("leaveTypeId", leaveTypeId || selectedBalance?.leaveTypeId || "");
      formData.set("startDate", startDate);
      formData.set("endDate", endDate);
      formData.set("totalDays", String(totalDays));
      formData.set("reason", reason.trim());

      const res = await submitLeaveRequestAction(null, formData);
      if (res.success) {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply for Leave"
      description="Submit an official leave request for supervisory authorization."
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {error && (
          <div style={{ color: "var(--danger)", fontSize: "0.85rem", padding: "8px 12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: 6 }}>
            {error}
          </div>
        )}

        <Select
          label="Leave Category"
          options={leaveOptions}
          value={leaveTypeId}
          onChange={(e) => setLeaveTypeId(e.target.value)}
          required
        />

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
            rows={3}
            placeholder="State the purpose of your leave (e.g. Family vacation, medical appointment, personal emergency)..."
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
            Submit Leave Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}
