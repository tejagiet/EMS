"use client";

import { useState } from "react";
import { DataTable, type DataTableColumn } from "../ui/DataTable";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { upsertSalaryStructureAction } from "@/lib/data/payroll-actions";
import type { SalaryStructure, SalaryComponentItem } from "@ems/types";
import { Plus, Edit2, AlertCircle, Trash2 } from "lucide-react";

interface EmployeeOption {
  id: string;
  fullName: string;
  employeeCode: string;
}

interface SalaryStructuresClientProps {
  structures: SalaryStructure[];
  employees: EmployeeOption[];
}

export function SalaryStructuresClient({
  structures,
  employees,
}: SalaryStructuresClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<SalaryStructure | null>(null);

  const [employeeId, setEmployeeId] = useState("");
  const [baseSalary, setBaseSalary] = useState("45000");
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [effectiveTo, setEffectiveTo] = useState("");
  const [paymentFrequency, setPaymentFrequency] = useState("monthly");
  const [notes, setNotes] = useState("");

  const [allowances, setAllowances] = useState<SalaryComponentItem[]>([
    { code: "HRA", name: "House Rent Allowance", amount: 15000, type: "fixed" },
    { code: "SPECIAL", name: "Special Allowance", amount: 10000, type: "fixed" },
  ]);

  const [deductions, setDeductions] = useState<SalaryComponentItem[]>([
    { code: "PF", name: "Provident Fund", amount: 5400, type: "fixed" },
    { code: "PT", name: "Professional Tax", amount: 200, type: "fixed" },
  ]);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const openCreateModal = () => {
    setEditingStructure(null);
    setEmployeeId(employees[0]?.id ?? "");
    setBaseSalary("45000");
    setEffectiveFrom(new Date().toISOString().slice(0, 10));
    setEffectiveTo("");
    setPaymentFrequency("monthly");
    setNotes("");
    setAllowances([
      { code: "HRA", name: "House Rent Allowance", amount: 15000, type: "fixed" },
      { code: "SPECIAL", name: "Special Allowance", amount: 10000, type: "fixed" },
    ]);
    setDeductions([
      { code: "PF", name: "Provident Fund", amount: 5400, type: "fixed" },
      { code: "PT", name: "Professional Tax", amount: 200, type: "fixed" },
    ]);
    setErrorMessage("");
    setModalOpen(true);
  };

  const openEditModal = (item: SalaryStructure) => {
    setEditingStructure(item);
    setEmployeeId(item.employeeId);
    setBaseSalary(item.baseSalary.toString());
    setEffectiveFrom(item.effectiveFrom);
    setEffectiveTo(item.effectiveTo ?? "");
    setPaymentFrequency(item.paymentFrequency);
    setNotes(item.notes ?? "");
    setAllowances(item.allowances.length > 0 ? item.allowances : []);
    setDeductions(item.deductions.length > 0 ? item.deductions : []);
    setErrorMessage("");
    setModalOpen(true);
  };

  const addAllowance = () => {
    setAllowances([...allowances, { code: "OTHER", name: "Allowance", amount: 1000, type: "fixed" }]);
  };

  const removeAllowance = (idx: number) => {
    setAllowances(allowances.filter((_, i) => i !== idx));
  };

  const updateAllowance = (idx: number, field: keyof SalaryComponentItem, val: string | number) => {
    setAllowances(
      allowances.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const addDeduction = () => {
    setDeductions([...deductions, { code: "OTHER", name: "Deduction", amount: 500, type: "fixed" }]);
  };

  const removeDeduction = (idx: number) => {
    setDeductions(deductions.filter((_, i) => i !== idx));
  };

  const updateDeduction = (idx: number, field: keyof SalaryComponentItem, val: string | number) => {
    setDeductions(
      deductions.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  // Preview Totals
  const numBase = parseFloat(baseSalary) || 0;
  const totAllowances = allowances.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
  const totDeductions = deductions.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
  const grossPreview = numBase + totAllowances;
  const netPreview = Math.max(0, grossPreview - totDeductions);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");

    const formData = new FormData();
    if (editingStructure?.id) formData.append("id", editingStructure.id);
    formData.append("employeeId", employeeId);
    formData.append("baseSalary", baseSalary);
    formData.append("paymentFrequency", paymentFrequency);
    formData.append("effectiveFrom", effectiveFrom);
    if (effectiveTo) formData.append("effectiveTo", effectiveTo);
    formData.append("allowances", JSON.stringify(allowances));
    formData.append("deductions", JSON.stringify(deductions));
    if (notes) formData.append("notes", notes);

    const res = await upsertSalaryStructureAction(formData);
    setSaving(false);

    if (!res.success) {
      setErrorMessage(res.error ?? "Failed to save salary structure.");
    } else {
      setModalOpen(false);
    }
  };

  const columns: DataTableColumn<SalaryStructure>[] = [
    {
      key: "employeeCode",
      header: "Employee Code",
      sortable: true,
      render: (row) => (
        <code style={{ fontSize: "0.82rem", padding: "2px 6px", borderRadius: 4, background: "var(--background)" }}>
          {row.employeeCode ?? "—"}
        </code>
      ),
    },
    {
      key: "employeeName",
      header: "Employee Name",
      sortable: true,
      render: (row) => <span style={{ fontWeight: 600 }}>{row.employeeName ?? "Staff Member"}</span>,
    },
    {
      key: "baseSalary",
      header: "Basic Salary",
      sortable: true,
      render: (row) => <span>₹{row.baseSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>,
    },
    {
      key: "allowances",
      header: "Allowances",
      render: (row) => {
        const sum = row.allowances.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
        return <span>+₹{sum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>;
      },
    },
    {
      key: "deductions",
      header: "Deductions",
      render: (row) => {
        const sum = row.deductions.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
        return <span style={{ color: "#ef4444" }}>-₹{sum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>;
      },
    },
    {
      key: "effectiveFrom",
      header: "Effective Period",
      render: (row) => (
        <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
          {row.effectiveFrom} to {row.effectiveTo ?? "Present"}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (row) => (
        <Badge
          label={row.isActive ? "ACTIVE" : "INACTIVE"}
          variant={row.isActive ? "success" : "neutral"}
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
          Edit / Revise
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>Configured Salary Structures</h3>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
            Effective-dated base pay, statutory deductions, and allowances per employee.
          </p>
        </div>
        <Button variant="primary" onClick={openCreateModal} leftIcon={<Plus size={16} />}>
          Assign Salary Structure
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={structures}
        keyExtractor={(item) => item.id}
        emptyTitle="No Salary Structures Configured"
        emptyDescription="Click 'Assign Salary Structure' to define compensation components for your employees."
      />

      {/* Structure Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); }}
        title={editingStructure ? "Revise Salary Structure" : "Assign New Salary Structure"}
        maxWidth="700px"
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Select
              label="Select Employee"
              value={employeeId}
              onChange={(e) => { setEmployeeId(e.target.value); }}
              required
              disabled={Boolean(editingStructure)}
              options={employees.map((emp) => ({
                value: emp.id,
                label: `${emp.fullName} (${emp.employeeCode})`,
              }))}
            />

            <Input
              label="Base Salary (₹ per month)"
              type="number"
              step="0.01"
              value={baseSalary}
              onChange={(e) => { setBaseSalary(e.target.value); }}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input
              label="Effective From"
              type="date"
              value={effectiveFrom}
              onChange={(e) => { setEffectiveFrom(e.target.value); }}
              required
            />
            <Input
              label="Effective To (Optional)"
              type="date"
              value={effectiveTo}
              onChange={(e) => { setEffectiveTo(e.target.value); }}
            />
          </div>

          {/* Allowances Section */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#10b981" }}>Allowances Breakdown</span>
              <Button size="sm" variant="ghost" type="button" onClick={addAllowance} leftIcon={<Plus size={14} />}>
                Add Component
              </Button>
            </div>
            {allowances.map((a, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "100px 1fr 120px 36px", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <Input
                  value={a.code}
                  onChange={(e) => { updateAllowance(idx, "code", e.target.value.toUpperCase()); }}
                  placeholder="CODE"
                  required
                />
                <Input
                  value={a.name}
                  onChange={(e) => { updateAllowance(idx, "name", e.target.value); }}
                  placeholder="Component Name"
                  required
                />
                <Input
                  type="number"
                  step="0.01"
                  value={a.amount.toString()}
                  onChange={(e) => { updateAllowance(idx, "amount", parseFloat(e.target.value) || 0); }}
                  placeholder="₹"
                  required
                />
                <Button size="sm" variant="ghost" type="button" onClick={() => { removeAllowance(idx); }} leftIcon={<Trash2 size={14} color="#ef4444" />} />
              </div>
            ))}
          </div>

          {/* Deductions Section */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#ef4444" }}>Deductions Breakdown</span>
              <Button size="sm" variant="ghost" type="button" onClick={addDeduction} leftIcon={<Plus size={14} />}>
                Add Component
              </Button>
            </div>
            {deductions.map((d, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "100px 1fr 120px 36px", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <Input
                  value={d.code}
                  onChange={(e) => { updateDeduction(idx, "code", e.target.value.toUpperCase()); }}
                  placeholder="CODE"
                  required
                />
                <Input
                  value={d.name}
                  onChange={(e) => { updateDeduction(idx, "name", e.target.value); }}
                  placeholder="Component Name"
                  required
                />
                <Input
                  type="number"
                  step="0.01"
                  value={d.amount.toString()}
                  onChange={(e) => { updateDeduction(idx, "amount", parseFloat(e.target.value) || 0); }}
                  placeholder="₹"
                  required
                />
                <Button size="sm" variant="ghost" type="button" onClick={() => { removeDeduction(idx); }} leftIcon={<Trash2 size={14} color="#ef4444" />} />
              </div>
            ))}
          </div>

          {/* Live Preview Box */}
          <div
            style={{
              padding: "12px 16px",
              background: "var(--surface)",
              border: "1px dashed var(--border)",
              borderRadius: 6,
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.85rem",
            }}
          >
            <div>
              <span style={{ color: "var(--text-muted)" }}>Gross Salary: </span>
              <span style={{ fontWeight: 600 }}>₹{grossPreview.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Total Deductions: </span>
              <span style={{ fontWeight: 600, color: "#ef4444" }}>-₹{totDeductions.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Calculated Net Pay: </span>
              <span style={{ fontWeight: 700, color: "#10b981" }}>₹{netPreview.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <Input
            label="Revision Notes / Justification (Optional)"
            value={notes}
            onChange={(e) => { setNotes(e.target.value); }}
            placeholder="e.g. Annual compensation increment or grade revision."
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <Button variant="ghost" type="button" onClick={() => { setModalOpen(false); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={saving}>
              {editingStructure ? "Save Revision" : "Assign Structure"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
