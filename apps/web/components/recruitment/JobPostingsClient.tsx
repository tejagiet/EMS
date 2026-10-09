"use client";

import { useState } from "react";
import { DataTable, type DataTableColumn } from "../ui/DataTable";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { upsertJobPostingAction } from "@/lib/data/recruitment-actions";
import type { JobPosting } from "@ems/types";
import { Plus, Edit2, AlertCircle, Users } from "lucide-react";

interface OptionItem {
  id: string;
  name: string;
}

interface JobPostingsClientProps {
  postings: JobPosting[];
  departments: OptionItem[];
  designations: OptionItem[];
}

export function JobPostingsClient({
  postings,
  departments,
  designations,
}: JobPostingsClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPosting, setEditingPosting] = useState<JobPosting | null>(null);

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [location, setLocation] = useState("GIET Main Campus");
  const [employmentType, setEmploymentType] = useState<JobPosting["employmentType"]>("full_time");
  const [vacancyCount, setVacancyCount] = useState("2");
  const [minSalary, setMinSalary] = useState("35000");
  const [maxSalary, setMaxSalary] = useState("65000");
  const [status, setStatus] = useState<JobPosting["status"]>("published");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const openCreateModal = () => {
    setEditingPosting(null);
    setTitle("");
    setCode(`JOB-${new Date().getFullYear()}-${String(postings.length + 1).padStart(3, "0")}`);
    setDepartmentId(departments[0]?.id ?? "");
    setDesignationId(designations[0]?.id ?? "");
    setDescription("We are seeking a talented professional to join our department.");
    setRequirements("Bachelor's or Master's degree in relevant discipline; 2+ years of experience.");
    setLocation("GIET Main Campus");
    setEmploymentType("full_time");
    setVacancyCount("2");
    setMinSalary("35000");
    setMaxSalary("65000");
    setStatus("published");
    setErrorMessage("");
    setModalOpen(true);
  };

  const openEditModal = (p: JobPosting) => {
    setEditingPosting(p);
    setTitle(p.title);
    setCode(p.code);
    setDepartmentId(p.departmentId ?? "");
    setDesignationId(p.designationId ?? "");
    setDescription(p.description);
    setRequirements(p.requirements ?? "");
    setLocation(p.location);
    setEmploymentType(p.employmentType);
    setVacancyCount(p.vacancyCount.toString());
    setMinSalary(p.minSalary ? p.minSalary.toString() : "");
    setMaxSalary(p.maxSalary ? p.maxSalary.toString() : "");
    setStatus(p.status);
    setErrorMessage("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");

    const formData = new FormData();
    if (editingPosting?.id) formData.append("id", editingPosting.id);
    formData.append("title", title);
    formData.append("code", code);
    if (departmentId) formData.append("departmentId", departmentId);
    if (designationId) formData.append("designationId", designationId);
    formData.append("description", description);
    if (requirements) formData.append("requirements", requirements);
    formData.append("location", location);
    formData.append("employmentType", employmentType);
    formData.append("vacancyCount", vacancyCount);
    if (minSalary) formData.append("minSalary", minSalary);
    if (maxSalary) formData.append("maxSalary", maxSalary);
    formData.append("status", status);

    const res = await upsertJobPostingAction(formData);
    setSaving(false);

    if (!res.success) {
      setErrorMessage(res.error ?? "Failed to save job posting.");
    } else {
      setModalOpen(false);
    }
  };

  const columns: DataTableColumn<JobPosting>[] = [
    {
      key: "code",
      header: "Job Code",
      sortable: true,
      render: (row) => (
        <code style={{ fontSize: "0.82rem", padding: "2px 6px", borderRadius: 4, background: "var(--background)" }}>
          {row.code}
        </code>
      ),
    },
    {
      key: "title",
      header: "Position Title",
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.title}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            {row.departmentName ?? "Department"} · {row.location}
          </div>
        </div>
      ),
    },
    {
      key: "vacancyCount",
      header: "Vacancies",
      sortable: true,
      render: (row) => <span>{row.vacancyCount} openings</span>,
    },
    {
      key: "candidateCount",
      header: "Applicants",
      render: (row) => (
        <span style={{ fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Users size={14} /> {row.candidateCount ?? 0}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge
          label={row.status.toUpperCase()}
          variant={row.status === "published" ? "success" : row.status === "closed" ? "danger" : "neutral"}
          size="sm"
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => { openEditModal(row); }}
          leftIcon={<Edit2 size={14} />}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>Active Job Requisitions</h3>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
            Manage faculty and staff recruitment requisitions across academic departments.
          </p>
        </div>
        <Button variant="primary" onClick={openCreateModal} leftIcon={<Plus size={16} />}>
          Post New Position
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={postings}
        keyExtractor={(item) => item.id}
        emptyTitle="No Job Openings"
        emptyDescription="Click 'Post New Position' to create your first departmental job requisition."
      />

      {/* Posting Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); }}
        title={editingPosting ? "Edit Job Opening" : "Create New Job Opening"}
        maxWidth="650px"
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {errorMessage && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 6,
                background: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertCircle size={16} /> {errorMessage}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12 }}>
            <Input
              label="Position Title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); }}
              placeholder="e.g. Assistant Professor in AI & Machine Learning"
              required
            />
            <Input
              label="Job Code"
              value={code}
              onChange={(e) => { setCode(e.target.value); }}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select
              label="Department"
              value={departmentId}
              onChange={(e) => { setDepartmentId(e.target.value); }}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
            <Select
              label="Designation"
              value={designationId}
              onChange={(e) => { setDesignationId(e.target.value); }}
              options={designations.map((d) => ({ value: d.id, label: d.name }))}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Input
              label="Vacancies"
              type="number"
              min="1"
              value={vacancyCount}
              onChange={(e) => { setVacancyCount(e.target.value); }}
              required
            />
            <Select
              label="Employment Type"
              value={employmentType}
              onChange={(e) => { setEmploymentType(e.target.value as JobPosting["employmentType"]); }}
              options={[
                { value: "full_time", label: "Full Time" },
                { value: "part_time", label: "Part Time" },
                { value: "contract", label: "Contract" },
                { value: "intern", label: "Intern" },
              ]}
            />
            <Select
              label="Status"
              value={status}
              onChange={(e) => { setStatus(e.target.value as JobPosting["status"]); }}
              options={[
                { value: "published", label: "Published" },
                { value: "draft", label: "Draft" },
                { value: "on_hold", label: "On Hold" },
                { value: "closed", label: "Closed" },
              ]}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input
              label="Min Salary (₹/month)"
              type="number"
              value={minSalary}
              onChange={(e) => { setMinSalary(e.target.value); }}
            />
            <Input
              label="Max Salary (₹/month)"
              type="number"
              value={maxSalary}
              onChange={(e) => { setMaxSalary(e.target.value); }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
              Job Description
            </label>
            <textarea
              style={{
                width: "100%",
                minHeight: 80,
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--background)",
                color: "var(--foreground)",
                fontSize: "0.85rem",
                fontFamily: "inherit",
              }}
              value={description}
              onChange={(e) => { setDescription(e.target.value); }}
              required
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <Button variant="ghost" type="button" onClick={() => { setModalOpen(false); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={saving}>
              {editingPosting ? "Save Changes" : "Publish Opening"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
