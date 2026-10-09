"use client";

import { useState } from "react";
import { DataTable, type DataTableColumn } from "../ui/DataTable";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import {
  submitPerformanceReviewAction,
  exportReviewsCsvAction,
} from "@/lib/data/performance-actions";
import type { ExtendedPerformanceReview, ExtendedPerformanceGoal } from "@/lib/data/performance";
import type { PerformanceCycle } from "@ems/types";
import {
  Star,
  CheckCircle,
  Download,
  AlertTriangle,
} from "lucide-react";

interface PerformanceClientProps {
  cycles: PerformanceCycle[];
  reviews: ExtendedPerformanceReview[];
  goals: ExtendedPerformanceGoal[];
  organizationId: string;
  currentUserId: string;
}

export function PerformanceClient({
  cycles,
  reviews,
  goals,
  organizationId,
  currentUserId,
}: PerformanceClientProps) {
  const [selectedCycleId, setSelectedCycleId] = useState(cycles[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<"reviews" | "goals">("reviews");
  const [selectedReview, setSelectedReview] = useState<ExtendedPerformanceReview | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const [rating, setRating] = useState("4.0");
  const [comments, setComments] = useState("Consistently meets and exceeds expectations.");
  const [reviewStage, setReviewStage] = useState<"self" | "manager" | "acknowledge">("manager");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const filteredReviews = reviews.filter((r) => !selectedCycleId || r.cycleId === selectedCycleId);
  const filteredGoals = goals.filter((g) => !selectedCycleId || g.cycleId === selectedCycleId);

  const handleOpenReview = (rev: ExtendedPerformanceReview, stage: "self" | "manager" | "acknowledge") => {
    setSelectedReview(rev);
    setReviewStage(stage);
    setRating(
      stage === "self"
        ? String(rev.selfRating ?? "4.0")
        : String(rev.managerRating ?? rev.selfRating ?? "4.0")
    );
    setComments(
      stage === "self"
        ? rev.selfComments ?? ""
        : rev.managerComments ?? "Great quarterly performance."
    );
    setErrorMessage("");
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;
    setIsSubmitting(true);
    setErrorMessage("");

    const numRating = parseFloat(rating);
    if (isNaN(numRating) || numRating < 1.0 || numRating > 5.0) {
      setErrorMessage("Rating must be between 1.0 and 5.0.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload: {
        reviewId: string;
        actorId: string;
        stage: "self" | "manager" | "acknowledge";
        rating?: number | null;
        comments?: string | null;
      } = {
        reviewId: selectedReview.id,
        actorId: currentUserId,
        stage: reviewStage,
        comments,
      };

      if (reviewStage !== "acknowledge") {
        payload.rating = numRating;
      }

      const res = await submitPerformanceReviewAction(payload);

      if (!res.success) {
        setErrorMessage(res.error ?? "Failed to submit review.");
        setIsSubmitting(false);
        return;
      }

      setIsReviewModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCsv = async () => {
    const csvData = await exportReviewsCsvAction(organizationId, selectedCycleId || undefined);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `performance_reviews_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reviewColumns: DataTableColumn<ExtendedPerformanceReview>[] = [
    {
      key: "employeeName",
      header: "Employee",
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-900">{r.employeeName}</p>
          <p className="text-xs text-slate-500">Reviewer: {r.reviewerName}</p>
        </div>
      ),
    },
    {
      key: "selfRating",
      header: "Self Rating",
      render: (r) => (
        <span className="text-sm font-medium text-slate-700">
          {r.selfRating != null ? `${r.selfRating.toFixed(1)} / 5.0` : "Pending"}
        </span>
      ),
    },
    {
      key: "managerRating",
      header: "Manager Rating",
      render: (r) => (
        <span className="text-sm font-medium text-slate-700">
          {r.managerRating != null ? `${r.managerRating.toFixed(1)} / 5.0` : "Pending"}
        </span>
      ),
    },
    {
      key: "finalRating",
      header: "Final Score",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="font-bold text-slate-900">
            {r.finalRating != null ? r.finalRating.toFixed(1) : "-"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Appraisal Status",
      render: (r) => {
        const variants: Record<string, "success" | "warning" | "info" | "neutral"> = {
          completed: "success",
          awaiting_acknowledgement: "warning",
          manager_review: "warning",
          self_assessment: "info",
          draft: "neutral",
        };
        return <Badge variant={variants[r.status] ?? "neutral"}>{r.status.replace("_", " ")}</Badge>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (r) => (
        <div className="flex justify-end gap-2">
          {r.status === "self_assessment" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenReview(r, "self")}
            >
              Self Review
            </Button>
          )}
          {r.status === "manager_review" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenReview(r, "manager")}
            >
              Evaluate
            </Button>
          )}
          {r.status === "awaiting_acknowledgement" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenReview(r, "acknowledge")}
            >
              Acknowledge
            </Button>
          )}
          {r.isLocked && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Locked
            </span>
          )}
        </div>
      ),
    },
  ];

  const goalColumns: DataTableColumn<ExtendedPerformanceGoal>[] = [
    {
      key: "title",
      header: "Goal Title",
      render: (g) => (
        <div>
          <p className="font-medium text-slate-900">{g.title}</p>
          <p className="text-xs text-slate-500 capitalize">{g.category ?? "OKR"}</p>
        </div>
      ),
    },
    {
      key: "weight",
      header: "Weight (%)",
      render: (g) => <span className="text-sm font-semibold text-slate-700">{g.weight}%</span>,
    },
    {
      key: "targetValue",
      header: "Target / Progress",
      render: (g) => (
        <span className="text-xs text-slate-600">
          {g.currentValue ?? "0"} / {g.targetValue ?? "N/A"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (g) => {
        const variants: Record<string, "success" | "warning" | "info" | "neutral"> = {
          achieved: "success",
          in_progress: "info",
          not_started: "neutral",
          partially_achieved: "warning",
          missed: "warning",
        };
        return <Badge variant={variants[g.status] ?? "neutral"}>{g.status.replace("_", " ")}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Performance & Appraisals</h2>
            <p className="text-xs text-slate-500">Cycles, measurable OKRs, and appraisal reviews</p>
          </div>
          {cycles.length > 0 && (
            <div className="w-48">
              <Select
                value={selectedCycleId}
                onChange={(e) => setSelectedCycleId(e.target.value)}
                options={cycles.map((c) => ({ value: c.id, label: c.title }))}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCsv}
          >
            Export CSV
          </Button>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === "reviews" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
              }`}
            >
              Appraisals ({filteredReviews.length})
            </button>
            <button
              onClick={() => setActiveTab("goals")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === "goals" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
              }`}
            >
              Goals & OKRs ({filteredGoals.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {activeTab === "reviews" ? (
        <DataTable
          columns={reviewColumns}
          data={filteredReviews}
          keyExtractor={(r) => r.id}
          emptyDescription="No appraisal records found for this cycle."
        />
      ) : (
        <DataTable
          columns={goalColumns}
          data={filteredGoals}
          keyExtractor={(g) => g.id}
          emptyDescription="No goals registered for this cycle."
        />
      )}

      {/* Review Submission Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={
          reviewStage === "self"
            ? "Submit Self Assessment"
            : reviewStage === "manager"
            ? `Manager Appraisal: ${selectedReview?.employeeName ?? ""}`
            : `Acknowledge Final Review: ${selectedReview?.employeeName ?? ""}`
        }
        maxWidth="550px"
      >
        <form onSubmit={handleSubmitReview} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {reviewStage !== "acknowledge" ? (
            <>
              <Input
                label="Rating Score (1.0 to 5.0)"
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                required
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Evaluation Feedback & Observations
                </label>
                <textarea
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </>
          ) : (
            <div className="p-4 bg-slate-50 rounded-lg space-y-2 text-sm text-slate-700">
              <p>
                <strong>Final Rating:</strong> {selectedReview?.finalRating ?? selectedReview?.managerRating} / 5.0
              </p>
              <p>
                <strong>Manager Feedback:</strong> {selectedReview?.managerComments ?? "Approved"}
              </p>
              <p className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                Acknowledging this appraisal confirms you have reviewed the feedback. The appraisal will be permanently locked.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReviewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              {reviewStage === "acknowledge" ? "Acknowledge & Lock" : "Submit Evaluation"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
