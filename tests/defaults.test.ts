import { describe, it, expect } from "vitest";
import { DEFAULTS } from "../src/defaults.js";
describe("defaults", () => {
  it("has sane sleep bounds", () => {
    expect(DEFAULTS.targetSleepMin).toBeGreaterThanOrEqual(DEFAULTS.targetSleepMinLo);
    expect(DEFAULTS.targetSleepMin).toBeLessThanOrEqual(DEFAULTS.targetSleepMinHi);
    expect(DEFAULTS.caffeineCutoffLargeH).toBeGreaterThan(DEFAULTS.caffeineCutoffModerateH);
  });
});
