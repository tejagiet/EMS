import { AppShell } from "@/components/shell/AppShell";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { getCurrentUserContext } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/login");
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <AppShell context={context}>{children}</AppShell>
      </ToastProvider>
    </ThemeProvider>
  );
}
