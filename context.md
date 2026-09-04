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
| — | The ending (owner's Figma "Mystry" 149-102, the SCREEN 7.x frames): five beats after the walk home — the high-five in the lit town (new Figma art, hand-clap sfx, two lines), 'Neel?', the owner's animated video of the smell carrying Neel to the bakery (assets/videos/neel_floating.webm, audio stripped at conversion; our cues + his 'Caaaake!' play over it — screen field: video), a staged smell (the story aroma art, one shared box, its unfurl mask advanced per beat: wisp on e1, halfway on e2, at his nose on e3), and a Tom-and-Jerry iris close (clip-path circle on the street layer, fx-iris) with 'The End' written on the dark (the shout renderer, size/space/at aware) — then straight back to the title screen (newcover.webp; resetToTitle in js/main.js — there is no end card any more, Play simply runs the chapter again). Played by the game engine as `epilogue` (not in `levels`; `currentLevel() === -1` signals the chapter end). hand_clap.mp3 is synthesized (ffmpeg, no samples). Figma note: raw uploads keep alpha, node exports flatten onto white. | | | ✅ built |

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
| `tools/install-vo.js` | Puts the recorded Hindi takes where the game looks for them: maps take -> cue id, trims, levels, and cuts the two lines with a number spoken inside them |
| `js/warp.js` + `css/warp.css` | The hand-over between levels: the finished place travelling out to the left, the next one arriving behind it, a seam of light down the join |
| `js/fit.js` + `js/data/bubbles.js` | Speech balloons: where each balloon's round face and tail sit (measured), and the fitter that shrinks a balloon onto its own line |
| `tools/shrink-art.js` | Brings the heaviest artwork down to the size it is drawn at. Originals kept in `assets/full/` |
| `js/watch.js` | The black box. Writes where the chapter got to into sessionStorage, so a run the device kills leaves a note for the run that follows — read at import, BEFORE the first mark of the new run can overwrite it |
| `js/clock.js` | Every timeout in the chapter. `after`/`cancel` have setTimeout's shape; `freeze`/`thaw` take a pause through them, each timer keeping what it had left |
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
- **The voice is Hindi, installed by `node tools/install-vo.js`.** The takes
  live under `assets/audios/vo/agni dilouge/` and `assets/audios/vo/neel/`,
  named for what they say; the game asks for `vo_<id>.mp3`, and that tool is
  the mapping. It never touches the recordings — it writes the vo_*.mp3 the
  engine loads, and moves the English take it replaces into `vo/en/` first.
  Re-run it whenever a take is added or redone. Things it does that matter:
  - **Trims by measured bounds, not `silenceremove`.** Several takes end with a
    30ms click a second after the last word, and silenceremove stops at the
    click — leaving a second of room tone that the engine then schedules the
    next beat behind. It reads the silence map and keeps the speech.
  - **Numbers are single words**, so a take with a long pause in it is a word
    read twice; the fuller read is kept. Two of them are (agni 10, 10 NEEL).
  - **Two takes have a number spoken inside them** and the number is the
    player's: "तुम्हारा अंदाज़ा था — 10" is cut before it, and Neel's
    "मुझे लगता है — 10 जुगनू थे" ends where the number begins, because the number
    and the words after it are one breath.
  - **The answer beat has two takes**, with and without "लेकिन", chosen by the
    same test the words use — `totalVo` on the round in js/data/screens.js,
    read by `dynamicVoice()`. It is per-round because the line names what was
    counted: the tutorial's जुगनू take cannot play over a meadow of berries.
  - The takes came in two deliveries: `agni dilouge/` and `neel/` first, then
    `agni_dilouge_new/` and `neel_dilouge_new/` with the verdicts, every level's
    own two lines, and re-takes of a handful. Where a line is in both, the
    installer maps the newer one.
  - The lamp beat cheers with BOTH of them — one take each, his a beat ahead of
    hers, panned to where LAMP_STAGE puts them. Hers rides in the beat's `sfx`
    list, because a beat has one `vo` and this beat has two voices.
  - **Mr Giggles laughs once**, in his own recording (`vo_giggles_1`, delivered
    as .ogg and installed as mp3 — iOS will not play Ogg at all). Six "he"s over
    2.2s, where the beat used to play two short clips three times and pretend
    they were one voice. The text on screen is his: three pairs of "ही! ही!"
    popping at 1250 / 1850 / 2450, which is his phrasing rather than a round
    number, so what is read and what is heard are the same laugh.
  - Still English: Neel's chuckle on story 1.4. It is wordless.
  - **The answer beat has no counter card.** There was nowhere on Neel's side to
    put his balloon — under the card is 163px and the line needs 176, below the
    swarm the number line is in the way, and the band between them is 151px
    wide. The card was repeating the number the line was about to show, so it
    goes, and `dropFromCounter()` flies the answer down from the twinkles
    themselves when there is no card to fly it from.
  - **A story step's `hold` is a floor, not the answer** (`holdFor()` in
    js/story.js). Those numbers were written against the English clips — the
    comments in js/data/scenes.js still quote their lengths — and four steps cut
    their Hindi line off, one by 3.2 seconds. The step now holds for whichever
    is longer, what the scene needs watching for or what the line needs saying
    in. The game already did this in `speak()`.
  - **Whose voice must match whose balloon.** The answer beat is नील's in the
    sheet and his in the recording, but its balloon was Agni's on Agni's side —
    every round ended with his voice out of her mouth. The balloon is his now,
    at his mark. And the lamp beats re-stage the pair (`LAMP_STAGE`: Neel at
    cx 264, Agni at 823), so their pans had to move with them — his cheer was
    coming from the right while the word was drawn over his head on the left.
