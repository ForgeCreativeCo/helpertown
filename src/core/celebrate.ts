import { woodFrame } from '../art/frames';
import type { Pops } from '../art/pops';
import { stickerArt } from '../art/stickers';
import { lineId } from '../content/lines';
import type { StickerId } from '../content/stickers';
import { bounce, flyArc, placeAt, popIn } from './anim';
import { photoUrl } from './photos';
import type { SceneContext } from './scenes';
import { s } from './svg';

export interface CelebrateOptions {
  pops: Pops;
  svg: SVGSVGElement;
  /** Sticker earned this round; it pops up big, then flies toward the toolbox. */
  sticker?: StickerId;
  /** Where the reward flies (stage coords). Defaults to the hub toolbox, bottom left. */
  flyTo?: { x: number; y: number };
}

const CONFETTI = 36;
const COLORS = ['#e4473b', '#3d7fe0', '#f2b33d', '#3fae5a', '#e85fa4', '#8b5cd6', '#f07f2a'];

/** Confetti falls once (no strobing), then removes itself. */
function confetti(svg: SVGSVGElement): void {
  const layer = s('g', { class: 'no-hit' });
  svg.append(layer);
  let left = CONFETTI;
  for (let i = 0; i < CONFETTI; i++) {
    const color = COLORS[i % COLORS.length]!;
    const piece =
      i % 3 === 0
        ? s('circle', { cx: 0, cy: 0, r: 9, fill: color })
        : s('rect', { x: -8, y: -12, width: 16, height: 24, rx: 4, fill: color });
    layer.append(piece);
    const x = -80 + Math.random() * 1440;
    const drift = (Math.random() - 0.5) * 240;
    const spin = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360);
    const a = piece.animate(
      [
        { transform: `translate(${x}px, -60px) rotate(0deg)` },
        { transform: `translate(${x + drift}px, 880px) rotate(${spin}deg)` },
      ],
      { duration: 1800 + Math.random() * 1000, delay: Math.random() * 400, easing: 'cubic-bezier(.3,.1,.6,1)', fill: 'both' },
    );
    a.onfinish = a.oncancel = () => {
      piece.remove();
      if (--left === 0) layer.remove();
    };
  }
}

export async function celebrate(ctx: SceneContext, o: CelebrateOptions): Promise<void> {
  // The real Pops (if there's a photo) pops up and bounces along.
  void ctx.guard(photoUrl('pops')).then((url) => {
    if (!url) return;
    const frame = woodFrame(url, 1020, 70, 190, 160);
    o.svg.append(frame);
    popIn(frame, 500);
    for (let i = 1; i <= 3; i++) ctx.after(i * 650, () => bounce(frame, 26));
  });
  o.pops.pose('cheering');
  confetti(o.svg);
  ctx.sfx('fanfare');
  bounce(o.pops.body, 30);
  ctx.after(600, () => bounce(o.pops.body, 30));
  await ctx.speak('round.great');

  if (o.sticker) {
    const art = stickerArt(o.sticker);
    art.setAttribute('class', 'tf');
    const holder = s('g', { class: 'no-hit' }, [art]);
    o.svg.append(holder);
    const origin = { x: 50, y: 50 };
    const center = { x: 640, y: 330, scale: 2.4 };
    placeAt(holder, center, origin);
    popIn(art, 500);
    ctx.sfx('sparkle');
    await ctx.speak('round.sticker');
    await ctx.speak(lineId('sticker.say', o.sticker));
    const to = o.flyTo ?? { x: 215, y: 640 };
    ctx.sfx('whoosh');
    await ctx.guard(flyArc(holder, center, { ...to, scale: 0.5, rot: -10 }, origin, 800, 120));
    holder.remove();
  }
  await ctx.wait(250);
}
