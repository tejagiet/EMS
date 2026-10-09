"use client";

import React, { useState } from "react";
import { ClockInOutWidget } from "./ClockInOutWidget";
import { AttendanceCorrectionModal } from "./AttendanceCorrectionModal";
import { ApplyLeaveModal } from "../leave/ApplyLeaveModal";
import { LeaveBalancesGrid } from "../leave/LeaveBalancesGrid";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { ClockStatusResult } from "@/lib/data/attendance";
import type { AttendanceRecord, LeaveBalanceSummary, LeaveRequest } from "@ems/types";
import { Calendar, Plus } from "lucide-react";

interface EmployeeSelfClientProps {
  initialClockStatus: ClockStatusResult;
  employeeName: string;
  balances: LeaveBalanceSummary[];
  attendanceHistory: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
}

export function EmployeeSelfClient({
  initialClockStatus,
  employeeName,
  balances,
  attendanceHistory,
  leaveRequests,
}: EmployeeSelfClientProps) {
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);

  const historyColumns: DataTableColumn<AttendanceRecord>[] = [
    {
      key: "workDate",
      header: "Date",
      render: (row) => <strong>{new Date(row.workDate).toLocaleDateString()}</strong>,
    },
    {
      key: "clockIn",
      header: "Clock In",
      render: (row) => (
        <span>{row.clockIn ? new Date(row.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
      ),
    },
    {
      key: "clockOut",
      header: "Clock Out",
      render: (row) => (
        <span>{row.clockOut ? new Date(row.clockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
      ),
    },
    {
      key: "durationMinutes",
      header: "Worked",
      render: (row) => {
        const h = Math.floor(row.durationMinutes / 60);
        const m = row.durationMinutes % 60;
        return <span>{h}h {m}m</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge
          label={row.isLate ? "LATE" : row.status.toUpperCase()}
          variant={row.status === "present" ? "success" : row.isLate ? "warning" : "neutral"}
          size="sm"
        />
      ),
    },
    {
      key: "notes",
      header: "Audit / Notes",
      render: (row) => (
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {row.isCorrected ? "Adjusted by Manager" : row.notes || "—"}
        </span>
      ),
    },
  ];

  const leaveColumns: DataTableColumn<LeaveRequest>[] = [
    {
      key: "leaveTypeName",
      header: "Type",
      render: (row) => <strong>{row.leaveTypeName}</strong>,
    },
    {
      key: "startDate",
      header: "Dates",
      render: (row) => (
        <span>{new Date(row.startDate).toLocaleDateString()} – {new Date(row.endDate).toLocaleDateString()}</span>
      ),
    },
    {
      key: "totalDays",
      header: "Days",
      render: (row) => <span>{row.totalDays}d</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge
          label={row.status.toUpperCase()}
          variant={row.status === "approved" ? "success" : row.status === "rejected" ? "danger" : "warning"}
          size="sm"
        />
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (row) => (
        <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{row.reason}</span>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* 1. Interactive Clock Widget */}
      <ClockInOutWidget
        initialStatus={initialClockStatus}
        employeeName={employeeName}
        onOpenCorrectionModal={() => setIsCorrectionOpen(true)}
      />

      {/* 2. Leave Balances Section */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--foreground)" }}>
              My Leave Quota & Balances
            </h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Real-time authoritative ledger balances computed from approved credits and deductions.
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsApplyLeaveOpen(true)}>
            <Plus size={15} style={{ marginRight: 6 }} /> Apply for Leave
          </Button>
        </div>

        <LeaveBalancesGrid balances={balances} />
      </div>

      {/* 3. Recent Attendance History & Leave Applications */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }}>
        <Card>
          <CardHeader>
            <CardTitle>Attendance History (Recent Days)</CardTitle>
            <CardDescription>Verified daily clocking punches and durations</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={attendanceHistory}
              columns={historyColumns}
              keyExtractor={(row) => row.id}
              emptyTitle="No attendance records"
              emptyDescription="You haven't clocked in yet."
              pageSize={5}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <div>
                <CardTitle>My Leave Applications</CardTitle>
                <CardDescription>Track status of submitted leave requests</CardDescription>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setIsApplyLeaveOpen(true)}>
                <Calendar size={14} style={{ marginRight: 4 }} /> New Request
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={leaveRequests}
              columns={leaveColumns}
              keyExtractor={(row) => row.id}
              emptyTitle="No leave applications"
              emptyDescription="You have not submitted any leave requests."
              pageSize={5}
            />
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {isApplyLeaveOpen && (
        <ApplyLeaveModal
          isOpen={isApplyLeaveOpen}
          onClose={() => setIsApplyLeaveOpen(false)}
          balances={balances}
        />
      )}

      {isCorrectionOpen && (
        <AttendanceCorrectionModal
          isOpen={isCorrectionOpen}
          onClose={() => setIsCorrectionOpen(false)}
        />
      )}
    </div>
  );
}
