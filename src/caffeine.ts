import type { Profile, DayMode, DayToggles, PlanWindow } from "./types.js";
import { DEFAULTS } from "./defaults.js";

export function caffeineWindows(args: {
  profile: Profile; bedMin: number; mode: DayMode; toggles: DayToggles; badNight: boolean;
}): PlanWindow[] {
  const { profile, bedMin, mode, toggles, badNight } = args;
  if (toggles.noCaffeine) {
    return [{
      kind: "caffeine_last", startMin: bedMin, available: false,
      title: "Кофеин выключен", detail: "Сегодня без кофеина",
      why: "Ты отметил «без кофеина» — компенсируем свет+движение+нап",
      refs: ["T6"], substitutedWith: "свет, движение, нап, гидратация",
    }];
  }
  const large = profile.caffeine.typicalMgPerDose >= DEFAULTS.caffeineLargeMg;
  const cutoffH = mode === "recovery"
    ? DEFAULTS.caffeineCutoffRecoveryH
    : large ? DEFAULTS.caffeineCutoffLargeH : DEFAULTS.caffeineCutoffModerateH;
  const lastMin = bedMin - cutoffH * 60;
  const out: PlanWindow[] = [{
    kind: "caffeine_last", startMin: lastMin, available: true,
    title: "Последний кофеин", detail: `Последняя доза до этого времени (отсечка ${cutoffH} ч)`,
    why: "Кофеин с периодом полувыведения ~5 ч ухудшает сон даже за часы до отбоя",
    refs: ["T6"],
  }];
  if (badNight || mode === "recovery") {
    out.push({
      kind: "caffeine_boost", startMin: bedMin - (cutoffH + 4) * 60, available: true,
      title: "Утренний буст", detail: "Разрешён кофеин в первой половине дня, до отсечки",
      why: "После плохой ночи ранний кофеин помогает бодрости, не трогая ночь",
      refs: ["T6", "T14"],
    });
  }
  return out;
}
