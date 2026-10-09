"use client";

import { useState } from "react";
import { DataTable, type DataTableColumn } from "../ui/DataTable";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import {
  initiateOffboardingCaseAction,
  updateClearanceItemAction,
  processOffboardingDecisionAction,
  exportOffboardingCsvAction,
} from "@/lib/data/offboarding-actions";
import type { ExtendedOffboardingCase, ExtendedClearanceItem } from "@/lib/data/offboarding";
import type { ClearanceStatus } from "@ems/types";
import {
  UserMinus,
  CheckSquare,
  Download,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";

interface OptionItem {
  id: string;
  name: string;
}

interface OffboardingClientProps {
  initialCases: ExtendedOffboardingCase[];
  employees: OptionItem[];
  organizationId: string;
  currentUserId: string;
}

export function OffboardingClient({
  initialCases,
  employees,
  organizationId,
  currentUserId,
}: OffboardingClientProps) {
  const [cases] = useState<ExtendedOffboardingCase[]>(initialCases);
  const [selectedCase, setSelectedCase] = useState<ExtendedOffboardingCase | null>(null);
  const [clearanceItems, setClearanceItems] = useState<ExtendedClearanceItem[]>([]);
  const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [isLoadingClearances, setIsLoadingClearances] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // New Exit Case Form State
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [exitType, setExitType] = useState<ExtendedOffboardingCase["exitType"]>("resignation");
  const [reason, setReason] = useState("Career growth opportunity");
  const [lastWorkingDate, setLastWorkingDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [noticePeriodDays, setNoticePeriodDays] = useState("30");
  const [handoverNotes, setHandoverNotes] = useState("Documentation handed over to team lead.");

  const handleOpenClearances = async (c: ExtendedOffboardingCase) => {
    setSelectedCase(c);
    setIsLoadingClearances(true);
    setIsClearanceModalOpen(true);
    try {
      const response = await fetch(`/api/offboarding/${c.id}`);
      if (response.ok) {
        const data = await response.json();
        setClearanceItems(data.clearanceItems ?? []);
      } else {
        setClearanceItems([]);
      }
    } catch {
      setClearanceItems([]);
    } finally {
      setIsLoadingClearances(false);
    }
  };

  const handleInitiateExit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await initiateOffboardingCaseAction({
        orgId: organizationId,
        employeeId,
        exitType,
        reason,
        lastWorkingDate,
        noticePeriodDays: parseInt(noticePeriodDays, 10) || 30,
        handoverNotes,
        createdBy: currentUserId,
      });

      if (!res.success) {
        setErrorMessage(res.error ?? "Failed to initiate exit case.");
        setIsSubmitting(false);
        return;
      }

      setIsNewCaseModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleClearance = async (item: ExtendedClearanceItem) => {
    const newStatus: ClearanceStatus = item.status === "cleared" ? "pending" : "cleared";
    const res = await updateClearanceItemAction(item.id, newStatus, currentUserId);
    if (res.success) {
      setClearanceItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: newStatus, clearedAt: newStatus === "cleared" ? new Date().toISOString() : null }
            : i
        )
      );
    }
  };

  const handleFinalizeDecision = async (caseId: string, decision: "complete" | "cancel") => {
    setIsSubmitting(true);
    try {
      const res = await processOffboardingDecisionAction(
        caseId,
        decision,
        currentUserId,
        decision === "complete" ? "All clearances fulfilled. Account deactivated." : "Exit cancelled."
      );

      if (!res.success) {
        alert(res.error || "Cannot complete offboarding while required clearances remain open.");
      } else {
        setIsClearanceModalOpen(false);
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.message || "Failed to finalize offboarding.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCsv = async () => {
    const csvData = await exportOffboardingCsvAction(organizationId);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `offboarding_cases_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: DataTableColumn<ExtendedOffboardingCase>[] = [
    {
      key: "employeeCode",
      header: "Employee",
      render: (c) => (
        <div>
          <p className="font-semibold text-slate-900">{c.employeeName}</p>
          <p className="text-xs text-slate-500">{c.employeeCode}</p>
        </div>
      ),
    },
    {
      key: "exitType",
      header: "Exit Type / Reason",
      render: (c) => (
        <div>
          <span className="capitalize text-sm font-medium text-slate-800">{c.exitType}</span>
          <p className="text-xs text-slate-500 truncate max-w-xs">{c.reason}</p>
        </div>
      ),
    },
    {
      key: "lastWorkingDate",
      header: "Last Working Date",
      render: (c) => <span className="text-sm text-slate-700">{c.lastWorkingDate}</span>,
    },
    {
      key: "clearanceProgressPercent",
      header: "Clearances",
      render: (c) => (
        <div className="w-36">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-slate-700">{c.clearanceProgressPercent}%</span>
            <span className="text-slate-500">
              {c.clearedClearances}/{c.totalClearances}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                c.clearanceProgressPercent === 100 ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${c.clearanceProgressPercent}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (c) => {
        const variants: Record<string, "success" | "warning" | "info" | "neutral"> = {
          completed: "neutral",
          clearance_pending: "warning",
          in_progress: "info",
          requested: "warning",
          cancelled: "neutral",
        };
        return <Badge variant={variants[c.status] ?? "neutral"}>{c.status.replace("_", " ")}</Badge>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (c) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<CheckSquare className="w-4 h-4" />}
            onClick={() => handleOpenClearances(c)}
          >
            Clearances
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Employee Offboarding & Exits</h2>
          <p className="text-xs text-slate-500">Coordinate multi-department clearances and account deactivation</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCsv}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            leftIcon={<UserMinus className="w-4 h-4" />}
            onClick={() => setIsNewCaseModalOpen(true)}
          >
            Initiate Exit
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={cases}
        keyExtractor={(c) => c.id}
        emptyDescription="No offboarding cases recorded."
      />

      {/* Initiate Exit Modal */}
      <Modal
        isOpen={isNewCaseModalOpen}
        onClose={() => setIsNewCaseModalOpen(false)}
        title="Initiate Employee Offboarding"
        maxWidth="600px"
      >
        <form onSubmit={handleInitiateExit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <Select
            label="Employee"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            options={employees.map((e) => ({ value: e.id, label: e.name }))}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Exit Type"
              value={exitType}
              onChange={(e) => setExitType(e.target.value as any)}
              options={[
                { value: "resignation", label: "Resignation" },
                { value: "termination", label: "Termination" },
                { value: "contract_end", label: "Contract End" },
                { value: "retirement", label: "Retirement" },
              ]}
              required
            />
            <Input
              label="Notice Period (Days)"
              type="number"
              value={noticePeriodDays}
              onChange={(e) => setNoticePeriodDays(e.target.value)}
              required
            />
          </div>

          <Input
            label="Last Working Date"
            type="date"
            value={lastWorkingDate}
            onChange={(e) => setLastWorkingDate(e.target.value)}
            required
          />

          <Input
            label="Primary Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Higher studies, Personal reasons"
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Handover & Knowledge Transfer Notes
            </label>
            <textarea
              rows={3}
              value={handoverNotes}
              onChange={(e) => setHandoverNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewCaseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Confirm Exit Initiation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Clearance Checklist Modal */}
      <Modal
        isOpen={isClearanceModalOpen}
        onClose={() => setIsClearanceModalOpen(false)}
        title={`Exit Clearances: ${selectedCase?.employeeName ?? ""}`}
        maxWidth="650px"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
            <div>
              <p className="font-semibold text-slate-900">{selectedCase?.employeeCode}</p>
              <p className="text-slate-500">LWD: {selectedCase?.lastWorkingDate}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-slate-500">Clearances</span>
              <p className="text-base font-bold text-amber-600">{selectedCase?.clearanceProgressPercent}%</p>
            </div>
          </div>

          {isLoadingClearances ? (
            <div className="py-8 text-center text-slate-500 text-sm">Loading clearance checkpoints...</div>
          ) : clearanceItems.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No clearance items registered.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {clearanceItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    item.status === "cleared"
                      ? "bg-emerald-50/50 border-emerald-200"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.status === "cleared"}
                      onChange={() => handleToggleClearance(item)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          item.status === "cleared"
                            ? "line-through text-slate-500"
                            : "text-slate-900"
                        }`}
                      >
                        {item.title ?? item.itemName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="uppercase font-semibold text-indigo-600">{item.departmentType}</span>
                        {item.assetTag && (
                          <span className="text-slate-700 font-medium">• Asset: {item.assetTag}</span>
                        )}
                        {item.isRequired && (
                          <span className="text-rose-600 font-medium">• Required</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant={item.status === "cleared" ? "success" : "warning"}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setIsClearanceModalOpen(false)}
            >
              Close
            </Button>
            {selectedCase && selectedCase.status !== "completed" && (
              <Button
                variant="danger"
                leftIcon={<ShieldAlert className="w-4 h-4" />}
                isLoading={isSubmitting}
                onClick={() => handleFinalizeDecision(selectedCase.id, "complete")}
              >
                Complete Offboarding & Deactivate
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
