"use client";

import { useState } from "react";
import { DataTable, type DataTableColumn } from "../ui/DataTable";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import {
  createAnnouncementAction,
  markAnnouncementReadAction,
  exportAnnouncementsCsvAction,
} from "@/lib/data/announcements-actions";
import type { Announcement, AnnouncementPriority, AnnouncementTargetType } from "@ems/types";
import {
  Plus,
  Eye,
  Download,
  AlertTriangle,
  Users,
} from "lucide-react";

interface OptionItem {
  id: string;
  name: string;
}

interface AnnouncementsClientProps {
  initialAnnouncements: (Announcement & { readCount?: number; isReadByCurrentUser?: boolean })[];
  departments: OptionItem[];
  branches: OptionItem[];
  organizationId: string;
  currentUserId: string;
}

export function AnnouncementsClient({
  initialAnnouncements,
  departments,
  branches,
  organizationId,
  currentUserId,
}: AnnouncementsClientProps) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<(Announcement & { readCount?: number }) | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // New Announcement Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriority>("normal");
  const [targetAudience, setTargetAudience] = useState<AnnouncementTargetType>("all");
  const [targetDepartmentId, setTargetDepartmentId] = useState(departments[0]?.id ?? "");
  const [targetBranchId, setTargetBranchId] = useState(branches[0]?.id ?? "");

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await createAnnouncementAction({
        organizationId,
        authorId: currentUserId,
        title,
        content,
        priority,
        targetAudience,
        targetDepartmentId: targetAudience === "department" ? targetDepartmentId : null,
        targetBranchId: targetAudience === "branch" ? targetBranchId : null,
      });

      if (!res.success) {
        setErrorMessage(res.error ?? "Failed to publish announcement.");
        setIsSubmitting(false);
        return;
      }

      setIsNewModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewAnnouncement = async (a: Announcement & { readCount?: number; isReadByCurrentUser?: boolean }) => {
    setSelectedAnnouncement(a);
    if (!a.isReadByCurrentUser) {
      await markAnnouncementReadAction(a.id, currentUserId);
      setAnnouncements((prev) =>
        prev.map((item) =>
          item.id === a.id
            ? { ...item, isReadByCurrentUser: true, isRead: true, readCount: (item.readCount ?? 0) + 1 }
            : item
        )
      );
    }
  };

  const handleExportCsv = async () => {
    const csvData = await exportAnnouncementsCsvAction(organizationId);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `announcements_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: DataTableColumn<Announcement & { readCount?: number; isReadByCurrentUser?: boolean }>[] = [
    {
      key: "title",
      header: "Announcement",
      render: (a) => (
        <div>
          <p className="font-semibold text-slate-900">{a.title}</p>
          <p className="text-xs text-slate-500 truncate max-w-sm">{a.body}</p>
        </div>
      ),
    },
    {
      key: "targetType",
      header: "Audience Scope",
      render: (a) => (
        <span className="capitalize text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1 w-max">
          <Users className="w-3 h-3 text-slate-500" />
          {a.targetType === "all"
            ? "Entire Organization"
            : a.targetLabel ?? a.targetType}
        </span>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (a) => {
        const variants: Record<string, "danger" | "warning" | "neutral"> = {
          urgent: "danger",
          high: "warning",
          normal: "neutral",
        };
        return <Badge variant={variants[a.priority] ?? "neutral"}>{a.priority}</Badge>;
      },
    },
    {
      key: "publishedAt",
      header: "Published At",
      render: (a) => (
        <span className="text-xs text-slate-600">
          {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : "Draft"}
        </span>
      ),
    },
    {
      key: "readCount",
      header: "Views",
      render: (a) => (
        <span className="text-xs text-slate-600 font-medium">
          {a.readCount ?? 0} reads
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (a) => (
        <div className="flex justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Eye className="w-4 h-4" />}
            onClick={() => handleViewAnnouncement(a)}
          >
            Read
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Company Announcements</h2>
          <p className="text-xs text-slate-500">Publish and broadcast notices across departments and campuses</p>
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
              setContent("");
              setErrorMessage("");
              setIsNewModalOpen(true);
            }}
          >
            Post Notice
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={announcements}
        keyExtractor={(a) => a.id}
        emptyDescription="No announcements published yet."
      />

      {/* New Announcement Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Broadcast New Notice"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <Input
            label="Notice Headline"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Annual Sports Day & Academic Schedule 2026"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              options={[
                { value: "normal", label: "Normal" },
                { value: "high", label: "High" },
                { value: "urgent", label: "Urgent" },
              ]}
              required
            />
            <Select
              label="Target Scope"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value as any)}
              options={[
                { value: "all", label: "All Employees" },
                { value: "department", label: "Specific Department" },
                { value: "branch", label: "Specific Campus Branch" },
              ]}
              required
            />
          </div>

          {targetAudience === "department" && (
            <Select
              label="Select Department"
              value={targetDepartmentId}
              onChange={(e) => setTargetDepartmentId(e.target.value)}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
          )}

          {targetAudience === "branch" && (
            <Select
              label="Select Branch Campus"
              value={targetBranchId}
              onChange={(e) => setTargetBranchId(e.target.value)}
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notice Content
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide clear instructions and details..."
              className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Publish Notice
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Notice Modal */}
      <Modal
        isOpen={Boolean(selectedAnnouncement)}
        onClose={() => setSelectedAnnouncement(null)}
        title={selectedAnnouncement?.title ?? ""}
        maxWidth="600px"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100">
            <span>Posted by: <strong>{selectedAnnouncement?.authorName}</strong></span>
            <span>
              {selectedAnnouncement?.publishedAt
                ? new Date(selectedAnnouncement.publishedAt).toLocaleString()
                : ""}
            </span>
          </div>

          <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
            {selectedAnnouncement?.body}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setSelectedAnnouncement(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