- The loader and the title screen use `cover_hindi.webp` — the Hindi cover,
  converted from `assets/game/Hindi_Cover.png` at the frame's own 1920x1080.
- **Two faces, split by code point** (css/stage.css). The stack is
  `"Fredoka One", "Baloo 2", …`, and Fredoka One's `@font-face` is declared
  `unicode-range: U+0030-0039` — the digits and nothing else. So every number
  (counter, number line, keypad, tap counts, and a number inside a line of
  dialogue) is the face the game was designed in, and everything else —
  the Hindi, the `?` `!` `,` `…` written with it, and any Latin — is Baloo 2.
  Punctuation belongs to the sentence, not to the numbers. Nothing has to be
  told which of the two it is. Fredoka One also claims `font-weight: 100 900`
  so the body's 600 does not smear a synthetic bold over a one-weight font.
- **A line is centred on its INK, not on its line box** (`centreInk` in
  js/fit.js). A font reserves the same descent under every line, deep enough for
  the lowest thing the script can draw; Devanagari rarely uses it, so a line
  centred by its box sits 4–7px high inside the balloon. Measured per line with
  canvas metrics and the text box moved by the difference.
- **After the counting, the sheet's order is guess → answer → verdict**: Agni
  reads the player's guess back ("तुम्हारा अंदाज़ा था {guess}!"), then the answer
  arrives beside it ("लेकिन वहाँ कुल {total} … थे!"), then the verdict. The build
  had the answer first, which gave away the thing the guess was about to be
  measured against. The answer line carries a `{but}` token: "लेकिन" is only
  filled in when the guess was wrong, because "but there were 7" argues with a
  player who already said 7. The number line follows: `numberLineStrip()` pre-places the
  GUESS on the totalline and verdict beats, and the total only on the verdict.
  NOTE: the sheet gives the answer line to नील; it is still spoken from Agni's
  mark, because on that beat the right of frame is taken by the swarm, the
  counter card and Neel himself, with nowhere clean for a second balloon.
- **The twinkles wait for the line that introduces them** (`swarmDelay()` in
  js/game.js). `fireflies.at` in the data is the EARLIEST they may arrive, not
  the answer: a child looks up the moment they appear and stops listening, so
  the arrival is held to `max(at, line end + 300)`. The whole swarm — entry,
  hold, poof — is clocked off `--swarm-at`, and the two sounds that belong to it
  are marked `onSwarm: true` in the cue table so they travel with it rather than
  sitting at fixed times. The beat's own length grows to cover it too.
- **The twinkles sit in the middle of the frame** — every round's swarm mark is
  set so its formation centres on 941 — and no balloon touches them. Two things
  came out of that:
  - `tail: "right"` on a bubble spec forces the mirror, for the two balloons
    that cannot flip by position: the tutorial's "चलो, गिनकर देखते हैं…" is too
    wide for its middle ever to pass Agni, and the answer beat's has to point
    down at Neel from above rather than out into the sky beside him.
  - The pointing hand belongs to the first thing to be counted, so its mark
    moved with the swarm — the same shift, so it keeps the offset it was drawn
    with.
  - That balloon's `artInset` was Figma's: the art sat in the middle third of a
    much bigger box, so the longest line in the game had a third of the room it
    appeared to have, grew to the full 1.35x, and landed on the twinkles. Its
    box IS the art now, taller than it is wide.
- **Neel's readback is said in three pieces.** "हम्म… मुझे लगता है {guess} जुगनू थे।"
  puts the player's number in the MIDDLE, so the words after it are their own
  clip (`vo_g_ithink_tail`), cut at a 114ms dip that only shows at -30dB. A
  fragment cut out of another line takes THAT line's gain (`like:` in
  tools/install-vo.js) — levelled on its own merits, the end of a sentence gets
  more voice than the words before it.
