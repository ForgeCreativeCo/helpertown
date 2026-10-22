import { CHECK_COLORS, checkTap, newCheck } from './check';
import { h } from './dom';

const TIMEOUT_MS = 20_000;

/** Shows the grown-ups check. Resolves true if passed, false otherwise. */
export function showCheck(): Promise<boolean> {
  return new Promise((resolve) => {
    const state = newCheck();
    const target = CHECK_COLORS.find((c) => c.id === state.target)!;
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      root.remove();
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), TIMEOUT_MS);

    const squares = state.order.map((id) => {
      const c = CHECK_COLORS.find((x) => x.id === id)!;
      const b = h('button', {
        class: 'check-square',
        style: `background:${c.hex}`,
        'aria-label': c.label,
        onClick: () => {
          const r = checkTap(state, id);
          if (r === 'fail') finish(false);
          else if (r === 'pass') finish(true);
          else b.classList.add('hit');
        },
      });
      return b;
    });

    const root = h('div', { class: 'parent-check', 'data-native': true }, [
      h('div', { class: 'check-card' }, [
        h('h2', { text: 'Grown-ups only' }),
        h('p', {}, ['Tap the ', h('strong', { text: target.label.toUpperCase() }), ' square two times.']),
        h('div', { class: 'check-squares' }, squares),
        h('button', { class: 'link', text: 'Back to the game', onClick: () => finish(false) }),
      ]),
    ]);
    document.body.append(root);
  });
}
