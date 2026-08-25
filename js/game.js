// The game player — act two. Builds each beat from js/data/screens.js into one
// of two panes and cross-fades between them, so the outgoing screen is still on
// display while the incoming one paints.
//
// It shares the page, the stage and the audio context with the story, so the
// ambience the story ends on simply keeps playing under the first screen.
//
// Dialogue beats read themselves and move on: each one waits long enough for
// its line to be read, then advances. The three interactive beats wait for the
// player instead — the keypad for a guess, the swarm for every twinkle to
// be tapped, the lamp for a tap — and advance once that is done.

import { levels, keypad, counter, numberLine, FRAME_W } from "./data/screens.js";
import { gameCues } from "./data/audio.js";
import { anchorOffset, bodyBox, castOf } from "./anchor.js";
import { clearCues, playCues, playSfx, playVo, clipLength } from "./audio.js";

const panes = [
  document.getElementById("game-a"),
  document.getElementById("game-b")
];
const hud = document.getElementById("hud");

const CROSSFADE = 620; // must track --speed-slow in css/game.css

// Reading pace for a dialogue beat: a beat to take in the picture, plus time
// per character, held between a comfortable floor and ceiling.
const READ_BASE = 1400;
const READ_PER_CHAR = 70;
const READ_MIN = 3000;
const READ_MAX = 6200;

const AFTER_COUNT = 950; // let the last twinkle land before moving on
// The lamp's whole answer to the tap: the flock takes FLOCK_MS to stream in
// and pour into the glass, the light comes up under the last of them, and the
// beat turns once it has been seen lit.
const FLOCK_MS = 2100;
const AFTER_LAMP = FLOCK_MS + 1500;
// The breath between the end of a line and the next beat. This is most of the
// game's pacing: the next line starts 500ms into its own beat, and the 620ms
// cross-fade eats into whatever sits between them, so at 650 one line ended and
// the next was speaking about a second later — nothing had time to land. 1700
// leaves a genuine pause: line, a moment to take it in, then the answer.
const VO_TAIL = 1700;
const GUESS_FLIGHT = 1500; // the tapped digit's trip across — slow enough to watch
const GUESS_LANDS = 2200; // and a beat to see it sitting there before moving on
const COUNT_SETTLE = 600; // the last number grows before the line is drawn
const LINE_WALK = 1500; // both markers travel down onto the number line
const LINE_HOLD = 2200; // and then stay put long enough to be compared

// Which round is playing. A level is the whole kit for one place: its screens,
// what is counted (art, layout, total), what the thing is called, and the class
// that restyles the swarm — see `levels` in js/data/screens.js. Everything
// below reads through `level`, so the same machine plays every round.
let round = levels[0];

let index = -1;
let front = 0;
let busy = false;
let timer = null;
let onComplete = () => {};
let hold = false; // dev: freeze on the current beat instead of reading on
let pending = null; // a beat built but not yet begun, waiting on releaseHold()

/* ---- run state ---- */

let guess = null; // what the player typed on the keypad
let counted = 0; // twinkles tapped on screen 3.2

export function initGame(handlers) {
  onComplete = handlers.onComplete;
  hold = Boolean(handlers.hold);
}

// Let a held run start. Used when arriving from the walk: the first screen is
// built under the cross-fade and only begins once the pair have stopped and
// changed pose, so none of its reading time — and none of its voice — is spent
// under the hand-over.
export function releaseHold() {
  if (!hold) return;
  hold = false;

  const screen = pending ?? round.screens[index];
  pending = null;
  if (screen) speak(screen);
}

// Re-arm the hold for another arrival — the next startGame() builds its first
// beat and waits for releaseHold(), exactly like the first hand-over did.
export function armHold() {
  hold = true;
}

// A jump past the keypad needs a guess to quote back. Single digit, because
// that is all the pad can produce.
function standInGuess(start) {
  const pad = round.screens.findIndex((screen) => screen.interact === "keypad");
  if (pad >= 0 && start > pad) guess = 7;
}

// `at` jumps straight to a beat — see the ?beat= dev shortcut in main.js —
// and `levelIndex` picks which round to play (see `levels` in data/screens.js).
export function startGame(at = 0, levelIndex = 0) {
  clearTimeout(timer);
  clearCues();
  round = levels[Math.min(Math.max(levelIndex, 0), levels.length - 1)];
  index = -1;
  front = 0;
  pending = null;
  guess = null;
  counted = 0;

  panes.forEach((pane) => {
    pane.classList.remove("is-active");
    pane.replaceChildren();
  });

  hud.classList.add("is-active");

  const start = Math.min(Math.max(at, 0), round.screens.length - 1);
  standInGuess(start);
  go(start);
}

export function next() {
  clearTimeout(timer);
  if (index >= round.screens.length - 1) return finish();
  go(index + 1);
}

