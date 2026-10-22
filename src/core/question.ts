import type { Character } from '../art/characters';
import { bounce, wiggle } from './anim';
import { IDLE_STEPS, wrongTapResponse } from './errorless';
import { addGlow } from './glow';
import { showPause } from './pause';
import type { SceneContext } from './scenes';

export interface Choice {
  /** The tap target (positioned group). */
  el: SVGGElement;
  /** The art inside it, which wobbles and bounces. */
  art: SVGGElement;
  correct: boolean;
  /** Line the item says when tapped by mistake ("That's the saw!"). */
  nameLine?: string;
  /** Hint position and size, in the target's own coordinates. */
  glow: { cx: number; cy: number; r: number };
  /** Draw the hint as a ring on top instead of a halo behind (for spots on a vehicle). */
  glowRing?: boolean;
  /** Stage point Pops points at. */
  center: { x: number; y: number };
}

export interface QuestionOptions {
  promptLine: string;
  choices: Choice[];
  pops: Character;
  svg: SVGSVGElement;
  /** Don't speak the prompt right away (it's only repeated if he goes idle). */
  silentStart?: boolean;
  /** Show the hint glow from the start ("tap the glowing spot"). */
  glowFromStart?: boolean;
  /** The idle check-in line (default Pops' "Are you still there?"). */
  stillThereLine?: string;
}

export interface QuestionResult {
  firstTry: boolean;
  choice: Choice;
}

/**
 * Asks one errorless question and resolves when the right answer is tapped.
 * Handles wrong taps (name, then glow, then Pops points and locks the rest),
 * tap-Pops-to-repeat, and idle help (repeat, hint, pause).
 */
export function askQuestion(ctx: SceneContext, q: QuestionOptions): Promise<QuestionResult> {
  const correct = q.choices.find((c) => c.correct)!;
  let wrong = 0;
  let done = false;
  let paused = false;
  let removeGlow: (() => void) | null = null;
  const offs: (() => void)[] = [];
  let idleCancels: (() => void)[] = [];

  const prompt = () => {
    if (q.pops.current === 'idle' || q.pops.current === 'asking') q.pops.pose('asking');
    void ctx.speak(q.promptLine).then(() => {
      if (!done && q.pops.current === 'asking') q.pops.pose('idle');
    });
  };

  const glow = () => {
    if (!removeGlow) {
      const { cx, cy, r } = correct.glow;
      removeGlow = addGlow(ctx, correct.el, cx, cy, r, correct.glowRing ? 'ring' : 'halo');
    }
    bounce(correct.art, 28);
  };

  const clearIdle = () => {
    for (const c of idleCancels) c();
    idleCancels = [];
  };

  const armIdle = () => {
    clearIdle();
    if (done || paused) return;
    idleCancels = IDLE_STEPS.map(({ at, step }) =>
      ctx.after(at, () => {
        if (done || paused) return;
        if (step === 'repeat') prompt();
        else if (step === 'hint') {
          glow();
          prompt();
        } else void pause();
      }),
    );
  };

  const pause = async () => {
    paused = true;
    clearIdle();
    await ctx.speak(q.stillThereLine ?? 'idle.stillThere', { replaceQueued: true });
    await showPause(ctx, q.svg);
    paused = false;
    prompt();
    armIdle();
  };

  return new Promise<QuestionResult>((resolve) => {
    const finish = (choice: Choice) => {
      done = true;
      clearIdle();
      removeGlow?.();
      for (const off of offs) off();
      for (const c of q.choices) ctx.setEnabled(c.el, false);
      ctx.app.audio.clearQueue();
      resolve({ firstTry: wrong === 0, choice });
    };

    for (const choice of q.choices) {
      offs.push(
        ctx.tap(choice.el, () => {
          if (done || paused) return;
          if (choice.correct) {
            finish(choice);
            return;
          }
          wrong++;
          ctx.sfx('boing');
          wiggle(choice.art);
          if (choice.nameLine) void ctx.speak(choice.nameLine, { replaceQueued: true });
          const help = wrongTapResponse(wrong);
          if (help.glow) glow();
          if (help.point) q.pops.pose('pointing', correct.center);
          if (help.onlyCorrect) for (const c of q.choices) if (!c.correct) ctx.setEnabled(c.el, false);
          void ctx.speak(q.promptLine);
        }),
      );
    }

    offs.push(
      ctx.tap(q.pops.el, () => {
        if (done || paused) return;
        bounce(q.pops.body, 20);
        if (wrong >= 3) q.pops.pose('pointing', correct.center);
        ctx.app.audio.clearQueue();
        prompt();
      }),
    );

    // Any tap restarts the idle clock.
    offs.push(
      ctx.onAnyTap(() => {
        if (!done && !paused) armIdle();
      }),
    );

    if (q.glowFromStart) glow();
    if (!q.silentStart) prompt();
    armIdle();
  });
}
