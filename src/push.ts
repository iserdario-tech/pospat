import type { PlanWindow, WindowKind } from "./types.js";

// Какие окна шлём пушем (бюджет уведомлений — только ключевые)
export const PUSH_WINDOWS: WindowKind[] = [
  "morning_light", "caffeine_last", "nap", "coffee_nap", "target_bed",
];

// Окна, чьё время наступило в последнем интервале [nowMin - slotMin, nowMin].
export function dueWindows(
  windows: PlanWindow[], nowMin: number, slotMin: number, allow: WindowKind[] = PUSH_WINDOWS,
): PlanWindow[] {
  return windows.filter((w) => {
    if (!allow.includes(w.kind)) return false;
    const s = ((w.startMin % 1440) + 1440) % 1440;
    return s > nowMin - slotMin && s <= nowMin;
  });
}
