import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const initials = (session.user.name ?? "S")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const signOutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
    <AppShell
      isAdmin={session.user.role === "admin"}
      userName={session.user.name ?? "Staff"}
      initials={initials}
      signOutAction={signOutAction}
    >
      {children}
    </AppShell>
  );
}
