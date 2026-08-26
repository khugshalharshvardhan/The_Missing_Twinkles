# The Missing Twinkles — project context

This file briefs Claude (or any developer) who has NOT seen the design sheet or the
conversations this game was built in. Read it fully before touching anything.
At the bottom are ready-to-paste prompts, **one per remaining level** — give
Claude exactly one prompt at a time, let it finish and verify, then give the next.

---

## 1. What this game is

A browser storybook + counting game for young children (~4–7), teaching
**estimation**: *look → guess → count to check → compare guess with the truth*.
Hindi/English design sheet by the design team; the build is English.

**Story:** Agni (small orange dragon, she) and Neel (big soft blue monster, he,
always hungry for cake) stroll through Mystery Town at night. The prankster
ghost **Mr. Giggles** scares away the "light-keepers" (glowing creatures) and the
town's lanterns go out. The pair walk from place to place, and in each place the
child guesses how many light-keepers there are, counts them by tapping, and taps
the lamp so they gather and relight it — until the town shines again.

**One round = the same 9 beats everywhere** (only the place and the countable
element change):
1. The swarm appears, holds ~5s, vanishes magically (look, no tapping)
2. "How many were there?" → keypad appears → child types a guess
3. The swarm returns; child taps each one; a counter counts 1..2..3…
4. "There are N …" — the true count drops onto a number line
5. "You guessed G." — the guess drops next to it
6. Verdict ("Spot on!" / "That was close!" / "Good try — now we know!")
7. "Tap the lamp!" → child taps → the swarm streams into the lamp with sparkle
   trails → the lamp lights via real art → Neel cheers "YAY!"

**Levels** (from the design sheet — totals must stay below 20):

