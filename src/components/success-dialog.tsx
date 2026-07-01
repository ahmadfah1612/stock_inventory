"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function SuccessDialog({ message, dismissHref }: { message?: string; dismissHref: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(!!message);

  useEffect(() => {
    if (message) setOpen(true);
  }, [message]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        router.replace(dismissHref);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, dismissHref, router]);

  function dismiss() {
    setOpen(false);
    router.replace(dismissHref);
  }

  if (!open || !message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup"
        className="absolute inset-0 cursor-default bg-black/60"
        onClick={dismiss}
      />
      <div
        role="alertdialog"
        aria-labelledby="success-title"
        aria-describedby="success-desc"
        className="relative w-full max-w-sm rounded-xl border border-emerald-500/30 bg-slate-900 p-6 shadow-xl"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6" aria-hidden>
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h2 id="success-title" className="mt-4 text-center text-base font-semibold text-slate-100">
          Berhasil
        </h2>
        <p id="success-desc" className="mt-2 text-center text-sm text-slate-300">
          {message}
        </p>
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            autoFocus
            onClick={dismiss}
            className="cursor-pointer rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