// Dev hooks (devtools/, only reached with ?dev). Jumping to a screen carries on
// playing from it; only devPause() stops the clock.
export function devGoto(at, levelIndex) {
  clearTimeout(timer);
  hold = false;
  if (levelIndex != null) {
    const next = levels[Math.min(Math.max(levelIndex, 0), levels.length - 1)];
    // A fresh level is a fresh run: its own count, its own guess.
    if (next !== round) { round = next; guess = null; counted = 0; }
  }
  const i = Math.min(Math.max(at, 0), round.screens.length - 1);
  standInGuess(i);
  go(i);
  return round.screens[i];
}

export function devPause(on) {
  clearTimeout(timer);
  hold = on;
  if (on) return;

  const screen = pending ?? round.screens[index];
  pending = null;
  if (screen && !screen.interact) advanceIn(readingTime(screen));
}

// "Skip" leaves the whole act, not one screen.
export function skipGame() {
  clearTimeout(timer);
  index = round.screens.length - 1;
  finish();
}

// Queue the next beat. Any new beat cancels whatever was pending.
function advanceIn(ms) {
  clearTimeout(timer);
  timer = window.setTimeout(next, ms);
}

function go(target) {
  const screen = round.screens[target];
  const back = panes[1 - front];
  // An interactive beat is left by the player acting, which they can do while
  // the line is still going. Let it finish over the next screen rather than
  // cutting it off to answer them.
  const leaving = round.screens[index];

  clearTimeout(timer);
  index = target;
  busy = true;
  back.replaceChildren(render(screen));
  // Both are per-beat states and the pane is reused: is-cleared left behind
  // would arrive with the next screen and hide a bubble that was never shown.
  back.classList.remove("is-begun", "is-cleared");

  panes[front].classList.remove("is-active");
  back.classList.add("is-active");
  front = 1 - front;

  clearCues({ keepVoice: Boolean(leaving?.interact) });

  // Held means the beat is built but has not begun. Arriving from the walk that
  // is the whole cross-fade, and firing the cues here put the bubble and the
  // line on screen while the pair were still mid-stride. So a held beat speaks
  // nothing until releaseHold() lets it.
  if (hold) {
    pending = screen;
    return settle();
  }

  speak(screen);

  settle();
}

// Start a beat: what it shows, what it says, and its clock. The class is what
// lets the bubble in and starts the arriving swarm — both are rendered with the
// pane, so gating only the cues left them on screen under the hand-over while
// the pair were still walking.
function speak(screen) {
  // `front` has already been flipped by go() at this point, so the pane that
  // just became active is panes[front], not panes[1 - front].
  panes[front].classList.add("is-begun");
  scheduleReveals(screen, panes[front]);

  const cue = gameCues[screen.id];
  playCues(cue);
  const spokenEnd = dynamicVoice(screen);

  // A beat lasts the longest of three things: long enough to read, long enough
  // for its own line to finish, and long enough for whatever the player's answer
  // added. Reading pace alone was cutting lines off — it is counted from the
  // caption, and a caption is a poor guide to how long it takes to say.
  const lineEnd = cue?.vo ? (cue.vo.at ?? 0) + clipLength(cue.vo.id) : 0;
  const wait = Math.max(readingTime(screen), lineEnd + VO_TAIL, spokenEnd + VO_TAIL);

  // Dialogue reads itself; an interactive beat waits for the player, and its
  // own handler queues the advance once the player is done.
  if (!screen.interact) advanceIn(wait);
}

// What a beat holds back until its line has been said. The swarm's own delay
// lives in CSS (--swarm-at, set by swarm()); these are the parts CSS cannot do:
// the bubble leaving as the twinkles arrive, and the keypad coming in on its
// sparkle. Timers are kept so a screen change never fires a reveal into the
// wrong pane.
let revealTimers = [];

function scheduleReveals(screen, pane) {
  revealTimers.forEach(clearTimeout);
  revealTimers = [];

  // 1.5: her line ends, the bubble goes, and only then do the twinkles come.
  if (screen.fireflies?.at) {
    revealTimers.push(window.setTimeout(() => {
      pane.classList.add("is-cleared");
    }, screen.fireflies.at - 150));
  }

  // 2: the pad appears once the question has been asked, on a burst of sparkle.
  if (screen.keypadAt) {
    revealTimers.push(window.setTimeout(() => {
      const panel = pane.querySelector(".keypad");
      if (!panel) return;
      panel.classList.remove("is-waiting");
      // The burst is scattered over the panel's face, not its corner.
      sparkleBurst(pane, { x: 941, y: 530, spread: 300, count: 18 });
    }, screen.keypadAt));
  }
}

// A handful of gold motes thrown out from a point — the same magic the tapped
// twinkles use. Deterministic off the index, so it is the same burst each time.
function sparkleBurst(pane, { x, y, spread, count = 14 }) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + (i % 3) * 0.4;
    const r = spread * (0.3 + ((i * 37) % 60) / 100);
    const bit = document.createElement("i");
    bit.className = "magic-bit";
    bit.style.left = `${x + Math.cos(a) * r * 0.4}px`;
    bit.style.top = `${y + Math.sin(a) * r * 0.25}px`;
    bit.style.setProperty("--px", `${(Math.cos(a) * r * 0.7).toFixed(1)}px`);
    bit.style.setProperty("--py", `${(Math.sin(a) * r * 0.45 - 24).toFixed(1)}px`);
    bit.style.width = bit.style.height = `${7 + (i % 4) * 4}px`;
    bit.style.animationDelay = `${(i % 5) * 60}ms`;
    pane.append(bit);
    window.setTimeout(() => bit.remove(), 1400);
  }
}

