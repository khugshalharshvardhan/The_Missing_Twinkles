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

import { screens, keypad, counter, FIREFLIES, FIREFLY_SRC, TOTAL } from "./data/screens.js";
import { gameCues } from "./data/audio.js";
import { clearCues, playCues, playSfx, playVo, clipLength } from "./audio.js";

const panes = [
  document.getElementById("game-a"),
  document.getElementById("game-b")
];
const hud = document.getElementById("hud");

const CROSSFADE = 620; // must track --speed-slow in css/game.css

// Reading pace for a dialogue beat: a beat to take in the picture, plus time
// per character, held between a comfortable floor and ceiling.
const READ_BASE = 1150;
const READ_PER_CHAR = 58;
const READ_MIN = 1900;
const READ_MAX = 6200;

const AFTER_COUNT = 950; // let the last twinkle land before moving on
const AFTER_LAMP = 900; // hold on the lit lamp for a moment
const VO_TAIL = 650; // breath between the end of a line and the next beat

let index = -1;
let front = 0;
let busy = false;
let timer = null;
let onComplete = () => {};
let hold = false; // dev: freeze on the current beat instead of reading on
let pending = null; // a beat built but not yet begun, waiting on releaseHold()

/* ---- run state ---- */

let guess = null; // what the player typed on the keypad
let entry = ""; // digits mid-typing
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

  const screen = pending ?? screens[index];
  pending = null;
  if (screen) speak(screen);
}

// `at` jumps straight to a beat — see the ?beat= dev shortcut in main.js.
export function startGame(at = 0) {
  clearTimeout(timer);
  clearCues();
  index = -1;
  front = 0;
  pending = null;
  guess = null;
  entry = "";
  counted = 0;

  panes.forEach((pane) => {
    pane.classList.remove("is-active");
    pane.replaceChildren();
  });

  hud.classList.add("is-active");

  const start = Math.min(Math.max(at, 0), screens.length - 1);
  // Stand in for the guess the player would have typed, so the beats that
  // quote it back have something to say.
  if (start > 5) guess = 10;
  go(start);
}

export function next() {
  clearTimeout(timer);
  if (index >= screens.length - 1) return finish();
  go(index + 1);
}

// Dev hooks (devtools/, only reached with ?dev). Jumping to a screen carries on
// playing from it; only devPause() stops the clock.
export function devGoto(at) {
  clearTimeout(timer);
  hold = false;
  const i = Math.min(Math.max(at, 0), screens.length - 1);
  if (i > 5) guess = 10;
  go(i);
  return screens[i];
}

export function devPause(on) {
  clearTimeout(timer);
  hold = on;
  if (on) return;

  const screen = pending ?? screens[index];
  pending = null;
  if (screen && !screen.interact) advanceIn(readingTime(screen));
}

// "Skip" leaves the whole act, not one screen.
export function skipGame() {
  clearTimeout(timer);
  index = screens.length - 1;
  finish();
}

// Queue the next beat. Any new beat cancels whatever was pending.
function advanceIn(ms) {
  clearTimeout(timer);
  timer = window.setTimeout(next, ms);
}

