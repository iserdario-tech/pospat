import type { Profile, DayMode, DayToggles, PlanWindow } from "./types.js";
import { DEFAULTS } from "./defaults.js";

export function napWindow(args: {
  profile: Profile; wakeMin: number; bedMin: number; mode: DayMode; toggles: DayToggles; badNight: boolean;
}): PlanWindow | null {
  const { profile, wakeMin, bedMin, mode, toggles, badNight } = args;
  if (!profile.napPossibleByDefault && !toggles.napUnavailable && mode !== "recovery") return null;

  let start = wakeMin + 7 * 60; // середина окна 6–8ч после подъёма
  const latest = bedMin - DEFAULTS.napNotLaterBeforeBedH * 60;
  if (start > latest) start = latest;
  const end = start + DEFAULTS.napSlotMin;

  if (toggles.napUnavailable) {
    return {
      kind: "nap", startMin: start, available: true,
      title: "Вместо дневного сна",
      detail: "Вздремнуть нельзя — посиди 3–5 минут с закрытыми глазами или спокойно подыши, и пройдись в перерыв.",
      why: "Даже короткий отдых и движение помогают, когда поспать не получается",
      refs: ["T5"],
    };
  }
  const coffee = mode === "recovery" || badNight;
  return {
    kind: coffee ? "coffee_nap" : "nap", startMin: start, endMin: end, available: true,
    title: coffee ? "Кофе-нап" : "Короткий нап",
    detail: coffee ? "200 мг кофеина → сразу лечь → будильник 15–20 мин" : "10–20 мин сна (будильник ~20 мин)",
    why: coffee
      ? "Кофе-нап даёт максимум бодрости: кофеин срабатывает к пробуждению"
      : "Короткий нап 10–20 мин восстанавливает бодрость без инерции сна",
    refs: coffee ? ["T5", "T14"] : ["T5"],
  };
}
