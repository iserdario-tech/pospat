import { describe, it, expect } from "vitest";
import { saveState, loadState, type StoredState } from "../src/ui/storage.js";
function memStore() {
  const m = new Map<string,string>();
  return { getItem:(k:string)=>m.get(k) ?? null, setItem:(k:string,v:string)=>{m.set(k,v);} };
}
const profile = { anchorWakeHM:"07:00", targetSleepMin:465, chronotype:"intermediate",
  caffeine:{ typicalMgPerDose:200, regularUser:true }, napPossibleByDefault:true, goal:"alertness" } as const;

describe("storage", () => {
  it("round-trips state", () => {
    const s: StoredState = { profile, history:[], screener:null };
    const store = memStore(); saveState(s, store);
    expect(loadState(store)?.profile.anchorWakeHM).toBe("07:00");
  });
  it("empty -> null", () => { expect(loadState(memStore())).toBeNull(); });
});