| # | Place (bg art) | Element (art) | Count | Status |
|---|---|---|---|---|
| 0 | Mystery Town clearing (`bg_night.webp`) | Twinkles/fireflies (`firefly.webp`) | 8 | ✅ built (tutorial: Neel models the guess, extra intro/handover beats) |
| 1 | Glowberry meadow (`bg_meadow.webp`) | Glowberries (`glowberry.webp`) | 7 (the sheet's formation diagram) | ✅ built |
| 2 | Starlight Valley (`bg_valley.webp`) | Starlights (`starlight.webp`) | 6 | ✅ built |
| 3 | Magic Seed Forest (`bg_forest.webp`) | Magic seeds (`magicseed.webp`) | 9 | ✅ built |
| 4 | Glowflower Meadow (`bg_flowermeadow.webp`) | Glow flowers (`glowflower.webp`) | 11 | ✅ built |
| — | The walk home: after the last lamp, the walk replays in reverse (right to left, slower, the pair close together) with one of every rescued element flying ahead, and dissolves into the lit town (`homeMode` in js/data/walk.js; `goingHome` in js/main.js) | | | ✅ built |
| — | The ending (owner's Figma "Mystry" 149-102, the SCREEN 7.x frames): four beats after the walk home — the high-five in the lit town (two lines), "Neel?", and Neel at the bakery with the smell — then the end card. Played by the game engine as `epilogue` (deliberately not in `levels`; `currentLevel() === -1` is how gameDone knows the chapter is over). Figma note: raw uploads keep alpha, node exports flatten onto white — the cutouts came from raws, seated by measuring the flattened exports. | | | ✅ built |

Sheet order is starlight → flowers → seeds. Flowers (11) needed the multi-digit
keypad first, so they were built last: starlight → seeds → (keypad + flowers).
All four rounds are in; only the post-game screens (prompt 4) remain.

**Formations as built** (sheet rule: equal spacing, gentle bob allowed, home
positions fixed). Every group centres on (998, 357), so the countable is always
in the same place on screen whatever it happens to be that round:
- Fireflies 8 → two rows of 4 (210px across — 250 runs the row into the
  characters — 250 down); replaced the original loose scatter to match the
  sheet's diagram.
- Glowberries 7 → the sheet's zigzag: one / a pair / one / a pair / one,
  singles centred between the pair columns (pairs 340 apart, rows every 115).
- Starlights 6 → two rows of 3, 250px pitch across and down
- Magic seeds 9 → 3 × 3 grid, 250px pitch across and down
- Glow flowers 11 → 5 / 1 / 5, on a **160px** pitch, not 250: five across at
  250 is 1116px wide and runs through both characters, who leave about 750px of
  clear frame between them. At 160 the group is exactly 750 wide.

**Verdict tiers as built** (js/game.js `VERDICTS`): exact → "Spot on!", off ≤2 →
"That was close!", further → "Good try — now we know!", no guess → "Let us try
again!". The sheet wants five tiers (0/1/2/3–4/5+ away, "Your guess was 4 away",
"Now you know there were 10"). Known deviation — upgrade only if asked.

---

## 2. Running & debugging

No build step, vanilla HTML/CSS/ES modules. Serve and open:

    npx http-server -p 8123 -s     # from the repo root

- `http://127.0.0.1:8123/?act=game&level=1&beat=0` — jump straight into a level
  (`level` = index into `levels`, `beat` = screen index; beats past the guess
  auto-fill guess=7).
- `?act=walk` / `?act=story` — jump to an act.
- `?dev` — devtools hamburger menu (top left): every page/step/screen of every
  level, click to jump; also a live edit mode (`devtools/edit.js`) whose drags
  print `devEdits` coordinates to the console — the user pastes those back as
  change requests, apply them to the data files verbatim.
- Verification is done headless with puppeteer-core +
  `C:/Program Files/Google/Chrome/Application/chrome.exe` (`headless: "shell"`,
  viewport 1160×652, click `#loader-cta`, screenshot per beat). Collect
  `pageerror`/console errors and require zero. **Always verify on real
  screenshots before reporting done.**

---

## 3. Architecture map

Three acts in one document, `body[data-act]` = `story | walk | game`
(js/main.js flips it). Fixed design frames scaled to fit (js/stage.js):
story 1920×1080, walk/game 1882×1059. **All x/y/w/h in data files are literal
frame coordinates.**

| File | Job |
|---|---|
| `js/main.js` | Boot, preloading, act sequencing, the chapter loop (story → walk → level → walk → level … → end card), HUD actions, keyboard |
| `js/story.js` | Story player: keyed layer diffing, 700ms cross-fades, per-step overlays, page-turn Next/Prev buttons |
| `js/data/scenes.js` | Story pages/steps data (3 pages) |
| `js/walk.js` | Parallax walk renderer (distance-driven walk cycles, contact shadows, guide) |
| `js/data/walk.js` | Walk layers (measured against bg_night) + **`destinations`** — per-level arrival painting + guide element |
| `js/game.js` | The whole game engine — reads everything through `round` (the current level) |
| `js/data/screens.js` | Game data: screen arrays per level, **`levels` registry**, keypad, counter, number line, manifest |
| `js/data/audio.js` | Every audio cue per screen/step id (`cues`), clip lengths |
| `js/audio.js` | WebAudio: music bed, sfx, VO with pan, `playCues`/`clearCues` |
| `js/anchor.js` + `js/data/poses.js` | Pins each character's centre-x/feet per scene so pose swaps don't slide |
| `devtools/` | The hamburger menu + live-edit mode |
| `tools/gen-vo-game.js` | Regenerates game VO via msedge-tts (`npm i msedge-tts`, then `node tools/gen-vo-game.js assets/audios/vo`) |

Game engine facts that matter when adding a level:
- Two panes cross-fade (620ms); panes are **reused**, so per-beat classes must be
  cleared in `go()` (already handled — don't add new pane classes without
  clearing them there).
- `speak()` holds each beat until `max(readingTime, VO end + VO_TAIL 1700ms)`.
  **Every VO must finish, with air, before the next beat.** If a user reports a
  cut-off line, lengthen the hold — never trim audio.
- Screens carry a `role` (`readback`, `totalline`, `guessline`, `verdict`) —
  game.js keys dynamic voice/number-line behaviour off roles, **not ids**, so a
  new level's beats get it for free by carrying the same roles.
- Swarm/keypad/lamp/counter/number line are all driven from the level config +
  screen fields (`fireflies: {x,y,enter,at,dim}`, `keypadAt`, `lamp`, `lampLit`,
  `lampGlass`, `shout`) — game.js needs **no per-level code**.
- Animations that must stay in sync are clocked by CSS vars (`--swarm-at`,
  `--d`); randomness is deterministic (`noise(i,k)` sin-hash — **never
  Math.random**, replays must be identical).
- The lamp beats are staged with the lamp at the LEFT of frame and both
  characters on the right (`LAMP_STAGE` anchor in screens.js; Agni's pose is
  flipped so she points at it). The tap beat plays a small camera move — the
  pane pans right while the lamp slides in from the left edge (`is-lampstage`
  in game.js/game.css) — and the flock sweeps in from whichever side of frame
  the lamp is not on. NOTE: the pan animation lives on the PANE; putting a
  transform animation on `.layer` stomps the `is-flipped` transform.

---

## 4. The level recipe (exactly how level 1 was added — copy it)

1. **Convert art** (see §6): location PNG → `assets/game/bg_<place>.webp`
   (1882×1059, lanczos); element PNG → `assets/game/<element>.webp` (small,
   e.g. berry shipped 224×246, keep alpha).
2. **`js/data/screens.js`**:
   - `const BG_<PLACE> = { src, x:0, y:0, w:FRAME_W, h:FRAME_H }`.
   - `<ELEMENT>S` layout array (the sheet formation; box aspect = the art's own
     aspect) + `<ELEMENT>_TOTAL` + `<ELEMENT>_SRC`.
   - A screens array cloned from `level1` (`p1, p2, p3, p3.2, p4, p16, p4.2,
     p5.1, p5.2` — 9 beats, ids prefixed per level, e.g. `s1, s2…` for
     starlights). Keep THE_CLEARING anchors, the same poses, bubbles, keypad,
     counter, lamp coordinates — only the BG layer, the swarm config, the
     element word in bubble texts, and ids change.
   - Register in `levels`: `{ name, word, total, swarmSrc, layout, swarmClass,
     walkTo, screens }`.
3. **`css/game.css`**: a `swarmClass` block if the element's glow needs its own
   dim/lit styling (see `.is-berries` ~line 360).
4. **`js/data/walk.js`**: add a `destinations.<place>` entry — `arrive` = the new
   bg, `guide` = the element art scaled near the firefly's 104×109 so the walk's
   weave keyframes read the same. The walk journey itself is shared on purpose
   (it reads as travel; the destination + guide are what say "new place").
5. **`js/data/audio.js`**: cues for the new ids, mirroring the `p*` cue block
   (same offsets); three per-level VO stems (`vo_l<N>_howmany`, `_tapcount`,
   `_total` — the lines that name the element).
6. **`tools/gen-vo-game.js`**: add those three lines (Agni = `en-US-AnaNeural`;
   match the level-1 entries' prosody), run it, then normalise like the rest
   (silence-trim + two-pass loudnorm to −16 LUFS; pad clips under ~3s before
   measuring or loudnorm returns −inf).
7. **`devtools/devtools.js`**: nothing usually — the menu is data-driven off
   `levels` — but check `parts()` covers any new per-screen field you invent.
8. **Verify headless** (§2): ride the new level end to end at
   `?act=game&level=<N>`, screenshot every beat, zero console errors, and check
   the walk into it (`gameDone()` in main.js advances `chapter` automatically —
   a new `levels` entry joins the chapter loop with **no main.js change**).

---

## 5. New assets already on disk (analysed, not yet converted)

All in `assets/images/`, all genuine RGBA (the glows fade to transparent):

| File | Size | Notes |
|---|---|---|
| `StarlightValley.png` | 3764×2118 | Grassy valley, river, cliffs, crescent moon — same palette family as bg_night/bg_meadow |
| `MagicSeedForest.png` | 3764×2118 | Big mossy trees, stone path lower-right |
| `GlowflowerMeadow.png` | 3764×2118 | Rolling meadow, two big trees, stone path bottom |
| `starlight.png` | 1536×1024 | Smiling gold star, glow halo baked in — plenty of transparent margin |
| `seed.png` | 1536×1024 | Glowing rune seed with leaf sprout |
| `flower.png` | 2896×2172 | Violet-blue flower, glowing gold face centre |

All three locations have an open mid/lower area for the swarm and ground the
characters can stand on at the tutorial's marks. None contains a lamp — **reuse
the tutorial's `lamp_off.webp`/`lamp_on.webp` at their existing coordinates**
(explicitly decided by the owner).

---

## 6. Standing conventions (the user has corrected us on these — do not relearn them)

- **Every image ships as WebP, every video as WebM** — convert on the way in,
  unprompted (`ffmpeg -i in.png -vf scale=1882:1059:flags=lanczos out.webp` for
  backgrounds; keep alpha for elements). **Leave the source PNGs on disk** for
  the owner to delete.
- **Never delete audio files** when removing them from code — just remove the
  references.
- **Update the devtools hamburger menu with every screen/feature change**,
  unprompted (`parts()` in devtools/devtools.js; TARGETS in devtools/edit.js).
- Every dialogue VO must complete (+ air) before the next beat — pacing bugs are
  the most-reported issue.
- Magic look: gold dust motes with sparkle trails (see `.magic-bit`,
  `sparkleBurst()`, the poof bits) — new effects should reuse these, "Harry
  Potter dust", never plain dots.
- Coordinates come from measurement (screenshots, colour-bbox), not eyeballing;
  when the user pastes `devEdits` from edit mode, apply those numbers verbatim.
- Verify with screenshots before saying done. Report failures plainly.
- Comment style in data files: explain *why a number is what it is*.

---

## 7. Parked / open items

- ~~VO to record~~ **Done.** All 20 clips (`vo_l2/3/4_*`, `vo_nn_10..19`, and a
  re-take of `vo_l1_total` saying "seven") were generated with the same
  msedge-tts casting, silence-trimmed and loudness-matched to −16 LUFS like the
  rest. `tools/gen-vo-game.js` stays the source of truth for a full regen.

- **Two things headless verification cannot see**, so don't read their absence
  from a screenshot as a bug: the `enter: "magic"` materialise-in on every
  level's look beat (its CSS animation clock does not advance under
  `--virtual-time-budget`, so the swarm sits at opacity 0 — the shipped
  tutorial and level 1 behave identically), and the walk when it is entered by
  a devtools jump rather than by finishing the previous level (it renders empty
  for `clearing` and `meadow` too). Verify the walk by riding the previous
  level's last beat to its end instead; that path renders correctly.

- **Multi-digit keypad — done.** The pad now builds a number: digits land in the
  readout (`keypad.display`, back in the place Figma drew it, which is why the
  key rows returned to their designed y), clear empties it, and the tick
  submits. Capped at 2 digits and 19 (`keypad.maxDigits` / `maxValue`). Neel's
  read-back range followed it (`NEEL_SPOKEN_MAX` in js/game.js). One digit plus
  the tick is two taps, so the tutorial and levels 1–3 cost one extra tap and
  gain a readout showing the choice before it is committed. Clear was added
  alongside confirm — it is not in the sheet's note, but a mistyped digit had
  to be survivable once a guess takes two taps to build.
- Five-tier verdicts (§1) — deviation, upgrade on request.
- On-screen counts spoken during tapping go through `sayNumber()` — already
  handles any total ≤ 20 for Agni.

---

## 8. Prompts for the remaining work — give ONE at a time

**Prompts 1, 2 and 3 are done** (levels 2, 3, the multi-digit keypad and level
4). Only **prompt 4** below is outstanding. The three finished prompts are kept
for the record of what was asked.

---

### Prompt 1 — Level 2: Starlight Valley (6 starlights)

> Read `context.md` fully, then `js/data/screens.js` (the `level1` array and
> `levels` registry), `js/data/walk.js` (`destinations`), `js/data/audio.js`
> (the `p*` cue block), and `tools/gen-vo-game.js` (the `vo_l1_*` entries).
>
> Build **Level 2 — Starlight Valley**, following the level recipe in
> context.md §4 exactly:
> - Background: `assets/images/StarlightValley.png` → `assets/game/bg_valley.webp`.
> - Element: `assets/images/starlight.png` → `assets/game/starlight.webp`
>   (keep alpha; ship it near the glowberry's on-disk size).
> - **6 starlights, two rows of 3**, equal spacing on the glowberries' 250px
>   pitch, centred where the berry swarm sits; the word is "Starlight"
>   ("How many starlights were there?", "Tap each starlight to count.",
>   "There are {total} starlights"), screen ids `s1…s5.2`, VO ids `vo_l2_*`.
> - Walk destination `valley`, guide = the starlight art.
> - Reuse the tutorial lamp exactly as level 1 does.
> - The starlight art glows gold like the firefly, so start from `swarmClass: ""`
>   and only add CSS if the dim/counted states don't read on screenshots.
> - Update the devtools menu if any new per-screen field appears, generate and
>   normalise the three VO lines, then verify headless per context.md §2:
>   every beat of `?act=game&level=2` screenshotted, the walk into it checked,
>   zero console errors. Convert images to WebP; leave source PNGs in place.

---

### Prompt 2 — Level 3: Magic Seed Forest (9 magic seeds)

> Read `context.md`, then the same files as before plus the just-added level 2
> block as a second reference.
>
> Build **Level 3 — Magic Seed Forest**, per the recipe in context.md §4:
> - Background: `assets/images/MagicSeedForest.png` → `assets/game/bg_forest.webp`.
> - Element: `assets/images/seed.png` → `assets/game/magicseed.webp`.
> - **9 magic seeds in a 3×3 grid**, equal spacing (250px pitch), centred where
>   level 1's swarm sits; word "Magic seed" (bubbles: "How many magic seeds were
>   there?", "Tap each magic seed to count.", "There are {total} magic seeds"),
>   screen ids `m1…m5.2`, VO ids `vo_l3_*`, walk destination `forest`, guide =
>   the seed art.
> - The seed's glow is warm amber on a dark forest — check the dim (uncounted)
>   state actually reads darker on screenshots; add a `swarmClass` block in
>   css/game.css modelled on `.is-berries` if not.
> - Same conversion, VO, devtools, and headless verification duties as always
>   (`?act=game&level=3`, plus the walk into it).

---

### Prompt 3 — Multi-digit keypad, then Level 4: Glowflower Meadow (11 glow flowers)

> Read `context.md` (§7 especially), `js/data/screens.js` (`keypad`),
> `js/game.js` (`keypadPanel`, the guess flow, `flyToCounter`, `sayNumber`,
> `dynamicVoice`), and `tools/gen-vo-game.js` (the `NUMBERS` section).
>
> **Part A — multi-digit entry.** The pad currently takes one digit and that tap
> is the whole interaction. Change it to: digits build a number shown in a
> readout on the keypad panel (the art has empty space at the top where the
> readout originally sat), cap at 2 digits / value ≤ 19, and a confirm key
> (`assets/game/key_ok.webp` exists) submits the guess — reuse the existing
> flying-digit magic for the readout→counter flight. Keep the tutorial and
> levels 1–3 fully working: a single digit + confirm must feel as light as
> before. Generate Neel's number VO for 10–19 (`vo_nn_10`…, matching the
> existing `vo_nn_*` prosody) so the readback beat can speak any guess.
> Also bump the glowberries to the sheet's 10 (add a row slot in `BERRIES`,
> `BERRY_TOTAL = 10`) now that two digits are possible.
>
> **Part B — Level 4.** Build it per context.md §4:
> - `assets/images/GlowflowerMeadow.png` → `assets/game/bg_flowermeadow.webp`;
>   `assets/images/flower.png` → `assets/game/glowflower.webp`.
> - **11 glow flowers in the sheet's 5 / 1 / 5 formation** (row of 5, one alone
>   centred between, row of 5), equal spacing; word "Glow flower", screen ids
>   `f1…f5.2`, VO ids `vo_l4_*`, walk destination `flowermeadow`, guide = the
>   flower art.
> - Verify headless: the new keypad on the tutorial AND on level 4 (type 11,
>   confirm, watch the count reach 11 and the number line place 11 — note
>   `numberLine.max` is 10, extend it for totals up to 12), every beat
>   screenshotted, zero console errors.