function settle() {
  window.setTimeout(() => {
    busy = false;
  }, CROSSFADE * 0.45);
}

// `dwell` overrides the reading pace for a beat that has something to watch as
// well as something to read — screen 1.1 holds while the swarm arrives, is
// looked at, and leaves again.
function readingTime(screen) {
  if (screen.dwell) return screen.dwell;

  const chars = screen.bubble ? screen.bubble.text.length : 0;
  return Math.min(READ_MAX, Math.max(READ_MIN, READ_BASE + chars * READ_PER_CHAR));
}

function finish() {
  clearTimeout(timer);
  clearCues();
  playSfx({ id: "cheer_swell", gain: 0.9 });
  hud.classList.remove("is-active");
  onComplete();
}

/* ---- dynamic copy ---- */

// The words, the line and the chime for each outcome, together, so they cannot
// drift apart. None of them is a buzzer: guessing wrong and then counting is the
// whole point of the game, so the worst case still sounds like encouragement.
const VERDICTS = {
  none: { text: "Let us try again!", vo: "vo_g_tryagain", sfx: "try_chime" },
  exact: { text: "Spot on!", vo: "vo_g_spoton", sfx: "correct_chime" },
  near: { text: "That was close!", vo: "vo_g_close", sfx: "near_chime" },
  far: { text: "Good try — now we know!", vo: "vo_g_goodtry", sfx: "try_chime" }
};

function verdictKey() {
  if (guess === null) return "none";

  const off = Math.abs(guess - round.total);
  if (off === 0) return "exact";
  if (off <= 2) return "near";
  return "far";
}

function verdict() {
  return VERDICTS[verdictKey()].text;
}

// Agni counts along, and finishes the two lines that end in a number the player
// chose. Only zero to twenty were recorded — a larger guess is left to the
// bubble, which is showing the figure anyway.
const SPOKEN_MAX = 20;

// `who` picks whose voice says it. Agni counts the twinkles and reads the
// total; Neel has his own nought to nine, because he is the one who says "Hmm...
// I think there were —" and the number that finishes his sentence cannot be in
// her voice. His only go to nine, which is all the pad can make.
function sayNumber(n, at, pan, who = "agni") {
  if (!Number.isInteger(n) || n < 0) return false;
  const neel = who === "neel";
  if (n > (neel ? 9 : SPOKEN_MAX)) return false;
  playVo({ id: `${neel ? "vo_nn_" : "vo_n_"}${n}`, at, pan });
  return true;
}

// The beats whose voice depends on what the player did, named by `role` in the
// screen data so every level's version of the beat gets the same treatment.
// Returns the moment its last clip finishes, in ms from the start of the beat,
// so speak() can hold the screen until then. The stems' timing is read off the
// beat's own cue, so a level with a different line stays in step by itself.
function dynamicVoice(screen) {
  // A breath after the beat's own stem — "I think there were —", "You
  // guessed —" — where the number that finishes the sentence goes.
  const afterStem = () => {
    const v = gameCues[screen.id]?.vo;
    return v ? (v.at ?? 0) + clipLength(v.id) + 120 : 620;
  };

  // "Hmm... I think there were {guess}." — Neel's voice finishes his sentence.
  if (screen.role === "readback") {
    const at = afterStem();
    return sayNumber(guess, at, 0.55, "neel") ? at + clipLength(`vo_nn_${guess}`) : 0;
  }

  // "You guessed {guess}." — the number is said and drops onto the line with it.
  if (screen.role === "guessline") {
    const at = afterStem();
    window.setTimeout(() => dropFromCounter(panes[front], "guess", guess), at);
    return sayNumber(guess, at, -0.5) ? at + clipLength(`vo_n_${guess}`) : 0;
  }

  // "There are {total} …" The answer goes onto the line as it is said.
  if (screen.role === "totalline") {
    window.setTimeout(() => dropFromCounter(panes[front], "total", counted || round.total), 620);
    return 0;
  }

  if (screen.role === "verdict") {
    const v = VERDICTS[verdictKey()];
    playSfx({ id: v.sfx, at: 260, gain: 0.85 });
    playVo({ id: v.vo, at: 560, pan: -0.5 });
    return 560 + clipLength(v.vo);
  }

  return 0;
}

function fill(text) {
  return text
    .replace("{guess}", guess === null ? "?" : guess)
    .replace("{total}", round.total)
    .replace("{verdict}", verdict());
}

/* ---- rendering ---- */

