import { describe, expect, it } from "vitest";
import { KARTU_PAGE_SIZE, paginate, parsePage } from "@/lib/pagination";

describe("parsePage", () => {
  it("defaults invalid values to 1", () => {
    expect(parsePage()).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-2")).toBe(1);
    expect(parsePage("abc")).toBe(1);
  });

  it("parses positive integers", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage("3.7")).toBe(3);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  it("slices items for the requested page", () => {
    const p1 = paginate(items, 1, 10);
    expect(p1.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(p1.totalPages).toBe(3);
    expect(p1.rangeStart).toBe(1);
    expect(p1.rangeEnd).toBe(10);

    const p3 = paginate(items, 3, 10);
    expect(p3.items).toEqual([21, 22, 23, 24, 25]);
    expect(p3.rangeEnd).toBe(25);
  });

  it("clamps page beyond the last page", () => {
    const p = paginate(items, 99, 10);
    expect(p.page).toBe(3);
    expect(p.items).toEqual([21, 22, 23, 24, 25]);
  });

  it("uses kartu page size constant", () => {
    expect(KARTU_PAGE_SIZE).toBe(10);
  });
});
