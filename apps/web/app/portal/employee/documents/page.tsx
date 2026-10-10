import { verifyPortalAccess } from "@/lib/auth/session";
import { getDocuments } from "@/lib/data/documents";
import { DocumentsClient } from "@/components/documents/DocumentsClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { FileText, CheckCircle, Clock } from "lucide-react";

export const metadata = {
  title: "My Documents | Employee Portal",
};

export default async function EmployeeDocumentsPage() {
  const context = await verifyPortalAccess("employee");
  const orgId = context.activeOrganization?.id ?? "";
  const linkedEmployee = context.linkedEmployee;

  const docs = linkedEmployee ? await getDocuments(orgId, linkedEmployee.id) : [];

  const verifiedCount = docs.filter((d) => d.verificationStatus === "verified").length;
  const pendingCount = docs.filter((d) => d.verificationStatus === "pending").length;

  const employeeOptions = linkedEmployee
    ? [{ id: linkedEmployee.id, name: `${context.profile.fullName ?? "My Profile"} (${linkedEmployee.employeeCode})` }]
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          My Document Repository
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
          Upload identification documents, contracts, educational degrees, and view verification statuses.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
        <MetricCard
          label="Total Documents"
          value={docs.length}
          subtitle="Files on permanent record"
          icon={<FileText size={20} />}
        />
        <MetricCard
          label="Verified by HR"
          value={verifiedCount}
          subtitle="Officially approved files"
          icon={<CheckCircle size={20} color="#10b981" />}
        />
        <MetricCard
          label="Pending Review"
          value={pendingCount}
          subtitle="Awaiting compliance sign-off"
          icon={<Clock size={20} color="#f59e0b" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Personal Employment Documents</CardTitle>
            <CardDescription>
              Government ID proofs, appointment letters, academic transcripts, and compliance certificates
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <DocumentsClient
            initialDocuments={docs}
            employees={employeeOptions}
            organizationId={orgId}
            currentUserId={context.userId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
