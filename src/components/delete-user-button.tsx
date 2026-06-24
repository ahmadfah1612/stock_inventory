"use client";

import { deleteUserAction } from "@/server/actions";

export function DeleteUserButton({ id, email, disabled }: { id: string; email: string; disabled?: boolean }) {
  if (disabled) {
    return <span className="text-xs text-slate-500">akun Anda</span>;
  }
  return (
    <form
      action={deleteUserAction}
      onSubmit={(e) => {
        if (!confirm(`Hapus user "${email}"?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-lg border border-red-500/40 px-2.5 py-1 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/10"
      >
        Hapus
      </button>
    </form>
  );
}
