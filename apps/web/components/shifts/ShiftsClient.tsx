"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { upsertShiftAction, assignShiftAction } from "@/lib/data/shift-actions";
import type { Shift, ShiftAssignment } from "@ems/types";
import { Plus, Clock, Users, Calendar } from "lucide-react";

interface ShiftsClientProps {
  shifts: Shift[];
  assignments: ShiftAssignment[];
  employees: Array<{ id: string; name: string; code: string }>;
  canManage: boolean;
}

export function ShiftsClient({
  shifts,
  assignments,
  employees,
  canManage,
}: ShiftsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"shifts" | "assignments">("shifts");
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Form states
  const [shiftName, setShiftName] = useState("");
  const [shiftCode, setShiftCode] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [breakMins, setBreakMins] = useState(60);
  const [graceMins, setGraceMins] = useState(15);
  const [isOvernight, setIsOvernight] = useState(false);

  // Assignment states
  const [assignEmpId, setAssignEmpId] = useState(employees[0]?.id ?? "");
  const [assignShiftId, setAssignShiftId] = useState(shifts[0]?.id ?? "");
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split("T")[0]!);
  const [effectiveTo, setEffectiveTo] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", shiftName.trim());
      formData.set("code", shiftCode.trim().toUpperCase());
      formData.set("startTime", startTime.length === 5 ? `${startTime}:00` : startTime);
      formData.set("endTime", endTime.length === 5 ? `${endTime}:00` : endTime);
      formData.set("breakDurationMinutes", String(breakMins));
      formData.set("gracePeriodMinutes", String(graceMins));
      formData.set("isOvernight", String(isOvernight));

      const res = await upsertShiftAction(null, formData);
      if (res.success) {
        setIsShiftModalOpen(false);
        setShiftName("");
        setShiftCode("");
        router.refresh();
      } else {
        setFormError(res.error ?? "Failed to save shift.");
      }
    });
  };

  const handleAssignShift = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("employeeId", assignEmpId || (employees[0]?.id ?? ""));
      formData.set("shiftId", assignShiftId || (shifts[0]?.id ?? ""));
      formData.set("effectiveFrom", effectiveFrom);
      if (effectiveTo) formData.set("effectiveTo", effectiveTo);

      const res = await assignShiftAction(null, formData);
      if (res.success) {
        setIsAssignModalOpen(false);
        router.refresh();
      } else {
        setFormError(res.error ?? "Failed to assign shift.");
      }
    });
  };

  const shiftColumns: DataTableColumn<Shift>[] = [
    {
      key: "code",
      header: "Shift Code",
      render: (row) => <code>{row.code}</code>,
    },
    {
      key: "name",
      header: "Shift Name",
      render: (row) => <div style={{ fontWeight: 600 }}>{row.name}</div>,
    },
    {
      key: "startTime",
      header: "Working Hours",
      render: (row) => (
        <span>{row.startTime.slice(0, 5)} – {row.endTime.slice(0, 5)}</span>
      ),
    },
    {
      key: "gracePeriodMinutes",
      header: "Grace Period",
      render: (row) => <span>{row.gracePeriodMinutes} mins</span>,
    },
    {
      key: "isOvernight",
      header: "Overnight",
      render: (row) => (
        <Badge
          label={row.isOvernight ? "OVERNIGHT" : "STANDARD"}
          variant={row.isOvernight ? "warning" : "neutral"}
          size="sm"
        />
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (row) => (
        <Badge label={row.isActive ? "ACTIVE" : "INACTIVE"} variant={row.isActive ? "success" : "neutral"} size="sm" />
      ),
    },
  ];

  const assignColumns: DataTableColumn<ShiftAssignment>[] = [
    {
      key: "employeeCode",
      header: "Employee",
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.employeeName}</div>
          <code style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{row.employeeCode}</code>
        </div>
      ),
    },
    {
      key: "shiftName",
      header: "Assigned Shift",
      render: (row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.shiftName}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{row.shiftCode}</span>
        </div>
      ),
    },
    {
      key: "effectiveFrom",
      header: "Effective Period",
      render: (row) => (
        <span>
          {new Date(row.effectiveFrom).toLocaleDateString()} – {row.effectiveTo ? new Date(row.effectiveTo).toLocaleDateString() : "Indefinite"}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (row) => (
        <Badge label={row.isActive ? "ACTIVE" : "INACTIVE"} variant={row.isActive ? "success" : "neutral"} size="sm" />
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Top Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            size="sm"
            variant={activeTab === "shifts" ? "primary" : "secondary"}
            onClick={() => setActiveTab("shifts")}
          >
            <Clock size={14} style={{ marginRight: 6 }} /> Shift Definitions ({shifts.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === "assignments" ? "primary" : "secondary"}
            onClick={() => setActiveTab("assignments")}
          >
            <Users size={14} style={{ marginRight: 6 }} /> Staff Roster Assignments ({assignments.length})
          </Button>
        </div>

        {canManage && (
          <div style={{ display: "flex", gap: 8 }}>
            {activeTab === "shifts" ? (
              <Button size="sm" variant="primary" onClick={() => setIsShiftModalOpen(true)}>
                <Plus size={14} style={{ marginRight: 4 }} /> New Shift Definition
              </Button>
            ) : (
              <Button size="sm" variant="primary" onClick={() => setIsAssignModalOpen(true)}>
                <Calendar size={14} style={{ marginRight: 4 }} /> Assign Shift to Staff
              </Button>
            )}
          </div>
        )}
      </div>

      {activeTab === "shifts" ? (
        <DataTable
          data={shifts}
          columns={shiftColumns}
          keyExtractor={(row) => row.id}
          emptyTitle="No shifts configured"
          emptyDescription="Configure institutional shift profiles for automatic lateness and attendance calculations."
          pageSize={8}
        />
      ) : (
        <DataTable
          data={assignments}
          columns={assignColumns}
          keyExtractor={(row) => row.id}
          emptyTitle="No shift assignments"
          emptyDescription="Assign staff members to working shifts."
          pageSize={8}
        />
      )}

      {/* New Shift Modal */}
      {isShiftModalOpen && (
        <Modal
          isOpen={isShiftModalOpen}
          onClose={() => setIsShiftModalOpen(false)}
          title="Create Shift Definition"
          description="Define standard or overnight working schedule with grace periods."
        >
          <form onSubmit={handleSaveShift} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {formError && (
              <div style={{ color: "var(--danger)", fontSize: "0.85rem", padding: "8px 12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: 6 }}>
                {formError}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="Shift Name"
                placeholder="e.g. Morning Shift A"
                value={shiftName}
                onChange={(e) => setShiftName(e.target.value)}
                required
              />
              <Input
                label="Shift Code"
                placeholder="e.g. SHT-M01"
                value={shiftCode}
                onChange={(e) => setShiftCode(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="Start Time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
              <Input
                label="End Time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="Break Duration (Mins)"
                type="number"
                min="0"
                value={breakMins}
                onChange={(e) => setBreakMins(Number(e.target.value))}
                required
              />
              <Input
                label="Grace Period (Mins)"
                type="number"
                min="0"
                value={graceMins}
                onChange={(e) => setGraceMins(Number(e.target.value))}
                required
              />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isOvernight}
                onChange={(e) => setIsOvernight(e.target.checked)}
              />
              Overnight Shift (crosses midnight into next day)
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <Button variant="secondary" onClick={() => setIsShiftModalOpen(false)} type="button" disabled={isPending}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isPending}>
                Save Shift
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Shift Modal */}
      {isAssignModalOpen && (
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title="Assign Shift Schedule"
          description="Assign an employee to a scheduled working shift with overlap conflict protection."
        >
          <form onSubmit={handleAssignShift} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {formError && (
              <div style={{ color: "var(--danger)", fontSize: "0.85rem", padding: "8px 12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: 6 }}>
                {formError}
              </div>
            )}

            <Select
              label="Select Employee"
              options={employees.map((e) => ({ label: `${e.name} (${e.code})`, value: e.id }))}
              value={assignEmpId}
              onChange={(e) => setAssignEmpId(e.target.value)}
              required
            />

            <Select
              label="Select Shift"
              options={shifts.map((s) => ({ label: `${s.name} (${s.code} - ${s.startTime.slice(0, 5)} to ${s.endTime.slice(0, 5)})`, value: s.id }))}
              value={assignShiftId}
              onChange={(e) => setAssignShiftId(e.target.value)}
              required
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="Effective From"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                required
              />
              <Input
                label="Effective To (Optional)"
                type="date"
                value={effectiveTo}
                min={effectiveFrom}
                onChange={(e) => setEffectiveTo(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)} type="button" disabled={isPending}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isPending}>
                Confirm Assignment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
