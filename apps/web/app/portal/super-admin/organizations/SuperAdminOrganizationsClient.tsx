"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Building2, Plus, CheckCircle2, XCircle, RefreshCw, AlertCircle } from "lucide-react";
import { SuperAdminOrgsTable } from "../SuperAdminOrgsTable";
import { ProvisionTenantModal } from "./ProvisionTenantModal";
import { EditTenantModal } from "./EditTenantModal";
import { deleteTenantAction } from "@/lib/data/tenant-actions";
import { getSuperAdminAnalytics, type OrgItem } from "@/lib/data/analytics";

interface SuperAdminOrganizationsClientProps {
  initialData?: {
    totalOrgs: number;
    activeOrgs: number;
    inactiveOrgs: number;
    organizations: OrgItem[];
  };
}

export function SuperAdminOrganizationsClient({
  initialData,
}: SuperAdminOrganizationsClientProps) {
  const [data, setData] = useState({
    totalOrgs: initialData?.totalOrgs ?? 0,
    activeOrgs: initialData?.activeOrgs ?? 0,
    inactiveOrgs: initialData?.inactiveOrgs ?? 0,
    organizations: initialData?.organizations ?? [],
  });

  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Record<string, unknown> | null>(null);
  const [deletingOrg, setDeletingOrg] = useState<Record<string, unknown> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    setActionError(null);
    try {
      const fresh = await getSuperAdminAnalytics();
      setData({
        totalOrgs: fresh.totalOrgs,
        activeOrgs: fresh.activeOrgs,
        inactiveOrgs: fresh.inactiveOrgs,
        organizations: fresh.organizations,
      });
    } catch (err) {
      console.error("[SuperAdminOrganizations] Failed to reload analytics:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deletingOrg) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      const orgId = String(deletingOrg.id);
      const res = await deleteTenantAction(orgId);
      if (!res.success) {
        setActionError(res.error || "Failed to delete tenant institution.");
        setIsDeleting(false);
        return;
      }

      // Optimistically remove from state
      setData((prev) => {
        const remaining = prev.organizations.filter((o) => o.id !== orgId);
        const activeCount = remaining.filter((o) => o.isActive ?? o.is_active).length;
        return {
          totalOrgs: remaining.length,
          activeOrgs: activeCount,
          inactiveOrgs: remaining.length - activeCount,
          organizations: remaining,
        };
      });

      setDeletingOrg(null);
      setIsDeleting(false);
      refreshData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to delete tenant.");
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      refreshData();
    }

    const handleOrgRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<OrgItem>;
      if (customEvent.detail && customEvent.detail.id) {
        setData((prev) => {
          const exists = prev.organizations.some((o) => o.id === customEvent.detail.id);
          const updatedOrgs = exists
            ? prev.organizations.map((o) => (o.id === customEvent.detail.id ? customEvent.detail : o))
            : [customEvent.detail, ...prev.organizations];
          const activeCount = updatedOrgs.filter((o) => o.isActive ?? o.is_active).length;
          return {
            totalOrgs: updatedOrgs.length,
            activeOrgs: activeCount,
            inactiveOrgs: updatedOrgs.length - activeCount,
            organizations: updatedOrgs,
          };
        });
      } else {
        refreshData();
      }
    };

    const handleOrgDeleted = (event: Event) => {
      const customEvent = event as CustomEvent<{ id: string }>;
      if (customEvent.detail && customEvent.detail.id) {
        const deletedId = customEvent.detail.id;
        setData((prev) => {
          const remaining = prev.organizations.filter((o) => o.id !== deletedId);
          const activeCount = remaining.filter((o) => o.isActive ?? o.is_active).length;
          return {
            totalOrgs: remaining.length,
            activeOrgs: activeCount,
            inactiveOrgs: remaining.length - activeCount,
            organizations: remaining,
          };
        });
      }
    };

    window.addEventListener("ems:refresh-organizations", handleOrgRefresh);
    window.addEventListener("ems:tenant-deleted", handleOrgDeleted);
    window.addEventListener("ems:refresh", refreshData);

    return () => {
      window.removeEventListener("ems:refresh-organizations", handleOrgRefresh);
      window.removeEventListener("ems:tenant-deleted", handleOrgDeleted);
      window.removeEventListener("ems:refresh", refreshData);
    };
  }, [initialData, refreshData]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top Banner Error if any */}
      {actionError && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            background: "#fee2e2",
            border: "1px solid #f87171",
            color: "#b91c1c",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={18} />
            <span>{actionError}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setActionError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Header section with active action buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "var(--primary)",
              margin: 0,
            }}
          >
            Institutions & Tenants
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.9rem",
              marginTop: 4,
            }}
          >
            Provisioned institutions, educational departments, and enterprise tenant boundaries.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshData}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw size={14} />}
            title="Refresh organizations list"
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsProvisionModalOpen(true)}
            leftIcon={<Plus size={16} />}
            style={{
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
              fontWeight: 600,
            }}
          >
            + Add / Provision Tenant
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        <MetricCard
          label="Total Tenants"
          value={data.totalOrgs}
          subtitle="Provisioned in database"
          icon={<Building2 size={20} />}
        />
        <MetricCard
          label="Active Tenants"
          value={data.activeOrgs}
          subtitle="Operational instances"
          icon={<CheckCircle2 size={20} color="#10b981" />}
        />
        <MetricCard
          label="Inactive / Suspended"
          value={data.inactiveOrgs}
          subtitle="Awaiting authorization"
          icon={<XCircle size={20} color="#ef4444" />}
        />
      </div>

      {/* Directory Table */}
      <Card>
        <CardHeader>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <div>
              <CardTitle>Platform Organization Directory</CardTitle>
              <CardDescription>
                Registered educational institutions and corporate multi-tenant entities
              </CardDescription>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {data.organizations.length} institution{data.organizations.length === 1 ? "" : "s"} listed
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsProvisionModalOpen(true)}
                leftIcon={<Plus size={14} />}
              >
                Add Tenant
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SuperAdminOrgsTable
            data={data.organizations as unknown as Record<string, unknown>[]}
            onEdit={(org) => setEditingOrg(org)}
            onDelete={(org) => setDeletingOrg(org)}
            onAdd={() => setIsProvisionModalOpen(true)}
          />
        </CardContent>
      </Card>

      {/* Provision Tenant Modal Dialog */}
      <ProvisionTenantModal
        isOpen={isProvisionModalOpen}
        onClose={() => setIsProvisionModalOpen(false)}
        onSuccess={() => {
          refreshData();
        }}
      />

      {/* Edit Tenant Modal Dialog */}
      <EditTenantModal
        isOpen={Boolean(editingOrg)}
        onClose={() => setEditingOrg(null)}
        org={editingOrg}
        onSuccess={() => {
          refreshData();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingOrg)}
        title="Delete Tenant Institution"
        description={`Are you sure you want to delete "${deletingOrg?.name}" (${deletingOrg?.code})? This will permanently delete the organization boundary and all associated configuration, branches, and memberships.`}
        confirmLabel="Delete Tenant"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (!isDeleting) setDeletingOrg(null);
        }}
      />
    </div>
  );
}
