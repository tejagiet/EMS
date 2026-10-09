"use client";

import { useState } from "react";
import { DataTable, type DataTableColumn } from "../ui/DataTable";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import {
  createCandidateAction,
  transitionCandidateStageAction,
  scheduleInterviewAction,
  recordInterviewFeedbackAction,
  createJobOfferAction,
  processJobOfferDecisionAction,
  hireCandidateAction,
  exportRecruitmentCsvAction,
  getCandidateDetailsAction,
} from "@/lib/data/recruitment-actions";
import type {
  Candidate,
  CandidateStage,
  CandidateStageHistoryItem,
  Interview,
  JobOffer,
  JobPosting,
} from "@ems/types";
import {
  Plus,
  ArrowRight,
  Calendar,
  Award,
  UserCheck,
  Download,
  AlertCircle,
  Eye,
  CheckCircle,
} from "lucide-react";

interface BranchOption {
  id: string;
  name: string;
}

interface CandidatePipelineClientProps {
  candidates: Candidate[];
  jobPostings: JobPosting[];
  branches: BranchOption[];
}

export function CandidatePipelineClient({
  candidates,
  jobPostings,
  branches,
}: CandidatePipelineClientProps) {
  const [activeStage, setActiveStage] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // New candidate application modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [jobPostingId, setJobPostingId] = useState(jobPostings[0]?.id ?? "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState("direct");
  const [savingCandidate, setSavingCandidate] = useState(false);
  const [createError, setCreateError] = useState("");

  // Candidate Inspector modal
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [history, setHistory] = useState<CandidateStageHistoryItem[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [offers, setOffers] = useState<JobOffer[]>([]);

  // Transition Stage modal
  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const [targetStage, setTargetStage] = useState<CandidateStage>("screening");
  const [transitionNotes, setTransitionNotes] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState("");

  // Schedule Interview modal
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewType, setInterviewType] = useState<Interview["interviewType"]>("technical");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("45");
  const [interviewerName, setInterviewerName] = useState("Dr. K. Srinivas (HOD AI)");
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState("");

  // Interview Feedback modal
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState("");
  const [interviewRating, setInterviewRating] = useState("4");
  const [interviewFeedback, setInterviewFeedback] = useState("");
  const [interviewRecommendation, setInterviewRecommendation] = useState<Interview["recommendation"]>("hire");
  const [savingFeedback, setSavingFeedback] = useState(false);

  // Job Offer modal
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offeredSalary, setOfferedSalary] = useState("65000");
  const [joiningDate, setJoiningDate] = useState("2026-11-01");
  const [offerNotes, setOfferNotes] = useState("");
  const [savingOffer, setSavingOffer] = useState(false);
  const [offerError, setOfferError] = useState("");

  // Handoff to Onboarding modal
  const [handoffModalOpen, setHandoffModalOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id ?? "");
  const [handoffNotes, setHandoffNotes] = useState("");
  const [hiring, setHiring] = useState(false);
  const [hireError, setHireError] = useState("");
  const [hiredSuccess, setHiredSuccess] = useState<{ code: string } | null>(null);

  const openCreateCandidate = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setNotes("");
    setSource("direct");
    setJobPostingId(jobPostings[0]?.id ?? "");
    setCreateError("");
    setCreateModalOpen(true);
  };

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCandidate(true);
    setCreateError("");

    const formData = new FormData();
    formData.append("jobPostingId", jobPostingId);
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("email", email);
    if (phone) formData.append("phone", phone);
    if (notes) formData.append("notes", notes);
    formData.append("source", source);

    const res = await createCandidateAction(formData);
    setSavingCandidate(false);

    if (!res.success) {
      setCreateError(res.error ?? "Failed to register candidate.");
    } else {
      setCreateModalOpen(false);
    }
  };

  const handleInspect = async (cand: Candidate) => {
    setSelectedCandidate(cand);
    setInspectModalOpen(true);
    setHiredSuccess(null);

    try {
      const details = await getCandidateDetailsAction(cand.id);
      setHistory(details.history);
      setInterviews(details.interviews);
      setOffers(details.offers);
      if (details.candidate) setSelectedCandidate(details.candidate);
    } catch {
      setHistory([]);
      setInterviews([]);
      setOffers([]);
    }
  };

  const refreshDetails = async (candId: string) => {
    const details = await getCandidateDetailsAction(candId);
    if (details.candidate) setSelectedCandidate(details.candidate);
    setHistory(details.history);
    setInterviews(details.interviews);
    setOffers(details.offers);
  };

  const handleTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    setTransitioning(true);
    setTransitionError("");

    const formData = new FormData();
    formData.append("candidateId", selectedCandidate.id);
    formData.append("toStage", targetStage);
    if (transitionNotes) formData.append("notes", transitionNotes);

    const res = await transitionCandidateStageAction(formData);
    setTransitioning(false);

    if (!res.success) {
      setTransitionError(res.error ?? "Invalid transition.");
    } else {
      setTransitionModalOpen(false);
      setTransitionNotes("");
      await refreshDetails(selectedCandidate.id);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    setScheduling(true);
    setScheduleError("");

    const formData = new FormData();
    formData.append("candidateId", selectedCandidate.id);
    formData.append("jobPostingId", selectedCandidate.jobPostingId);
    formData.append("interviewType", interviewType);
    formData.append("scheduledAt", new Date(scheduledAt).toISOString());
    formData.append("durationMinutes", durationMinutes);
    formData.append("interviewerName", interviewerName);

    const res = await scheduleInterviewAction(formData);
    setScheduling(false);

    if (!res.success) {
      setScheduleError(res.error ?? "Failed to schedule interview.");
    } else {
      setInterviewModalOpen(false);
      await refreshDetails(selectedCandidate.id);
    }
  };

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !selectedInterviewId) return;
    setSavingFeedback(true);

    const formData = new FormData();
    formData.append("interviewId", selectedInterviewId);
    formData.append("rating", interviewRating);
    formData.append("feedback", interviewFeedback);
    if (interviewRecommendation) formData.append("recommendation", interviewRecommendation);
    formData.append("status", "completed");

    const res = await recordInterviewFeedbackAction(formData);
    setSavingFeedback(false);

    if (res.success) {
      setFeedbackModalOpen(false);
      await refreshDetails(selectedCandidate.id);
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    setSavingOffer(true);
    setOfferError("");

    const formData = new FormData();
    formData.append("candidateId", selectedCandidate.id);
    formData.append("jobPostingId", selectedCandidate.jobPostingId);
    formData.append("offeredSalary", offeredSalary);
    formData.append("joiningDate", joiningDate);
    if (offerNotes) formData.append("notes", offerNotes);

    const res = await createJobOfferAction(formData);
    setSavingOffer(false);

    if (!res.success) {
      setOfferError(res.error ?? "Failed to create offer.");
    } else {
      setOfferModalOpen(false);
      await refreshDetails(selectedCandidate.id);
    }
  };

  const handleOfferDecision = async (offerId: string, status: "accepted" | "rejected") => {
    const formData = new FormData();
    formData.append("offerId", offerId);
    formData.append("status", status);
    formData.append("notes", `Candidate status updated to ${status}`);

    const res = await processJobOfferDecisionAction(formData);
    if (res.success && selectedCandidate) {
      await refreshDetails(selectedCandidate.id);
    }
  };

  const handleHireHandoff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    setHiring(true);
    setHireError("");

    const formData = new FormData();
    formData.append("candidateId", selectedCandidate.id);
    if (selectedBranchId) formData.append("branchId", selectedBranchId);
    if (handoffNotes) formData.append("notes", handoffNotes);

    const res = await hireCandidateAction(formData);
    setHiring(false);

    if (!res.success) {
      setHireError(res.error ?? "Hiring handoff failed.");
    } else {
      const data = res.data as { employeeCode: string } | undefined;
      setHiredSuccess({ code: data?.employeeCode ?? "EMP" });
      setHandoffModalOpen(false);
      await refreshDetails(selectedCandidate.id);
    }
  };

  const handleExportCsv = async () => {
    try {
      const csv = await exportRecruitmentCsvAction();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `candidates_pipeline_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert("Failed to export candidates report.");
    }
  };

  const stageVariant = (stage: CandidateStage) => {
    switch (stage) {
      case "hired":
        return "success";
      case "offer":
        return "secondary";
      case "interview":
        return "warning";
      case "screening":
        return "neutral";
      case "rejected":
        return "danger";
      default:
        return "neutral";
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchesStage = activeStage === "all" || c.stage === activeStage;
    const matchesSearch =
      searchQuery.trim() === "" ||
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.jobTitle && c.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStage && matchesSearch;
  });

  const columns: DataTableColumn<Candidate>[] = [
    {
      key: "fullName",
      header: "Candidate Name",
      sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.fullName}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{row.email}</div>
        </div>
      ),
    },
    {
      key: "jobTitle",
      header: "Applied Position",
      sortable: true,
      render: (row) => (
        <div>
          <span style={{ fontWeight: 500 }}>{row.jobTitle ?? "General"}</span>
          {row.jobCode && (
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: 6 }}>
              ({row.jobCode})
            </span>
          )}
        </div>
      ),
    },
    {
      key: "stage",
      header: "Pipeline Stage",
      sortable: true,
      render: (row) => (
        <Badge
          label={row.stage.toUpperCase()}
          variant={stageVariant(row.stage)}
          size="sm"
        />
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (row) => (
        <span style={{ fontSize: "0.82rem", textTransform: "capitalize" }}>{row.source}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Applied Date",
      sortable: true,
      render: (row) => (
        <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
          {new Date(row.createdAt).toLocaleDateString("en-GB")}
        </span>
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
          onClick={() => { void handleInspect(row); }}
          leftIcon={<Eye size={14} />}
        >
          View Profile
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Controls Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>Candidate Pipeline</h3>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
            Track candidates through screening, interviews, offer letters, and onboarding.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="ghost" onClick={() => { void handleExportCsv(); }} leftIcon={<Download size={15} />}>
            Export Pipeline
          </Button>
          <Button variant="primary" onClick={openCreateCandidate} leftIcon={<Plus size={15} />}>
            Add Candidate
          </Button>
        </div>
      </div>

      {/* Stage Filters and Search */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", "applied", "screening", "interview", "offer", "hired", "rejected"].map((stage) => (
            <button
              key={stage}
              onClick={() => { setActiveStage(stage); }}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: activeStage === stage ? "var(--primary)" : "var(--surface)",
                color: activeStage === stage ? "#ffffff" : "var(--foreground)",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {stage}
            </button>
          ))}
        </div>
        <div style={{ width: 240 }}>
          <Input
            placeholder="Search candidate name or email..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); }}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredCandidates}
        keyExtractor={(item) => item.id}
        emptyTitle="No Candidates in this Stage"
        emptyDescription="Click 'Add Candidate' to register a new applicant into the screening funnel."
      />

      {/* Create Candidate Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => { setCreateModalOpen(false); }}
        title="Register Candidate Application"
        maxWidth="540px"
      >
        <form onSubmit={handleCreateCandidate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {createError && (
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
              <AlertCircle size={16} /> {createError}
            </div>
          )}

          <Select
            label="Applied Position"
            value={jobPostingId}
            onChange={(e) => { setJobPostingId(e.target.value); }}
            required
            options={jobPostings.map((j) => ({
              value: j.id,
              label: `${j.title} (${j.code})`,
            }))}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); }}
              required
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); }}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); }}
              required
            />
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); }}
            />
          </div>

          <Input
            label="Application Notes / Source"
            value={notes}
            onChange={(e) => { setNotes(e.target.value); }}
            placeholder="e.g. Referred via campus placement portal"
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <Button variant="ghost" type="button" onClick={() => { setCreateModalOpen(false); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={savingCandidate}>
              Register Candidate
            </Button>
          </div>
        </form>
      </Modal>

      {/* Candidate Inspector Modal */}
      {selectedCandidate && (
        <Modal
          isOpen={inspectModalOpen}
          onClose={() => { setInspectModalOpen(false); }}
          title={`Candidate Profile: ${selectedCandidate.fullName}`}
          maxWidth="820px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Hired Success Banner */}
            {hiredSuccess && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 6,
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#10b981",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <CheckCircle size={20} />
                Successfully hired and onboarded as new employee ({hiredSuccess.code})!
              </div>
            )}

            {/* Candidate Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
                padding: 16,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: "0.85rem",
              }}
            >
              <div>
                <span style={{ color: "var(--text-muted)", display: "block" }}>Applied Position</span>
                <span style={{ fontWeight: 600 }}>{selectedCandidate.jobTitle ?? "Standard"}</span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block" }}>Email</span>
                <span style={{ fontWeight: 600 }}>{selectedCandidate.email}</span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block" }}>Phone</span>
                <span style={{ fontWeight: 600 }}>{selectedCandidate.phone ?? "—"}</span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block" }}>Current Stage</span>
                <div>
                  <Badge
                    label={selectedCandidate.stage.toUpperCase()}
                    variant={stageVariant(selectedCandidate.stage)}
                    size="sm"
                  />
                </div>
              </div>
            </div>

            {/* Quick Action Progression Toolbar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                Pipeline actions for {selectedCandidate.stage.toUpperCase()} stage:
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {selectedCandidate.stage !== "hired" && selectedCandidate.stage !== "rejected" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      if (selectedCandidate.stage === "applied") setTargetStage("screening");
                      else if (selectedCandidate.stage === "screening") setTargetStage("interview");
                      else if (selectedCandidate.stage === "interview") setTargetStage("offer");
                      setTransitionError("");
                      setTransitionModalOpen(true);
                    }}
                    leftIcon={<ArrowRight size={14} />}
                  >
                    Progress Stage
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setScheduledAt(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
                    setScheduleError("");
                    setInterviewModalOpen(true);
                  }}
                  leftIcon={<Calendar size={14} />}
                >
                  Schedule Interview
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setOfferError("");
                    setOfferModalOpen(true);
                  }}
                  leftIcon={<Award size={14} />}
                >
                  Create Offer
                </Button>

                {/* Handoff Button if Offer Accepted */}
                {selectedCandidate.stage === "offer" &&
                  offers.some((o) => o.status === "accepted") && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setHireError("");
                        setHandoffModalOpen(true);
                      }}
                      leftIcon={<UserCheck size={14} />}
                    >
                      Handoff to Onboarding
                    </Button>
                  )}
              </div>
            </div>

            {/* Interviews Section */}
            <div>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 8 }}>
                Scheduled Interviews ({interviews.length})
              </h4>
              {interviews.length === 0 ? (
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                  No interviews scheduled yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {interviews.map((intv) => (
                    <div
                      key={intv.id}
                      style={{
                        padding: "10px 14px",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                          {intv.interviewType.toUpperCase()} Interview with {intv.interviewerName}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          {new Date(intv.scheduledAt).toLocaleString("en-GB")} · {intv.durationMinutes} mins · {intv.status}
                        </div>
                        {intv.feedback && (
                          <div style={{ fontSize: "0.8rem", color: "var(--foreground)", marginTop: 4 }}>
                            <strong>Feedback:</strong> {intv.feedback} ({intv.recommendation ?? "N/A"})
                          </div>
                        )}
                      </div>
                      <div>
                        {intv.status === "scheduled" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedInterviewId(intv.id);
                              setInterviewFeedback("");
                              setFeedbackModalOpen(true);
                            }}
                          >
                            Submit Feedback
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Offers Section */}
            <div>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 8 }}>
                Job Offers ({offers.length})
              </h4>
              {offers.length === 0 ? (
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                  No formal job offers issued yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {offers.map((off) => (
                    <div
                      key={off.id}
                      style={{
                        padding: "10px 14px",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#10b981" }}>
                          ₹{off.offeredSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })} / month
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          Target Joining: {off.joiningDate} · Status: <strong>{off.status.toUpperCase()}</strong>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {off.status === "draft" && (
                          <Button size="sm" variant="secondary" onClick={() => { void handleOfferDecision(off.id, "accepted"); }}>
                            Mark Accepted
                          </Button>
                        )}
                        {off.status === "accepted" && (
                          <Badge label="ACCEPTED" variant="success" size="sm" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pipeline Stage History */}
            {history.length > 0 && (
              <div>
                <h4 style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: 8, color: "var(--text-muted)" }}>
                  Recruitment Stage Timeline
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.8rem" }}>
                  {history.map((h) => (
                    <div
                      key={h.id}
                      style={{
                        padding: "6px 12px",
                        background: "var(--surface)",
                        borderRadius: 4,
                        border: "1px solid var(--border)",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>
                        Stage changed to <strong>{h.toStage.toUpperCase()}</strong>
                        {h.notes && <span style={{ color: "var(--text-muted)" }}> — {h.notes}</span>}
                      </span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                        {new Date(h.createdAt).toLocaleString("en-GB")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Stage Progression Modal */}
      <Modal
        isOpen={transitionModalOpen}
        onClose={() => { setTransitionModalOpen(false); }}
        title="Progress Candidate Stage"
        maxWidth="460px"
      >
        <form onSubmit={handleTransition} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {transitionError && (
            <div style={{ padding: "8px 12px", borderRadius: 4, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "0.82rem" }}>
              {transitionError}
            </div>
          )}

          <Select
            label="Target Stage"
            value={targetStage}
            onChange={(e) => { setTargetStage(e.target.value as CandidateStage); }}
            options={[
              { value: "screening", label: "Screening" },
              { value: "interview", label: "Interview" },
              { value: "offer", label: "Offer" },
              { value: "rejected", label: "Rejected" },
            ]}
          />

          <Input
            label="Evaluation Notes"
            value={transitionNotes}
            onChange={(e) => { setTransitionNotes(e.target.value); }}
            placeholder="e.g. Passed initial technical screening round"
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
            <Button variant="ghost" type="button" onClick={() => { setTransitionModalOpen(false); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={transitioning}>
              Confirm Transition
            </Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={interviewModalOpen}
        onClose={() => { setInterviewModalOpen(false); }}
        title="Schedule Evaluation Interview"
        maxWidth="500px"
      >
        <form onSubmit={handleScheduleInterview} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {scheduleError && (
            <div style={{ padding: "8px 12px", borderRadius: 4, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "0.82rem" }}>
              {scheduleError}
            </div>
          )}

          <Select
            label="Interview Type"
            value={interviewType}
            onChange={(e) => { setInterviewType(e.target.value as Interview["interviewType"]); }}
            options={[
              { value: "screening", label: "Initial Screening" },
              { value: "technical", label: "Technical Competence" },
              { value: "hr", label: "HR & Culture" },
              { value: "management", label: "Management & Leadership" },
            ]}
          />

          <Input
            label="Interview Date & Time"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => { setScheduledAt(e.target.value); }}
            required
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input
              label="Duration (minutes)"
              type="number"
              value={durationMinutes}
              onChange={(e) => { setDurationMinutes(e.target.value); }}
              required
            />
            <Input
              label="Assigned Interviewer"
              value={interviewerName}
              onChange={(e) => { setInterviewerName(e.target.value); }}
              required
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
            <Button variant="ghost" type="button" onClick={() => { setInterviewModalOpen(false); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={scheduling}>
              Schedule Interview
            </Button>
          </div>
        </form>
      </Modal>

      {/* Interview Feedback Modal */}
      <Modal
        isOpen={feedbackModalOpen}
        onClose={() => { setFeedbackModalOpen(false); }}
        title="Record Interview Evaluation"
        maxWidth="480px"
      >
        <form onSubmit={handleSaveFeedback} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select
              label="Rating (1 - 5)"
              value={interviewRating}
              onChange={(e) => { setInterviewRating(e.target.value); }}
              options={[
                { value: "5", label: "5 - Exceptional" },
                { value: "4", label: "4 - Strong" },
                { value: "3", label: "3 - Meets Standard" },
                { value: "2", label: "2 - Below Standard" },
                { value: "1", label: "1 - Unsatisfactory" },
              ]}
            />
            <Select
              label="Hiring Recommendation"
              value={interviewRecommendation ?? "hire"}
              onChange={(e) => { setInterviewRecommendation(e.target.value as Interview["recommendation"]); }}
              options={[
                { value: "strong_hire", label: "Strong Hire" },
                { value: "hire", label: "Hire" },
                { value: "undecided", label: "Undecided" },
                { value: "reject", label: "Reject" },
              ]}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
              Feedback Comments
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
              value={interviewFeedback}
              onChange={(e) => { setInterviewFeedback(e.target.value); }}
              placeholder="Candidate demonstrated strong knowledge of AI models and deep learning..."
              required
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
            <Button variant="ghost" type="button" onClick={() => { setFeedbackModalOpen(false); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={savingFeedback}>
              Save Evaluation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Job Offer Modal */}
      <Modal
        isOpen={offerModalOpen}
        onClose={() => { setOfferModalOpen(false); }}
        title="Issue Formal Job Offer"
        maxWidth="480px"
      >
        <form onSubmit={handleCreateOffer} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {offerError && (
            <div style={{ padding: "8px 12px", borderRadius: 4, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "0.82rem" }}>
              {offerError}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input
              label="Offered Monthly Salary (₹)"
              type="number"
              step="0.01"
              value={offeredSalary}
              onChange={(e) => { setOfferedSalary(e.target.value); }}
              required
            />
            <Input
              label="Proposed Joining Date"
              type="date"
              value={joiningDate}
              onChange={(e) => { setJoiningDate(e.target.value); }}
              required
            />
          </div>

          <Input
            label="Offer Notes / Conditions"
            value={offerNotes}
            onChange={(e) => { setOfferNotes(e.target.value); }}
            placeholder="Subject to verification of academic credentials"
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
            <Button variant="ghost" type="button" onClick={() => { setOfferModalOpen(false); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={savingOffer}>
              Generate Offer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Handoff to Onboarding Modal */}
      <Modal
        isOpen={handoffModalOpen}
        onClose={() => { setHandoffModalOpen(false); }}
        title="Complete Hiring & Onboarding Handoff"
        maxWidth="480px"
      >
        <form onSubmit={handleHireHandoff} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {hireError && (
            <div style={{ padding: "8px 12px", borderRadius: 4, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "0.82rem" }}>
              {hireError}
            </div>
          )}

          <div
            style={{
              padding: "10px 14px",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              borderRadius: 6,
              fontSize: "0.82rem",
            }}
          >
            Candidate accepted offer. Executing this step will atomically:
            <ul style={{ margin: "6px 0 0", paddingLeft: 16 }}>
              <li>Verify email uniqueness across active employees</li>
              <li>Provision new Employee profile with unique employee code</li>
              <li>Establish starting Salary Structure from accepted offer compensation</li>
              <li>Mark candidate status as <strong>HIRED</strong> and log audit trail</li>
            </ul>
          </div>

          <Select
            label="Assigned Campus / Branch"
            value={selectedBranchId}
            onChange={(e) => { setSelectedBranchId(e.target.value); }}
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
          />

          <Input
            label="Handoff Notes"
            value={handoffNotes}
            onChange={(e) => { setHandoffNotes(e.target.value); }}
            placeholder="Completed verification of background and educational certificates."
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
            <Button variant="ghost" type="button" onClick={() => { setHandoffModalOpen(false); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={hiring}>
              Confirm Handoff & Hire
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
