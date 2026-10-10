"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Download, Upload, CheckCircle2 } from "lucide-react";
import { exportEmployeesCsvAction, importEmployeesCsvAction } from "@/lib/data/employee-actions";
import type { EmployeeImportRow } from "@ems/types";

interface ImportExportClientProps {
  totalEmployees: number;
}

export function ImportExportClient({ totalEmployees }: ImportExportClientProps) {
  const [exporting, setExporting] = useState(false);
  const [csvContent, setCsvContent] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ importedCount: number; errors: Array<{ rowNumber: number; message: string }> } | null>(null);

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await exportEmployeesCsvAction({});
      if (res.success && res.data) {
        const blob = new Blob([res.data.csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `EMS_Employees_Export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(res.error ?? "Failed to export employees.");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!csvContent.trim()) {
      alert("Please paste CSV data or template rows.");
      return;
    }

    try {
      setImporting(true);
      const lines = csvContent.trim().split("\n");
      if (lines.length < 2) {
        alert("CSV requires at least a header row and one data row.");
        return;
      }
      const firstLine = lines[0] ?? "";
      const headers = firstLine.split(",").map((h) => h.trim());
      const parsedRows: EmployeeImportRow[] = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = values[i] ?? "";
        });
        return row as unknown as EmployeeImportRow;
      });

      const res = await importEmployeesCsvAction(parsedRows);
      if (res.success && res.data) {
        setImportResult({
          importedCount: res.data.importedCount,
          errors: (res.data.errors as Array<{ rowNumber: number; message: string }>) || [],
        });
      } else {
        alert(res.error ?? "Import failed.");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const sampleCsvTemplate = `employeeCode,firstName,lastName,workEmail,departmentCode,branchCode,designationCode,employmentType,dateOfJoining
EMP-1001,Aarav,Sharma,aarav.sharma@giet.edu,CSE,MAIN,ASST-PROF,full_time,2026-06-01
EMP-1002,Priya,Reddy,priya.reddy@giet.edu,ECE,MAIN,ASSOC-PROF,full_time,2026-06-15`;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24 }}>
      {/* Export Section */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Export Employee Directory</CardTitle>
            <CardDescription>
              Generate sanitized CSV data with spreadsheet formula injection protection
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>
              Export all <strong>{totalEmployees}</strong> active employee records, organizational departments, designations, branches, and contact emails in compliant CSV format.
            </p>

            <div style={{ padding: 12, borderRadius: 8, background: "var(--background)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", marginBottom: 4 }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>RFC 4180 Escaped & Formula Hardened</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem" }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>Compatible with Excel, Google Sheets, & LibreOffice</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <Download size={16} />
              {exporting ? "Generating CSV..." : "Download Full CSV Export"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Batch CSV Import</CardTitle>
            <CardDescription>
              Bulk enroll staff records with atomic validation and foreign-key resolution
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleImportSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>CSV Payload / Paste Data</label>
              <button
                type="button"
                onClick={() => setCsvContent(sampleCsvTemplate)}
                style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.8rem", cursor: "pointer", textDecoration: "underline" }}
              >
                Load Sample Template
              </button>
            </div>

            <textarea
              rows={6}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="Paste comma-separated rows with header: employeeCode,firstName,lastName,workEmail,..."
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 6,
                border: "1px solid var(--border)",
                fontSize: "0.82rem",
                fontFamily: "monospace",
                background: "var(--background)",
              }}
            />

            <Button
              type="submit"
              disabled={importing}
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <Upload size={16} />
              {importing ? "Validating & Importing..." : "Execute Batch Import"}
            </Button>

            {importResult && (
              <div style={{ padding: 12, borderRadius: 8, background: "var(--background)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    Successfully Imported: {importResult.importedCount} Records
                  </span>
                </div>
                {importResult.errors.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--danger, #ef4444)", fontWeight: 600 }}>
                      Validation Errors ({importResult.errors.length}):
                    </span>
                    <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: "0.78rem", color: "var(--danger, #ef4444)" }}>
                      {importResult.errors.map((err, idx) => (
                        <li key={idx}>Row {err.rowNumber}: {err.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
