import { expect, test } from "vitest";
import { labelYm, monthEnd, toDateStr, toYm } from "@/lib/month";

test("toDateStr normalizes ISO strings", () => {
  expect(toDateStr("2025-07-14")).toBe("2025-07-14");
});

test("toYm extracts month key", () => {
  expect(toYm("2025-07-14")).toBe("2025-07");
});

test("labelYm renders Indonesian month", () => {
  expect(labelYm("2026-06")).toBe("Juni 2026");
});

test("monthEnd returns last day", () => {
  expect(monthEnd("2026-02")).toBe("2026-02-28");
});
