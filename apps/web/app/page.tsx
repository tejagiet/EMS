import { getCurrentUserContext } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const context = await getCurrentUserContext();

  if (context?.isAccountActive) {
    redirect("/portal");
  }

  redirect("/login");
}
