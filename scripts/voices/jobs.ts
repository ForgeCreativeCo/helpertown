import { family } from '../../src/config/family.ts';
import { expandLines, namedVariantId, spokenText, type Line } from '../../src/content/lines.ts';

export interface VoiceJob {
  /** Voice file id (file name without extension). */
  id: string;
  text: string;
}

/**
 * Every voice file the game can use: each line's name-free version, plus a
 * named version for the configured child name and every grandpa name.
 */
export function voiceJobs(
  lines: Line[] = expandLines(),
  childName: string = family.childName,
  grandpaNames: readonly string[] = family.grandpaNames,
): VoiceJob[] {
  const jobs = new Map<string, VoiceJob>();
  for (const line of lines) {
    jobs.set(line.id, { id: line.id, text: line.plain });
    if (!line.usesChild && !line.usesGrandpa) continue;
    for (const grandpa of line.usesGrandpa ? grandpaNames : ['']) {
      const names = { child: childName, grandpa };
      const id = namedVariantId(line, names);
      if (id) jobs.set(id, { id, text: spokenText(line, names) });
    }
  }
  return [...jobs.values()];
}
