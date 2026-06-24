"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DayPicker, type Matcher } from "react-day-picker";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import "react-day-picker/style.css";

function toDate(s?: string): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
const fmtIso = (d: Date) => format(d, "yyyy-MM-dd");
const fmtId = (d?: Date) => (d ? format(d, "dd/MM/yyyy") : "");

function SingleDatePicker({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value?: Date;
  onChange: (d?: Date) => void;
  disabled?: Matcher;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const labelId = useId();

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
    <div ref={ref} className="relative">
      <span id={labelId} className="mb-1 block text-xs font-medium text-slate-300">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={labelId}
        className="inline-flex w-44 items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-100 shadow-sm hover:bg-slate-800/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        <span aria-hidden="true" className="text-slate-500">
          🗓
        </span>
        <span className={value ? "" : "text-slate-500"}>{value ? fmtId(value) : "Pilih tanggal"}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute left-0 top-full z-30 mt-2 rounded-xl border border-slate-800 bg-slate-900 p-3 shadow-lg"
        >
          <DayPicker
            mode="single"
            locale={idLocale}
            defaultMonth={value ?? new Date()}
            captionLayout="dropdown"
            startMonth={new Date(2015, 0)}
            endMonth={new Date(2035, 11)}
            disabled={disabled}
            selected={value}
            onSelect={(d) => {
              onChange(d);
              setOpen(false);
            }}
          />
          {value && (
            <div className="mt-2 flex justify-end border-t border-slate-800 pt-2">
              <button
                type="button"
                onClick={() => {
                  onChange(undefined);
                  setOpen(false);
                }}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                Hapus
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DateRangePicker({
  action,
  from,
  to,
}: {
  action: string;
  from?: string;
  to?: string;
}) {
  const router = useRouter();
  const [fromDate, setFromDate] = useState<Date | undefined>(() => toDate(from));
  const [toDate2, setToDate2] = useState<Date | undefined>(() => toDate(to));

  function apply() {
    const params = new URLSearchParams();
    if (fromDate) params.set("from", fmtIso(fromDate));
    if (toDate2) params.set("to", fmtIso(toDate2));
    const qs = params.toString();
    router.push(qs ? `${action}?${qs}` : action);
  }
  function reset() {
    setFromDate(undefined);
    setToDate2(undefined);
    router.push(action);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <SingleDatePicker
        label="Dari tanggal"
        value={fromDate}
        onChange={setFromDate}
        disabled={toDate2 ? { after: toDate2 } : undefined}
      />
      <SingleDatePicker
        label="Sampai tanggal"
        value={toDate2}
        onChange={setToDate2}
        disabled={fromDate ? { before: fromDate } : undefined}
      />
      <button
        type="button"
        onClick={apply}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Hitung
      </button>
      {(from || to) && (
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-slate-800 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          Reset
        </button>
      )}
    </div>
  );
}
