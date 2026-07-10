import type { DayToggles, PlanWindow } from "./types.js";
import { DEFAULTS } from "./defaults.js";

export function winddownWindows(args: { bedMin: number; toggles: DayToggles }): PlanWindow[] {
  const { bedMin, toggles } = args;
  const shower: PlanWindow = {
    kind: "warm_shower", startMin: bedMin - DEFAULTS.warmShowerBeforeBedMin, available: true,
    title: "Тёплый душ/ванна", detail: "10–15 мин, вода 40–42 °C",
    why: "Тёплый душ за ~90 мин ускоряет засыпание через сброс температуры тела", refs: ["T32"],
  };
  const wind: PlanWindow = {
    kind: "winddown", startMin: bedMin - DEFAULTS.winddownBeforeBedMin, available: true,
    title: "Wind-down", detail: toggles.eveningBusy
      ? "Короткий ритуал: тусклый свет + дыхание, телефон вне кровати"
      : "Тусклый свет, экраны вниз, дыхание/чтение, телефон вне кровати",
    why: "Приглушение света и снижение возбуждения готовят мозг ко сну", refs: ["T7", "T31", "T37"],
  };
  const bed: PlanWindow = {
    kind: "target_bed", startMin: bedMin, available: true,
    title: "Целевой отбой", detail: "Лечь в это время",
    why: "Стабильное время отбоя держит регулярность — рычаг №1", refs: ["T46"],
  };
  return [shower, wind, bed];
}
