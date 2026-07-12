import type { Profile, DayLog, DayMode, DayToggles, ScreenerResult } from "../index.js";

export type StorageLike = { getItem(k: string): string | null; setItem(k: string, v: string): void };
export interface StoredState { profile: Profile; history: DayLog[]; screener: ScreenerResult | null }
// выбранный на сегодня контекст (режим + переключатели), чтобы не терялся при перезапуске PWA
export interface DayDraft { date: string; mode: DayMode; crunchEndHM: string; toggles: DayToggles }

const KEY = "pospat.state.v1";
const DAY_KEY = "pospat.day.v1";
function defaultStore(): StorageLike {
  return typeof localStorage !== "undefined"
    ? localStorage
    : { getItem: () => null, setItem: () => {} };
}
export function saveState(s: StoredState, store: StorageLike = defaultStore()): void {
  store.setItem(KEY, JSON.stringify(s));
}
export function loadState(store: StorageLike = defaultStore()): StoredState | null {
  const raw = store.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as StoredState; } catch { return null; }
}
export function saveDayDraft(d: DayDraft, store: StorageLike = defaultStore()): void {
  store.setItem(DAY_KEY, JSON.stringify(d));
}
// вернёт черновик только если он за сегодня — вчерашний контекст не тянем
export function loadDayDraft(date: string, store: StorageLike = defaultStore()): DayDraft | null {
  const raw = store.getItem(DAY_KEY);
  if (!raw) return null;
  try { const d = JSON.parse(raw) as DayDraft; return d?.date === date ? d : null; } catch { return null; }
}