- **Agni's balloons sit OVER her, tail pointing down-right at her.** They used to
  sit to her right, which put the tail on the left and the balloon itself in the
  middle of the frame — where the twinkles are, which is why they stopped
  looking centred. `tailToward()` flips the art when the balloon's middle passes
  the speaker's, so this is a matter of position, not of art: each balloon was
  measured against where Agni actually stands and moved past her. Screen 2 was
  already like this and is the reference.
- **Pause stops the whole chapter, not just the picture.** The dev menu's Pause
  now takes four things together, in this order: every timer (js/clock.js —
  nothing in the project calls setTimeout directly any more), the entire
  soundtrack (`setAudioPaused()` suspends the AudioContext, which stops music,
  voice and effects at once because they are all scheduled on its clock), every
  CSS animation and transition (`getAnimations()`), and the video. Measured: a
  beat that runs 10.66s on its own ran 4.00s + 6.65s across a pause — the pause
  cost it 9ms. Notes:
  - `unlockAudio()` refuses to resume while paused, or a tap anywhere would
    start the sound under a frozen picture.
  - An act's `devPause` no longer re-arms its own clock; the freeze does that.
    The game's only starts a beat that was BUILT during the pause and never
    spoke — calling speak() on one already running would replay its cues and
    queue a second advance.
- **The keypad beats say nothing.** The pad arriving is the question
  (`keypadAt: 800`, on its own sparkle). If nobody touches it for eight seconds
  a nudge balloon — `bubble: { idle: true }` in screens.js, `armIdle()` in
  js/game.js, `.bubble--idle` in css/game.css — comes up and STAYS up. It is a
  hand held out, not a line the beat is delivering, and taking it away while a
  child is still deciding is the opposite of help: what puts it away is the
  child doing something, which also restarts the eight seconds. Its voice plays
  once per beat, not every time it reappears. The tutorial keeps its spoken
  question: it is the round that teaches.
- **A devEdit on a balloon can be a box its line does not fit.** The dev panel
  reports the DATA box, because that is what an export has to carry — but a
  line too long for it makes the fitter GROW the balloon, and growth is anchored
  at the tail, so it walks up and sideways out of whatever gap it was dragged
  into. The panel now says so in the part's name when it is happening.
- **The road is walked twice in the whole chapter, not six times.** Out of the
  story into the tutorial, and home again at the end — those two are the scenes
  the parallax was built for. Every level after the tutorial hands over in a
  **warp** instead (`warpOn()` in js/main.js, js/warp.js) — the road without
  the walking. The place they have just finished travels out to the left and
  the next one arrives behind it, the same direction they have gone all
  chapter, with a line of gold running down the join between them and throwing
  sparks off it. 1.05s against the walk's ~6s, four times over.
  - The scene that leaves is the REAL one: the live pane is `cloneNode`d into
    the overlay first, so `startGame()` is free to empty the panes and build
    the next round underneath while both places are on screen. Nothing has to
    hold two levels at once.
  - The arriving half is `#game` itself, animated by `.is-warping`. The pane
    transform is left alone — the lamp beat's camera pan lives there.
  - The leaving pane must not be SCALED on its way out: at 0.94 its edges sit
    three per cent inside the frame and the letterbox shows through the gap.
    The depth comes from `.warp__dim` instead.
  - The new round is held (`armHold`/`releaseHold`) for the whole trip, so its
    first line starts on arrival rather than while it is still moving.
  The dev menu has a `warp · level to level` row that plays the real thing, and
  marks the walk rows the chapter no longer takes.
- **Speech balloons size themselves to their line** (`js/fit.js`, used by both
  acts). A balloon's box in the data is the size it was DRAWN at and the size it
  can never exceed; the fitter scales the art uniformly down to the smallest
  size the line still fits at, plus a little air, anchored at the tail so it
  keeps pointing at the same mouth. Notes:
  - A line is laid out in the balloon's **room** — the largest rectangle that
    fits inside the outline, measured against the pale paper so it starts where
    the border ends. Its bounding **face** is not the same thing: a face
    includes the corners the balloon curves away from, and text laid out in one
    runs into the border on the top and bottom lines. `ROOM_INSET` in js/fit.js
    brings it in a little further for air. Both, plus the tail, are measured per
    file by `tools/measure-bubbles.js` into `js/data/bubbles.js` — re-run that
    tool when balloon art changes.
  - The leading is **1.3x** the type (52px in the game, 54px in the story). The
    1.5x it had before was set against the old bounding-box text area; in the
    room a balloon actually encloses, it left no two-line balloon able to shrink.
  - Never test the fit with `scrollWidth`: the line is centred, so a line that
    is too wide spills past both edges and the left half is not scrollable. The
    fitter measures a `Range` over the text instead.
  - The story's balloon is a `.layer`, and layers glide between marks over
    700ms; fitting turns that transition off for the moment it resizes, or the
    balloon is seen shrinking after it pops in.
  - **Every line in the project is set at one size** (40px/52px, both acts). A
    beat whose words are smaller than the last one's reads as a mistake, so a
    line too long for the size its balloon was drawn at makes the BALLOON
    bigger — up to `FIT_MAX` (1.35x), grown from the tail like every other
    resize. Four balloons in the whole game use any of it.
  - devtools reports and applies balloon edits in the DRAWN numbers, not the
    fitted ones (`_design`/`_fitAt` in js/game.js and js/story.js, `read()` and
    `write()` in devtools/edit.js) — otherwise an exported edit would bake in
    the shrunken size and the balloon would walk smaller with every round of
    edits. The story's `say.text` is no longer separately draggable: it follows
    its balloon.