function render(screen) {
  const frag = document.createDocumentFragment();

  screen.layers.forEach((layer) => frag.append(imageLayer(layer, "layer", screen.anchor)));

  if (screen.fireflies) frag.append(swarm(screen));
  if (screen.lamp) frag.append(lamp(screen));
  if (screen.keypad) frag.append(keypadPanel(screen));
  if (screen.counter) frag.append(counterCard(screen.counter));
  if (screen.numberLine) frag.append(numberLineStrip(screen));
  if (screen.hint) frag.append(imageLayer(screen.hint, "layer hint"));
  if (screen.bubble) frag.append(bubble(screen.bubble, screen));
  if (screen.shout) frag.append(shout(screen.shout));

  return frag;
}

// A layer is a clipping box at the designed size, holding the image fill.
// That mirrors how Figma stores it, so a cropped fill lands on the same pixels
// here as it does on the canvas. The mirror goes on the BOX, not the image —
// Figma wraps the whole clipped box in the flip, and with an off-centre crop
// the two are not the same thing.
function imageLayer(layer, className = "layer", anchors = null) {
  const box = document.createElement("div");

  box.className = layer.fx ? `${className} fx-${layer.fx}` : className;
  // Names what this is, so devtools/ can report edits against the data.
  if (layer.src) box.dataset.key = layer.src.split("/").pop().replace(/\.\w+$/, "");

  // A change of pose should change the pose and nothing else. Each pose is drawn
  // at its own Figma box with its own transparent margin, so left alone they put
  // the character somewhere different every beat — measured, 118px of drift
  // across one scene. Shifting the layer onto the scene's anchor turns the
  // cross-fade into what it should be: the same character, a different pose.
  const nudge = anchorOffset(layer, anchors);
  place(box, nudge ? { ...layer, x: layer.x + nudge.dx, y: layer.y + nudge.dy } : layer);
  if (layer.flipX) box.classList.add("is-flipped");

  const img = document.createElement("img");
  img.className = layer.fill ? "fill fill--crop" : "fill";
  img.src = layer.src;
  img.alt = "";

  if (layer.fill) {
    // Figma's crop transform, verbatim — both dimensions always set, so the
    // fill can never fall back to `auto`.
    img.style.left = layer.fill.left;
    img.style.top = layer.fill.top;
    img.style.width = layer.fill.width;
    img.style.height = layer.fill.height;
  }

  box.append(img);
  return box;
}

function place(el, { x, y, w, h }) {
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  if (w != null) el.style.width = `${w}px`;
  if (h != null) el.style.height = `${h}px`;
}

/* ---- the swarm ---- */

function swarm(screen) {
  const group = document.createElement("div");
  const countable = screen.interact === "count";

  // Two beats bring the swarm in and scatter it again — 1.1 from off the left,
  // 1.5 from every direction — which is what gives "Where did they go?" and the
  // guess after it something to be about. The rest just show it, still.
  const enter = screen.fireflies.enter;
  group.className = enter ? `swarm is-swarming from-${enter}` : "swarm";
  // The level's own dressing — the glowberries' pink halo lives on this class,
  // see .swarm.is-berries in css/game.css.
  if (round.swarmClass) group.classList.add(round.swarmClass);
  // Drawn at the uncounted level — see .swarm.is-dim in css/game.css.
  if (screen.fireflies.dim) group.classList.add("is-dim");
  group.style.left = `${screen.fireflies.x}px`;
  group.style.top = `${screen.fireflies.y}px`;
  // When the swarm starts, ms into the beat. Everything downstream — each
  // twinkle's stagger, its vanish, the poof it vanishes on — is CSS arithmetic
  // over this one number; see --swarm-at in css/game.css.
  group.style.setProperty("--swarm-at", `${screen.fireflies.at ?? 0}ms`);

  round.layout.forEach((spot, i) => {
    // A countable twinkle is a real button; a decorative one is not.
    const el = document.createElement(countable ? "button" : "div");

    el.className = countable ? "firefly is-countable" : "firefly";
    place(el, spot);

    const img = document.createElement("img");
    img.className = "fill";
    img.src = round.swarmSrc;
    img.alt = "";
    el.append(img);

    if (countable) {
      el.type = "button";
      el.setAttribute("aria-label", `${round.word} ${i + 1}`);

      // The number each one takes when it is tapped, sitting above it. Built
      // empty: it is the tap that gives it a value, which is what makes the
      // count feel like the player's doing rather than a readout.
      const tag = document.createElement("b");
      tag.className = "firefly__n";
      el.append(tag);

      el.addEventListener("click", () => tally(el));
    }

    // An arriving swarm leaves by magic: each twinkle bursts into a ring of
    // gold as it goes — and on the beats that materialise (enter: "magic") the
    // same burst runs as it appears. The bits are built now and fired by CSS on
    // the same clock as the twinkle itself, so the two can never drift apart.
    if (enter) {
      const sets = enter === "magic" ? ["poof__bit poof__bit--in", "poof__bit"] : ["poof__bit"];
      for (const cls of sets) {
        for (let k = 0; k < 7; k++) {
          const a = (k / 7) * Math.PI * 2 + (i % 3) * 0.5;
          const bit = document.createElement("i");
          bit.className = cls;
          bit.style.setProperty("--px", `${Math.round(Math.cos(a) * (42 + (k % 3) * 20))}px`);
          bit.style.setProperty("--py", `${Math.round(Math.sin(a) * (32 + ((k + 1) % 3) * 17) - 14)}px`);
          bit.style.width = bit.style.height = `${7 + ((i + k) % 3) * 4}px`;
          el.append(bit);
        }
      }
    }

    group.append(el);
  });

  return group;
}

