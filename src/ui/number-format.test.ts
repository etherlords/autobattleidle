import { describe, expect, it } from "vitest";
import { formatNumber } from "./number-format";

describe("formatNumber", () => {
  it.each([
    [0, "0"],
    [999, "999"],
    [1_000, "1,000"],
    [9_999, "9,999"],
    [10_000, "10K"],
    [10_049, "10K"],
    [99_950, "100K"],
    [100_000, "100K"],
    [999_949, "999K"],
    [999_950, "1M"],
    [1_000_000, "1M"],
    [1_234_567, "1.23M"],
    [Number.MAX_SAFE_INTEGER, "9.01Qa"],
    [1e33, "1e33"],
  ])("formats %d as %s", (value, expected) => {
    expect(formatNumber(value).text).toBe(expected);
  });

  it("keeps a grouped exact companion and rejects invalid UI values", () => {
    expect(formatNumber(900_000)).toEqual({ exact: "900,000", text: "900K" });
    expect(formatNumber(Number.NaN)).toEqual({ exact: "—", text: "—" });
    expect(formatNumber(Number.POSITIVE_INFINITY)).toEqual({ exact: "—", text: "—" });
    expect(formatNumber(Number.NEGATIVE_INFINITY)).toEqual({ exact: "—", text: "—" });
    expect(formatNumber(-1)).toEqual({ exact: "—", text: "—" });
  });
});
