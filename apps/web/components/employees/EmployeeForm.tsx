"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { createEmployeeAction, updateEmployeeAction } from "@/lib/data/employee-actions";
import type { OrgMetadataOptions } from "@/lib/data/employees";
import type { Employee } from "@ems/types";
import { User, Briefcase, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";

interface EmployeeFormProps {
  mode: "create" | "edit";
  initialData?: Employee;
  metadata: OrgMetadataOptions;
}

export function EmployeeForm({ mode, initialData, metadata }: EmployeeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      if (mode === "create") {
        const res = await createEmployeeAction(null, formData);
        if (!res.success) {
          setError(res.error ?? "Failed to save employee.");
          if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        } else {
          setSuccess(true);
          const newId = res.data?.employeeId;
          if (newId) {
            router.push(`/portal/hr/employees/${newId}`);
          } else {
            router.push("/portal/hr/employees");
          }
        }
      } else {
        formData.set("id", initialData!.id);
        const res = await updateEmployeeAction(null, formData);
        if (!res.success) {
          setError(res.error ?? "Failed to update employee.");
          if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        } else {
          setSuccess(true);
          router.push(`/portal/hr/employees/${initialData!.id}`);
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            background: "rgba(239, 68, 68, 0.1)",
            color: "var(--danger)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: "0.875rem",
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            background: "rgba(16, 185, 129, 0.1)",
            color: "var(--success)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: "0.875rem",
          }}
        >
          <CheckCircle2 size={18} />
          <span>Employee record saved successfully! Redirecting...</span>
        </div>
      )}

      {/* Section 1: Personal Information */}
      <Card>
        <CardHeader>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <User size={18} style={{ color: "var(--primary)" }} />
            <CardTitle>Personal Information</CardTitle>
          </div>
          <CardDescription>Primary identity and personal contact credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <Input
              label="First Name *"
              name="firstName"
              defaultValue={initialData?.firstName ?? ""}
              placeholder="e.g. Rahul"
              required
              error={fieldErrors.firstName}
            />
            <Input
              label="Last Name *"
              name="lastName"
              defaultValue={initialData?.lastName ?? ""}
              placeholder="e.g. Verma"
              required
              error={fieldErrors.lastName}
            />
            <Input
              label="Work Email"
              name="workEmail"
              type="email"
              defaultValue={initialData?.workEmail ?? ""}
              placeholder="rahul.verma@organization.com"
              error={fieldErrors.workEmail}
            />
            <Input
              label="Contact Number"
              name="contactNumber"
              defaultValue={initialData?.contactNumber ?? ""}
              placeholder="+919876543210"
              error={fieldErrors.contactNumber}
            />
            <Input
              label="Office Work Phone"
              name="workPhone"
              defaultValue={initialData?.workPhone ?? ""}
              placeholder="Ext 204"
              error={fieldErrors.workPhone}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Employment Details */}
      <Card>
        <CardHeader>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Briefcase size={18} style={{ color: "var(--primary)" }} />
            <CardTitle>Employment & Hierarchy Placement</CardTitle>
          </div>
          <CardDescription>Organization code, department, branch, designation, and reporting manager</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <Input
              label="Employee Code"
              name="employeeCode"
              defaultValue={initialData?.employeeCode ?? ""}
              placeholder="Leave blank to auto-generate (e.g. EMP-0001)"
              disabled={mode === "edit"}
              helperText={mode === "create" ? "If left empty, a sequence code is generated automatically." : undefined}
              error={fieldErrors.employeeCode}
            />

            <Select
              label="Department"
              name="departmentId"
              defaultValue={initialData?.departmentId ?? ""}
              options={[
                { value: "", label: "— Select Department —" },
                ...metadata.departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
              ]}
              error={fieldErrors.departmentId}
            />

            <Select
              label="Branch Location"
              name="branchId"
              defaultValue={initialData?.branchId ?? ""}
              options={[
                { value: "", label: "— Select Branch —" },
                ...metadata.branches.map((b) => ({ value: b.id, label: `${b.name} (${b.code})` })),
              ]}
              error={fieldErrors.branchId}
            />

            <Select
              label="Designation / Role"
              name="designationId"
              defaultValue={initialData?.designationId ?? ""}
              options={[
                { value: "", label: "— Select Designation —" },
                ...metadata.designations.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
              ]}
              error={fieldErrors.designationId}
            />

            <Select
              label="Reporting Manager"
              name="reportingManagerId"
              defaultValue={initialData?.reportingManagerId ?? ""}
              options={[
                { value: "", label: "— None / Self-Directed —" },
                ...metadata.managers
                  .filter((m) => mode === "create" || m.id !== initialData?.id)
                  .map((m) => ({ value: m.id, label: `${m.name} (${m.code})` })),
              ]}
              error={fieldErrors.reportingManagerId}
            />

            <Select
              label="Employment Classification *"
              name="employmentType"
              defaultValue={initialData?.employmentType ?? "full_time"}
              options={[
                { value: "full_time", label: "Full Time Regular" },
                { value: "probation", label: "Probationary Period" },
                { value: "contract", label: "Fixed-Term Contract" },
                { value: "intern", label: "Industrial Training / Intern" },
                { value: "part_time", label: "Part Time" },
              ]}
              required
              error={fieldErrors.employmentType}
            />

            <Select
              label="Employment Status *"
              name="employmentStatus"
              defaultValue={initialData?.employmentStatus ?? "active"}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive / Suspended" },
                { value: "on_leave", label: "Extended Leave" },
                { value: "terminated", label: "Terminated" },
                { value: "resigned", label: "Resigned" },
              ]}
              required
              error={fieldErrors.employmentStatus}
            />

            <Input
              label="Date of Joining *"
              name="dateOfJoining"
              type="date"
              defaultValue={initialData?.dateOfJoining ?? new Date().toISOString().slice(0, 10)}
              required
              error={fieldErrors.dateOfJoining}
            />

            <Input
              label="Confirmation Date"
              name="dateOfConfirmation"
              type="date"
              defaultValue={initialData?.dateOfConfirmation ?? ""}
              error={fieldErrors.dateOfConfirmation}
            />

            <Input
              label="Notice Period (Days)"
              name="noticePeriodDays"
              type="number"
              defaultValue={String(initialData?.noticePeriodDays ?? 30)}
              error={fieldErrors.noticePeriodDays}
            />

            <Input
              label="Work Location / Desk"
              name="workLocation"
              defaultValue={initialData?.workLocation ?? ""}
              placeholder="e.g. Block B, Lab 3"
              error={fieldErrors.workLocation}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Emergency Contacts & Address */}
      <Card>
        <CardHeader>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MapPin size={18} style={{ color: "var(--primary)" }} />
            <CardTitle>Emergency Contact & Residential Address</CardTitle>
          </div>
          <CardDescription>Emergency personnel contacts and home address coordinates</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <Input
              label="Emergency Contact Name"
              name="emergencyContactName"
              defaultValue={initialData?.emergencyContactName ?? ""}
              placeholder="e.g. Sunita Verma"
              error={fieldErrors.emergencyContactName}
            />

            <Input
              label="Relationship"
              name="emergencyContactRelationship"
              defaultValue={initialData?.emergencyContactRelationship ?? ""}
              placeholder="e.g. Spouse / Parent"
              error={fieldErrors.emergencyContactRelationship}
            />

            <Input
              label="Emergency Phone"
              name="emergencyContactPhone"
              defaultValue={initialData?.emergencyContactPhone ?? ""}
              placeholder="+919876543211"
              error={fieldErrors.emergencyContactPhone}
            />

            <Input
              label="Address Line 1"
              name="addressLine1"
              defaultValue={initialData?.addressLine1 ?? ""}
              placeholder="House/Flat No., Street"
              error={fieldErrors.addressLine1}
            />

            <Input
              label="Address Line 2"
              name="addressLine2"
              defaultValue={initialData?.addressLine2 ?? ""}
              placeholder="Area, Landmark"
              error={fieldErrors.addressLine2}
            />

            <Input
              label="City"
              name="city"
              defaultValue={initialData?.city ?? ""}
              placeholder="e.g. Rajahmundry"
              error={fieldErrors.city}
            />

            <Input
              label="State"
              name="state"
              defaultValue={initialData?.state ?? ""}
              placeholder="e.g. Andhra Pradesh"
              error={fieldErrors.state}
            />

            <Input
              label="Postal Code"
              name="postalCode"
              defaultValue={initialData?.postalCode ?? ""}
              placeholder="e.g. 533296"
              error={fieldErrors.postalCode}
            />

            <Input
              label="Country"
              name="country"
              defaultValue={initialData?.country ?? "India"}
              placeholder="India"
              error={fieldErrors.country}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 6, color: "var(--text)" }}>
              Administrative Notes
            </label>
            <textarea
              name="notes"
              defaultValue={initialData?.notes ?? ""}
              placeholder="Restricted internal HR notes regarding this personnel..."
              rows={3}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                background: "var(--background)",
                color: "var(--text)",
                fontSize: "0.875rem",
                fontFamily: "inherit",
              }}
            />
          </div>
        </CardContent>
        <CardFooter style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isPending}
          >
            {mode === "create" ? "Save & Create Employee" : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
