# Helper Town

A tap-only learning game for a little helper who can't read yet. He visits the places in Helper Town and helps the grown-ups there: fixing things with Pops in his workshop, cooking with Mama in her kitchen, delivering the mail at the post office, sending help from the rescue station, digging up dinosaurs and building at the construction site, all with Pops. They ask, he helps, and they're proud of him.

Built for Amazon Kids Fire tablets (Silk browser), works offline as a PWA. No ads, links, accounts, analytics or network requests after install.

**Status:** The **Town Map** is the home screen with six places:

- **Pops' Workshop** (Phase 1, complete): Fetch the Tool, Fix It, Tool Wall, My Garage.
- **Mama's Kitchen** (complete): Fetch the Ingredient, Bake Together, Decorate Cookies, and the Bakery Shelf.
- **Post Office** (complete): Letter Mail, Name Sign and Number Houses, with Pops delivering the mail.
- **Rescue Station** (complete): Who Can Help, Siren Sounds and Fire Hose.
- **Dino Dig** (complete): The Dig, Big and Little, Dino Puzzle, and the Dino Museum.
- **Construction Site** (new): Rock Sorting, Excavator Scoops and Tile Tower.

Also: celebrations, adaptive difficulty, generated voices for Pops and Mama, the parent menu and the session wind-down. It's live at https://lincolnshelpertown.netlify.app (every push to `main` deploys).

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
| `npm run icons` | Render the app icons (PNGs) from `public/icon.svg` |

### Testing on the Fire tablet

