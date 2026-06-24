import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listUsers } from "@/server/users";
import { createUserAction, changePasswordAction } from "@/server/actions";
import { DeleteUserButton } from "@/components/delete-user-button";
import { PageHeader } from "@/components/ui";

const inputCls =
  "block w-full rounded-lg border border-slate-700 px-3 py-2.5 text-sm text-slate-100 shadow-sm placeholder:text-slate-500 focus:border-indigo-500 focus:outline-2 focus:outline-offset-0 focus:outline-indigo-500";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/");

  const [users, { error, ok }] = await Promise.all([listUsers(), searchParams]);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Kelola User" subtitle="Tambah, hapus, dan ubah password user. Hanya admin." />

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      {ok && (
        <p role="status" className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">
          {ok}
        </p>
      )}

      {/* Add user */}
      <form action={createUserAction} className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-100">Tambah User</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-sm font-medium text-slate-200">Nama</label>
            <input id="name" name="name" required className={inputCls} placeholder="Nama" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-slate-200">Email</label>
            <input id="email" name="email" type="email" required className={inputCls} placeholder="email@contoh.com" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-slate-200">Password</label>
            <input id="password" name="password" type="password" required minLength={6} className={inputCls} placeholder="min. 6 karakter" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="role" className="block text-sm font-medium text-slate-200">Role</label>
            <select id="role" name="role" defaultValue="user" className={inputCls}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
            Tambah User
          </button>
        </div>
      </form>

      {/* User list */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-800/50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Ubah Password</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map((u) => (
              <tr key={u.id} className="align-middle">
                <td className="px-4 py-3 font-medium text-slate-100">{u.name}</td>
                <td className="px-4 py-3 text-slate-300">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      u.role === "admin"
                        ? "bg-indigo-500/15 text-indigo-300 ring-indigo-600/20"
                        : "bg-slate-800 text-slate-300 ring-slate-500/20"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <form action={changePasswordAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <input
                      name="password"
                      type="password"
                      minLength={6}
                      required
                      placeholder="password baru"
                      className="w-36 rounded-lg border border-slate-700 px-2 py-1.5 text-xs focus:border-indigo-500 focus:outline-2 focus:outline-indigo-500"
                    />
                    <button className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800">
                      Ubah
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <DeleteUserButton id={u.id} email={u.email} disabled={u.id === session.user.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
