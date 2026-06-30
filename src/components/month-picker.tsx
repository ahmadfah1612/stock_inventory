"use client";

import { useRouter } from "next/navigation";

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function labelYm(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
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

  function onChange(next: string) {
    const params = new URLSearchParams();
    params.set("month", next);
    if (hidden) {
      for (const [k, v] of Object.entries(hidden)) {
        if (v) params.set(k, v);
      }
    }
    router.push(`${action}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="month-picker" className="text-sm font-medium text-slate-400">
        Bulan
      </label>
      <select
        id="month-picker"
        value={month}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        {months.map((ym) => (
          <option key={ym} value={ym}>
            {labelYm(ym)}
          </option>
        ))}
      </select>
    </div>
  );
}

export { labelYm };
