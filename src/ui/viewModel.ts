import type { DayPlan, Readiness, WindowKind } from "../index.js";
import { fmtHM } from "../index.js";

export interface PlanRow {
  time: string; endTime?: string; icon: string; title: string; detail: string;
  why: string; refs: string[]; disabled: boolean; note?: string;
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
  charged: { label: "Заряжен", color: "#3fb950" },
  ok: { label: "Норма", color: "#d29922" },
  in_debt: { label: "В долге сна", color: "#f85149" },
};
export function toPlanView(plan: DayPlan): PlanView {
  const rows: PlanRow[] = plan.windows.map((w) => ({
    time: fmtHM(w.startMin),
    endTime: w.endMin != null ? fmtHM(w.endMin) : undefined,
    icon: ICONS[w.kind],
    title: w.title, detail: w.detail, why: w.why, refs: w.refs,
    disabled: !w.available, note: w.substitutedWith,
  }));
  const r = READINESS[plan.readiness.level];
  return {
    readiness: { level: plan.readiness.level, label: r.label, color: r.color,
      whyRU: plan.readiness.whyRU, priorityRU: plan.readiness.priorityRU },
    rows, notes: plan.notesRU,
  };
}
