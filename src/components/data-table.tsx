"use client";
import { type ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type SortingState } from "@tanstack/react-table";
import { useState } from "react";

export function DataTable<T>({ columns, data }: { columns: ColumnDef<T, any>[]; data: T[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({ data, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        {table.getHeaderGroups().map((hg) => (
          <tr key={hg.id} className="border-b bg-gray-50">
            {hg.headers.map((h) => (
              <th key={h.id} onClick={h.column.getToggleSortingHandler()} className="cursor-pointer p-2 text-left font-medium">
                {flexRender(h.column.columnDef.header, h.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((r) => (
          <tr key={r.id} className="border-b hover:bg-gray-50">
            {r.getVisibleCells().map((c) => (
              <td key={c.id} className="p-2">{flexRender(c.column.columnDef.cell, c.getContext())}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
