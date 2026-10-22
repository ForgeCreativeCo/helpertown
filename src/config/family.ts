/**
 * Family names used in spoken lines and on license plates.
 * `npm run voices` generates named lines for childName and every grandpa name.
 * The parent menu can override both on the tablet; lines without a matching
 * named voice file fall back to their name-free version.
 */
export const family = {
  /** Leave empty until it's set; name-free lines play instead. */
  childName: '',
  grandpaNames: ['Pops', 'Pappa'],
} as const;

export type GrandpaName = (typeof family.grandpaNames)[number];
