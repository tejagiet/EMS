"use client";

import { useState } from "react";
import { DataTable, type DataTableColumn } from "../ui/DataTable";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import {
  registerDocumentAction,
  verifyDocumentAction,
  exportDocumentsCsvAction,
} from "@/lib/data/documents-actions";
import type { EmployeeDocument, DocumentCategory } from "@ems/types";
import {
  Upload,
  CheckCircle,
  XCircle,
  Download,
  AlertTriangle,
} from "lucide-react";

interface OptionItem {
  id: string;
  name: string;
}

interface DocumentsClientProps {
  initialDocuments: EmployeeDocument[];
  employees: OptionItem[];
  organizationId: string;
  currentUserId: string;
}

export function DocumentsClient({
  initialDocuments,
  employees,
  organizationId,
  currentUserId,
}: DocumentsClientProps) {
  const [documents] = useState<EmployeeDocument[]>(initialDocuments);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<EmployeeDocument | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Upload Document State
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [category, setCategory] = useState<DocumentCategory>("identification");
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const handleRegisterDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await registerDocumentAction({
        organizationId,
        employeeId,
        category,
        title,
        fileName: fileName || `${title.toLowerCase().replace(/\s+/g, "_")}.pdf`,
        filePath: `organizations/${organizationId}/employees/${employeeId}/${fileName || "doc.pdf"}`,
        fileSizeBytes: 245000,
        mimeType: "application/pdf",
        expiryDate: expiryDate || null,
      });

      if (!res.success) {
        setErrorMessage(res.error ?? "Failed to register document.");
        setIsSubmitting(false);
        return;
      }

      setIsUploadModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyDecision = async (status: "verified" | "rejected") => {
    if (!selectedDoc) return;
    setIsSubmitting(true);
    try {
      const res = await verifyDocumentAction(
        selectedDoc.id,
        status,
        currentUserId,
        status === "rejected" ? rejectionReason : undefined
      );

      if (!res.success) {
        alert(res.error || "Failed to update document verification status.");
      } else {
        setIsVerifyModalOpen(false);
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCsv = async () => {
    const csvData = await exportDocumentsCsvAction(organizationId);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `employee_documents_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: DataTableColumn<EmployeeDocument>[] = [
    {
      key: "title",
      header: "Document",
      render: (d) => (
        <div>
          <p className="font-semibold text-slate-900">{d.title}</p>
          <p className="text-xs text-slate-500 font-mono">{d.fileName}</p>
        </div>
      ),
    },
    {
      key: "employeeName",
      header: "Employee",
      render: (d) => <span className="text-sm text-slate-800">{d.employeeName ?? "Staff Member"}</span>,
    },
    {
      key: "category",
      header: "Category",
      render: (d) => (
        <span className="capitalize text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {d.category.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "fileSizeBytes",
      header: "File Size",
      render: (d) => (
        <span className="text-xs text-slate-600">
          {Math.round(d.fileSizeBytes / 1024)} KB
        </span>
      ),
    },
    {
      key: "verificationStatus",
      header: "Status",
      render: (d) => {
        const variants: Record<string, "success" | "warning" | "danger" | "neutral"> = {
          verified: "success",
          pending: "warning",
          rejected: "danger",
        };
        return <Badge variant={variants[d.verificationStatus] ?? "neutral"}>{d.verificationStatus}</Badge>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (d) => (
        <div className="flex justify-end gap-1.5">
          {d.verificationStatus === "pending" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedDoc(d);
                setRejectionReason("");
                setIsVerifyModalOpen(true);
              }}
            >
              Verify
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
          <h2 className="text-lg font-bold text-slate-900">Document Repository</h2>
          <p className="text-xs text-slate-500">Employee credentials, identity proofs, and verification</p>
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
            leftIcon={<Upload className="w-4 h-4" />}
            onClick={() => {
              setTitle("");
              setFileName("");
              setErrorMessage("");
              setIsUploadModalOpen(true);
            }}
          >
            Register Document
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={documents}
        keyExtractor={(d) => d.id}
        emptyDescription="No documents uploaded yet."
      />

      {/* Register Doc Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Register Employee Document"
        maxWidth="550px"
      >
        <form onSubmit={handleRegisterDoc} className="space-y-4">
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
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              options={[
                { value: "identification", label: "Identity Proof" },
                { value: "academic", label: "Academic Degree" },
                { value: "employment_contract", label: "Employment Contract" },
                { value: "certification", label: "Certification" },
                { value: "payroll_tax", label: "Tax & Payroll" },
                { value: "medical", label: "Medical / Fitness" },
                { value: "policy", label: "Signed Policy" },
                { value: "other", label: "Other Document" },
              ]}
              required
            />
            <Input
              label="Expiry Date (If applicable)"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <Input
            label="Document Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Aadhaar Card / Degree Certificate"
            required
          />

          <Input
            label="File Name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="e.g. employee_degree.pdf"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Upload & Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* Verification Modal */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        title={`Verify Document: ${selectedDoc?.title ?? ""}`}
        maxWidth="500px"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Reviewing document submitted by <strong>{selectedDoc?.employeeName}</strong>.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Rejection Reason (If rejecting)
            </label>
            <Input
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Illegible scan, name mismatch"
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setIsVerifyModalOpen(false)}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                variant="danger"
                leftIcon={<XCircle className="w-4 h-4" />}
                isLoading={isSubmitting}
                onClick={() => handleVerifyDecision("rejected")}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                leftIcon={<CheckCircle className="w-4 h-4" />}
                isLoading={isSubmitting}
                onClick={() => handleVerifyDecision("verified")}
              >
                Verify & Approve
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
