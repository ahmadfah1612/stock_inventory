import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { MainNav } from "@/components/main-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const initials = (session.user.name ?? "S")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white"
            >
              SP
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
              Stock PP
            </span>
          </div>

          <MainNav />

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
            className="flex items-center gap-2.5"
          >
            <span
              aria-hidden="true"
              className="hidden h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 sm:flex"
            >
              {initials}
            </span>
            <span className="hidden text-sm text-slate-600 md:inline">{session.user.name}</span>
            <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              Keluar
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
