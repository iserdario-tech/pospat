import type { Profile, DayMode, DayToggles, PlanWindow } from "./types.js";
import { DEFAULTS } from "./defaults.js";

export function caffeineWindows(args: {
  profile: Profile; bedMin: number; mode: DayMode; toggles: DayToggles; badNight: boolean;
}): PlanWindow[] {
  const { profile, bedMin, mode, toggles, badNight } = args;
  if (toggles.noCaffeine) return [];
  const large = profile.caffeine.typicalMgPerDose >= DEFAULTS.caffeineLargeMg;
  const cutoffH = mode === "recovery"
    ? DEFAULTS.caffeineCutoffRecoveryH
    : large ? DEFAULTS.caffeineCutoffLargeH : DEFAULTS.caffeineCutoffModerateH;
  const extra = (badNight || mode === "recovery")
    ? " Спал плохо — с утра можно на чашку больше." : "";
  return [{
    kind: "caffeine_last", startMin: bedMin - cutoffH * 60, available: true,
    title: "Последняя чашка кофе",
    detail: `Кофе — утром и в первой половине дня (1–2 порции). После этого времени не пей, иначе испортит сон.${extra}`,
    why: "Кофеин выводится примерно за 5 часов, поэтому поздний кофе крадёт сон",
    refs: ["T6"],
  }];
}
