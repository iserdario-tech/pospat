import type { DayPlan, Readiness, WindowKind } from "../index.js";
import { fmtHM } from "../index.js";

export interface PlanRow {
  time: string; endTime?: string; icon: string; title: string; detail: string; why: string;
}
export interface PlanView {
  readiness: { level: Readiness; label: string; color: string; whyRU: string; priorityRU: string };
  rows: PlanRow[]; notes: string[];
}
const ICONS: Record<WindowKind, string> = {
  morning_light: "☀️", caffeine_last: "☕", caffeine_boost: "⚡", nap: "😴",
  coffee_nap: "☕😴", afternoon_dip: "🚶", warm_shower: "🚿", winddown: "🌙", target_bed: "🛌",
};
const READINESS: Record<Readiness, { label: string; color: string }> = {
  charged: { label: "Бодрый", color: "#3fb950" },
  ok: { label: "Норма", color: "#d29922" },
  in_debt: { label: "Недосып", color: "#f85149" },
};
// "03:00 (+1)" -> "03:00 ночью" — понятнее, чем технический (+1)
const nice = (min: number): string => fmtHM(min).replace(" (+1)", " ночью");

export function toPlanView(plan: DayPlan): PlanView {
  const rows: PlanRow[] = plan.windows.map((w) => ({
    time: nice(w.startMin),
    endTime: w.endMin != null ? nice(w.endMin) : undefined,
    icon: ICONS[w.kind],
    title: w.title, detail: w.detail, why: w.why,
  }));
  const r = READINESS[plan.readiness.level];
  return {
    readiness: { level: plan.readiness.level, label: r.label, color: r.color,
      whyRU: plan.readiness.whyRU, priorityRU: plan.readiness.priorityRU },
    rows, notes: plan.notesRU,
  };
}
