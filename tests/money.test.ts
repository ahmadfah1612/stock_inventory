import { expect, test } from "vitest";
import { formatIDR, formatQty } from "@/lib/money";

test("formats IDR without decimals", () => {
  expect(formatIDR("566149500")).toMatch(/Rp/);
  expect(formatIDR("566149500")).toContain("566.149.500");
});
test("formats qty with Kg", () => {
  expect(formatQty("31500")).toBe("31.500 Kg");
});
