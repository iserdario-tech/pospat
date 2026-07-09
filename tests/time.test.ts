import { describe, it, expect } from "vitest";
import { parseHM, fmtHM, addMin, clampMin } from "../src/time.js";

describe("time", () => {
  it("parses and formats", () => {
    expect(parseHM("07:00")).toBe(420);
    expect(parseHM("23:30")).toBe(1410);
    expect(fmtHM(420)).toBe("07:00");
  });
  it("formats next-day times", () => {
    expect(fmtHM(1620)).toBe("03:00 (+1)"); // 27:00
  });
  it("adds and clamps", () => {
    expect(addMin(420, 90)).toBe(510);
    expect(clampMin(30, 60, 120)).toBe(60);
    expect(clampMin(200, 60, 120)).toBe(120);
  });
});
