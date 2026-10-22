import { family } from '../config/family';
import { getIngredient } from '../content/ingredients';
import { expandLines, namedVariantId, spokenText, type LineGroup } from '../content/lines';
import { STICKERS } from '../content/stickers';
import { getTool } from '../content/tools';
import { VEHICLES } from '../content/vehicles';
import { blobs } from '../core/db';
import { forgetPhoto, photoUrl, preparePhoto, type PhotoId } from '../core/photos';
import { ingredientAccuracy, toolAccuracy } from '../core/progress';
import type { App } from '../core/scenes';
import { playedInLast } from '../core/session';
import { DIFFICULTIES, localDate, SESSION_MINUTES, type DifficultySetting, type SessionMinutes } from '../core/storage';
import { h, minutes } from './dom';
import { canRecord, MAX_RECORD_MS, Recorder } from './recorder';

const GROUP_LABELS: Record<LineGroup, string> = {
  start: 'Hello',
  hub: 'Workshop',
  pops: 'Tapping Pops',
  fetch: 'Fetch the Tool',
  fixit: 'Fix It',
  toolwall: 'Tool Wall',
  garage: 'My Garage',
  praise: 'Praise',
  round: 'End of a round',
  sticker: 'Stickers',
  idle: 'Idle',
  winddown: 'Goodbye',
  town: 'Town map',
  kitchen: 'Mama’s Kitchen',
};

/** The parent menu. Everything here is for grown-ups, so it's plain text and form controls. */
export function openMenu(app: App, onClose: () => void): void {
  const recorder = new Recorder();
  const close = () => {
    recorder.release();
    root.remove();
    onClose();
  };

  const sections = [
    ['settings', 'Settings', settingsSection(app)],
    ['photos', 'Photos', photosSection()],
    ['voices', 'Voices', voicesSection(app, recorder)],
    ['progress', 'Progress', progressSection(app)],
    ['reset', 'Reset', resetSection(app)],
  ] as const;

  const root = h('div', { class: 'parent-menu', 'data-native': true }, [
    h('header', {}, [
      h('h1', { text: 'Helper Town · Grown-ups' }),
      h('button', { class: 'primary', text: 'Back to the game', onClick: close }),
    ]),
    h(
      'nav',
      {},
      sections.map(([id, label]) =>
        h('button', { text: label, onClick: () => root.querySelector(`#pm-${id}`)?.scrollIntoView({ behavior: 'smooth' }) }),
      ),
    ),
    ...sections.map(([id, label, body]) => h('section', { id: `pm-${id}` }, [h('h2', { text: label }), body])),
  ]);
  document.body.append(root);
}

function field(label: string, control: HTMLElement, hint?: string): HTMLElement {
  return h('label', { class: 'field' }, [h('span', { text: label }), control, hint ? h('small', { text: hint }) : null]);
}

function select<T extends string | number>(options: readonly { value: T; label: string }[], current: T, onChange: (v: T) => void) {
  const el = h(
    'select',
    { onChange: () => onChange(options[el.selectedIndex]!.value) },
    options.map((o) => h('option', { text: o.label, selected: o.value === current })),
  );
  return el;
}

function settingsSection(app: App): HTMLElement {
  const { store, audio } = app;
  const s = store.settings;
  const applyNames = () => audio.setNames({ child: store.settings.childName, grandpa: store.settings.grandpaName });
  const applyVolumes = () => audio.setVolumes(store.settings.voiceVolume, store.settings.sfxVolume);

  const name = h('input', {
    type: 'text',
    value: s.childName,
    maxlength: 30,
    autocomplete: 'off',
    onInput: () => {
      store.update((d) => (d.settings.childName = name.value.trim()));
      applyNames();
    },
  });
  const range = (value: number, onInput: (v: number) => void) => {
    const el = h('input', { type: 'range', min: 0, max: 100, value: Math.round(value * 100), onInput: () => onInput(Number(el.value) / 100) });
    return el;
  };
  const music = h('input', {
    type: 'checkbox',
    checked: s.music,
    onChange: () => {
      store.update((d) => (d.settings.music = music.checked));
      audio.setMusic(music.checked);
    },
  });

  return h('div', { class: 'card' }, [
    field('Child’s name', name, 'Used in spoken lines and as the initial on his license plates. Named lines only play if a voice file with this name exists; otherwise the name-free line plays.'),
    field(
      'Grandpa’s name',
      select(
        family.grandpaNames.map((n) => ({ value: n as string, label: n })),
        s.grandpaName,
        (v) => {
          store.update((d) => (d.settings.grandpaName = v));
          applyNames();
        },
      ),
    ),
    field(
      'Difficulty',
      select(
        DIFFICULTIES.map((d) => ({ value: d, label: d === 'auto' ? 'Auto (adjusts to him)' : `Always ${d} choices` })),
        s.difficulty,
        (v: DifficultySetting) => store.update((d) => (d.settings.difficulty = v)),
      ),
      'Auto starts at 2 choices and adds one after 3 right answers in a row.',
    ),
    field(
      'Session length',
      select(
        SESSION_MINUTES.map((m) => ({ value: m, label: m === 0 ? 'Off (no limit)' : `${m} minutes` })),
        s.sessionMinutes,
        (v: SessionMinutes) => store.update((d) => (d.settings.sessionMinutes = v)),
      ),
      'When time is up, he finishes the round he’s in, Pops says goodbye, and the game rests until tomorrow or until you open this menu.',
    ),
    field(
      'Voice volume',
      range(s.voiceVolume, (v) => {
        store.update((d) => (d.settings.voiceVolume = v));
        applyVolumes();
      }),
    ),
    field(
      'Sound effects volume',
      range(s.sfxVolume, (v) => {
        store.update((d) => (d.settings.sfxVolume = v));
        applyVolumes();
      }),
    ),
    h('label', { class: 'field inline' }, [music, h('span', { text: 'Gentle background music' })]),
  ]);
}