- The lamp beats are staged with the lamp at the LEFT of frame and both
  characters on the right (`LAMP_STAGE` anchor in screens.js; Agni's pose is
  flipped so she points at it). The tap beat plays a small camera move — the
  pane pans right while the lamp slides in from the left edge (`is-lampstage`
  in game.js/game.css) — and the flock sweeps in from whichever side of frame
  the lamp is not on. NOTE: the pan animation lives on the PANE; putting a
  transform animation on `.layer` stomps the `is-flipped` transform.

---

### Memory — why it used to die on a phone

A browser holds every decoded image as **width x height x 4 bytes**, whatever
the file compressed to: a 24KB WebP that happens to be 4344x1448 costs a device
24 MEGABYTES the moment it is on screen. Audio is the same — decoded PCM, about
0.29 MB per second.

The chapter used to ask a device for **272 MB** (171 MB of bitmap plus 101 MB of
audio), and the peak landed exactly at the walk, because that is where the
parallax decodes on top of everything the story is still holding. A phone
answers that by killing the tab and reloading it — which looks like the game
restarting itself the moment the walk begins. It is now **98 MB**. Four things
did it, and all four are worth keeping:

- **The story lets go of its art** (`releaseStory()` in js/story.js, called from
  `leaveStory()` in js/main.js on every route out of the story). Forty megabytes
  of pages nobody could see stayed mounted through the walk and the whole game.
  startStory() rebuilds from the data, so nothing is lost.
- **The cover is put down** when the chapter starts (`.is-spent` on the loader):
  eight megabytes of full-frame picture sat behind the game for ever.
- **The heaviest art is stored at the size it is drawn** —
  `node tools/shrink-art.js`, originals in `assets/full/`. The spark sheet alone
  was 24 MB decoded for the smallest thing on screen. Nothing in it is a
  judgement call: each file is measured against the height its layer is drawn
  at in js/data/walk.js.
- **The music streams instead of being decoded** (`bedNode()` in js/audio.js).
  A bed runs for minutes and decoding one costs ~15 MB per minute for the life
  of the tab; they now play from a media element routed into the same music bus,
  so the cross-fade, the duck and the mute are unchanged. They are deliberately
  absent from `audioManifest`. The pause has to stop the element as well as
  suspending the context — a media element has a clock of its own.

Two more, which are about the *moment* rather than the total. A phone can hold
98 MB comfortably and still be killed by a spike, and the hand-over was one:

- **Six images decode at a time, not sixty** (`AT_ONCE` in js/preload.js).
  `preload()` used to fire every source at once, so the hand-over asked for the
  walk's fifteen and the game's forty-nine in the same instant — sixty-four full
  bitmaps alive together, at exactly the point where the walk starts. A worker
  pool turns that spike into a window that moves along. Measured on the
  emulated phone: **64 in flight becomes 16**.
- **One round at a time** (`artFor(round)` in js/data/screens.js,
  `prefetchRound()` in js/main.js). The hand-over only needs the tutorial's
  pictures; every round after it is fetched a second and a half into the round
  before it, so nothing ever waits and no two places are held at once. The dev
  tools jump anywhere, so `?dev` still fetches the whole manifest.

Together those take the peak at the hand-over from ~98 MB to **49 MB**,
settling to 30 MB once a round is being played.

## The cake gag, on a switch

The chapter ran long for a four-year-old, and the cake is the part that can go
without taking the story with it. `const CAKE = false` in **js/data/scenes.js**
and the same in **js/data/screens.js** cut it in both halves at once. Nothing is
deleted — set both back to `true` and the gag returns exactly as it was, with
every recording it uses.

What it removes:

- **Story, page one** — 1.2 (Neel smells the bakery), 1.3 (Agni: you just ate),
  1.4 (his grin). The page keeps 1.1, the walk into town, and 1.1 takes a
  `reveal` because it is now the last step of the page and a last step waits for
  the reader instead of turning itself. The page is called "The Walk" while the
  gag is off — there is no cupcake on that lane any more.
- **The ending** — e3 ("नील?", he has wandered off) and ev (the film of him
  floating to the bakery), plus the smell drifting across e1 and e2, which was
  only ever the gag's setup.

