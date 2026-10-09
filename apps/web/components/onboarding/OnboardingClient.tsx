"use client";

import { useState } from "react";
import { DataTable, type DataTableColumn } from "../ui/DataTable";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import {
  createOnboardingCaseAction,
  updateOnboardingTaskAction,
  completeOnboardingCaseAction,
  exportOnboardingCsvAction,
} from "@/lib/data/onboarding-actions";
import type { OnboardingCase, OnboardingTask, OnboardingChecklistTemplate } from "@ems/types";
import {
  UserPlus,
  CheckCircle2,
  Download,
  AlertTriangle,
  ListTodo,
} from "lucide-react";

interface OptionItem {
  id: string;
  name: string;
}

interface OnboardingClientProps {
  initialCases: OnboardingCase[];
  templates: OnboardingChecklistTemplate[];
  employees: OptionItem[];
  departments: OptionItem[];
  designations: OptionItem[];
  branches: OptionItem[];
  organizationId: string;
  currentUserId: string;
}

export function OnboardingClient({
  initialCases,
  templates,
  employees,
  departments,
  designations,
  branches,
  organizationId,
  currentUserId,
}: OnboardingClientProps) {
  const [cases] = useState<OnboardingCase[]>(initialCases);
  const [selectedCase, setSelectedCase] = useState<OnboardingCase | null>(null);
  const [caseTasks, setCaseTasks] = useState<OnboardingTask[]>([]);
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // New Case Form State
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().slice(0, 10));
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? "");
  const [designationId, setDesignationId] = useState(designations[0]?.id ?? "");
  const [branchId] = useState(branches[0]?.id ?? "");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");

  const handleOpenTasks = async (c: OnboardingCase) => {
    setSelectedCase(c);
    setIsLoadingTasks(true);
    setIsTasksModalOpen(true);
    try {
      // Import dynamic or client fetch details
      const response = await fetch(`/api/onboarding/${c.id}`);
      if (response.ok) {
        const data = await response.json();
        setCaseTasks(data.tasks ?? []);
      } else {
        // Fallback placeholder task if API route isn't separate
        setCaseTasks([]);
      }
    } catch {
      setCaseTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await createOnboardingCaseAction({
        orgId: organizationId,
        employeeId,
        joiningDate,
        deptId: departmentId || null,
        desigId: designationId || null,
        branchId: branchId || null,
        templateId: templateId || null,
        createdBy: currentUserId,
      });

      if (!res.success) {
        setErrorMessage(res.error ?? "Failed to create onboarding case.");
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

  const handleToggleTask = async (task: OnboardingTask) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    const res = await updateOnboardingTaskAction(task.id, newStatus, currentUserId);
    if (res.success) {
      setCaseTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: newStatus, completedAt: newStatus === "completed" ? new Date().toISOString() : null }
            : t
        )
      );
    }
  };

  const handleCompleteCase = async (caseId: string) => {
    setIsSubmitting(true);
    try {
      const res = await completeOnboardingCaseAction(caseId, currentUserId);
      if (!res.success) {
        alert(res.error || "Cannot complete onboarding case while required tasks remain incomplete.");
      } else {
        setIsTasksModalOpen(false);
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.message || "Failed to complete onboarding.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCsv = async () => {
    const csvData = await exportOnboardingCsvAction(organizationId);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `onboarding_cases_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: DataTableColumn<OnboardingCase>[] = [
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
      key: "departmentName",
      header: "Department / Role",
      render: (c) => (
        <div>
          <p className="text-sm text-slate-900">{c.departmentName ?? "General"}</p>
          <p className="text-xs text-slate-500">{c.designationName ?? "Employee"}</p>
        </div>
      ),
    },
    {
      key: "joiningDate",
      header: "Joining Date",
      render: (c) => <span className="text-sm text-slate-700">{c.joiningDate}</span>,
    },
    {
      key: "progressPercent",
      header: "Checklist Progress",
      render: (c) => (
        <div className="w-36">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-slate-700">{c.progressPercent}%</span>
            <span className="text-slate-500">
              {c.completedTasks}/{c.totalTasks}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                c.progressPercent === 100 ? "bg-emerald-500" : "bg-indigo-600"
              }`}
              style={{ width: `${c.progressPercent}%` }}
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
          completed: "success",
          in_progress: "info",
          pending: "warning",
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
            leftIcon={<ListTodo className="w-4 h-4" />}
            onClick={() => handleOpenTasks(c)}
          >
            Checklist
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
          <h2 className="text-lg font-bold text-slate-900">Employee Onboarding Cases</h2>
          <p className="text-xs text-slate-500">Track and fulfill new hire onboarding workflows</p>
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
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsNewCaseModalOpen(true)}
          >
            Initiate Onboarding
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={cases}
        keyExtractor={(c) => c.id}
        emptyDescription="No onboarding cases found. Click 'Initiate Onboarding' to begin a case."
      />

      {/* Initiate Onboarding Modal */}
      <Modal
        isOpen={isNewCaseModalOpen}
        onClose={() => setIsNewCaseModalOpen(false)}
        title="Initiate Employee Onboarding"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateCase} className="space-y-4">
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

          <Input
            label="Joining Date"
            type="date"
            value={joiningDate}
            onChange={(e) => setJoiningDate(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
            <Select
              label="Designation"
              value={designationId}
              onChange={(e) => setDesignationId(e.target.value)}
              options={designations.map((d) => ({ value: d.id, label: d.name }))}
            />
          </div>

          <Select
            label="Checklist Template"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            options={templates.map((t) => ({ value: t.id, label: t.name }))}
          />

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
              Start Onboarding
            </Button>
          </div>
        </form>
      </Modal>

      {/* Checklist Inspection Modal */}
      <Modal
        isOpen={isTasksModalOpen}
        onClose={() => setIsTasksModalOpen(false)}
        title={`Onboarding Checklist: ${selectedCase?.employeeName ?? ""}`}
        maxWidth="650px"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
            <div>
              <p className="font-semibold text-slate-900">{selectedCase?.employeeCode}</p>
              <p className="text-slate-500">Joining: {selectedCase?.joiningDate}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-slate-500">Progress</span>
              <p className="text-base font-bold text-indigo-600">{selectedCase?.progressPercent}%</p>
            </div>
          </div>

          {isLoadingTasks ? (
            <div className="py-8 text-center text-slate-500 text-sm">Loading checklist tasks...</div>
          ) : caseTasks.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No tasks registered for this case.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {caseTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    task.status === "completed"
                      ? "bg-emerald-50/50 border-emerald-200"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={task.status === "completed"}
                      onChange={() => handleToggleTask(task)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          task.status === "completed"
                            ? "line-through text-slate-500"
                            : "text-slate-900"
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="capitalize">{task.category}</span>
                        {task.isRequired && (
                          <span className="text-amber-600 font-medium">• Required</span>
                        )}
                        {task.isOverdue && (
                          <span className="text-rose-600 font-medium">• Overdue</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant={task.status === "completed" ? "success" : "neutral"}>
                    {task.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setIsTasksModalOpen(false)}
            >
              Close
            </Button>
            {selectedCase && selectedCase.status !== "completed" && (
              <Button
                variant="primary"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                isLoading={isSubmitting}
                onClick={() => handleCompleteCase(selectedCase.id)}
              >
                Complete Onboarding
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
