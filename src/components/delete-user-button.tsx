"use client";

import { deleteUserAction } from "@/server/actions";

export function DeleteUserButton({ id, email, disabled }: { id: string; email: string; disabled?: boolean }) {
  if (disabled) {
    return <span className="text-xs text-slate-400">akun Anda</span>;
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
        className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
      >
        Hapus
      </button>
    </form>
  );
}