function photosSection(): HTMLElement {
  const card = (id: PhotoId, title: string, where: string) => {
    const img = h('img', { alt: '' });
    const empty = h('div', { class: 'photo-empty', text: 'No photo yet' });
    const status = h('small', {});
    const refresh = async () => {
      const url = await photoUrl(id);
      img.hidden = !url;
      empty.hidden = !!url;
      if (url) img.src = url;
    };
    const input = h('input', {
      type: 'file',
      accept: 'image/*',
      hidden: true,
      onChange: async () => {
        const file = input.files?.[0];
        if (!file) return;
        status.textContent = 'Saving…';
        try {
          await blobs.put('photos', id, await preparePhoto(file));
          forgetPhoto(id);
          status.textContent = 'Saved.';
          await refresh();
        } catch (err) {
          status.textContent = `Couldn’t use that picture (${err instanceof Error ? err.message : err}).`;
        }
        input.value = '';
      },
    });
    void refresh();
    return h('div', { class: 'card photo-card' }, [
      h('h3', { text: title }),
      h('p', { text: where }),
      h('div', { class: 'photo-frame' }, [img, empty]),
      h('div', { class: 'row' }, [
        h('button', { class: 'primary', text: 'Choose photo', onClick: () => input.click() }),
        h('button', {
          text: 'Remove',
          onClick: async () => {
            await blobs.delete('photos', id);
            forgetPhoto(id);
            status.textContent = 'Removed.';
            await refresh();
          },
        }),
      ]),
      status,
      input,
    ]);
  };
  return h('div', {}, [
    h('p', { text: 'Photos are kept on this tablet only. To include them in the app for every tablet, add pops.jpg and child.jpg to public/family/ (see README).' }),
    h('div', { class: 'grid' }, [
      card('pops', 'The real Pops', 'Hangs framed on the workshop wall and pops up in every celebration.'),
      card('child', 'Your helper', 'Wears a hard hat in his garage.'),
    ]),
  ]);
}

function voicesSection(app: App, recorder: Recorder): HTMLElement {
  const { audio, store } = app;
  const names = () => ({ child: store.settings.childName, grandpa: store.settings.grandpaName });
  const supported = canRecord();
  let active: { stop: () => Promise<void> } | null = null;

  const groups = new Map<LineGroup, HTMLElement[]>();
  for (const line of expandLines()) {
    // Record the exact version the game would play with the current names.
    const id = namedVariantId(line, names()) ?? line.id;
    const badge = h('span', { class: 'badge', text: 'Recorded' });
    badge.hidden = !audio.hasParentRecording(id);
    const recBtn = h('button', { text: 'Record', disabled: !supported });
    const playBtn = h('button', {
      text: 'Play',
      onClick: async () => {
        const blob = audio.hasParentRecording(id) ? await blobs.get('recordings', id) : undefined;
        if (blob) {
          const url = URL.createObjectURL(blob);
          const player = new Audio(url);
          player.onended = () => URL.revokeObjectURL(url);
          void player.play();
        } else {
          void audio.speak(line.id, { replaceQueued: true });
        }
      },
    });
    const delBtn = h('button', {
      text: 'Delete',
      onClick: async () => {
        await blobs.delete('recordings', id);
        await audio.refreshParentRecordings();
        badge.hidden = true;
      },
    });
    const stop = async () => {
      const blob = await recorder.stop();
      recBtn.textContent = 'Record';
      recBtn.classList.remove('recording');
      active = null;
      if (blob.size > 0) {
        await blobs.put('recordings', id, blob);
        await audio.refreshParentRecordings();
        badge.hidden = false;
      }
    };
    recBtn.addEventListener('click', async () => {
      if (active && recBtn.classList.contains('recording')) return void active.stop();
      if (active) await active.stop();
      try {
        await recorder.start(() => void stop());
        active = { stop };
        recBtn.textContent = 'Stop';
        recBtn.classList.add('recording');
      } catch (err) {
        recBtn.textContent = 'Mic blocked';
        console.warn(err);
      }
    });
    const row = h('div', { class: 'voice-row' }, [
      h('div', { class: 'voice-text' }, [h('span', { text: spokenText(line, names()) }), badge]),
      h('div', { class: 'row' }, [recBtn, playBtn, delBtn]),
    ]);
    const list = groups.get(line.group) ?? [];
    list.push(row);
    groups.set(line.group, list);
  }

  return h('div', {}, [
    h('p', {
      text: `Record any line in your own voice (up to ${MAX_RECORD_MS / 1000} seconds); it plays instead of the generated voice. Tap Record, say the line, tap Stop. Play lets you hear what the game will use.`,
    }),
    h('p', {
      class: 'note',
      text: 'Recordings made here stay on this tablet only. To use the same recordings on every tablet, save them as files named by line and bundle them into the app (see “Adding bundled recordings” in the README).',
    }),
    supported
      ? null
      : h('p', {
          class: 'warn',
          text: 'Recording needs the secure (https) version of the app, like the installed Netlify app or `npm run dev:https`. Playing still works here.',
        }),
    ...[...groups.entries()].map(([group, rows]) =>
      h('details', {}, [h('summary', { text: `${GROUP_LABELS[group]} (${rows.length})` }), ...rows]),
    ),
  ]);
}