What is left is the flow as asked for: they are walking through town, the
lights go out, something laughs in the dark, they decide to find the twinkles,
and the game begins. It ends on "हमने कर दिखाया, नील!" / "शहर फिर से चमक रहा
है!" and then समाप्त.

The story reaches the road at **38s instead of 52s**, and the ending runs 8s
instead of 21s.

Three things followed from the cut:

- **Nothing is left outside the lamp.** Screen 5.2 in every level drew a single
  twinkle beside the lit lamp — the one it had "caught". The beat before it
  pours the whole flock INTO the glass, so one sitting outside read as one that
  got away. All five are gone; the light in the glass is where they all are.
- **The closing circle is back, and belongs to the beat now.** It used to be
  part of the film — the last frame shrank to a point and the chapter ended in
  the dark it left — so cutting the film took the iris with it and the chapter
  simply went black. `screen.iris` puts the scene's layers inside a box that
  closes to nothing on the middle of the frame (`.scene-iris`, js/game.js +
  css/game.css). What it closes down to is the pane's own ground. The word is
  appended OUTSIDE that box, or it would be clipped away with the picture.
- **समाप्त is centred**, on both axes, by `shout: { centre: true }` rather than
  by an x/y that was only right at one size. The idle rock needed its own
  keyframes (`shout-rock-centre`) because it animates `transform`, which would
  otherwise throw the centring translate away.

## How long the items stay

One number in CSS used to govern every round, so the tutorial — where a child
is meeting the idea — and the last level — where they have counted four rounds
already — showed their countables for the same 6.6 seconds. It is per screen
now: `fireflies.life` in js/data/screens.js, out through `--swarm-life` to the
`ff-swarm` animation, with the poof's delay written as a fraction of it
(88.2%, which is where 5820 of the old 6600 was) so it still bursts where they
vanish rather than after they have gone.

| round | items on screen |
| --- | --- |
| tutorial, first time | 5s |
| tutorial, second time | 4s |
| levels 1 and 2 | 3.5s |
| levels 3 and 4 | 2.5s |

Measured in the browser rather than read off the data: 4.9 / 4.0 / 3.5 / 2.5.

Two things had to follow it:

- **Six hand-written dwells came out.** Every swarm beat carried `dwell: 10000`
  (or 7100), which was the old 6.9s life written out by hand — stale the moment
  the life changed, and a stale dwell holds the beat open on an empty screen.
  The beat already knows how to work this out: `swarmAt + swarmLife + SWARM_AIR`
  is one of the four terms in its `max()`.
- **The first beat's swarm now counts towards its own length.** The test was
  `swarmAt`, which is zero on screen 1.1 — the twinkles come in WITH her line
  there rather than after it — so that one beat's swarm did not count, and the
  hand-written dwell had been covering for it. It tests `fireflies.enter` now:
  a swarm that arrives has a life the beat must outlast, one that is simply
  standing there does not.

## Seating a replacement drawing

`ep_pair.webp` — the high-five — had the white of Agni's eyes erased. The fixed
render (`agni_neel_highfive.webp`) is NOT a drop-in, and neither difference is
visible in the file listing:

- **It is drawn the right way round.** The old one was Neel-left and carried
  `flipX: true` to put Agni on the left; the new one is already Agni-left, so
  the flip has to go or the pair swap sides.
- **It is the same composition on a taller canvas.** Same box, different
  margins, so reusing the old box would have stretched it.

The way to move a drawing between two renders is to match the INK, not the
file: measure the alpha bounding box of each, work out where the old ink landed
on the frame (x 414..1309, y 434..994 — remembering the old box was mirrored,
so its ink spans the mirror of where it sits in the source), and solve for the
box that puts the new ink on those same pixels. That gives
`x: 400, y: 348, w: 916, h: 664`. The two inks measure 1.599 wide-to-tall to
three places, which is the check that the render really is the same drawing and
not a recomposition — if that number had drifted, no box would fit and
something else would have to give.

The scratchpad script that does it is `bbox.cjs`; it is worth keeping the
approach in mind for the next replacement.

Converted to WebP at the height it is drawn (764, per tools/shrink-art.js), so
it costs 3.1 MB decoded where the old one cost 4.5. The PNG and the old
ep_pair.webp are both untouched on disk.

## Both of them are frightened

Only Neel shivered when the mist came in, which read as him being the scared one
and Agni being fine with it — and she is the one looking down at it crawling
over her feet. She has `fx: "shiver-slow"` now: the same shake, 290ms instead of
220 and slightly smaller, because two people shivering in perfect step is a
mechanism and two different times are two people.

## The cover speaks its own name

Pressing Play now says the title (`vo_title`, played straight from
js/main.js — no cue table names it, so it is listed in `audioManifest` by hand)
and the cover holds while it is said. Opening the story underneath would put
the title and the narrator's first line in the same breath and neither would be
heard. `clipLength` is 0 on a silent device, so that case waits nothing.

