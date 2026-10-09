import { INSTITUTION } from "@ems/config";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Employee Management System | GIET Polytechnic College",
  description:
    "GIET Polytechnic College — AI Department | Industrial Training Project 2024–2027 | EMS Team T-1 (GIETP-AI-IT-EMS-T1-2026)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="institutional-banner">
          <h2>
            {INSTITUTION.name} — {INSTITUTION.department}
          </h2>
          <p>
            {INSTITUTION.category} | Batch {INSTITUTION.batch} | {INSTITUTION.projectName} —{" "}
            {INSTITUTION.team}
          </p>
          <div className="badge">Publisher ID: {INSTITUTION.publisherId}</div>
        </header>
        {children}
      </body>
    </html>
  );
}
