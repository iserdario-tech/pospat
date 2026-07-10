import type { Profile, Chronotype, Goal } from "../index.js";
import { parseHM } from "../index.js";

export interface OnboardingForm {
  wakeHM: string; bedHM: string; chronotype: Chronotype;
  caffeineMg: number; caffeineRegular: boolean; napPossible: boolean; goal: Goal;
}
export function buildProfile(f: OnboardingForm): Profile {
  let dur = parseHM(f.wakeHM) - parseHM(f.bedHM);
  if (dur < 0) dur += 1440;
  const target = Math.max(420, Math.min(540, dur));
  return {
    anchorWakeHM: f.wakeHM,
    targetSleepMin: Number.isFinite(target) ? target : 465,
    chronotype: f.chronotype,
    caffeine: { typicalMgPerDose: f.caffeineMg, regularUser: f.caffeineRegular },
    napPossibleByDefault: f.napPossible,
    goal: f.goal,
  };
}