## Why Mr Giggles could not be heard

He was being charged for distance three times over: `gain: 0.32`, a lowpass at
1500Hz — through the middle of his voice, not above it — and the **sfx bus**,
which runs at 0.85 and, far more to the point, does not duck the music. So the
laugh was playing at roughly a quarter of full underneath a `bed_dark` that
never got out of its way.

He is `vo` now. That is most of the fix: full bus, and the bed steps back under
him like it does for every other line in the chapter. What is left of the
distance is the part that still reads as distance once he can be heard — the
lowpass moved up to 3600Hz and the pan further out to the side than the blink
beside him. Net, about +10 dB before the duck.

The lesson generalises: **a voice on the sfx bus is a voice the music will
bury.** `fire()` ducks on `bus === "vo"` and nothing else.

## Told once, then trusted

The tutorial teaches the tap and says the whole sentence — "गिनने के लिए हर
जुगनू पर टैप करो।" The four levels used to say their own version of it every
time, which was the longest repeated thing in the chapter. They say **"अब
गिनो!"** now: a child who has counted a round is being asked to count, not
shown how.

The voice follows the text. `vo_l1_tapcount`..`vo_l4_tapcount` are off those
cues — a voice reciting the full sentence over a two-word balloon is exactly
the repetition that was taken out. The recordings are untouched on disk, and a
short "अब गिनो!" take drops straight into the same four cues.

**And the hand waits.** The hint hand used to lie over the first item from the
moment the line ended, in every round. On the levels it is now held back
(`hint.after: 10000`, `armHint()` in js/game.js) and only offered if nothing has
been touched for ten seconds — and it goes again the moment something is, which
restarts the wait, so it comes back if a child stalls halfway through. The
tutorial's hand still comes out with the line, because that beat is where
tapping is taught.

Measured: beat opens with no hand, hand at ~10s, gone on the first tap, back
ten seconds later if the counting stops.

The take arrived: `vo_l_countnow` ("अब गिनो!", 0.8s after trimming) is on all
four level count cues, so the balloon and the voice say the same short thing.
`vo_l1_tapcount`..`vo_l4_tapcount` — the four long reads — are untouched on
disk and no longer played.

## The chapter ends on the dark

No word. The picture closing to a point IS the ending, and "समाप्त" over it only
labelled what the reader had just watched happen. The iris stays; `eend` is the
iris and a breath after it (dwell 2800), and the chapter closes onto its own
cover as before — verified reaching `chapter:done` 11s after the last line.

## The lamp asks to be tapped

`#game .lamp .fill` already had a warm halo on `:hover` — which a child on a
tablet will never see. The same halo now breathes on its own for as long as the
lamp is unstruck (`lamp-ask`, css/game.css): a tight near-white core to pick the
ironwork out of the dark and a wide amber one behind it, because one soft
shadow alone washes out against a lit sky.

It is on `.fill` rather than `.lamp` because the lamp box carries the beat's
camera move (`.is-lampstage`) and an animation there would take it over. And it
is scoped `:not(.is-struck)`, so the invitation cannot outlive the tap that
answered it. Under `prefers-reduced-motion` it holds still rather than
disappearing — a lamp that gives no sign of being tappable is worse than one
that glows steadily.

It is on every round's lamp beat, not only the tutorial's: the instruction
appears each round and so should the thing it points at.

`#game .lamp` is the one `.layer` that does not clip. Every other layer is a
crop box (`overflow: hidden`), and the lamp's crop is horizontal only — the art
is a lamp on a transparent field, narrowed to the lamp. But the box was cutting
the halo below as well, which is why the glow had a straight edge across it at
the lamp's foot. There is nothing outside that box but transparent pixels
(checked: the corners are 0/10000 opaque), so letting it show costs nothing and
the glow now ends where the light ends.

## No "यय!"

The comic-burst caption over Neel on screen 5.2 is gone from all five rounds.
`vo_neel_yay` and `vo_agni_yay` still play from the cue table, so the beat is
still their cheer — heard rather than read, which is one fewer thing asking to
be looked at on a beat whose subject is the lamp.

## No page turning

The story turns its own pages. It is eight beats long; a reader holding its
hand through it was worth having at twenty-two and is not at eight, so the two
arrow buttons are gone from index.html, their styles are gone from
css/story.css, and the keys that matched them are gone from js/main.js. In
js/story.js every beat now schedules the next itself — a page-closing step
takes its `reveal` as a floor, because that number is the beat of air the page
was written to end on. Verified by pressing nothing at all: cover to road in
42s, unattended.

`nav_arrow.svg` and `nav_arrow_blue.svg` are still in assets/images/.

**The manifests follow the data by themselves.** `audioManifest` now fetches
only the cues whose beat is still in the chapter — and it checks each act
against ITS OWN ids, because the two halves reuse them and mean different beats
by them: "1.2" is Neel smelling the bakery in the story and the third screen of
the tutorial in the game. Checking one against the other is how a cut beat's
voice went on being downloaded and decoded. Four clips and four pictures come
off the load as a result.