function go(target) {
  const screen = screens[target];
  const back = panes[1 - front];
  // An interactive beat is left by the player acting, which they can do while
  // the line is still going. Let it finish over the next screen rather than
  // cutting it off to answer them.
  const leaving = screens[index];

  clearTimeout(timer);
  index = target;
  busy = true;
  back.replaceChildren(render(screen));
  back.classList.remove("is-begun");

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

  const off = Math.abs(guess - TOTAL);
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

function sayNumber(n, at, pan) {
  if (!Number.isInteger(n) || n < 0 || n > SPOKEN_MAX) return false;
  playVo({ id: `vo_n_${n}`, at, pan });
  return true;
}

// The beats whose voice depends on what the player did. Returns the moment its
// last clip finishes, in ms from the start of the beat, so speak() can hold the
// screen until then. Offsets are the stem's own measured length.
function dynamicVoice(screen) {
  // "Hmm... I think there were {guess}." — vo_g_ithink starts at 500ms.
  if (screen.id === "2.2") {
    const at = 500 + clipLength("vo_g_ithink") + 120;
    return sayNumber(guess, at, 0.55) ? at + clipLength(`vo_n_${guess}`) : 0;
  }

  // "You guessed {guess}." — vo_g_youguessed starts at 500ms.
  if (screen.id === "16") {
    const at = 500 + clipLength("vo_g_youguessed") + 120;
    return sayNumber(guess, at, -0.5) ? at + clipLength(`vo_n_${guess}`) : 0;
  }

  if (screen.id === "4.2") {
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
    .replace("{total}", TOTAL)
    .replace("{verdict}", verdict());
}

/* ---- rendering ---- */

function render(screen) {
  const frag = document.createDocumentFragment();

  screen.layers.forEach((layer) => frag.append(imageLayer(layer)));

  if (screen.fireflies) frag.append(swarm(screen));
  if (screen.lamp) frag.append(lamp(screen.lamp));
  if (screen.keypad) frag.append(keypadPanel());
  if (screen.counter) frag.append(counterCard(screen.counter));
  if (screen.hint) frag.append(imageLayer(screen.hint, "layer hint"));
  if (screen.bubble) frag.append(bubble(screen.bubble));

  return frag;
}

// A layer is a clipping box at the designed size, holding the image fill.
// That mirrors how Figma stores it, so a cropped fill lands on the same pixels
// here as it does on the canvas. The mirror goes on the BOX, not the image —
// Figma wraps the whole clipped box in the flip, and with an off-centre crop
// the two are not the same thing.
function imageLayer(layer, className = "layer") {
  const box = document.createElement("div");

  box.className = layer.fx ? `${className} fx-${layer.fx}` : className;
  // Names what this is, so devtools/ can report edits against the data.
  if (layer.src) box.dataset.key = layer.src.split("/").pop().replace(/\.\w+$/, "");
  place(box, layer);
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
  group.style.left = `${screen.fireflies.x}px`;
  group.style.top = `${screen.fireflies.y}px`;

  FIREFLIES.forEach((spot, i) => {
    // A countable twinkle is a real button; a decorative one is not.
    const el = document.createElement(countable ? "button" : "div");

    el.className = countable ? "firefly is-countable" : "firefly";
    place(el, spot);

    const img = document.createElement("img");
    img.className = "fill";
    img.src = FIREFLY_SRC;
    img.alt = "";
    el.append(img);

    if (countable) {
      el.type = "button";
      el.setAttribute("aria-label", `Twinkle ${i + 1}`);
      el.addEventListener("click", () => tally(el));
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

  // Each one rings a step higher than the last, so counting up is audible as
  // well as visible — and Agni says the number, which is the whole lesson.
  playSfx({ id: "count_pip", gain: 0.8, rate: 1 + (counted - 1) * 0.07 });
  sayNumber(counted, 90);

  // Scope the lookups to this beat's own pane — the outgoing pane can still
  // be on screen mid-fade, holding a stale counter of its own.
  const pane = el.closest(".scene");

  const readout = pane?.querySelector(".counter__value");
  if (readout) readout.textContent = counted;

  // The tap hint has done its job once the player gets the idea.
  pane?.querySelector(".hint")?.classList.add("is-done");

  if (counted === TOTAL) {
    playSfx({ id: "count_done", at: 260, gain: 0.85 });
    advanceIn(AFTER_COUNT);
  }
}

/* ---- the lamp ---- */

function lamp(spec) {
  const el = imageLayer(spec, "layer lamp");

  // A div, not a button, so it can hold the art box exactly — give it the
  // keyboard affordances a button would have had.
  el.setAttribute("role", "button");
  el.setAttribute("tabindex", "0");
  el.setAttribute("aria-label", "Light the lamp");

  const strike = () => {
    if (el.classList.contains("is-struck")) return;
    el.classList.add("is-struck");
    playSfx({ id: "lamp_strike", gain: 0.9 });
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

/* ---- the keypad ---- */

function keypadPanel() {
  const panel = document.createElement("div");
  panel.className = "keypad";

  panel.append(imageLayer(keypad.frame, "layer"));

  // Display: the art, plus the digits typed so far.
  const display = imageLayer(keypad.display, "layer");
  const value = document.createElement("span");
  value.className = "keypad__value";
  display.append(value);
  panel.append(display);

  // The player types, then taps the tick to commit — so nothing advances on a
  // timer, and a two-digit guess is never cut off halfway.
  const ticks = [];
  const paint = () => {
    value.textContent = entry;
    // Nothing to confirm until at least one digit is in.
    ticks.forEach((t) => {
      t.classList.toggle("is-off", entry.length === 0);
      t.disabled = entry.length === 0;
    });
  };

  keypad.keys.forEach((key) => {
    const btn = document.createElement("button");

    btn.type = "button";
    btn.className = `key${key.clear ? " key--clear" : ""}${key.confirm ? " key--confirm" : ""}`;
    place(btn, { x: key.x, y: key.y, w: keypad.keyW, h: keypad.keyH });
    btn.setAttribute("aria-label", key.clear ? "Clear" : key.confirm ? "Confirm guess" : key.label);

    // The number keys carry a crop; the clear and confirm art fills its box.
    const plain = key.clear || key.confirm;
    const img = document.createElement("img");
    img.src = key.clear ? keypad.clearArt : key.confirm ? keypad.confirmArt : keypad.keyArt;
    img.alt = "";

    if (plain) {
      img.className = "fill";
    } else {
      img.className = "fill fill--crop";
      img.style.left = keypad.keyFill.left;
      img.style.top = keypad.keyFill.top;
      img.style.width = keypad.keyFill.width;
      img.style.height = keypad.keyFill.height;
    }

    btn.append(img);

    if (key.confirm) {
      // The tick is art, not a glyph, and keeps its designed box.
      const tick = document.createElement("img");
      tick.className = "key__tick";
      tick.src = keypad.tick.src;
      tick.alt = "";
      place(tick, keypad.tick);
      btn.append(tick);
      ticks.push(btn);
    } else {
      const label = document.createElement("span");
      label.className = "key__label";
      label.textContent = key.label;
      btn.append(label);
    }

    btn.addEventListener("click", () => {
      // Committing is a rising fourth, not a fanfare: the guess has not been
      // judged yet, and it will not be until after the count.
      if (key.confirm) {
        if (!entry.length) return;
        playSfx({ id: "key_confirm", gain: 0.85 });
        guess = Number(entry);
        return next();
      }

      // The keys are wooden rather than electronic, so ten in a row do not turn
      // into a beeping calculator; clearing goes downwards, and nowhere.
      if (key.clear) {
        entry = "";
        playSfx({ id: "key_clear", gain: 0.7 });
      } else {
        if (entry.length < 2) entry = (entry + key.label).replace(/^0+(?=\d)/, "");
        playSfx({ id: "key_press", gain: 0.75 });
      }
      paint();
    });

    panel.append(btn);
  });

  paint();
  return panel;
}

/* ---- the counter ---- */

function counterCard(mode) {
  const card = imageLayer(counter, "layer counter");

  const value = document.createElement("span");
  value.className = "counter__value";
  value.textContent = mode === "live" ? counted : TOTAL;
  card.append(value);

  return card;
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

function bubble(spec) {
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
  if (spec.mirror) art.style.transform = "scaleX(-1)";

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
