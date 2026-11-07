"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { provisionTenantAction, type ProvisionTenantResult } from "@/lib/data/tenant-actions";
import { Building2, CheckCircle2, AlertCircle } from "lucide-react";

interface ProvisionTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (org: NonNullable<ProvisionTenantResult["organization"]>) => void;
}

export function ProvisionTenantModal({
  isOpen,
  onClose,
  onSuccess,
}: ProvisionTenantModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [defaultBranchName, setDefaultBranchName] = useState("Main Campus");
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-generate code & slug when typing organization name if not manually modified
  const handleNameChange = (val: string) => {
    setName(val);
    if (!code || code === generateCode(name)) {
      setCode(generateCode(val));
    }
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(val));
    }
  };

  const generateCode = (str: string) => {
    const words = str.trim().split(/\s+/);
    if (words.length > 1) {
      return words
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 8);
    }
    return str.slice(0, 6).toUpperCase();
  };

  const generateSlug = (str: string) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage("Institution / Organization Name is required.");
      return;
    }
    if (!code.trim()) {
      setErrorMessage("Tenant Code is required (e.g. GIETP).");
      return;
    }
    if (!slug.trim()) {
      setErrorMessage("Tenant URL Slug is required (e.g. giet-polytechnic).");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await provisionTenantAction({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        slug: slug.trim().toLowerCase(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        defaultBranchName: defaultBranchName.trim() || "Main Campus",
        isActive,
      });

      if (!res.success || !res.organization) {
        setErrorMessage(res.error || "Failed to provision tenant.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(`Tenant "${res.organization.name}" provisioned successfully!`);
      if (onSuccess) {
        onSuccess(res.organization);
      }

      // Close modal after brief feedback
      setTimeout(() => {
        setIsSubmitting(false);
        resetForm();
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setCode("");
    setSlug("");
    setEmail("");
    setPhone("");
    setAddress("");
    setDefaultBranchName("Main Campus");
    setIsActive(true);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) {
          resetForm();
          onClose();
        }
      }}
      title="Provision New Tenant Institution"
      description="Create a completely isolated multi-tenant organization boundary with institutional hierarchy and default campus."
      maxWidth="620px"
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {errorMessage && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 6,
              background: "#fee2e2",
              border: "1px solid #f87171",
              color: "#b91c1c",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 6,
              background: "#dcfce7",
              border: "1px solid #86efac",
              color: "#15803d",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Institution Name */}
        <Input
          label="Institution / Organization Name *"
          placeholder="e.g. GIET Polytechnic College"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          disabled={isSubmitting}
          required
        />

        {/* Code & Slug */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input
            label="Tenant Code *"
            placeholder="e.g. GIETP"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={isSubmitting}
            helperText="Short uppercase identifier for employee codes and badges"
            required
          />
          <Input
            label="URL Slug *"
            placeholder="e.g. giet-polytechnic"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            disabled={isSubmitting}
            helperText="Lowercase subdomain/routing slug"
            required
          />
        </div>

        {/* Contact Email & Phone */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input
            label="Administrative Email"
            type="email"
            placeholder="admin@institution.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            label="Contact Phone"
            type="tel"
            placeholder="+91 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Default Branch & Address */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input
            label="Default Initial Branch / Campus"
            placeholder="Main Campus"
            value={defaultBranchName}
            onChange={(e) => setDefaultBranchName(e.target.value)}
            disabled={isSubmitting}
            helperText="Initial branch created for department placement"
          />
          <Input
            label="Physical Address / Campus City"
            placeholder="Rajahmundry, AP"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Status Checkbox */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
          <input
            type="checkbox"
            id="tenant-is-active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={isSubmitting}
            style={{ width: 18, height: 18, cursor: "pointer" }}
          />
          <label htmlFor="tenant-is-active" style={{ fontSize: "0.875rem", cursor: "pointer", fontWeight: 500 }}>
            Activate tenant instance immediately upon provisioning
          </label>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 12,
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid var(--card-border, #e2e8f0)",
          }}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<Building2 size={16} />}
          >
            Provision Institution
          </Button>
        </div>
      </form>
    </Modal>
  );
}
