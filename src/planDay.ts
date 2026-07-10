import type { Profile, DayContext, LastNight, DayLog, DayPlan, PlanWindow } from "./types.js";
import { computeBedMin } from "./modes.js";
import { caffeineWindows } from "./caffeine.js";
import { napWindow } from "./nap.js";
import { lightWindows } from "./light.js";
import { winddownWindows } from "./winddown.js";
import { computeReadiness } from "./readiness.js";

export function planDay(args: {
  profile: Profile; ctx: DayContext; lastNight: LastNight; history: DayLog[];
}): DayPlan {
  const { profile, ctx, lastNight, history } = args;
  const mode = ctx.mode;
  const { wakeMin, bedMin, badNight } = computeBedMin({ profile, ctx, lastNight });

  const windows: PlanWindow[] = [];
  windows.push(...lightWindows({ wakeMin, bedMin, toggles: ctx.toggles, recovery: mode === "recovery" }));
  windows.push(...caffeineWindows({ profile, bedMin, mode, toggles: ctx.toggles, badNight }));
  const nap = napWindow({ profile, wakeMin, bedMin, mode, toggles: ctx.toggles, badNight });
  if (nap) windows.push(nap);
  windows.push(...winddownWindows({ bedMin, toggles: ctx.toggles }));

  windows.sort((a, b) => a.startMin - b.startMin);

  const readiness = computeReadiness({ profile, lastNight, history });

  const notesRU: string[] = [];
  for (const w of windows) if (!w.available && w.substitutedWith)
    notesRU.push(`${w.title}: заменено на «${w.substitutedWith}».`);
  if (mode === "crunch")
    notesRU.push("Режим аврала: сегодня минимизируем урон, завтра — день восстановления. Это долг сна.");
  if (mode === "recovery")
    notesRU.push("День восстановления: рычаги front-load, кофеин рано отсекаем. Реально восстановит только ночь.");

  return { date: ctx.date, mode, windows, readiness, notesRU };
}
