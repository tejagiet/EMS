import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Employee Management System | GIET Polytechnic College",
  description:
    "GIET Polytechnic College — AI Department | Industrial Training Project 2024–2027 | EMS Team T-1 (GIETP-AI-IT-EMS-T1-2026)",
  icons: {
    icon: [
      { url: "/logo.jpg", sizes: "any" },
    ],
    shortcut: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
