import type { DayToggles, PlanWindow } from "./types.js";
import { DEFAULTS } from "./defaults.js";

export function lightWindows(args: {
  wakeMin: number; bedMin: number; toggles: DayToggles; recovery: boolean;
}): PlanWindow[] {
  const { wakeMin, bedMin, toggles, recovery } = args;
  const morning: PlanWindow = toggles.noBrightLight
    ? {
        kind: "morning_light", startMin: wakeMin, endMin: wakeMin + DEFAULTS.morningLightWindowMin,
        available: true, title: "Вместо яркого света",
        detail: "Яркого света нет — выйди на улицу в перерыв или включи лампу поярче.",
        why: "Свет по утрам бодрит и настраивает внутренние часы; без него эффект слабее", refs: ["T7"],
      }
    : {
        kind: "morning_light", startMin: wakeMin, endMin: wakeMin + DEFAULTS.morningLightWindowMin,
        available: true, title: recovery ? "Свет-удар с утра" : "Утренний свет",
        detail: DEFAULTS.morningLightDoText,
        why: "Утренний яркий свет бодрит и сдвигает циркадную фазу; в день восстановления ещё и ре-анкорит ритм",
        refs: recovery ? ["T7", "T35"] : ["T7"],
      };
  const dip: PlanWindow = {
    kind: "afternoon_dip", startMin: wakeMin + 9 * 60, available: true,
    title: "Дневной спад", detail: "Свет/движение/прогулка вместо позднего кофе",
    why: "В послеобеденный провал свет и движение бодрят без вреда ночному сну", refs: ["T7", "T13"],
  };
  return [morning, dip];
}
