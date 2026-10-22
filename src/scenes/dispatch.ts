import { Pops } from '../art/characters';
import { dispatchScreen, emergencyArt, radioSet, RESCUE_BACKDROP, rescueBack, sideDesk } from '../art/rescue';
import { vehicleArt, VEHICLE_H, VEHICLE_W, type VehicleArt } from '../art/vehicles';
import { lineId, PRAISE_LINES } from '../content/lines';
import { emergencyFor, RESCUE_VEHICLES, type RescueId } from '../content/rescue';
import { bounce, fadeTo, finished, popIn } from '../core/anim';
import type { SfxName } from '../core/audio/sfx';
import { askQuestion, type Choice } from '../core/question';
import { nextTarget, pickChoices } from '../core/rounds';
import type { Scene, SceneContext } from '../core/scenes';
import type { ActivityId } from '../core/storage';
import { s, stageSvg } from '../core/svg';
import { characterLife, nextPraise } from './common';
import { finishWithBadge } from './rescue';

const QUESTIONS = 4;
const GROUND = 712;
const ROW = { left: 300, right: 1250 };

/** How each rescue vehicle sounds. */
export const RESCUE_SOUND: Record<RescueId, SfxName> = {
  fireTruck: 'siren',
  ambulance: 'wail',
  policeCar: 'whoop',
  towTruck: 'honk',
};

type Mode = 'dispatch' | 'sirens';

/**
 * Who Can Help: an emergency appears on the screen ("There's a fire! Which
 * truck do we need?") and he sends the right vehicle. Siren Sounds is the same
 * game by ear: Pops plays a siren on the radio and he picks who makes it.
 */
function rescueGame(mode: Mode): () => Scene {
  return () => ({
    backdrop: RESCUE_BACKDROP,
    mount(ctx) {
      const svg = stageSvg();
      const pops = new Pops(10, 250, 0.7);
      const screen = s('g');
      const row = s('g');
      svg.append(rescueBack(), pops.el, sideDesk(), screen, row);
      ctx.root.append(svg);
      characterLife(ctx, pops);
      void run(ctx, mode, svg, pops, screen, row).catch((err) => {
        console.error(err);
        ctx.go('rescue');
      });
    },
  });
}

export const dispatchScene = rescueGame('dispatch');
export const sirensScene = rescueGame('sirens');

async function run(ctx: SceneContext, mode: Mode, svg: SVGSVGElement, pops: Pops, screen: SVGGElement, row: SVGGElement): Promise<void> {
  const track = `${mode}.choices`;
  const activity: ActivityId = mode;
  ctx.difficulty.startRound(track, 2, 4);
  ctx.app.audio.preload([
    'rescue.sound',
    'rescue.badge',
    ...RESCUE_VEHICLES.flatMap((v) => [lineId('garage.name', v), lineId('rescue.ask', emergencyFor(v).id)]),
    ...PRAISE_LINES,
  ]);
  const asked: RescueId[] = [];

  if (mode === 'sirens') {
    // The radio sits on the screen's spot; it wiggles whenever a siren plays.
    const radio = s('g', { transform: 'translate(-60 -170) scale(1.3)' }, [radioSet()]);
    radio.firstElementChild!.setAttribute('class', 'tf-bottom');
    screen.append(radio);
    popIn(radio);
  } else {
    screen.append(dispatchScreen());
  }
  await ctx.wait(450);

  for (let q = 0; q < QUESTIONS; q++) {
    const target = nextTarget([...RESCUE_VEHICLES], asked);
    asked.push(target);
    const ids = pickChoices(target, [...RESCUE_VEHICLES], ctx.difficulty.choices(track));

    // The emergency picture (or the radio) comes first, then the vehicles roll in.
    let picture: SVGGElement | null = null;
    if (mode === 'dispatch') {
      picture = s('g', { transform: 'translate(480 178)' }, [emergencyArt(emergencyFor(target).id)]);
      screen.append(picture);
      popIn(picture);
      ctx.sfx('ding');
    }
    const scale = ids.length > 3 ? 0.44 : 0.52;
    const step = (ROW.right - ROW.left) / ids.length;
    const built = ids.map((id, i) => {
      const art = vehicleArt(id);
      const hit = s('rect', { x: -20, y: -30, width: VEHICLE_W + 40, height: VEHICLE_H + 50, rx: 40, fill: 'transparent' });
      const cx = ROW.left + step * (i + 0.5);
      const el = s('g', { transform: `translate(${cx - (VEHICLE_W * scale) / 2} ${GROUND - VEHICLE_H * scale}) scale(${scale})` }, [hit, art.body]);
      row.append(el);
      ctx.after(i * 120, () => popIn(art.body));
      return { id, el, art, cx, scale };
    });
    ctx.sfx('vroom');
    await ctx.wait(ids.length * 120 + 400);

    const radio = screen.querySelector<SVGGElement>('.tf-bottom');
    const playSound = () => {
      ctx.sfx(RESCUE_SOUND[target]);
      if (radio) bounce(radio, 14);
    };
    const choices: Choice[] = built.map((b) => ({
      el: b.el,
      art: b.art.body,
      correct: b.id === target,
      nameLine: lineId('garage.name', b.id),
      glow: { cx: VEHICLE_W / 2, cy: VEHICLE_H / 2, r: 260 },
      center: { x: b.cx, y: GROUND - (VEHICLE_H * b.scale) / 2 },
    }));
    const result = await askQuestion(ctx, {
      promptLine: mode === 'dispatch' ? lineId('rescue.ask', emergencyFor(target).id) : 'rescue.sound',
      choices,
      pops,
      svg,
      onPrompt: mode === 'sirens' ? playSound : undefined,
    });
    ctx.difficulty.record(track, 2, 4, result.firstTry);

    // Off it goes, lights and siren, to help.
    const chosen = built.find((b) => b.id === target)!;
    for (const b of built) if (b !== chosen) void finished(fadeTo(b.el, 1, 0, 250));
    ctx.sfx(RESCUE_SOUND[target]);
    pops.pose('cheering');
    await driveOff(ctx, chosen.art, chosen.el);
    if (picture) await finished(fadeTo(picture, 1, 0, 250));
    picture?.remove();
    pops.pose('thumbsUp');
    await ctx.speak(nextPraise());
    pops.pose('idle');
    row.replaceChildren();
  }

  await finishWithBadge(ctx, activity, pops, svg);
}

/** The vehicle zooms off to the right with its wheels spinning. */
async function driveOff(ctx: SceneContext, art: VehicleArt, el: SVGGElement): Promise<void> {
  for (const w of art.spinners) w.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(720deg)' }], { duration: 1100 });
  const drive = art.body.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(-30px)', offset: 0.15 }, { transform: 'translateX(2400px)' }], {
    duration: 1300,
    easing: 'ease-in',
    fill: 'forwards',
  });
  await ctx.guard(finished(drive));
  el.remove();
}
