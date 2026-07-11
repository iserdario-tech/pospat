import { describe, it, expect } from "vitest";
import { planDay } from "../src/index.js";
import { dueWindows } from "../src/push.js";
const profile = { anchorWakeHM:"07:00", targetSleepMin:465, chronotype:"intermediate",
  caffeine:{ typicalMgPerDose:95, regularUser:true }, napPossibleByDefault:true, goal:"alertness" } as const;
const plan = planDay({ profile, ctx:{ date:"2026-07-10", mode:"normal", toggles:{} },
  lastNight:{ wokeHM:"07:00", quality:3 }, history:[] });

describe("dueWindows", () => {
  it("fires morning_light at 07:00 within slot", () => {
    const due = dueWindows(plan.windows, 7*60, 5); // 07:00
    expect(due.some(w=>w.kind==="morning_light")).toBe(true);
  });
  it("does not fire it at 09:00", () => {
    const due = dueWindows(plan.windows, 9*60, 5);
    expect(due.some(w=>w.kind==="morning_light")).toBe(false);
  });
  it("ignores non-allowlisted windows (afternoon_dip)", () => {
    const dip = plan.windows.find(w=>w.kind==="afternoon_dip")!;
    const due = dueWindows(plan.windows, dip.startMin % 1440, 5);
    expect(due.some(w=>w.kind==="afternoon_dip")).toBe(false);
  });
});