## Why it looked right here and wrong live

A picture that is preloaded and then dropped is not loaded. `preload()` used to
build an `Image`, wait for it, and let it go — after which the only copy left
was the HTTP cache, which a phone evicts whenever it likes and a host can tell
the browser not to keep at all. So the picture was fetched AGAIN at the instant
it was finally put on screen. Off localhost that second fetch is invisible;
over a real connection it is a character who is not there yet, a speech bubble
that never draws, a blank screen with the voice still playing — which is
exactly what came back from the live site and never once from this machine.

`preload(sources, onProgress, group)` now **holds** what it loaded, under a
group name, and `release(group)` lets it go when that act is done: `"story"`
(dropped by `leaveStory()`), `"walk"`, `"round:N"`. This is the same memory
shape as before — one place's art at a time — with the guarantee that what was
loaded is still there. Measured on the emulated phone: unchanged at 32 / 26 /
49 / 30 MB.

Three more holes the same investigation turned up, all of them invisible on a
fast connection:

- **The keypad is seven pieces, not three.** `commonArt` listed the frame, the
  key art and the counter; the readout, the clear key, the confirm key and the
  tick inside it were fetched only when the pad first drew itself.
- **The ending's clip was never preloaded.** `artFor()` and `manifest` read
  `screen.layers`, `lamp`, `hint` and `bubble` but not `screen.video`, so the
  5.9s film began downloading at the moment it was due to play.
- **A slow fetch was treated as a broken one.** The per-image timeout was 15s
  and a timeout was retried — so on mobile data, where the whole chapter's art
  and voice share one thin pipe, a picture that was merely queued got abandoned
  AND re-requested, putting it back at the end of the same queue. It is 45s
  now, only a real error is retried, and every place that waits on art has its
  own much shorter cap (`ready()`, `ART_WAIT` 12s) so nothing on screen is ever
  waiting on that number.

And the round hand-over is gated: `warpOn()` does not begin the light until
`prefetchRound(chapter)` has landed. The round after this one is fetched a
beat into this one, so in practice it waits for nothing.

**How to test this without a phone.** Throttle the connection — none of it
reproduces on localhost. `Network.emulateNetworkConditions` at 1.6 Mbps / 150ms
over the whole player path, sampling twice a second for anything on screen
whose picture has not arrived (an `img` with no `naturalWidth`, or a
background-image with no `PerformanceResourceTiming` entry). Before: the
keypad arrived in pieces and level 1 came up without Neel. After: cover →
story → walk → tutorial → warp → level 1 with nothing on screen ever waiting,
and no faults in the black box.

And a fifth, which was the iPhone-only half of it:

- **No layer may be wider than the frame.** The walk's scrolling bands were DOM
  elements one tile wider than the frame, moved by transform. On an iPhone in
  landscape the widest came to **6342 device pixels** — past the 4096 a Safari
  backing store can be — and the eleven together asked the compositor for
  **146MB of texture**. Safari answers by not rendering them, which is the
  parallax standing still, and then by killing the tab, which is the game
  appearing to restart the moment the walk begins. Chrome tiles oversized layers
  and survives, which is why Android was fine and one phone was not.

  Each band is a **canvas sized to the pixels it occupies on the screen**
  (`sizeStrip()` in js/walk.js) with the tile drawn at a fractional offset. The
  motion is still sub-pixel, which is what the transform was for. Two things
  keep it at full frame rate: a band is not drawn at all until it has moved a
  whole screen pixel — the sky travels nine pixels a second — and only the part
  of it inside the frame is drawn, since several hang off the bottom. Measured
  62fps, against 36 for the naive version and 60 for the DOM one it replaced.
  `refitWalk()` re-sizes the canvases when the stage does, so a rotate does not
  leave them blurred.

Where it landed, on an iPhone-shaped viewport:

| | before | after |
|---|---|---|
| bitmap at the walk | 171 MB | 26 MB |
| compositor texture | 146 MB | 43 MB |
| decoded audio | 101 MB | 41 MB |
| widest single layer | 6342 px | 1882 px |

