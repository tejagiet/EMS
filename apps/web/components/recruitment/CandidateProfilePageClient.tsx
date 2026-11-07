"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  ArrowLeft,
  User,
  Briefcase,
  MapPin,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Award,
  ArrowRight,
  UserCheck,
  AlertCircle,
  FileText,
  Lock,
} from "lucide-react";
import type {
  Candidate,
  CandidateStage,
  CandidateStageHistoryItem,
  Interview,
  JobOffer,
  JobPosting,
} from "@ems/types";
import {
  transitionCandidateStageAction,
  scheduleInterviewAction,
  recordInterviewFeedbackAction,
  createJobOfferAction,
  processJobOfferDecisionAction,
  hireCandidateAction,
} from "@/lib/data/recruitment-actions";
import { parseCandidateDetails, type CandidateEmployeeDetails } from "@/lib/data/candidate-details";
import { useRealtime } from "@/src/context/RealtimeContext";

interface BranchOption {
  id: string;
  name: string;
}

interface CandidateProfilePageClientProps {
  candidate: Candidate;
  history: CandidateStageHistoryItem[];
  interviews: Interview[];
  offers: JobOffer[];
  jobPostings: JobPosting[];
  branches: BranchOption[];
  canWrite: boolean;
}

export function CandidateProfilePageClient({
  candidate: initialCandidate,
  history: initialHistory,
  interviews: initialInterviews,
  offers: initialOffers,
  jobPostings,
  branches,
  canWrite,
}: CandidateProfilePageClientProps) {
  const router = useRouter();
  const { broadcastChange } = useRealtime();

  const [candidate, setCandidate] = useState<Candidate>(initialCandidate);
  const [history, setHistory] = useState<CandidateStageHistoryItem[]>(initialHistory);
  const [interviews, setInterviews] = useState<Interview[]>(initialInterviews);
  const [offers, setOffers] = useState<JobOffer[]>(initialOffers);

  const [activeTab, setActiveTab] = useState<string>("details");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Modals state
  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const [targetStage, setTargetStage] = useState<CandidateStage>("screening");
  const [transitionNotes, setTransitionNotes] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState("");

  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewType, setInterviewType] = useState("technical");
  const [scheduledAt, setScheduledAt] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [durationMinutes, setDurationMinutes] = useState("45");
  const [interviewerName, setInterviewerName] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState("");

  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offeredSalary, setOfferedSalary] = useState("25000");
  const [joiningDate, setJoiningDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [offerNotes, setOfferNotes] = useState("");
  const [savingOffer, setSavingOffer] = useState(false);
  const [offerError, setOfferError] = useState("");

  const [handoffModalOpen, setHandoffModalOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id ?? "");
  const [handoffNotes, setHandoffNotes] = useState("");
  const [hiring, setHiring] = useState(false);
  const [hireError, setHireError] = useState("");
  const [hiredSuccess, setHiredSuccess] = useState<{ code: string } | null>(null);

  const parsedDetails: CandidateEmployeeDetails = parseCandidateDetails(candidate.notes);
  const currentPassword = parsedDetails.setupPassword || "Welcome@EMS2026";

  const getStageBadge = (stage: CandidateStage) => {
    switch (stage) {
      case "applied":
        return <Badge label="APPLIED" variant="neutral" />;
      case "screening":
        return <Badge label="SCREENING" variant="warning" />;
      case "interview":
        return <Badge label="INTERVIEW" variant="primary" />;
      case "offer":
        return <Badge label="OFFER EXTENDED" variant="success" />;
      case "hired":
        return <Badge label="HIRED · ONBOARDED" variant="success" />;
      case "rejected":
        return <Badge label="REJECTED" variant="danger" />;
      default:
        return <Badge label={String(stage).toUpperCase()} variant="neutral" />;
    }
  };

  const handleTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    setTransitioning(true);
    setTransitionError("");

    const formData = new FormData();
    formData.append("candidateId", candidate.id);
    formData.append("toStage", targetStage);
    if (transitionNotes) formData.append("notes", transitionNotes);

    const res = await transitionCandidateStageAction(formData);
    setTransitioning(false);

    if (!res.success) {
      setTransitionError(res.error ?? "Invalid transition.");
    } else {
      setTransitionModalOpen(false);
      setTransitionNotes("");
      setCandidate((prev) => ({ ...prev, stage: targetStage }));
      await broadcastChange({
        table: "candidates",
        eventType: "UPDATE",
        message: `${candidate.fullName} moved to stage ${targetStage.toUpperCase()}.`,
      });
      router.refresh();
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    setScheduling(true);
    setScheduleError("");

    const formData = new FormData();
    formData.append("candidateId", candidate.id);
    formData.append("jobPostingId", candidate.jobPostingId);
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
      await broadcastChange({
        table: "candidates",
        eventType: "UPDATE",
        message: `Interview scheduled for ${candidate.fullName}.`,
      });
      router.refresh();
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    setSavingOffer(true);
    setOfferError("");

    const formData = new FormData();
    formData.append("candidateId", candidate.id);
    formData.append("jobPostingId", candidate.jobPostingId);
    formData.append("offeredSalary", offeredSalary);
    formData.append("joiningDate", joiningDate);
    if (offerNotes) formData.append("notes", offerNotes);

    const res = await createJobOfferAction(formData);
    setSavingOffer(false);

    if (!res.success) {
      setOfferError(res.error ?? "Failed to create offer.");
    } else {
      setOfferModalOpen(false);
      setCandidate((prev) => ({ ...prev, stage: "offer" }));
      await broadcastChange({
        table: "job_offers",
        eventType: "INSERT",
        message: `Job offer generated for ${candidate.fullName}.`,
      });
      router.refresh();
    }
  };

  const handleOfferDecision = async (offerId: string, status: "accepted" | "rejected") => {
    if (!canWrite) return;
    const formData = new FormData();
    formData.append("offerId", offerId);
    formData.append("status", status);
    formData.append("notes", `Decision marked ${status}`);

    const res = await processJobOfferDecisionAction(formData);
    if (res.success) {
      setOffers((prev) =>
        prev.map((o) => (o.id === offerId ? { ...o, status } : o))
      );
      await broadcastChange({
        table: "job_offers",
        eventType: "UPDATE",
        message: `Job offer for ${candidate.fullName} marked ${status.toUpperCase()}.`,
      });
      router.refresh();
    }
  };

  const handleHireHandoff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    setHiring(true);
    setHireError("");

    const formData = new FormData();
    formData.append("candidateId", candidate.id);
    if (selectedBranchId) formData.append("branchId", selectedBranchId);
    if (handoffNotes) formData.append("notes", handoffNotes);

    const res = await hireCandidateAction(formData);
    setHiring(false);

    if (!res.success) {
      setHireError(res.error ?? "Hiring handoff failed.");
    } else {
      const data = res.data as { employeeCode: string } | undefined;
      setHiredSuccess({ code: data?.employeeCode ?? "EMP" });
      setCandidate((prev) => ({ ...prev, stage: "hired" }));
      setHandoffModalOpen(false);
      await broadcastChange({
        table: "employees",
        eventType: "INSERT",
        message: `${candidate.fullName} onboarded as employee ${data?.employeeCode ?? ""}.`,
      });
      router.refresh();
    }
  };

  const hasAcceptedOffer = offers.some((o) => o.status === "accepted");

  const tabs = [
    { id: "details", label: "Complete Employee Onboarding Details" },
    { id: "history", label: "Stage History & Timeline" },
    { id: "interviews", label: `Interviews (${interviews.length})` },
    { id: "offers", label: `Job Offers (${offers.length})` },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top Navigation & Action Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <Link href="/portal/recruitment/candidates" style={{ textDecoration: "none" }}>
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} style={{ marginRight: 6 }} /> Back to Candidate Pipeline
          </Button>
        </Link>

        {canWrite && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {candidate.stage !== "hired" && candidate.stage !== "rejected" && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setTargetStage(
                      candidate.stage === "applied"
                        ? "screening"
                        : candidate.stage === "screening"
                        ? "interview"
                        : "offer"
                    );
                    setTransitionModalOpen(true);
                  }}
                >
                  <ArrowRight size={14} style={{ marginRight: 6 }} /> Advance Stage
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setInterviewModalOpen(true)}
                >
                  <Calendar size={14} style={{ marginRight: 6 }} /> Schedule Interview
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setOfferModalOpen(true)}
                >
                  <Award size={14} style={{ marginRight: 6 }} /> Issue Job Offer
                </Button>
              </>
            )}

            {hasAcceptedOffer && candidate.stage !== "hired" && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setHandoffModalOpen(true)}
              >
                <UserCheck size={15} style={{ marginRight: 6 }} /> Convert to Employee
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Candidate Banner Card */}
      <Card>
        <CardContent style={{ padding: "24px 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: "rgba(30, 58, 138, 0.12)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  flexShrink: 0,
                  border: "2px solid rgba(30, 58, 138, 0.2)",
                }}
              >
                {`${candidate.firstName[0] ?? ""}${candidate.lastName[0] ?? ""}`.toUpperCase()}
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "var(--foreground)" }}>
                    {candidate.fullName}
                  </h1>
                  {getStageBadge(candidate.stage)}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 6, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Briefcase size={14} /> Applied: {candidate.jobTitle || "Job Requisition"}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Mail size={14} /> {candidate.email}
                  </span>
                  {candidate.phone && (
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Phone size={14} /> {candidate.phone}
                    </span>
                  )}
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Calendar size={14} /> Applied on {new Date(candidate.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {candidate.stage === "hired" && (
              <div
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <CheckCircle2 size={18} />
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  Active Employee Profile Provisioned
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {hiredSuccess && (
        <div
          className="alert alert-success"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <div>
            <strong>Candidate Successfully Hired!</strong>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
              Assigned Employee Code: <strong>{hiredSuccess.code}</strong>. All details and credentials have been transferred.
            </p>
          </div>
          <Link href="/portal/hr/employees">
            <Button size="sm" variant="primary">
              View in Employee Directory →
            </Button>
          </Link>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 18px",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid var(--primary)" : "2px solid transparent",
              color: activeTab === tab.id ? "var(--primary)" : "var(--text-muted)",
              fontWeight: activeTab === tab.id ? 600 : 500,
              fontSize: "0.9rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Complete Employee Onboarding Details */}
      {activeTab === "details" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Card: Personal & Contact */}
          <Card>
            <CardHeader>
              <CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <User size={18} style={{ color: "var(--primary)" }} /> Personal & Identity Details
              </CardTitle>
              <CardDescription>Primary candidate demographics and civil coordinates</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>First Name</span>
                  <strong style={{ fontSize: "0.95rem" }}>{candidate.firstName}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Last Name</span>
                  <strong style={{ fontSize: "0.95rem" }}>{candidate.lastName}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Email Address</span>
                  <strong style={{ fontSize: "0.95rem" }}>{candidate.email}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Phone Number</span>
                  <strong style={{ fontSize: "0.95rem" }}>{candidate.phone || "Not specified"}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Date of Birth</span>
                  <strong style={{ fontSize: "0.95rem" }}>{parsedDetails.dateOfBirth || "Not specified"}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Gender</span>
                  <strong style={{ fontSize: "0.95rem", textTransform: "capitalize" }}>{parsedDetails.gender || "Not specified"}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Marital Status</span>
                  <strong style={{ fontSize: "0.95rem", textTransform: "capitalize" }}>{parsedDetails.maritalStatus || "Not specified"}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Blood Group</span>
                  <strong style={{ fontSize: "0.95rem" }}>{parsedDetails.bloodGroup || "Not specified"}</strong>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Address & Emergency Contacts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            <Card>
              <CardHeader>
                <CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MapPin size={18} style={{ color: "var(--primary)" }} /> Residential Address Coordinates
                </CardTitle>
                <CardDescription>Permanent home location coordinates</CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "0.9rem" }}>
                  <div>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Street Address</span>
                    <strong>{parsedDetails.addressLine1 || "Not specified"} {parsedDetails.addressLine2 || ""}</strong>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>City</span>
                      <strong>{parsedDetails.city || "Not specified"}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>State</span>
                      <strong>{parsedDetails.state || "Not specified"}</strong>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Postal Code</span>
                      <strong>{parsedDetails.postalCode || "Not specified"}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Country</span>
                      <strong>{parsedDetails.country || "India"}</strong>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Phone size={18} style={{ color: "var(--primary)" }} /> Emergency Contact Information
                </CardTitle>
                <CardDescription>Designated family / kin emergency responder</CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Emergency Contact Name</span>
                    <strong>{parsedDetails.emergencyContactName || "Not specified"}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Relationship</span>
                    <strong>{parsedDetails.emergencyContactRelationship || "Not specified"}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Emergency Phone</span>
                    <strong>{parsedDetails.emergencyContactPhone || "Not specified"}</strong>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Card: Statutory & Professional Qualifications */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            <Card>
              <CardHeader>
                <CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ShieldCheck size={18} style={{ color: "var(--primary)" }} /> Statutory & Identification
                </CardTitle>
                <CardDescription>Government identity numbers for tax and compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>PAN Number</span>
                    <code style={{ fontSize: "0.95rem", fontWeight: 600 }}>{parsedDetails.panNumber || "—"}</code>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Aadhaar Number</span>
                    <code style={{ fontSize: "0.95rem", fontWeight: 600 }}>{parsedDetails.aadhaarNumber || "—"}</code>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Award size={18} style={{ color: "var(--primary)" }} /> Qualifications & Experience
                </CardTitle>
                <CardDescription>Academic degrees and prior employment history</CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "0.88rem" }}>
                  <div>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Highest Degree</span>
                    <strong>{parsedDetails.highestQualification || "Not specified"}</strong> ({parsedDetails.university || "University"} - {parsedDetails.yearOfPassing || ""})
                  </div>
                  <div>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Prior Experience</span>
                    <strong>{parsedDetails.experienceYears || "0"} years</strong> at {parsedDetails.currentCompany || "N/A"} ({parsedDetails.currentDesignation || ""})
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Expected Salary</span>
                      <strong>₹{parsedDetails.expectedSalary || "Negotiable"} / mo</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Notice Period</span>
                      <strong>{parsedDetails.noticePeriodDays || "30"} days</strong>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Card: Portal Access & Credentials (Admin Visible) */}
          <Card>
            <CardHeader>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Lock size={18} style={{ color: "var(--primary)" }} /> Onboarding Portal Credentials
                  </CardTitle>
                  <CardDescription>Pre-configured login password for the candidate's employee portal account.</CardDescription>
                </div>
                <Badge label="Administrator Visible" variant="warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div
                style={{
                  padding: 16,
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--table-stripe, #f8fafc)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 14,
                }}
              >
                <div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Work / Login Email</span>
                  <code style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--primary)" }}>{candidate.email}</code>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Setup Password</span>
                    <code
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: 6,
                        backgroundColor: "var(--card-bg, #ffffff)",
                        border: "1px solid var(--border)",
                        letterSpacing: showPassword ? "normal" : "0.2em",
                      }}
                    >
                      {showPassword ? currentPassword : "••••••••••••"}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(currentPassword);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    title="Copy password"
                  >
                    {copied ? <Check size={14} style={{ color: "var(--success)" }} /> : <Copy size={14} />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Stage Progression & Timeline */}
      {activeTab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle>Recruitment Stage Progression History</CardTitle>
            <CardDescription>Authoritative audit log of recruitment lifecycle transitions</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p style={{ color: "var(--text-muted)", margin: 0 }}>No stage transitions recorded yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {history.map((h, i) => (
                  <div
                    key={h.id || i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--table-stripe, #f8fafc)",
                    }}
                  >
                    <Clock size={16} style={{ color: "var(--primary)", marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong>
                          {h.fromStage ? `${h.fromStage.toUpperCase()} → ` : ""}
                          {h.toStage.toUpperCase()}
                        </strong>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          {new Date(h.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {h.notes && (
                        <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          {h.notes}
                        </p>
                      )}
                      {h.changedByName && (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          Action by: {h.changedByName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Interviews & Evaluations */}
      {activeTab === "interviews" && (
        <Card>
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <CardTitle>Scheduled & Completed Interviews</CardTitle>
                <CardDescription>Technical, HR, and cultural evaluation rounds</CardDescription>
              </div>
              {canWrite && candidate.stage !== "hired" && (
                <Button size="sm" variant="secondary" onClick={() => setInterviewModalOpen(true)}>
                  <Calendar size={14} style={{ marginRight: 6 }} /> Schedule Round
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {interviews.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)" }}>
                No interviews scheduled yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {interviews.map((iv) => (
                  <div
                    key={iv.id}
                    style={{
                      padding: 16,
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--card-bg)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <strong style={{ fontSize: "1rem", textTransform: "capitalize" }}>
                        {iv.interviewType} Interview
                      </strong>
                      <Badge
                        label={iv.status.toUpperCase()}
                        variant={iv.status === "completed" ? "success" : "warning"}
                        size="sm"
                      />
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", gap: 16 }}>
                      <span>Scheduled: {new Date(iv.scheduledAt).toLocaleString()}</span>
                      <span>Duration: {iv.durationMinutes} mins</span>
                      <span>Interviewer: {iv.interviewerName}</span>
                    </div>
                    {iv.feedback && (
                      <div style={{ marginTop: 10, padding: 10, borderRadius: 6, backgroundColor: "var(--table-stripe)", fontSize: "0.85rem" }}>
                        <strong>Feedback:</strong> {iv.feedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Job Offers */}
      {activeTab === "offers" && (
        <Card>
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <CardTitle>Formal Job Offers & Decisions</CardTitle>
                <CardDescription>Compensation proposals, joining agreements, and acceptance tracking</CardDescription>
              </div>
              {canWrite && candidate.stage !== "hired" && (
                <Button size="sm" variant="secondary" onClick={() => setOfferModalOpen(true)}>
                  <Award size={14} style={{ marginRight: 6 }} /> Generate New Offer
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {offers.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)" }}>
                No job offers generated yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {offers.map((off) => (
                  <div
                    key={off.id}
                    style={{
                      padding: 16,
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--card-bg)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <strong style={{ fontSize: "1.1rem", color: "var(--primary)" }}>
                          ₹{Number(off.offeredSalary).toLocaleString()} / month
                        </strong>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginLeft: 8 }}>
                          (Proposed Joining: {new Date(off.joiningDate).toLocaleDateString()})
                        </span>
                      </div>
                      <Badge
                        label={off.status.toUpperCase()}
                        variant={off.status === "accepted" ? "success" : off.status === "rejected" ? "danger" : "warning"}
                      />
                    </div>

                    {off.notes && (
                      <p style={{ margin: "6px 0 12px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        {off.notes}
                      </p>
                    )}

                    {canWrite && (off.status === "draft" || off.status === "sent") && (
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleOfferDecision(off.id, "accepted")}
                        >
                          Mark as Candidate Accepted
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOfferDecision(off.id, "rejected")}
                        >
                          Mark as Rejected
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Advance Stage Modal */}
      {transitionModalOpen && (
        <Modal
          isOpen={transitionModalOpen}
          onClose={() => setTransitionModalOpen(false)}
          title="Advance Recruitment Stage"
          description={`Update pipeline stage for ${candidate.fullName}`}
        >
          <form onSubmit={handleTransition} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {transitionError && <div className="alert alert-error">{transitionError}</div>}
            <Select
              label="Select Next Stage"
              value={targetStage}
              onChange={(e) => setTargetStage(e.target.value as CandidateStage)}
              options={[
                { value: "applied", label: "Applied" },
                { value: "screening", label: "Screening" },
                { value: "interview", label: "Interview" },
                { value: "offer", label: "Offer" },
                { value: "rejected", label: "Rejected" },
              ]}
            />
            <Input
              label="Stage Notes"
              value={transitionNotes}
              onChange={(e) => setTransitionNotes(e.target.value)}
              placeholder="e.g. Cleared technical screening interview"
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <Button variant="secondary" onClick={() => setTransitionModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={transitioning}>
                {transitioning ? "Updating..." : "Confirm Stage Update"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Schedule Interview Modal */}
      {interviewModalOpen && (
        <Modal
          isOpen={interviewModalOpen}
          onClose={() => setInterviewModalOpen(false)}
          title="Schedule Interview Round"
          description={`Coordinate evaluation round for ${candidate.fullName}`}
        >
          <form onSubmit={handleScheduleInterview} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {scheduleError && <div className="alert alert-error">{scheduleError}</div>}
            <Select
              label="Interview Category"
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              options={[
                { value: "screening", label: "Initial Screening" },
                { value: "technical", label: "Technical & Coding" },
                { value: "hr", label: "HR & Fit Assessment" },
                { value: "management", label: "Institutional Management" },
              ]}
            />
            <Input
              label="Date & Time"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
            <Input
              label="Interviewer Name"
              value={interviewerName}
              onChange={(e) => setInterviewerName(e.target.value)}
              placeholder="e.g. Dr. K. Rao (Head of Dept)"
              required
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <Button variant="secondary" onClick={() => setInterviewModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={scheduling}>
                {scheduling ? "Scheduling..." : "Confirm Schedule"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Issue Job Offer Modal */}
      {offerModalOpen && (
        <Modal
          isOpen={offerModalOpen}
          onClose={() => setOfferModalOpen(false)}
          title="Issue Formal Job Offer"
          description={`Submit institutional appointment proposal for ${candidate.fullName}`}
        >
          <form onSubmit={handleCreateOffer} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {offerError && <div className="alert alert-error">{offerError}</div>}
            <Input
              label="Offered Monthly Salary (₹)"
              type="number"
              value={offeredSalary}
              onChange={(e) => setOfferedSalary(e.target.value)}
              required
            />
            <Input
              label="Proposed Date of Joining"
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              required
            />
            <Input
              label="Offer Terms / Conditions"
              value={offerNotes}
              onChange={(e) => setOfferNotes(e.target.value)}
              placeholder="e.g. Subject to verification of educational certificates"
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <Button variant="secondary" onClick={() => setOfferModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={savingOffer}>
                {savingOffer ? "Generating..." : "Generate Offer"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Convert to Employee Modal */}
      {handoffModalOpen && (
        <Modal
          isOpen={handoffModalOpen}
          onClose={() => setHandoffModalOpen(false)}
          title="Convert Candidate to Official Employee"
          description={`Execute full onboarding handoff for ${candidate.fullName}`}
        >
          <form onSubmit={handleHireHandoff} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {hireError && <div className="alert alert-error">{hireError}</div>}
            <div className="alert alert-info" style={{ fontSize: "0.85rem", margin: 0 }}>
              All application details (Personal, Address, Emergency Contacts, Statutory IDs, and Portal Setup Password) will be transferred directly and end-to-end to the active employee record.
            </div>
            <Select
              label="Assigned Campus Branch"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
            />
            <Input
              label="Onboarding Notes"
              value={handoffNotes}
              onChange={(e) => setHandoffNotes(e.target.value)}
              placeholder="e.g. Verified original degree documents"
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <Button variant="secondary" onClick={() => setHandoffModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={hiring}>
                {hiring ? "Onboarding..." : "Confirm & Hire Employee"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