- Use the tablet's **parent (adult) profile** in Silk for dev testing. An Amazon Kids profile only opens approved websites, so a LAN address usually won't work there; use the deployed Netlify URL for the Kids profile.
- Make sure the PC and tablet are on the same Wi-Fi. If the tablet can't connect, allow Node through the Windows firewall for private networks.
- `npm run dev:https` gives a `https://` address. Silk will warn about the self-signed certificate; continue past it. HTTPS is only needed to test microphone recording.
- Add `?debug` to the URL to see a dot for every touch: **green** = counted as a tap, **grey** = ignored (palm, edge, repeat, or during a transition). Handy for checking palm rejection. It also logs how each voice line played (`file`, `speech` or `silent`) to the browser console.
- In dev, `?gallery` shows every Pops pose, tool and sticker on one page; `?gallery=vehicles`, `?gallery=people`, `?gallery=kitchen`, `?gallery=baking`, `?gallery=post`, `?gallery=rescue`, `?gallery=dino` and `?gallery=construction` show the vehicles, Pops and Mama, the ingredients and magnets, the baking art, the post office art, the rescue art, the dino art and the construction art.
- Add `?fps` to the URL (works on the deployed site too) for a small frames-per-second meter with the slowest frame in the last second. On the tablet it should stay near 60 fps, with no frames slower than about 50 ms.
- Progress (tools learned, difficulty, stickers, garage) is saved on the device. Reset it from the parent menu.

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
  scenes/               start, town (Town Map), hub (Pops' Workshop), fetch, fixit, toolwall,
                        post (Post Office), letters, namesign, houses,
                        rescue (Rescue Station), dispatch + sirens (Who Can Help, Siren Sounds), flames,
                        dino (Dino Dig), dig, sizes, puzzle,
                        construction (Construction Site), sort, scoops, build,
                        garage, kitchen (Mama's Kitchen), cook (Fetch the Ingredient),
                        bake, decorate, bakery, fetchGame (the shared "fetch" game), rest, gallery (dev only)
scripts/
  vite-asset-manifest.ts  lists the bundled voice files and photos at build time
  voices/                 voice generation (setup, engines, mp3 encoding)
public/audio/generated  generated voice files
public/audio/recorded   real recordings to bundle (override generated)
public/family/          bundled family photos
tests/                  Vitest
```

### Toddler rules the code enforces

- **No reading needed:** every instruction is spoken. The only text on child screens is his initial on license plates and, in the Post Office, the letters and numbers he's learning, shown as things to tap (agreed as a change to the original rule). Instructions are never text.

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

### Town Map

The home screen after the start button: a sunny street with Pops' Workshop, Mama's house, the Post Office, the Rescue Station, the Dino Dig and the Construction Site (chimney smoke, clouds, a little dump truck driving by). Tapping a place says its name ("Pops's workshop!", "The rescue station!") and zooms in, where the grown-up says hello. Every place has a blue **town button** (two little houses) in its top-left corner to come back. Only places that exist are shown; there are no locked or "coming soon" buildings.

### Post Office

Pops is delivering the mail (in Bill's voice). The big blue **mailbox**, Lincoln's own red **mailbox** and the **mail truck** in the window each open a game, and his stamps go on the board.

- **Letter Mail:** "Find the letter L!" He finds the envelope with that letter on the sorting table and Pops posts it in the mailbox ("L!"). It's the same engine as Fetch the Tool: errorless, 2–4 choices, adaptive. It starts with the letters of his name (L, I, N, then C, O) and adds the rest of the alphabet one at a time as he learns them. Each letter always has the same color.
- **Name Sign:** building his name for his mailbox. Each round he fills in 3 letters at first, always including the first one ("Find the letter L!", then "That's the first letter of your name!"). After a round with no mistakes there's one more, up to 5, and the gaps move around his name from round to round, so over time he places every letter. Then Pops reads it back letter by letter: "That spells Lincoln!" After his first time, his name appears on his red mailbox in the post office. It uses the child's name from settings, so it adapts if the name changes.
- **Number Houses:** "This package goes to house three!" He taps the house with that number (houses on the street are in number order), the mail truck drives over and the package hops to the door, *ding-dong*. Houses 1–3 at first, growing to 10.
- **Reward:** each round earns a postage stamp for the board; tap a stamp to hear it.
- **Parent menu:** shows which letters and house numbers he knows (first-try accuracy).

### Rescue Station

Pops runs the fire station. The red **alarm bell**, the **radio** on his desk and the **fire hose** reel each open a game, and his rescue badges go on the board.

- **Who Can Help:** an emergency appears on the screen: a house on fire, someone with a hurt arm, a traffic jam, a broken-down car. "There's a fire! Which truck do we need?" He sends the right vehicle (fire truck, ambulance, police car, tow truck) and it zooms off with its siren. Errorless and adaptive, 2–4 choices; a wrong tap names the vehicle.
- **Siren Sounds:** the same game by ear. "Which one makes this sound?" and the radio plays a soft toy siren: a slow wail (fire truck), hi-lo (ambulance), quick whoops (police car) or a honk (tow truck). The sound replays every time the question repeats.
- **Fire Hose:** a house has little flames in the windows and on the roof. Every tap sprays one out while Pops counts ("One! Two! Three!"), then "You saved the day!" Two houses: 3 flames, then 5.
- **Reward:** each round earns a rescue badge (a sticker picture in a gold star); tap one to hear it.
- Most lines are reused from earlier places (vehicle names, counting, praise), so this place only needed 10 new voice lines.

### Dino Dig

Pops at the dig site. The **sandbox**, the **puzzle table** and the **dino park** each open a game, and the **museum shelf** shows his newest three fossils (tap one to hear its name).

- **The Dig:** "Tap the dirt to dig!" Each tap brushes away a sand mound while Pops counts. When the fossil is uncovered it comes alive for a moment as the real dinosaur ("A dinosaur with horns!", "You found it!"), then "It goes in the museum!" Two digs per visit (3 mounds, then 5); the T. rex, long-neck and horned dinosaur take turns.
- **Big and Little:** two of the same dinosaur in very different sizes. "Find the big dinosaur!" / "Find the little dinosaur!", taking turns. After a few first-try answers a middle-sized one joins as a distractor. Even the little one has a big tap area.
- **Dino Puzzle:** a dinosaur picture in 2, then 3, then 4 pieces. Each tap sends a piece home to its place in the frame (nothing to get wrong), and the finished dinosaur says its name.
- **Reward:** the fossils in the museum, and a celebration after each round.

### Construction Site

Pops at the building site. The **dump truck** opens Rock Sorting, the **excavator** opens Excavator Scoops, and the **tile table** Pops stands behind opens Tile Tower.

- **Rock Sorting:** a colored rock swings down from the crane. "Put the red rock in the red truck!" He taps the dump truck of the same color (red, blue, yellow, green) and the rock drops into its bed. Errorless and adaptive, 2–4 trucks; a wrong tap says "That's the blue truck!".
- **Excavator Scoops:** every tap on the excavator scoops dirt from the pile into the dump truck while Pops counts. "The truck is full!" and it drives off; three trucks of 3, 4 and 5 scoops.
- **Tile Tower:** open-ended building like his magnetic tiles. Tapping any of the four see-through tiles (square, triangle, rectangle, circle) stacks it on the tower; nothing is ever wrong. After six tiles, "What a tall tower!", then "Uh oh! Here comes a dinosaur!" and a friendly T. rex stomps in and knocks it down so he can build again. Two towers per visit.
- **Reward:** a sticker for his toolbox each round.
- Truck names, counting, "A dinosaur!", praise and the sticker lines are all reused, so this place needed 17 new voice lines (445 characters).

### Mama's Kitchen

Mama (an original cartoon mom with her hair in a bun and a heart on her apron) is at the counter. Four things to tap, each opening a game or his collection:

- **Fetch the Ingredient:** "Mama needs the eggs!" He finds it on the counter among 2–4 choices. It uses the same errorless help and adaptive difficulty as Fetch the Tool (it's the same engine). Mama tips it into her mixing bowl with its own sound. It starts with eggs, banana and milk, then adds strawberries, flour, butter, blueberries and sugar one at a time as he learns them.
- **Reward:** each round earns a fridge magnet (strawberry, cupcake, heart, banana, star, carrot, flower, apple). Magnets go on the fridge door; tap one to hear it.
- **Wind-down:** if the session ends here, Mama yawns and waves and the window shade comes down.

- **Bake Together** (the mixing bowl): muffins, a different flavor each time (blueberry, banana, strawberry). Each step is one big glowing thing to tap, so it can't go wrong. Crack two eggs, pour the flour and the milk, stir while Mama counts (2–5 taps, adjusting like Fix It), then count fruit in ("Add three blueberries!", 2–4 pieces). Mama pours it into the tin, he taps the oven to turn it on (Mama handles the hot part), it glows, *ding*, and out come muffins.
- **Decorate Cookies** (the cookie tray): "Put a red heart on the cookie!" He picks from icing on a tray (2–4 choices, errorless and adaptive). There are 12 decorations (red, blue, yellow and green × heart, star and circle), so it teaches colors and shapes. Three decorations finish a cookie.
- **Bakery Shelf** (the shelf on the wall): the muffins and cookies he made, newest first, big enough to tap ("A blueberry muffin!", "A cookie you decorated!"). The newest six also sit on the shelf in the kitchen. Like his garage, but it keeps filling up.

The teapot now lives on top of the fridge.

### Fix It

Tap the car lift. Three vehicles per round roll onto the lift, each with a different, clearly visible problem:

| Problem | Tool | What fixing looks like |
|---|---|---|
| Flat tire | Air pump | The tire puffs up, puff by puff |
| Wobbly wheel | Wrench | The nut on the floor spins back on and the wobble stops |
| Dent | Hammer | The dent pops out, bang by bang |
| Rattling door | Screwdriver | The screw twists in and the rattle stops |
| Branch stuck on top | Saw | The branch gets sawn through and falls off |
| Missing light | Drill | The new light gets drilled on |
| Scratched paint | Paintbrush | Fresh paint sweeps over the scratch |

1. Pops names the problem and the tool ("Uh oh! The tire is flat!", then "Pops needs the air pump!"), and he picks it from the tray (2–4 choices, errorless like Fetch the Tool). At the top difficulty level Pops names only the problem and asks "Which tool do we need?".
2. The tool flies over, the problem spot glows, and he taps the vehicle 2–5 times while Pops counts ("One! Two! Three!"). Each tap fixes a bit more, and the next tap waits until Pops has said the number.
3. The vehicle tests itself (a honk or a soft siren, and its bucket, blade, drum, beacon or hook moves), Pops says "You fixed the fire truck!", and it drives off to his garage. Fixing one he already has gives it a shiny star.

Only problems for tools he has met in Fetch the Tool come up, so the repair bay grows with him. Tracked vehicles (excavator, bulldozer) never get tire problems, and vehicles he hasn't collected yet come first. The number of fixing taps (2–5) has its own adaptive track. Back in the workshop, the garage door honks hello.

### Tool Wall

Tap the pegboard. Pops holds up a tool ("Where does the hammer go?") and he taps its painted outline on the pegboard. A round hangs 4 tools (5 at the top level), starting with the ones he has met in Fetch the Tool. Each question shows the right outline plus 1–3 others still empty, set by difficulty. A wrong outline says whose spot it is ("That spot is for the saw!"), with the same errorless help as everywhere else. The right tool arcs over and clicks onto its pegs. When the wall is full: "All tidy! High five!", and a sticker for the toolbox.

### Parent menu

**Opening it:** hold the small, faint gear in the top-right corner for 3 seconds (a ring fills), then tap the named colored square two times. A tap, a short hold, sliding off, or a second finger/palm cancels the hold, and a wrong square closes the check, so toddler taps can't get in. The game stops behind the menu; **Back to the game** returns to the workshop and starts a fresh session.

- **Settings:** child's name, grandpa's name (Pops or Pappa), difficulty (Auto, or always 2, 3 or 4 choices), session length (off, 10, 15, 20 or 30 minutes; default 15), voice and effects volume, and gentle background music (on by default; a looping children's track from `public/audio/music/background.mp3`, kept quiet under the voice and following the effects volume and the mute button. Swap that file to change the music).
- **Photos:** add or remove a photo of the real Pops (framed on the workshop wall, and popping up in every celebration) and of your helper (in a hard-hat frame in his garage). Photos are shrunk and kept on this tablet. Bundled files in `public/family/` work too (see below).
- **Voices:** every line, grouped by activity, with Record, Play and Delete. A recording replaces the generated voice for that line. Recording needs the microphone, which browsers only allow on a secure page: the installed Netlify app, `npm run dev:https`, or `localhost`. Recordings stay on that one tablet; to share them across tablets, bundle them (see "Adding bundled recordings").
- **Progress:** time played today and this week (active play only), rounds per activity, garage and sticker counts, and first-try accuracy per tool.
- **Reset:** clears progress after a second confirming tap. Settings, photos and recordings stay.

### Mute button

The faint speaker next to the gear mutes everything (voices, sound effects and music). Hold it for 1 second (a ring fills); hold it again to bring the sound back. A quick tap does nothing, so he can't turn the sound off by accident. While muted it shows a red X and stays clearly visible. The game keeps running at its normal pace. Muting isn't saved, so the game always opens with sound.

### Session wind-down

Only active play counts (the app must be visible, with a tap in the last minute). When the session length is up, he finishes the round he's in. Back in the workshop the lights dim, Pops yawns and waves, the garage door rolls down, and Pops says goodbye ("Great work today, Lincoln! Pops needs a nap. See you next time!"). Then a calm night-time resting screen stays up until the next day or until a grown-up opens the menu. Reloading the page doesn't skip it.

### My Garage

Tap the garage door. There's a parking spot for each of the 8 vehicles. The ones he has fixed are parked with his initial on their license plates and a gold star for each extra time he fixed them. Empty spots show a faint dotted outline of the vehicle, never a lock. Tapping a vehicle says its name, plays its honk or siren and moves its part. The green house button takes him back to the workshop.

### Fetch the Tool

Pops asks for 4 tools per round, never the same one twice in a row. He starts with the hammer, wrench and screwdriver. When each tool in play has been found on the first try twice in a row, the next tool (saw, drill, air pump, paintbrush) is introduced: Pops shows it off and asks for it next. Each finished round earns a sticker that flies onto the toolbox in the workshop; tap a sticker to hear what it is. The toolbox shows the 4 newest.

### Voice line ids

Lines live in `src/content/lines.ts`. Each concrete line has a stable id that is also its file name:

- `pops.giggle.mp3`: a line with no names
- `fetch.ask.hammer.mp3`: a line with a variable, name-free version
- `start.hello__c-sam__g-pops.mp3`: the named version for child "Sam" and grandpa "Pops"

### Family names

Set `childName` in `src/config/family.ts` (currently "Lincoln"). Both grandpa names (`Pops`, `Pappa`) get their own voice files. Lines without a matching named file play their name-free version instead.

## Adding bundled recordings

Record each line on a phone, save it as mono mp3 (or ogg/m4a), name it by its line id (see above), and drop it into `public/audio/recorded/`. Rebuild and redeploy. Bundled recordings play on every tablet; recordings made in the parent menu stay on that one tablet.

## Adding bundled photos

Put `pops.jpg` and/or `child.jpg` (or `.png`/`.webp`) in `public/family/`, then rebuild. A photo added in the parent menu takes priority on that tablet.

## Generating voices

The voice lines are generated with [ElevenLabs](https://elevenlabs.io) text to speech, model `eleven_v4`, with one voice per speaker: **Pops** is "Bill" (a wise, older American man) and **Mama** is "Sarah" (a mature, reassuring American woman). Each line in `src/content/lines.ts` names its speaker (Pops by default); Mama's name ("Mama") comes from `momName` in `src/config/family.ts`. They're saved as small mono mp3s in `public/audio/generated/` and committed to the repo, so you only need this when lines or names change. ElevenLabs is only used while generating files: the game plays the bundled mp3s and never contacts it.

```bash
npm run voices
```

- It generates only files that don't exist yet, in the same voice, so new lines match the old ones. It makes every line's name-free version, plus named versions for `childName` and both grandpa names in `src/config/family.ts`.
- `npm run voices -- --force` regenerates everything. `-- --only fetch.` limits it to ids starting with `fetch.`.
- The engine and voice defaults are in `scripts/voices/config.ts` (`DEFAULT_ENGINE`, `DEFAULT_ELEVEN_VOICES`). The script uses the official `@elevenlabs/elevenlabs-js` SDK (a dev dependency; it's never in the game).
- **Budget:** the free tier is 10,000 characters a month. `npm run voices -- --dry-run` shows how many characters the missing lines would use before spending anything. The whole game so far is about 8,600 characters.

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

To keep it, set `ELEVENLABS_VOICE_POPS` or `ELEVENLABS_VOICE_MAMA` in `.env.local`, or change `DEFAULT_ELEVEN_VOICES`. (`--voice` applies to every speaker, so use it with `--only` to try one line.) Always use `--force` when switching voices or engines, or only missing files get the new voice and the game ends up with a mix.

### Offline alternatives

- **Piper** (free, local, no account): `npm run voices:setup` downloads the engine and the `en_US-ryan-high` voice into `scripts/voices/.cache/` (git-ignored, ~140 MB). Then `npm run voices -- --engine piper --force`. Other voices: https://rhasspy.github.io/piper-samples/ (pass `--voice en_US-joe-medium` to both commands). Speaking rate is `PIPER_LENGTH_SCALE` in `scripts/voices/config.ts`.
- **Windows' built-in voice**: `-- --engine sapi` (no download, more robotic).
- Engines live in `scripts/voices/engines.ts`; add one by implementing its small `Engine` interface.

## Offline and performance

- The app is a PWA. On first load the service worker caches everything: code, art, every voice file and the icons (about 2.4 MB). After that it works in airplane mode. We tested this by loading the built app, shutting the server down and reloading: it started, spoke and moved between places.
- A new deploy reaches the tablet the next time the app is opened online. `netlify.toml` keeps `sw.js`, `registerSW.js`, `index.html` and the manifest from being cached, and hashed assets are cached forever.
- No requests go anywhere but the app's own site, and nothing is fetched after install.
- Performance: there are no SVG filters, and only transform and opacity are animated. Scenes have 165–450 SVG elements, and every screen ran at a steady 60 fps on a desktop. Tappable spots take turns doing a little hop instead of all moving at once, which keeps redrawing low on tablets.
- **Checking with CPU throttling:** in desktop Chrome, open DevTools → Performance → CPU: "4× slowdown", open the game with `?fps`, and play a round. On the tablet itself, open the game with `?fps`.

## Deploying

The game is a static site on Netlify. `npm run build` writes it to `dist/`, and `netlify.toml` holds the settings (build command, publish folder, Node version, caching headers).

**Setting it up once (recommended: deploy from GitHub):**
1. In Netlify, choose **Add new site → Import an existing project → GitHub**, and pick `ForgeCreativeCo/helpertown`.
2. The build settings come from `netlify.toml` (build `npm run build`, publish `dist`), so just click **Deploy**.
3. Optional: under **Site configuration → Change site name**, pick something friendly (for example `helper-town`) for a URL like `https://helper-town.netlify.app`.

After that, every push to `main` deploys automatically. Voice files are generated on your computer and committed, so Netlify never needs the ElevenLabs key.

## Adding it to his Amazon Kids profile

1. On the tablet, open the site once in the **parent profile** in Silk while online, so the game and all its voices get saved for offline use.
2. Add the site to his profile: on the tablet, go to **Settings → Amazon Kids → (his profile) → Add Content → Websites**. Or use the Amazon Parent Dashboard (parents.amazon.com) → his profile → **Add content** → **Websites**. Enter the Netlify URL. The menu names vary a little between Fire OS versions; it's the same place you added your other web app.
3. Switch to his profile and open Helper Town once while online. The first load inside the Kids browser caches everything there too.
4. To test offline, turn on airplane mode and open it again.

**Notes**
- Kids profiles keep their own browser storage, so his progress, photos and recordings live in his profile, not the parent profile. Add photos and make recordings from the parent menu inside his profile: hold the gear in the top-right corner for 3 seconds.
- Recording the voice needs a secure (https) page. The Netlify site is https, so recording works there.
