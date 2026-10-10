import { verifyPortalAccess } from "@/lib/auth/session";
import { getEmployeesDirectory } from "@/lib/data/employees";
import { ImportExportClient } from "./ImportExportClient";
import { MetricCard } from "@/components/ui/MetricCard";
import { Upload, FileSpreadsheet, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Import & Export Operations | HR Portal",
};

export default async function HrImportExportPage() {
  const context = await verifyPortalAccess("hr_manager");
  const orgId = context.activeOrganization?.id ?? "";

  const empResult = await getEmployeesDirectory(orgId, { pageSize: 1 });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          Employee Data Import & Export
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Bulk staff synchronization via RFC 4180 CSV files and spreadsheet data extracts with security guards.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Directory Headcount"
          value={empResult.totalCount}
          subtitle="Ready for export"
          icon={<FileSpreadsheet size={20} />}
        />
        <MetricCard
          label="Formula Injection Guard"
          value="Enabled (OWASP)"
          subtitle="Pre-escaped CSV fields"
          icon={<ShieldCheck size={20} color="#10b981" />}
        />
        <MetricCard
          label="Batch Validation"
          value="Atomic Zod"
          subtitle="Full schema verification"
          icon={<Upload size={20} color="#3b82f6" />}
        />
      </div>

      <ImportExportClient totalEmployees={empResult.totalCount} />
    </div>
  );
}
