import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employee Management System",
  description: "EMS — Phase 1 Foundation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