**When a device kills the tab there is no console**, so the chapter keeps a
black box (js/watch.js). It marks each stage — boot with the device's own
numbers, loader, begin, story:done, walk:build, walk:bands, walk:frame-1,
walk:running every 60 frames, walk:arrive, game:enter — plus any error or
rejection, into sessionStorage. A killed tab reloads, and the title screen shows
what the run before it was doing when it stopped ("stopped at 40.1s
walk:frame-1"); the full trail is in the note's tooltip and in the console.

Two things act on it rather than only reporting it:

- **A run that stopped ON the road does not take it again.** `walkIsUnsafe()` in
  js/main.js sends the next run straight from the story to the clearing. Only a
  trail whose last mark is inside the walk counts — a tab closed or navigated
  away from ends in pagehide wherever it was, and counting that would take the
  walk away from a device that was perfectly happy.
- **A walk that stalls still delivers them.** `walkGuard` hands over anyway at
  WALK_MS + 4s, so a throttled frame loop cannot strand a child in front of a
  still picture with nothing to press.

If you add art, check it with the same arithmetic before shipping it: pixels x 4
is what the device pays, not the file size — and nothing may be wider than the
frame it sits in.

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
- Story music follows its scenes: `bed_main` (page 1, the walks, the game) →
  `bed_uneasy` (the mist, step 2.1) → `bed_dark` (lights-out and the black
  page, 2.2) → `bed_hope` (page 3, from the 3.4 transition) — `playBed()`
  cross-fades between them. The lamp dies magically (`magic_gutter` /
  `magic_out` — this world has no electricity, nothing may buzz) and the
  game's swarms vanish on `magic_vanish` (a falling shimmer), never a reward
  chime. All recipes live in tools/gen-sfx.js; `lamp_flicker`, `lantern_pop`
  and `lamp_out` are unreferenced but kept on disk.
- **Never delete audio files** when removing them from code — just remove the
  references.
- **Nothing on the dark screens may be written down.** Step 3.1 holds nothing
  but two pairs of eyes, so any text on it reads as one of *them* saying it —
  which is why Mr Giggles' laugh is heard there and never spelled out (the
  "ही! ही!" that used to pop in time with it is gone; `hehes()` in js/story.js
  is kept, unused, beside `laugh()`). Same reason the two lines after him are
  spoken in each character's own colour rather than in a balloon.
- **Distance is not just level.** A cue can carry `muffle` — a lowpass corner
  in Hz applied before the pan (`fire()` in js/audio.js) — so something far off
  loses its top end as well as its loudness. The giggle uses it: `gain 0.32,
  muffle 1500, pan -0.62`. Turning a clip down on its own leaves it sounding
  close and quiet.
- **A sound that must straddle a beat boundary has to start on the later
  beat.** Every step change calls `clearCues()` (js/story.js), which stops
  anything still running on the sfx bus — only a voice already mid-line is
  spared, and only where `keepVoice` is passed. Something wanted "over the
  transition" therefore belongs at `at: 0` of the beat being dissolved *to*,
  where it plays under the 700ms layer fade; scheduled at the tail of the
  outgoing beat it is cut off mid-sound.
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
- **A pose lasts a phase, not a line.** Playtest feedback was that the
  characters changed pose on almost every dialogue (measured: Agni on 13 of the
  tutorial's 15 beat transitions). Each character now holds one pose per phase
  of a round — look/ask, count, compare, lamp — the listener never changes
  while the other speaks, and the only beat where both change is the payoff
  (the lamp lights: Neel spins, Agni cheers on `agni_celebrating`). Now Agni
  6/15 and Neel 7/15 in the tutorial, 4/8 and 3/8 in a level. When adding beats,
  reuse the pose the phase is already holding rather than picking a new one, and
  copy that pose's canonical box+crop so it does not change size mid-phase.

---

## 7. Parked / open items

- ~~VO to record~~ **Done.** All 20 clips (`vo_l2/3/4_*`, `vo_nn_10..19`, and a
  re-take of `vo_l1_total` saying "seven") were generated with the same
  msedge-tts casting, silence-trimmed and loudness-matched to −16 LUFS like the
  rest. `tools/gen-vo-game.js` stays the source of truth for a full regen.

- **Things headless verification cannot see**, so don't read their absence
  from a screenshot as a bug: the `enter: "magic"` materialise-in on every
  level's look beat (its CSS animation clock does not advance under
  `--virtual-time-budget`, so the swarm sits at opacity 0 — the shipped
  tutorial and level 1 behave identically), and the walk when it is entered by
  a devtools jump rather than by finishing the previous level (it renders empty
  for `clearing` and `meadow` too). Verify the walk by riding the previous
  level's last beat to its end instead; that path renders correctly. Also
  blind: the eyes on 3.1 (a `<video>` — headless decodes none, so that beat
  screenshots black), and any balloon on a beat reached by a devtools jump (the
  overlay fades in on a CSS transition that never runs — check the text is in
  the DOM instead).
- **Audio cannot be verified in a headless browser at all**: `decodeAudioData`
  never resolves under `--virtual-time-budget` (there is no audio thread to
  advance), so `loadAudio()` hangs and every buffer stays empty. To check what
  the mixer *builds* for a cue — the filter, the pan, the order of the chain —
  stub `window.AudioContext` with a recording fake **before** importing
  js/audio.js and read the connect/disconnect calls the real `fire()` makes.
  How it actually sounds still needs a person and a pair of speakers.

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
