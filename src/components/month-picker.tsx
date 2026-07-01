"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DayPicker } from "react-day-picker";
import { id as idLocale } from "date-fns/locale";
import { labelYm, toYm } from "@/lib/month";
import "react-day-picker/style.css";

function ymToDate(ym: string): Date {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

export function MonthPicker({
  action,
  month,
  months,
  hidden,
}: {
  action: string;
  month: string;
  months: string[];
  hidden?: Record<string, string>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const allowed = useMemo(() => new Set(months), [months]);
  const selected = ymToDate(month);
  const bounds = useMemo(() => {
    if (months.length === 0) return { start: selected, end: selected };
    return { start: ymToDate(months[months.length - 1]), end: ymToDate(months[0]) };
  }, [months, selected]);

  function navigate(nextYm: string) {
    const params = new URLSearchParams();
    params.set("month", nextYm);
    if (hidden) {
      for (const [k, v] of Object.entries(hidden)) {
        if (v) params.set(k, v);
      }
    }
    router.push(`${action}?${params.toString()}`);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <div className="flex items-center gap-2">
        <span id={labelId} className="text-sm font-medium text-slate-400">
          Bulan
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-labelledby={labelId}
          className="inline-flex min-w-44 cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm hover:bg-slate-800/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <span aria-hidden="true" className="text-slate-500">
            🗓
          </span>
          <span>{labelYm(month)}</span>
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Pilih bulan"
          className="absolute right-0 top-full z-30 mt-2 rounded-xl border border-slate-800 bg-slate-900 p-3 shadow-lg"
        >
          <DayPicker
            className="rdp-month-picker-only"
            mode="single"
            locale={idLocale}
            captionLayout="dropdown"
            month={selected}
            defaultMonth={selected}
            startMonth={bounds.start}
            endMonth={bounds.end}
            disabled={(date) => !allowed.has(toYm(date))}
            selected={selected}
            onMonthChange={(date) => {
              const ym = toYm(date);
              if (allowed.has(ym)) navigate(ym);
            }}
            onSelect={(date) => date && allowed.has(toYm(date)) && navigate(toYm(date))}
          />
        </div>
      )}
    </div>
  );
}
