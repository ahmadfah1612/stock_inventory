export type Dir = "asc" | "desc";

export function parseDir(v?: string): Dir {
  return v === "desc" ? "desc" : "asc";
}

/** Toggle dir when re-clicking the active column, else default to asc. */
function nextDir(active: boolean, dir: Dir): Dir {
  return active ? (dir === "asc" ? "desc" : "asc") : "asc";
}

export function sortHref(base: string, col: string, sort: string, dir: Dir): string {
  return `${base}?sort=${col}&dir=${nextDir(sort === col, dir)}`;
}

/** Arrow indicator for the active column. */
export function arrow(active: boolean, dir: Dir): string {
  return active ? (dir === "asc" ? " ↑" : " ↓") : "";
}

export function ariaSort(active: boolean, dir: Dir): "ascending" | "descending" | "none" {
  return active ? (dir === "asc" ? "ascending" : "descending") : "none";
}

export function compare(a: number | string, b: number | string, dir: Dir): number {
  const r =
    typeof a === "number" && typeof b === "number"
      ? a - b
      : String(a).localeCompare(String(b), "id");
  return dir === "asc" ? r : -r;
}
