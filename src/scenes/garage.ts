import { hardHatPhoto } from '../art/frames';
import { INK } from '../art/palette';
import { starPath } from '../art/stickers';
import { addPlate, vehicleArt, VEHICLE_H, VEHICLE_W } from '../art/vehicles';
import { GARAGE_SPOTS, garageBackground, homeButton } from '../art/workshop';
import { lineId } from '../content/lines';
import { VEHICLES } from '../content/vehicles';
import { bounce, breathe, wiggle } from '../core/anim';
import { photoUrl } from '../core/photos';
import type { Scene } from '../core/scenes';
import { timeUp } from '../core/session';
import { localDate } from '../core/storage';
import { s, stageSvg } from '../core/svg';

const SCALE = 0.5;
const MAX_STARS = 5;

/**
 * My Garage: a parking spot for every vehicle. The ones he fixed sit in their
 * spots with his initial on the plate; the rest are faint dotted outlines.
 */
export function garageScene(): Scene {
  return {
    backdrop: '#a7b0b8',
    mount(ctx) {
      const svg = stageSvg();
      svg.append(garageBackground());
      ctx.root.append(svg);

      const { garage } = ctx.progress;
      const initial = ctx.app.store.settings.childName.trim().charAt(0);
      VEHICLES.forEach((v, i) => {
        const spot = GARAGE_SPOTS[i]!;
        const art = vehicleArt(v.id);
        const parked = garage[v.id];
        const hit = s('rect', { x: -30, y: -40, width: VEHICLE_W + 60, height: VEHICLE_H + 60, rx: 50, fill: 'transparent' });
        const el = s('g', { transform: `translate(${spot.x - (VEHICLE_W * SCALE) / 2} ${spot.ground - VEHICLE_H * SCALE}) scale(${SCALE})` }, [
          hit,
          art.body,
        ]);
        svg.append(el);
        if (!parked) {
          art.body.classList.add('ghost');
          return;
        }
        if (initial) addPlate(art, initial);
        addStars(art.body, parked.stars);
        ctx.tap(el, () => {
          bounce(art.body, 30);
          art.testPart();
          ctx.sfx(v.test);
          void ctx.speak(lineId('garage.name', v.id), { replaceQueued: true });
        });
      });

      // The way back to the workshop.
      const home = homeButton(130, 118);
      home.setAttribute('class', 'tf');
      const homeHit = s('g', {}, [s('circle', { cx: 130, cy: 118, r: 86, fill: 'transparent' }), home]);
      svg.append(homeHit);
      ctx.keep(breathe(home, 0.05, 2000));
      ctx.tap(homeHit, () => {
        wiggle(home);
        ctx.sfx('tap');
        void ctx.speak('nav.home', { replaceQueued: true }).then(() => ctx.go('hub', { from: { x: 130, y: 118 } }));
        ctx.app.input.lock();
        ctx.onCleanup(() => ctx.app.input.unlock());
      });

      // His photo in a hard hat, if one was added.
      void ctx.guard(photoUrl('child')).then((url) => {
        if (!url) return;
        const frame = hardHatPhoto(url, 1010, 128, 66);
        svg.append(frame);
        ctx.keep(breathe(frame, 0.03, 2600));
      });

      // No rounds here, so if the session ends, head back to the workshop to wind down.
      const watch = () => {
        if (timeUp(ctx.progress, ctx.app.store.settings.sessionMinutes, localDate())) ctx.go('hub');
        else ctx.after(5000, watch);
      };
      ctx.after(5000, watch);

      const any = VEHICLES.some((v) => garage[v.id]);
      ctx.after(300, () => void ctx.speak(any ? 'garage.welcome' : 'garage.empty'));
    },
  };
}

/** Gold stars above a vehicle, one per extra time he fixed it. */
function addStars(body: SVGGElement, count: number): void {
  const n = Math.min(count, MAX_STARS);
  for (let i = 0; i < n; i++) {
    const x = VEHICLE_W / 2 + (i - (n - 1) / 2) * 76;
    body.append(s('path', { d: starPath(x, -34, 30), fill: '#ffd34d', stroke: INK, 'stroke-width': 7, 'stroke-linejoin': 'round' }));
  }
}

