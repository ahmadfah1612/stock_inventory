import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <nav className="flex gap-4">
          <Link href="/" className="font-semibold">Summary</Link>
          <Link href="/materials">Materials</Link>
        </nav>
        <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
          <span className="mr-3 text-sm text-gray-500">{session?.user?.name}</span>
          <button className="text-sm underline">Keluar</button>
        </form>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