function tally(el) {
  if (el.classList.contains("is-counted")) return;

  el.classList.add("is-counted");
  el.disabled = true;
  counted += 1;

  // Lit, not dimmed. They start low and come up as they are counted, so the
  // screen fills with light as the player works rather than emptying out.
  el.classList.add("is-lit");
  burst(el);

  // The number this one took. It appears with the tap.
  const tag = el.querySelector(".firefly__n");
  if (tag) tag.textContent = counted;

  // Each one rings a step higher than the last, so counting up is audible as
  // well as visible — and Agni says the number, which is the whole lesson.
  playSfx({ id: "magic_tap", gain: 0.7 });
  playSfx({ id: "count_pip", gain: 0.8, rate: 1 + (counted - 1) * 0.07 });
  sayNumber(counted, 90);

  // Scope the lookups to this beat's own pane — the outgoing pane can still
  // be on screen mid-fade, holding a stale counter of its own.
  const pane = el.closest(".scene");

  // The tap hint has done its job once the player gets the idea.
  pane?.querySelector(".hint")?.classList.add("is-done");

  if (counted === round.total) {
    playSfx({ id: "count_done", at: 260, gain: 0.85 });
    finishCount(pane, el);
  }
}

// The last twinkle is counted. Its number grows and every other number goes,
// leaving one figure — the answer — against the guess still showing in the
// counter. Then both walk down onto the number line.
function finishCount(pane, last) {
  if (!pane) return advanceIn(AFTER_COUNT);

  pane.classList.add("is-counted-out");
  last.querySelector(".firefly__n")?.classList.add("is-total");

  // The line comes up empty here. The two numbers arrive on the beats that
  // speak them — the answer on "There are eight twinkles", the guess on "You
  // guessed —" — so each one is put on the line as it is said.
  window.setTimeout(() => {
    pane.querySelector(".numline")?.classList.add("is-live");
    playSfx({ id: "sparkle", at: 160, gain: 0.55 });
    advanceIn(LINE_WALK);
  }, COUNT_SETTLE);
}

// A ring of sparks off a twinkle as it lights. Purely decorative, so it is built
// here rather than in the screen data and removes itself when it is done.
function burst(el) {
  const fx = document.createElement("i");
  fx.className = "spark-burst";
  for (let i = 0; i < 8; i++) {
    const s = document.createElement("i");
    s.style.setProperty("--a", `${i * 45}deg`);
    fx.append(s);
  }
  el.append(fx);
  window.setTimeout(() => fx.remove(), 900);
}

// Comic-burst lettering — a cheer drawn on the frame. Each letter is its own
// element so they can pop up the word one after another, at their own small
// tilts, the way a comic sets an exclamation rather than a caption.
function shout(spec) {
  const wrap = document.createElement("div");
  wrap.className = "shout";
  wrap.style.left = `${spec.x}px`;
  wrap.style.top = `${spec.y}px`;
  wrap.style.setProperty("--tilt", `${spec.tilt ?? 0}deg`);

  [...spec.text].forEach((ch, i) => {
    const b = document.createElement("b");
    b.textContent = ch;
    b.style.animationDelay = `${180 + i * 90}ms`;
    b.style.setProperty("--ch-tilt", `${((i * 47) % 15) - 7}deg`);
    wrap.append(b);
  });

  return wrap;
}

/* ---- the lamp ---- */

function lamp(screen) {
  const el = imageLayer(screen.lamp, "layer lamp");

  // A div, not a button, so it can hold the art box exactly — give it the
  // keyboard affordances a button would have had.
  el.setAttribute("role", "button");
  el.setAttribute("tabindex", "0");
  el.setAttribute("aria-label", "Light the lamp");

  const strike = () => {
    if (el.classList.contains("is-struck")) return;
    el.classList.add("is-struck");
    playSfx({ id: "magic_tap", gain: 0.7 });

    const pane = el.closest(".scene");
    if (pane) {
      // The line has been answered: the bubble goes, and the twinkles come.
      pane.classList.add("is-cleared");
      flock(pane, screen);
    }

    advanceIn(AFTER_LAMP);
  };

  el.addEventListener("click", strike);
  el.addEventListener("keydown", (event) => {
    if (event.code !== "Space" && event.code !== "Enter") return;
    event.preventDefault();
    strike();
  });

  return el;
}

