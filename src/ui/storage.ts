import type { Profile, DayLog, ScreenerResult } from "../index.js";

export type StorageLike = { getItem(k: string): string | null; setItem(k: string, v: string): void };
export interface StoredState { profile: Profile; history: DayLog[]; screener: ScreenerResult | null }

const KEY = "pospat.state.v1";
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
