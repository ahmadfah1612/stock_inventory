import { describe, expect, it } from "vitest";
import { computeLedger } from "@/lib/valuation";

describe("computeLedger weighted moving average", () => {
  it("single buy then sell at cost leaves zero balance", () => {
    const r = computeLedger([
      { type: "buy", qty: "10000", unitCost: "18100" },
      { type: "sell", qty: "10000", salePrice: "18100" },
    ]);
    expect(r[0].balQty).toBe("10000");
    expect(r[0].avgCost).toBe("18100");
    expect(r[1].balQty).toBe("0");
    expect(r[1].cogs).toBe("181000000");
    expect(r[1].revenue).toBe("181000000");
    expect(r[1].profit).toBe("0");
  });

  it("averages two buys then values outflow at the average (Exxon AP03B)", () => {
    const r = computeLedger([
      { type: "buy", qty: "25500", unitCost: "16089" },
      { type: "buy", qty: "25500", unitCost: "15346" },
      { type: "sell", qty: "3000", salePrice: "16000" },
    ]);
    expect(r[1].balQty).toBe("51000");
    expect(r[1].avgCost).toBe("15717.5");
    expect(r[1].balValue).toBe("801592500");
    expect(r[2].cogs).toBe("47152500");      // 3000 * 15717.5
    expect(r[2].revenue).toBe("48000000");   // 3000 * 16000
    expect(r[2].profit).toBe("847500");
  });

  it("sample reduces stock at cost with no revenue", () => {
    const r = computeLedger([
      { type: "buy", qty: "100", unitCost: "10" },
      { type: "sample", qty: "40" },
    ]);
    expect(r[1].balQty).toBe("60");
    expect(r[1].cogs).toBe("400");
    expect(r[1].revenue).toBe("0");
    expect(r[1].profit).toBe("-400");
  });

  it("scrap writes off at cost", () => {
    const r = computeLedger([
      { type: "buy", qty: "2", unitCost: "21169" },
      { type: "scrap", qty: "2" },
    ]);
    expect(r[1].balQty).toBe("0");
    expect(r[1].cogs).toBe("42338");
  });

  it("rejects overselling", () => {
    expect(() =>
      computeLedger([
        { type: "buy", qty: "10", unitCost: "5" },
        { type: "sell", qty: "20", salePrice: "6" },
      ]),
    ).toThrow(/Insufficient stock/);
  });

  it("sell without price yields null-ish revenue/profit", () => {
    const r = computeLedger([
      { type: "buy", qty: "10", unitCost: "5" },
      { type: "sell", qty: "10" },
    ]);
    expect(r[1].cogs).toBe("50");
    expect(r[1].revenue).toBe("0");
    expect(r[1].profit).toBe("-50");
  });
});