// The answer to the tap. Five twinkles stream in from off the left of frame,
// each trailing the same gold dust as everything else magical here, pour into
// the lamp's glass one after another, and the lit art fades up under the last
// of them — light arriving as a thing that was carried in, not as a filter
// turning on. Geometry is deterministic off the index, so it is the same
// arrival every run.
function flock(pane, screen) {
  const to = screen.lampGlass ?? { x: 902, y: 254 };
  const FLYERS = 5;
  const FLY_MS = 1400;

  for (let i = 0; i < FLYERS; i++) {
    const delay = i * 170;
    const from = { x: -70 - (i % 3) * 40, y: 150 + ((i * 89) % 330) };
    // The arc: a straight line lifted at its midpoint, higher for the flyers
    // that start lower, so the paths fan instead of stacking.
    const lift = 60 + ((i * 53) % 70);

    const fly = document.createElement("img");
    fly.className = "lamp-fly";
    fly.src = round.swarmSrc;
    fly.alt = "";
    fly.style.left = `${to.x}px`;
    fly.style.top = `${to.y}px`;
    fly.style.width = `${44 - (i % 3) * 8}px`;
    fly.style.setProperty("--fx", `${from.x - to.x}px`);
    fly.style.setProperty("--fy", `${from.y - to.y}px`);
    fly.style.animationDuration = `${FLY_MS}ms`;
    fly.style.animationDelay = `${delay}ms`;
    pane.append(fly);
    window.setTimeout(() => fly.remove(), delay + FLY_MS + 200);

    // Its trail, laid along the same arc, each mote lighting as the twinkle
    // passes it.
    for (let k = 0; k < 12; k++) {
      const t = (k + 0.5) / 12;
      const bit = document.createElement("i");
      bit.className = "magic-bit";
      bit.style.left = `${(from.x + (to.x - from.x) * t).toFixed(1)}px`;
      bit.style.top = `${(from.y + (to.y - from.y) * t - lift * 4 * t * (1 - t) + (((i * 31 + k * 47) % 22) - 11)).toFixed(1)}px`;
      bit.style.setProperty("--px", `${(((i + k) % 5) - 2) * 7}px`);
      bit.style.setProperty("--py", `${10 + ((i + k) % 3) * 8}px`);
      bit.style.width = bit.style.height = `${5 + ((i + k) % 4) * 3}px`;
      bit.style.animationDelay = `${delay + Math.round(t * FLY_MS) - 120}ms`;
      pane.append(bit);
      window.setTimeout(() => bit.remove(), delay + FLY_MS + 1100);
    }
  }

  // The light itself: the lit render fading up over the dark one as the flock
  // pours in, with a burst on the glass as it catches.
  if (screen.lampLit) {
    const lit = imageLayer(screen.lampLit, "layer lamp-lit fx-lamp-glow");
    pane.append(lit);
    window.setTimeout(() => {
      lit.classList.add("is-on");
      sparkleBurst(pane, { x: to.x, y: to.y, spread: 170, count: 14 });
      playSfx({ id: "lamp_strike", gain: 0.9 });
      playSfx({ id: "sparkle", at: 120, gain: 0.6 });
    }, FLOCK_MS - 500);
  }
}
/* ---- the keypad ---- */

// The panel and ten digits. The guess is a single number, so tapping one is the
// whole interaction: it lands in the counter and the beat moves on. No readout
// above them, and nothing to clear or confirm.
function keypadPanel(screen) {
  const panel = document.createElement("div");
  panel.className = "keypad";
  // Held invisible until the question has been asked — see scheduleReveals().
  if (screen?.keypadAt) panel.classList.add("is-waiting");

  panel.append(imageLayer(keypad.frame, "layer"));

  keypad.keys.forEach((key) => {
    const btn = document.createElement("button");

    btn.type = "button";
    btn.className = "key";
    place(btn, { x: key.x, y: key.y, w: keypad.keyW, h: keypad.keyH });
    btn.setAttribute("aria-label", key.label);

    const img = document.createElement("img");
    img.className = "fill fill--crop";
    img.src = keypad.keyArt;
    img.alt = "";
    img.style.left = keypad.keyFill.left;
    img.style.top = keypad.keyFill.top;
    img.style.width = keypad.keyFill.width;
    img.style.height = keypad.keyFill.height;
    btn.append(img);

    const label = document.createElement("span");
    label.className = "key__label";
    label.textContent = key.label;
    btn.append(label);

    btn.addEventListener("click", () => {
      if (guess !== null) return; // one guess; ignore a second tap mid-advance

      guess = Number(key.label);
      playSfx({ id: "key_confirm", gain: 0.85 });

      // The number is seen going where it is going: a copy of the digit lifts
      // off the key and flies to the counter, and only when it arrives does the
      // counter take the value. Without that the figure simply appeared in the
      // corner and nothing connected the two.
      const pane = panel.closest(".scene");
      pane?.querySelectorAll(".key").forEach((k) => { k.disabled = true; });
      pane?.querySelector(".hint")?.classList.add("is-done");
      flyToCounter(pane, btn, guess);
      advanceIn(GUESS_LANDS);
    });

    panel.append(btn);
  });

  return panel;
}

