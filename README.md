# Helper Town

A tap-only learning game for a little helper who can't read yet. He's Pops' helper in Pops' Workshop: Pops asks, he helps, things get fixed.

Built for Amazon Kids Fire tablets (Silk browser), works offline as a PWA. No ads, links, accounts, analytics or network requests after install.

**Status:** Milestone 1 (first playable). Start screen, the workshop hub with Pops, **Fetch the Tool** end to end, celebrations, toolbox stickers, adaptive difficulty and generated voices. Fix It, Tool Wall, My Garage and the parent menu come next.

## Running locally

Needs Node 20 or newer.

```bash
npm install
npm run dev
```

Open the printed `Local` URL. `npm run dev` also listens on your network (`--host`), so the tablet can open the `Network` URL (for example `http://192.168.1.20:5173`).

| Command | What it does |
|---|---|
| `npm run dev` | Dev server, reachable from the tablet over Wi-Fi |
| `npm run dev:https` | Same, over HTTPS with a self-signed certificate (needed for microphone recording on the tablet) |
| `npm run typecheck` | TypeScript, strict |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serves `dist/` (with the service worker) on your network |
| `npm run check` | Typecheck, lint, tests and build in one go |
| `npm run voices:setup` | One-time download of Piper, the free offline voice engine (optional) |
| `npm run voices` | Generate any missing voice files |

### Testing on the Fire tablet

- Use the tablet's **parent (adult) profile** in Silk for dev testing. An Amazon Kids profile only opens approved websites, so a LAN address usually won't work there; use the deployed Netlify URL for the Kids profile.
- Make sure the PC and tablet are on the same Wi-Fi. If the tablet can't connect, allow Node through the Windows firewall for private networks.
- `npm run dev:https` gives a `https://` address. Silk will warn about the self-signed certificate; continue past it. HTTPS is only needed to test microphone recording.
- Add `?debug` to the URL to see a dot for every touch: **green** = counted as a tap, **grey** = ignored (palm, edge, repeat, or during a transition). Handy for checking palm rejection. It also logs how each voice line played (`file`, `speech` or `silent`) to the browser console.
- In dev, `?gallery` shows every Pops pose, tool and sticker on one page.
- Progress (tools learned, difficulty, stickers) is saved on the device. Until the parent menu lands (Milestone 4), reset it by clearing the site's data in the browser settings.

## How it's built

Vite + TypeScript (strict), no UI framework: plain DOM, inline SVG and the Web Animations API.

```
src/
  main.ts               boot
  core/
    stage.ts            fixed 1280×800 logical stage, scaled to fit; scenery bleeds into letterbox
    tapGate.ts          pure mash-proof rules (palm bursts, big contacts, edges, debounce)
    input.ts            the one pointer handler; tap and hold targets, input lock
    audio/              voice queue + fallback chain, Web Audio engine, synthesized effects
    scenes.ts           scene manager, transitions, per-scene context with automatic cleanup
    question.ts         the shared errorless question (wrong-tap help, idle help, tap Pops to repeat)
    errorless.ts        the errorless and idle rules as data
    difficulty.ts       adaptive difficulty (pure)
    progress.ts         tool stats, tool introduction, stickers, rounds (pure)
    rounds.ts           picking targets and choices (pure)
    celebrate.ts        confetti, cheering Pops, reward flying home
    pause.ts, glow.ts   idle pause screen, hint halo
    storage.ts          settings + progress in localStorage (versioned, with migrations)
    db.ts               IndexedDB for recordings and photos
    anim.ts, svg.ts     motion and SVG helpers
  content/              tools, vehicles, stickers and voice lines as typed data
  config/family.ts      child and grandpa names
  art/                  original SVG art, drawn in code (Pops and his poses, tools, stickers, workshop)
  scenes/               start, hub, fetch (Fetch the Tool), gallery (dev only)
scripts/
  vite-asset-manifest.ts  lists the bundled voice files and photos at build time
  voices/                 voice generation (setup, engines, mp3 encoding)
public/audio/generated  generated voice files
public/audio/recorded   real recordings to bundle (override generated)
public/family/          bundled family photos
tests/                  Vitest
```

### Toddler rules the code enforces

- **Input** (`core/input.ts`, `core/tapGate.ts`): responds on pointerdown. Touches that land within 80 ms of another touch (a palm or several fingers), report a large contact area, or start in the outer 40 px of the screen are ignored. A resting palm does not block real taps. Repeat taps on the same thing within 400 ms are ignored, and nothing responds during scene transitions.
- **Scenes** (`core/scenes.ts`): each scene's taps, timers, waits and looping animations are cleaned up automatically when it leaves, and its pending async steps simply stop. Mashing during a transition is ignored, so nothing can be skipped or double-launched.
- **Voice** (`core/audio/`): one line at a time, never overlapping. For each line the game tries, in order:
  1. a parent recording made in the app (IndexedDB),
  2. a bundled recording in `public/audio/recorded/`,
  3. a generated file in `public/audio/generated/`,
  4. the browser's built-in speech,
  5. silence, after which the game carries on (the item glows and bounces).

  Within each source the named version (for example "Hi Sam! Let's help Pops!") wins over the name-free one. A build step lists which voice files exist, so the app never requests a missing file.
