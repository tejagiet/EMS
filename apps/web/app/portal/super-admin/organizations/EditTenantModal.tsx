"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateTenantAction } from "@/lib/data/tenant-actions";
import { Building2, CheckCircle2, AlertCircle } from "lucide-react";

interface EditTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  org: Record<string, unknown> | null;
  onSuccess?: () => void;
}

export function EditTenantModal({
  isOpen,
  onClose,
  org,
  onSuccess,
}: EditTenantModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (org) {
      setName(String(org.name ?? ""));
      setCode(String(org.code ?? ""));
      setSlug(String(org.slug ?? ""));
      setEmail(String(org.email ?? ""));
      setPhone(String(org.phone ?? ""));
      setAddress(String(org.address ?? ""));
      setIsActive(Boolean(org.isActive ?? org.is_active ?? true));
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [org]);

  if (!org) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage("Institution / Organization Name is required.");
      return;
    }
    if (!code.trim()) {
      setErrorMessage("Tenant Code is required.");
      return;
    }
    if (!slug.trim()) {
      setErrorMessage("Tenant URL Slug is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateTenantAction(String(org.id), {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        slug: slug.trim().toLowerCase(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        isActive,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to update tenant.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage("Tenant updated successfully!");
      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 1000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      title={`Edit Tenant: ${org.name}`}
      description="Update tenant boundary configuration, contact details, and institutional status."
      maxWidth="600px"
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

        <Input
          label="Institution / Organization Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          required
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input
            label="Tenant Code *"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={isSubmitting}
            required
          />
          <Input
            label="URL Slug *"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            disabled={isSubmitting}
            required
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input
            label="Administrative Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />
          <Input
            label="Contact Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <Input
          label="Physical Address / Campus City"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={isSubmitting}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
          <input
            type="checkbox"
            id="edit-tenant-is-active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={isSubmitting}
            style={{ width: 18, height: 18, cursor: "pointer" }}
          />
          <label htmlFor="edit-tenant-is-active" style={{ fontSize: "0.875rem", cursor: "pointer", fontWeight: 500 }}>
            Operational / Active Status
          </label>
        </div>

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
            onClick={onClose}
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
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
