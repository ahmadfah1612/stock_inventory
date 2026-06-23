import { expect, test } from "vitest";
import { toLedgerInputs } from "@/server/transactions";

test("maps db rows to engine inputs preserving type and amounts", () => {
  const rows = [
    { type: "buy", qty: "100", unitCost: "10", salePrice: null },
    { type: "sell", qty: "40", unitCost: null, salePrice: "12" },
  ] as const;
  expect(toLedgerInputs(rows as any)).toEqual([
    { type: "buy", qty: "100", unitCost: "10", salePrice: undefined },
    { type: "sell", qty: "40", unitCost: undefined, salePrice: "12" },
  ]);
});
