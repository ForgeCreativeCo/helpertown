/** Pure helpers for planning rounds: which item to ask for, and what to show. */
export type Rng = () => number;

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function pick<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)]!;
}

/**
 * Picks `count` targets from the pool: never the same one twice in a row,
 * spread across the pool, optionally starting with a given one (a new tool).
 */
export function planTargets<T>(pool: readonly T[], count: number, rng: Rng = Math.random, first?: T): T[] {
  if (pool.length === 0) return [];
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    out.push(i === 0 && first !== undefined && pool.includes(first) ? first : nextTarget(pool, out, rng));
  }
  return out;
}

/**
 * The next target given what's been asked so far this round: not the previous
 * one, and one of the least-asked.
 */
export function nextTarget<T>(pool: readonly T[], asked: readonly T[], rng: Rng = Math.random): T {
  const prev = asked[asked.length - 1];
  const options = pool.length > 1 ? pool.filter((t) => t !== prev) : [...pool];
  const count = (t: T) => asked.filter((a) => a === t).length;
  const least = Math.min(...options.map(count));
  return pick(
    options.filter((t) => count(t) === least),
    rng,
  );
}

/** The target plus distractors from the pool, shuffled. Never more than the pool holds. */
export function pickChoices<T>(target: T, pool: readonly T[], count: number, rng: Rng = Math.random): T[] {
  const others = shuffle(
    pool.filter((t) => t !== target),
    rng,
  );
  const n = Math.max(1, Math.min(count, pool.length));
  return shuffle([target, ...others.slice(0, n - 1)], rng);
}
