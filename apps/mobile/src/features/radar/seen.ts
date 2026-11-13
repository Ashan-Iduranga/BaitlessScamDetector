import Storage from 'expo-sqlite/kv-store';

import type { TrendingScam } from './api';

/**
 * The newest "confirmed" time the user has already been told about (by a notification or by
 * opening Scam Radar). Anything confirmed later is new.
 */
const LAST_SEEN_KEY = 'radar.lastSeenConfirmedAt';

export function lastSeenConfirmedAt(): number {
  const saved = Number(Storage.getItemSync(LAST_SEEN_KEY));
  return Number.isFinite(saved) ? saved : 0;
}

export function markSeen(at: number): void {
  if (at > lastSeenConfirmedAt()) Storage.setItemSync(LAST_SEEN_KEY, String(at));
}

const confirmedTime = (s: TrendingScam) => (s.confirmedAt ? Date.parse(s.confirmedAt) : 0);

export const newSince = (trending: TrendingScam[], since: number) =>
  trending.filter((s) => confirmedTime(s) > since);

export const newestConfirmed = (trending: TrendingScam[]) =>
  trending.reduce((max, s) => Math.max(max, confirmedTime(s)), 0);