// Send the tapped digit across to the counter. Positions are read off the live
// boxes and converted back into frame units, because the stage is scaled to fit
// and a screen pixel is not a frame pixel.
function flyToCounter(pane, key, value) {
  const readout = pane?.querySelector(".counter__value");
  if (!pane || !readout) return;

  const box = pane.getBoundingClientRect();
  const scale = box.width / FRAME_W || 1;
  const at = (el) => {
    const r = el.getBoundingClientRect();
    return {
      x: (r.left + r.width / 2 - box.left) / scale,
      y: (r.top + r.height / 2 - box.top) / scale
    };
  };

  const from = at(key);
  const to = at(readout);

  const flier = document.createElement("b");
  flier.className = "key-flight";
  flier.textContent = value;
  flier.style.left = `${from.x}px`;
  flier.style.top = `${from.y}px`;
  flier.style.setProperty("--dx", `${to.x - from.x}px`);
  flier.style.setProperty("--dy", `${to.y - from.y}px`);
  pane.append(flier);

  // The dust it sheds. Laid along the flight path ahead of time, each mote
  // lighting as the digit reaches it — the same arc as @keyframes key-flight,
  // a straight line lifted 90px at its midpoint.
  for (let i = 0; i < 22; i++) {
    const t = (i + 0.5) / 22;
    const bit = document.createElement("i");
    bit.className = "magic-bit";
    bit.style.left = `${(from.x + (to.x - from.x) * t + (((i * 29) % 22) - 11)).toFixed(1)}px`;
    bit.style.top = `${(from.y + (to.y - from.y) * t - 360 * t * (1 - t) + (((i * 41) % 18) - 9)).toFixed(1)}px`;
    bit.style.setProperty("--px", `${((i % 5) - 2) * 6}px`);
    bit.style.setProperty("--py", `${14 + (i % 3) * 8}px`);
    bit.style.width = bit.style.height = `${6 + (i % 4) * 3.5}px`;
    bit.style.animationDelay = `${Math.round(t * GUESS_FLIGHT) - 140}ms`;
    pane.append(bit);
    window.setTimeout(() => bit.remove(), GUESS_FLIGHT + 900);
  }

  // The counter only takes the value once the digit has actually got there.
  window.setTimeout(() => {
    readout.textContent = value;
    readout.classList.add("is-landing");
  }, GUESS_FLIGHT);
  window.setTimeout(() => flier.remove(), GUESS_FLIGHT + 120);
}

/* ---- the counter ---- */

// `guess` follows what the player typed and carries it through every beat from
// the pad to the count; `live` tracks the running tally; `total` is the answer.
function counterCard(mode) {
  const card = imageLayer(counter, "layer counter");
  card.dataset.mode = mode;

  const value = document.createElement("span");
  value.className = "counter__value";
  value.textContent =
    mode === "live" ? counted : mode === "guess" ? (guess ?? 0) : round.total;
  card.append(value);

  return card;
}

/* ---- the number line ---- */

// Eleven marks, 0 to 10. Drawn empty and only filled once the count is in: the
// two markers slide down from where their numbers already are — the guess from
// the counter, the answer from the last twinkle — so the comparison is watched
// being made rather than simply stated.
function numberLineStrip(screen) {
  const wrap = document.createElement("div");
  wrap.className = "numline";
  // The counting beat draws it empty and reveals it once the last twinkle is
  // in; the two beats after it are already showing it when they arrive.
  if (screen && screen.id !== "3.2") wrap.classList.add("is-live");
  place(wrap, { x: numberLine.x, y: numberLine.y, w: numberLine.w, h: 130 });

  const rule = document.createElement("i");
  rule.className = "numline__rule";
  wrap.append(rule);

  for (let n = 0; n <= numberLine.max; n++) {
    const tick = document.createElement("span");
    tick.className = "numline__tick";
    tick.style.left = `${(n / numberLine.max) * 100}%`;
    tick.dataset.n = String(n);

    const dot = document.createElement("i");
    dot.className = "numline__dot";
    const num = document.createElement("b");
    num.textContent = n;
    tick.append(dot, num);
    wrap.append(tick);
  }

  // What the earlier beats already put there. Marked `is-placed`, so it does
  // not fly in a second time — only the beat's own number arrives.
  if (screen && screen.id === "16" && counted) {
    level(mark(wrap, "total", counted), true);
  }

  return wrap;
}

// One marker on the line: the pill, and the tick under it lighting up.
function mark(wrap, kind, value) {
  if (!wrap || value === null || value === undefined || value > numberLine.max) return null;

  const marker = document.createElement("span");
  marker.className = `numline__marker is-${kind}`;
  marker.textContent = value;
  marker.style.left = `${(value / numberLine.max) * 100}%`;
  wrap.append(marker);

  wrap.querySelector(`.numline__tick[data-n="${value}"]`)?.classList.add("is-hit");
  return marker;
}