---

### Prompt 4 — Post-game screens & The End

> Read `context.md`, `js/main.js` (`gameDone`, the end card), `js/data/scenes.js`
> (story page structure) and the end-card markup in `index.html`.
>
> After the last level's lamp lights, before/instead of the current end card,
> add the sheet's two post-game screens:
> 1. Wide shot of Mystery Town with every light back on (`assets/images/
>    bg_town_lit.webp` exists) — Agni centred, happy, arms open:
>    "We did it, Neel! The town is shining again!"
> 2. Agni turns — "Neel?" — and Neel is drifting toward the bakery, dreamy:
>    "Caaakeee!", with the curly smell lines (`assets/images/smell.webp`, see the
>    `fx-smell` treatment in css/story.css) floating from the bakery to his
>    nose. Then "The End", and the existing Play-again card.
> Reuse story art from act one (`scene_cheer.webp`, `neel_smelling.webp`,
> `agni_talking.webp` etc. are in assets/images — check what fits before asking
> for new art). New VO lines for the two beats via tools/gen-vo.js style
> (story generator, not the game one), cues in js/data/audio.js, devtools menu
> updated, verified headless end to end: play the last level through and watch
> the hand-off into the new screens.

---

*Written 2026-08-26. Owner of this working copy: Piyush (cg_design06). The
project owner (whose repo this is) drives the remaining levels with the prompts
above.*