function progressSection(app: App): HTMLElement {
  const p = app.store.progress;
  const now = new Date();
  const rounds = (id: 'fetch' | 'fixit' | 'toolwall' | 'cook') => String(p.rounds[id] ?? 0);
  const collected = VEHICLES.filter((v) => p.garage[v.id]).length;
  return h('div', { class: 'grid' }, [
    h('div', { class: 'card' }, [
      h('h3', { text: 'Time played' }),
      h('p', { text: `Today: ${minutes(playedInLast(p, 1, now, localDate))}` }),
      h('p', { text: `This week: ${minutes(playedInLast(p, 7, now, localDate))}` }),
      h('small', { text: 'Only counts time he’s actively playing.' }),
    ]),
    h('div', { class: 'card' }, [
      h('h3', { text: 'Rounds played' }),
      h('p', { text: `Fetch the Tool: ${rounds('fetch')}` }),
      h('p', { text: `Fix It: ${rounds('fixit')}` }),
      h('p', { text: `Tool Wall: ${rounds('toolwall')}` }),
      h('p', { text: `Cooking with Mama: ${rounds('cook')}` }),
      h('p', { text: `Garage: ${collected} of ${VEHICLES.length} vehicles · Stickers: ${p.stickers.length} (${STICKERS.length} kinds) · Fridge magnets: ${p.magnets.length}` }),
    ]),
    accuracyTable(
      'Which tools he knows',
      toolAccuracy(p).map((r) => ({ name: getTool(r.id).name, asked: r.asked, accuracy: r.accuracy })),
    ),
    accuracyTable(
      'Which ingredients he knows',
      ingredientAccuracy(p).map((r) => ({ name: getIngredient(r.id).name, asked: r.asked, accuracy: r.accuracy })),
    ),
  ]);
}

/** First-try accuracy as a small table (tools, ingredients). */
function accuracyTable(title: string, rows: { name: string; asked: number; accuracy: number }[]): HTMLElement {
  return h('div', { class: 'card wide' }, [
    h('h3', { text: title }),
    h('small', { text: 'First-try accuracy: how often he picked the right one on his first tap.' }),
    h('table', {}, [
      h('tr', {}, [h('th', { text: 'Name' }), h('th', { text: 'Asked' }), h('th', { text: 'First try' })]),
      ...rows.map((r) =>
        h('tr', {}, [
          h('td', { text: r.name }),
          h('td', { text: String(r.asked) }),
          h('td', {}, [
            r.asked
              ? h('span', { class: 'bar' }, [h('span', { style: `width:${Math.round(r.accuracy * 120)}px` }), `${Math.round(r.accuracy * 100)}%`])
              : '—',
          ]),
        ]),
      ),
    ]),
  ]);
}

function resetSection(app: App): HTMLElement {
  let armed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const status = h('small', {});
  const btn = h('button', {
    class: 'danger',
    text: 'Reset progress',
    onClick: () => {
      if (!armed) {
        armed = true;
        btn.textContent = 'Tap again to confirm';
        timer = setTimeout(() => {
          armed = false;
          btn.textContent = 'Reset progress';
        }, 5000);
        return;
      }
      clearTimeout(timer);
      app.store.reset();
      armed = false;
      btn.textContent = 'Reset progress';
      status.textContent = 'Progress reset. Settings, photos and recordings were kept.';
    },
  });
  return h('div', { class: 'card' }, [
    h('p', { text: 'Clears stickers, fridge magnets, garage, what he’s learned, difficulty and time played. Settings, photos and recordings stay.' }),
    btn,
    status,
  ]);
}
