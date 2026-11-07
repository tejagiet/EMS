"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "../ui/DataTable";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { useRealtime } from "@/src/context/RealtimeContext";
import {
  createAssetAction,
  assignAssetAction,
  returnAssetAction,
  exportAssetsCsvAction,
} from "@/lib/data/assets-actions";
import type { ExtendedAsset } from "@/lib/data/assets";
import type { AssetCategory, AssetCondition } from "@ems/types";
import {
  Plus,
  UserCheck,
  RotateCcw,
  Download,
  AlertTriangle,
} from "lucide-react";

interface OptionItem {
  id: string;
  name: string;
}

interface AssetsClientProps {
  initialAssets: ExtendedAsset[];
  employees: OptionItem[];
  organizationId: string;
  currentUserId: string;
}

export function AssetsClient({
  initialAssets,
  employees,
  organizationId,
  currentUserId,
}: AssetsClientProps) {
  const router = useRouter();
  const [assets, setAssets] = useState<ExtendedAsset[]>(initialAssets);
  const [isNewAssetModalOpen, setIsNewAssetModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<ExtendedAsset | null>(null);

  useEffect(() => {
    setAssets(initialAssets);
  }, [initialAssets]);

  const { broadcastChange, isConnected } = useRealtime({
    table: "assets",
    onUpdate: () => {
      router.refresh();
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // New Asset State
  const [assetTag, setAssetTag] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<AssetCategory>("laptop");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [location, setLocation] = useState("Main Campus IT Store");

  // Assignment State
  const [assigneeId, setAssigneeId] = useState(employees[0]?.id ?? "");
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedReturnDate, setExpectedReturnDate] = useState("");

  // Return State
  const [returnCondition, setReturnCondition] = useState<AssetCondition>("good");
  const [returnedDate, setReturnedDate] = useState(new Date().toISOString().slice(0, 10));
  const [returnNotes, setReturnNotes] = useState("");

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await createAssetAction({
        organizationId,
        assetTag,
        name,
        category,
        model: model || null,
        serialNumber: serialNumber || null,
        purchaseCost: purchaseCost ? parseFloat(purchaseCost) : null,
        location: location || null,
      });

      if (!res.success) {
        setErrorMessage(res.error ?? "Failed to create asset.");
        setIsSubmitting(false);
        return;
      }

      setIsNewAssetModalOpen(false);
      await broadcastChange({
        table: "assets",
        eventType: "INSERT",
        message: `Hardware asset ${assetTag} registered.`,
      });
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await assignAssetAction({
        assetId: selectedAsset.id,
        employeeId: assigneeId,
        assignedDate,
        expectedReturnDate: expectedReturnDate || null,
        assignedBy: currentUserId,
      });

      if (!res.success) {
        setErrorMessage(res.error ?? "Failed to assign asset.");
        setIsSubmitting(false);
        return;
      }

      setIsAssignModalOpen(false);
      await broadcastChange({
        table: "assets",
        eventType: "UPDATE",
        message: `Asset ${selectedAsset.assetTag} assigned to employee.`,
      });
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await returnAssetAction({
        assetId: selectedAsset.id,
        returnCondition,
        returnedDate,
        receivedBy: currentUserId,
        notes: returnNotes || null,
      });

      if (!res.success) {
        setErrorMessage(res.error ?? "Failed to return asset.");
        setIsSubmitting(false);
        return;
      }

      setIsReturnModalOpen(false);
      await broadcastChange({
        table: "assets",
        eventType: "UPDATE",
        message: `Asset ${selectedAsset.assetTag} successfully returned to IT inventory.`,
      });
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCsv = async () => {
    const csvData = await exportAssetsCsvAction(organizationId);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `it_assets_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: DataTableColumn<ExtendedAsset>[] = [
    {
      key: "assetTag",
      header: "Asset Tag",
      render: (a) => (
        <div>
          <p className="font-mono font-semibold text-slate-900">{a.assetTag}</p>
          <p className="text-xs text-slate-500 capitalize">{a.category}</p>
        </div>
      ),
    },
    {
      key: "name",
      header: "Device / Model",
      render: (a) => (
        <div>
          <p className="font-medium text-slate-900">{a.name}</p>
          <p className="text-xs text-slate-500">{a.model ?? "Standard"}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (a) => {
        const variants: Record<string, "success" | "warning" | "info" | "neutral" | "danger"> = {
          available: "success",
          assigned: "info",
          under_maintenance: "warning",
          retired: "neutral",
          lost: "danger",
          damaged: "danger",
        };
        return <Badge variant={variants[a.status] ?? "neutral"}>{a.status.replace("_", " ")}</Badge>;
      },
    },
    {
      key: "condition",
      header: "Condition",
      render: (a) => (
        <span className="capitalize text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {a.condition}
        </span>
      ),
    },
    {
      key: "currentEmployeeName",
      header: "Current Custody",
      render: (a) => (
        <div>
          <p className="text-sm text-slate-900">{a.currentEmployeeName ?? a.assignedToEmployeeName ?? "In IT Inventory"}</p>
          {a.assignedDate && <p className="text-xs text-slate-500">Since {a.assignedDate}</p>}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (a) => (
        <div className="flex justify-end gap-2">
          {a.status === "available" ? (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<UserCheck className="w-4 h-4" />}
              onClick={() => {
                setSelectedAsset(a);
                setErrorMessage("");
                setIsAssignModalOpen(true);
              }}
            >
              Assign
            </Button>
          ) : a.status === "assigned" ? (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={() => {
                setSelectedAsset(a);
                setErrorMessage("");
                setIsReturnModalOpen(true);
              }}
            >
              Return
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">IT Asset Inventory & Allocation</h2>
          <p className="text-xs text-slate-500">Manage hardware lifecycle, assignments, and returns</p>
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
              setAssetTag(`GIET-IT-${Math.floor(1000 + Math.random() * 9000)}`);
              setErrorMessage("");
              setIsNewAssetModalOpen(true);
            }}
          >
            Add Hardware Asset
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={assets}
        keyExtractor={(a) => a.id}
        emptyDescription="No assets registered in the IT inventory."
      />

      {/* Create Asset Modal */}
      <Modal
        isOpen={isNewAssetModalOpen}
        onClose={() => setIsNewAssetModalOpen(false)}
        title="Register New IT Asset"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateAsset} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Asset Tag"
              value={assetTag}
              onChange={(e) => setAssetTag(e.target.value)}
              placeholder="e.g. GIET-IT-001"
              required
            />
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              options={[
                { value: "laptop", label: "Laptop" },
                { value: "desktop", label: "Desktop" },
                { value: "monitor", label: "Monitor" },
                { value: "mobile", label: "Mobile Device" },
                { value: "peripherals", label: "Peripheral" },
                { value: "other", label: "Other" },
              ]}
              required
            />
          </div>

          <Input
            label="Device Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. ThinkPad T14 Gen 4"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. T14G4-AMD"
            />
            <Input
              label="Serial Number"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="e.g. PF-2849X1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Purchase Cost (INR)"
              type="number"
              value={purchaseCost}
              onChange={(e) => setPurchaseCost(e.target.value)}
              placeholder="e.g. 75000"
            />
            <Input
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewAssetModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Save Asset
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Asset Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Asset: ${selectedAsset?.assetTag ?? ""}`}
        maxWidth="500px"
      >
        <form onSubmit={handleAssignAsset} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <p className="text-sm text-slate-600">
            Assigning <strong>{selectedAsset?.name}</strong> ({selectedAsset?.assetTag}) to staff member.
          </p>

          <Select
            label="Assign To Employee"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            options={employees.map((e) => ({ value: e.id, label: e.name }))}
            required
          />

          <Input
            label="Assignment Date"
            type="date"
            value={assignedDate}
            onChange={(e) => setAssignedDate(e.target.value)}
            required
          />

          <Input
            label="Expected Return Date (Optional)"
            type="date"
            value={expectedReturnDate}
            onChange={(e) => setExpectedReturnDate(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAssignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Return Asset Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title={`Return Asset: ${selectedAsset?.assetTag ?? ""}`}
        maxWidth="500px"
      >
        <form onSubmit={handleReturnAsset} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <p className="text-sm text-slate-600">
            Receiving <strong>{selectedAsset?.name}</strong> from{" "}
            <strong>{selectedAsset?.assignedToEmployeeName}</strong>.
          </p>

          <Select
            label="Inspection Condition"
            value={returnCondition}
            onChange={(e) => setReturnCondition(e.target.value as any)}
            options={[
              { value: "excellent", label: "Excellent" },
              { value: "good", label: "Good" },
              { value: "fair", label: "Fair" },
              { value: "poor", label: "Poor" },
            ]}
            required
          />

          <Input
            label="Return Date"
            type="date"
            value={returnedDate}
            onChange={(e) => setReturnedDate(e.target.value)}
            required
          />

          <Input
            label="Inspection Notes"
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
            placeholder="e.g. Scratches on chassis, chargers intact"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReturnModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Confirm Return
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