- **Errorless questions** (`core/question.ts`): a wrong tap makes the item say its name and wobble, then the question repeats. The second wrong tap makes the right answer bounce and glow. From the third, Pops points at it and it's the only thing that responds. With no taps: the question repeats after ~7 s, the answer glows after ~14 s, and after ~60 s Pops asks "Are you still there?" and the game rests behind a big play button. Tapping Pops repeats the question at any time.
- **Adaptive difficulty** (`core/difficulty.ts`): starts with 2 choices. 3 first-try right answers in a row add one (up to 4). 2 first-try misses in one round remove one (down to 2).

### Fetch the Tool

Pops asks for 4 tools per round, never the same one twice in a row. He starts with the hammer, wrench and screwdriver. When each tool in play has been found on the first try twice in a row, the next tool (saw, drill, air pump, paintbrush) is introduced: Pops shows it off and asks for it next. Each finished round earns a sticker that flies onto the toolbox in the workshop; tap a sticker to hear what it is. The toolbox shows the 4 newest.

### Voice line ids

Lines live in `src/content/lines.ts`. Each concrete line has a stable id that is also its file name:

- `pops.giggle.mp3`: a line with no names
- `fetch.ask.hammer.mp3`: a line with a variable, name-free version
- `start.hello__c-sam__g-pops.mp3`: the named version for child "Sam" and grandpa "Pops"

### Family names

Set `childName` in `src/config/family.ts`. Both grandpa names (`Pops`, `Pappa`) get their own voice files. Lines without a matching named file play their name-free version instead.

## Adding bundled recordings

Record each line on a phone, save it as mono mp3 (or ogg/m4a), name it by its line id (see above), and drop it into `public/audio/recorded/`. Rebuild and redeploy. Bundled recordings play on every tablet; recordings made in the parent menu stay on that one tablet.

## Adding bundled photos

Put `pops.jpg` and/or `child.jpg` (or `.png`/`.webp`) in `public/family/`, then rebuild.

## Generating voices

The voice lines are generated with [ElevenLabs](https://elevenlabs.io) text to speech, voice **"Bill"** (a wise, older American man), model `eleven_v4`. They're saved as small mono mp3s in `public/audio/generated/` and committed to the repo, so you only need this when lines or names change. ElevenLabs is only used while generating files: the game plays the bundled mp3s and never contacts it.

```bash
npm run voices
```

- It generates only files that don't exist yet, in the same voice, so new lines match the old ones. It makes every line's name-free version, plus named versions for `childName` and both grandpa names in `src/config/family.ts`.
- `npm run voices -- --force` regenerates everything. `-- --only fetch.` limits it to ids starting with `fetch.`.
- The engine and voice defaults are in `scripts/voices/config.ts` (`DEFAULT_ENGINE`, `DEFAULT_ELEVEN_VOICE`). The script uses the official `@elevenlabs/elevenlabs-js` SDK (a dev dependency; it's never in the game).
- The whole script is a couple of thousand characters, which fits the free tier. Check ElevenLabs' terms for free-tier use.

### ElevenLabs key

The key lives in `.env.local` (git-ignored, never committed). The easiest way to get one on a new computer is to run this in the project folder and approve in the browser:

```bash
npx -y @elevenlabs/cli@latest onboard init
```

Or create one on elevenlabs.io under **Developers → API Keys** (it only needs **Text to Speech** and **Voices (read)**), copy `.env.example` to `.env.local`, and paste it into `ELEVENLABS_API_KEY`.

### Changing the voice

`npm run voices -- --list-voices` prints the voices your account can use, with their ids. Try one on a single line, then regenerate everything:

```bash
npm run voices -- --voice <voice id> --force --only start.hello
npm run voices -- --voice <voice id> --force
```

To keep it, set `ELEVENLABS_VOICE_ID` in `.env.local` or change `DEFAULT_ELEVEN_VOICE`. Always use `--force` when switching voices or engines, or only missing files get the new voice and the game ends up with a mix.

### Offline alternatives

- **Piper** (free, local, no account): `npm run voices:setup` downloads the engine and the `en_US-ryan-high` voice into `scripts/voices/.cache/` (git-ignored, ~140 MB). Then `npm run voices -- --engine piper --force`. Other voices: https://rhasspy.github.io/piper-samples/ (pass `--voice en_US-joe-medium` to both commands). Speaking rate is `PIPER_LENGTH_SCALE` in `scripts/voices/config.ts`.
- **Windows' built-in voice**: `-- --engine sapi` (no download, more robotic).
- Engines live in `scripts/voices/engines.ts`; add one by implementing its small `Engine` interface.

## Deploying

Coming in Milestone 5 (Netlify, `npm run build` → `dist/`).
