"use client";

import { useState } from "react";
import { DataTable, type DataTableColumn } from "../ui/DataTable";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import {
  createEmployeeTaskAction,
  updateEmployeeTaskStatusAction,
  exportTasksCsvAction,
} from "@/lib/data/tasks-actions";
import type { ExtendedEmployeeTask } from "@/lib/data/tasks";
import type { TaskPriority, TaskStatus } from "@ems/types";
import {
  Plus,
  Download,
  AlertTriangle,
  Calendar,
} from "lucide-react";

interface OptionItem {
  id: string;
  name: string;
}

interface TasksClientProps {
  initialTasks: ExtendedEmployeeTask[];
  employees: OptionItem[];
  organizationId: string;
  currentUserId: string;
}

export function TasksClient({
  initialTasks,
  employees,
  organizationId,
  currentUserId,
}: TasksClientProps) {
  const [tasks, setTasks] = useState<ExtendedEmployeeTask[]>(initialTasks);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // New Task Form
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState("operational");

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await createEmployeeTaskAction({
        organizationId,
        employeeId,
        createdBy: currentUserId,
        title,
        description: description || null,
        priority,
        dueDate: dueDate || null,
        category,
      });

      if (!res.success) {
        setErrorMessage(res.error ?? "Failed to create task.");
        setIsSubmitting(false);
        return;
      }

      setIsNewTaskModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (task: ExtendedEmployeeTask, newStatus: TaskStatus) => {
    const res = await updateEmployeeTaskStatusAction(task.id, newStatus, currentUserId);
    if (res.success) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
    }
  };

  const handleExportCsv = async () => {
    const csvData = await exportTasksCsvAction(organizationId);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `operational_tasks_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: DataTableColumn<ExtendedEmployeeTask>[] = [
    {
      key: "title",
      header: "Task",
      render: (t) => (
        <div>
          <p className="font-semibold text-slate-900">{t.title}</p>
          {t.description && <p className="text-xs text-slate-500 truncate max-w-sm">{t.description}</p>}
        </div>
      ),
    },
    {
      key: "employeeName",
      header: "Assignee",
      render: (t) => <span className="text-sm text-slate-800">{t.employeeName ?? t.assigneeName}</span>,
    },
    {
      key: "priority",
      header: "Priority",
      render: (t) => {
        const variants: Record<string, "danger" | "warning" | "info" | "neutral"> = {
          urgent: "danger",
          high: "warning",
          medium: "info",
          low: "neutral",
        };
        return <Badge variant={variants[t.priority] ?? "neutral"}>{t.priority}</Badge>;
      },
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (t) => (
        <div className="flex items-center gap-1.5 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className={t.isOverdue ? "text-rose-600 font-semibold" : "text-slate-600"}>
            {t.dueDate ?? "No due date"}
          </span>
          {t.isOverdue && <span className="text-[10px] bg-rose-100 text-rose-700 px-1 rounded">Overdue</span>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (t) => {
        const variants: Record<string, "success" | "info" | "warning" | "neutral"> = {
          completed: "success",
          in_progress: "info",
          open: "warning",
          blocked: "warning",
          cancelled: "neutral",
        };
        return <Badge variant={variants[t.status] ?? "neutral"}>{t.status.replace("_", " ")}</Badge>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (t) => (
        <div className="flex justify-end gap-1.5">
          {t.status !== "completed" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUpdateStatus(t, "completed")}
            >
              Mark Done
            </Button>
          )}
          {t.status === "open" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUpdateStatus(t, "in_progress")}
            >
              Start
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Operational Tasks</h2>
          <p className="text-xs text-slate-500">Track and assign HR and day-to-day organizational tasks</p>
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
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setTitle("");
              setDescription("");
              setErrorMessage("");
              setIsNewTaskModalOpen(true);
            }}
          >
            Create Task
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={tasks}
        keyExtractor={(t) => t.id}
        emptyDescription="No operational tasks registered."
      />

      {/* Create Task Modal */}
      <Modal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        title="Create Operational Task"
        maxWidth="550px"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <Input
            label="Task Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Conduct fire drill briefing"
            required
          />

          <Select
            label="Assignee"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            options={employees.map((e) => ({ value: e.id, label: e.name }))}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
                { value: "urgent", label: "Urgent" },
              ]}
              required
            />
            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. operational"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewTaskModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