// Both markers sit at the same height so the two numbers read against each
// other. The one arrangement where that cannot work is a correct guess, where
// both land on the same mark — then the guess is lifted to sit above the answer
// instead of on top of it.
function level(marker, placed) {
  if (!marker) return null;
  if (placed) marker.classList.add("is-placed");

  const wrap = marker.parentElement;
  const mine = marker.style.left;
  const clash = [...wrap.querySelectorAll(".numline__marker")].some(
    (other) => other !== marker && other.style.left === mine
  );
  if (clash) wrap.querySelector(".numline__marker.is-guess")?.classList.add("is-stacked");
  return marker;
}

// Send a number down onto the line from the counter it is showing in, so the
// comparison is watched being made rather than simply appearing. Positions come
// off the live boxes and are converted back into frame units, because the stage
// is scaled to fit and a screen pixel is not a frame pixel.
function dropFromCounter(pane, kind, value) {
  const wrap = pane?.querySelector(".numline");
  const card = pane?.querySelector(".counter__value");
  if (!wrap || !card) return;

  const marker = mark(wrap, kind, value);
  if (!marker) return;

  const box = pane.getBoundingClientRect();
  const scale = box.width / FRAME_W || 1;
  const at = (el) => {
    const r = el.getBoundingClientRect();
    return {
      x: (r.left + r.width / 2 - box.left) / scale,
      y: (r.top + r.height / 2 - box.top) / scale
    };
  };

  const origin = at(wrap);
  const from = at(card);
  marker.style.setProperty("--from-x", `${from.x - origin.x}px`);
  marker.style.setProperty("--from-y", `${from.y - origin.y}px`);
  level(marker, false);
  playSfx({ id: "sparkle", at: 120, gain: 0.55 });
}

/* ---- speech bubbles ---- */

// Insets are Figma's own, as [top, right, bottom, left] percentages of the
// bubble box. The balloon art is mirrored on most screens; the text never is.
function inset(el, [top, right, bottom, left]) {
  el.style.inset = `${top}% ${right}% ${bottom}% ${left}%`;
}

// Side breathing room inside the balloon, as a fraction of the bubble box. It
// is symmetric, so it never pulls the words off centre.
const BUBBLE_PAD_X = 0.1;

// Where the tail sits across the balloon, as a fraction of its width. Measured
// off all twelve balloon files: every one of them draws it here, on the left.
// Mirroring the art puts it at 1 - this, on the right.
const BUBBLE_TAIL_X = 0.32;

// Which way round to draw the balloon, so its tail points at whoever is
// speaking. Worked out from where that character actually stands rather than
// set by hand, so it follows a change of pose or of anchor instead of drifting
// out of step with one. Falls back to leaving the art unmirrored when the
// speaker is not on the screen.
function tailToward(spec, screen) {
  if (!screen || !spec.who) return false;

  let mark = null;
  for (const layer of screen.layers) {
    if (castOf(layer.src) !== spec.who) continue;
    const nudge = anchorOffset(layer, screen.anchor);
    const box = bodyBox(
      nudge ? { ...layer, x: layer.x + nudge.dx, y: layer.y + nudge.dy } : layer
    );
    if (box) mark = (box.x0 + box.x1) / 2;
  }
  if (mark === null) return false;

  const left = spec.x + BUBBLE_TAIL_X * spec.w;
  const right = spec.x + (1 - BUBBLE_TAIL_X) * spec.w;
  return Math.abs(right - mark) < Math.abs(left - mark);
}

function bubble(spec, screen) {
  const box = document.createElement("div");

  box.className = "bubble";
  box.dataset.role = "bubble";
  place(box, spec);

  // The art sits in its own inset box so the image can fill that box exactly;
  // a percentage width on the image itself would resolve against the whole
  // bubble and ignore the inset.
  const art = document.createElement("div");
  art.className = "bubble__art";
  inset(art, spec.artInset ?? [0, 0, 0, 0]);
  if (tailToward(spec, screen)) art.style.transform = "scaleX(-1)";

  const artImg = document.createElement("img");
  artImg.className = "fill fill--crop";
  artImg.src = spec.art;
  artImg.alt = "";
  art.append(artImg);

  // Dead centre of the balloon, both ways. The box measured is the art's own,
  // not the bubble frame's — on two screens Figma insets the balloon inside
  // its frame — and the insets are applied symmetrically, so the centre of
  // the text box is exactly the centre of the balloon on both axes.
  const [aTop, aRight, aBottom, aLeft] = spec.artInset ?? [0, 0, 0, 0];
  const padX = BUBBLE_PAD_X * spec.w;

  const line = document.createElement("p");
  line.className = "bubble__text";
  line.textContent = fill(spec.text);
  line.style.left = `${(aLeft / 100) * spec.w + padX}px`;
  line.style.right = `${(aRight / 100) * spec.w + padX}px`;
  line.style.top = `${(aTop / 100) * spec.h}px`;
  line.style.bottom = `${(aBottom / 100) * spec.h}px`;

  box.append(art, line);
  return box;
}
