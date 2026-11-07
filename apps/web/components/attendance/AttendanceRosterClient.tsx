"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { exportAttendanceCsvAction } from "@/lib/data/attendance-actions";
import type { AttendanceRecord } from "@ems/types";
import { Download, AlertTriangle, RefreshCw } from "lucide-react";
import { useRealtime } from "@/src/context/RealtimeContext";

interface AttendanceRosterClientProps {
  initialRoster: AttendanceRecord[];
  currentDate: string;
}

export function AttendanceRosterClient({
  initialRoster,
  currentDate,
}: AttendanceRosterClientProps) {
  const router = useRouter();
  const [date, setDate] = useState(currentDate);
  const [onlyExceptions, setOnlyExceptions] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [roster, setRoster] = useState<AttendanceRecord[]>(initialRoster);
  const [lastLiveUpdate, setLastLiveUpdate] = useState<string | null>(null);

  useEffect(() => {
    setRoster(initialRoster);
  }, [initialRoster]);

  const { isConnected } = useRealtime({
    table: "attendance_records",
    onUpdate: () => {
      setLastLiveUpdate(new Date().toLocaleTimeString());
      router.refresh();
    },
  });

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    router.push(`?date=${newDate}`);
  };

  const handleExportCsv = async () => {
    setExportLoading(true);
    try {
      const res = await exportAttendanceCsvAction(date);
      if (res.success && res.csvContent) {
        const blob = new Blob([res.csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `attendance_roster_${date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } finally {
      setExportLoading(false);
    }
  };

  const filteredRoster = roster.filter((r) => {
    if (onlyExceptions) {
      return r.isLate || r.isEarlyDeparture || r.status === "absent" || (r.clockIn && !r.clockOut);
    }
    return true;
  });

  const getStatusBadge = (row: AttendanceRecord) => {
    if (row.isLate) return <Badge label="LATE" variant="warning" size="sm" />;
    if (row.status === "on_leave") return <Badge label="ON LEAVE" variant="neutral" size="sm" />;
    if (row.status === "absent") return <Badge label="ABSENT" variant="danger" size="sm" />;
    if (row.clockIn && !row.clockOut) return <Badge label="IN PROGRESS" variant="warning" size="sm" />;
    return <Badge label="PRESENT" variant="success" size="sm" />;
  };

  const columns: DataTableColumn<AttendanceRecord>[] = [
    {
      key: "employeeCode",
      header: "Employee",
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.employeeName ?? "Staff Member"}</div>
          <code style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{row.employeeCode}</code>
        </div>
      ),
    },
    {
      key: "shiftName",
      header: "Shift Schedule",
      render: (row) => (
        <span>{row.shiftName ?? "Standard Shift"}</span>
      ),
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
      header: "Duration",
      render: (row) => {
        if (!row.durationMinutes) return <span>—</span>;
        const h = Math.floor(row.durationMinutes / 60);
        const m = row.durationMinutes % 60;
        return <span>{h}h {m}m</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => getStatusBadge(row),
    },
    {
      key: "notes",
      header: "Notes",
      render: (row) => (
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {row.isCorrected ? "Adjusted" : row.notes || "—"}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Controls Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            style={{ width: "auto", margin: 0 }}
          />

          <Button
            size="sm"
            variant={onlyExceptions ? "primary" : "secondary"}
            onClick={() => setOnlyExceptions(!onlyExceptions)}
          >
            <AlertTriangle size={14} style={{ marginRight: 6 }} />
            {onlyExceptions ? "Showing Exceptions Only" : "Show Exceptions Only"}
          </Button>

          {isConnected && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "#059669",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(16, 185, 129, 0.08)",
                padding: "3px 8px",
                borderRadius: 6,
                border: "1px solid rgba(16, 185, 129, 0.2)",
              }}
            >
              <span className="realtime-pulse-dot" />
              Live Sync {lastLiveUpdate ? `(Updated ${lastLiveUpdate})` : "Active"}
            </span>
          )}
        </div>

        <Button size="sm" variant="secondary" onClick={handleExportCsv} isLoading={exportLoading}>
          <Download size={14} style={{ marginRight: 6 }} /> Export Roster CSV
        </Button>
      </div>

      <DataTable
        data={filteredRoster}
        columns={columns}
        keyExtractor={(row) => row.id}
        emptyTitle="No attendance logs found"
        emptyDescription={`No records found for ${date}.`}
        pageSize={12}
      />
    </div>
  );
}
