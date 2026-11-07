import { InstitutionalFooter } from "@/components/ui/InstitutionalHeader";
import { ArrowLeft, FileQuestion } from "lucide-react";
import Link from "next/link";
import React from "react";

export const metadata = {
  title: "Page Not Found | EMS",
};

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: 480,
            width: "100%",
            textAlign: "center",
            padding: "40px 24px",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "rgba(30, 58, 138, 0.1)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <FileQuestion size={28} />
          </div>

          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "var(--text-main)",
              margin: "0 0 8px",
            }}
          >
            404 — Page Not Found
          </h1>

          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--text-muted)",
              marginBottom: 24,
              lineHeight: 1.5,
            }}
          >
            The operational screen or resource you requested could not be located in this portal.
          </p>

          <Link
            href="/portal"
            className="btn btn-primary"
            style={{ display: "inline-flex", width: "auto", padding: "10px 20px" }}
          >
            <ArrowLeft size={16} /> Return to Portal Home
          </Link>
        </div>
      </main>

      <InstitutionalFooter />
    </div>
  );
}
