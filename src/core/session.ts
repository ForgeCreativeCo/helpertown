import type { Progress, SessionData } from './storage';

/**
 * Session wind-down rules, as functions over saved progress. Only active play
 * counts (the clock in main.ts skips hidden, idle and parent-menu time). When
 * the session length is up, the round in progress finishes first; then the
 * game winds down and rests until tomorrow or until a grown-up opens the menu.
 */

/** Today's session, starting fresh on a new day. */
export function currentSession(p: Progress, today: string): SessionData {
  if (p.session.date !== today) p.session = { date: today, ms: 0, resting: false };
  return p.session;
}

/** Adds active play time to today's total and today's session. */
export function addPlay(p: Progress, ms: number, today: string): void {
  p.playMs[today] = (p.playMs[today] ?? 0) + ms;
  currentSession(p, today).ms += ms;
}

/** True once the session has run its length (never when the limit is off). */
export function timeUp(p: Progress, minutes: number, today: string): boolean {
  return minutes > 0 && currentSession(p, today).ms >= minutes * 60_000;
}

export function isResting(p: Progress, today: string): boolean {
  return currentSession(p, today).resting;
}

export function startRest(p: Progress, today: string): void {
  currentSession(p, today).resting = true;
}

/** A grown-up opened the menu: playtime starts over. */
export function resetSession(p: Progress, today: string): void {
  p.session = { date: today, ms: 0, resting: false };
}

/** Total play over the last `days` days, today included. */
export function playedInLast(p: Progress, days: number, now: Date, dateOf: (d: Date) => string): number {
  let total = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    total += p.playMs[dateOf(d)] ?? 0;
  }
  return total;
}
