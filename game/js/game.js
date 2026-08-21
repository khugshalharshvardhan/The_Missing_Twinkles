// The game player. Builds each beat from js/data/screens.js into one of two
// panes and cross-fades between them, so the outgoing screen is still on
// display while the incoming one paints.
//
// Dialogue beats read themselves and move on: each one waits long enough for
// its line to be read, then advances. The three interactive beats wait for the
// player instead — the keypad for a guess, the swarm for every light keeper to
// be tapped, the lamp for a tap — and advance once that is done.

import { screens, keypad, counter, FIREFLIES, FIREFLY_SRC, TOTAL } from "./data/screens.js";

const panes = [
  document.getElementById("scene-a"),
  document.getElementById("scene-b")
];
const hud = document.getElementById("hud");

const CROSSFADE = 620; // must track --speed-slow in css/stage.css

// Reading pace for a dialogue beat: a beat to take in the picture, plus time
// per character, held between a comfortable floor and ceiling.
const READ_BASE = 1150;
const READ_PER_CHAR = 58;
const READ_MIN = 1900;
const READ_MAX = 6200;

const AFTER_COUNT = 950; // let the last light keeper land before moving on
const AFTER_LAMP = 900; // hold on the lit lamp for a moment

let index = -1;
let front = 0;
let busy = false;
let timer = null;
let onComplete = () => {};
let hold = false; // dev: freeze on the current beat instead of reading on

/* ---- run state ---- */

let guess = null; // what the player typed on the keypad
let entry = ""; // digits mid-typing
let counted = 0; // light keepers tapped on screen 3.2

export function initGame(handlers) {
  onComplete = handlers.onComplete;
  hold = Boolean(handlers.hold);
}

// `at` jumps straight to a beat — see the ?beat= dev shortcut in main.js.
export function startGame(at = 0) {
  clearTimeout(timer);
  index = -1;
  front = 0;
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

// Queue the next beat. Any new beat cancels whatever was pending.
function advanceIn(ms) {
  clearTimeout(timer);
  timer = window.setTimeout(next, ms);
}

function go(target) {
  const screen = screens[target];
  const back = panes[1 - front];

  clearTimeout(timer);
  index = target;
  busy = true;
  back.replaceChildren(render(screen));

  panes[front].classList.remove("is-active");
  back.classList.add("is-active");
  front = 1 - front;

  // Dialogue reads itself; an interactive beat waits for the player, and its
  // own handler queues the advance once the player is done.
  if (!screen.interact && !hold) advanceIn(readingTime(screen));

  window.setTimeout(() => {
    busy = false;
  }, CROSSFADE * 0.45);
}

function readingTime(screen) {
  const chars = screen.bubble ? screen.bubble.text.length : 0;
  return Math.min(READ_MAX, Math.max(READ_MIN, READ_BASE + chars * READ_PER_CHAR));
}

function finish() {
  clearTimeout(timer);
  hud.classList.remove("is-active");
  onComplete();
}

/* ---- dynamic copy ---- */

function verdict() {
  if (guess === null) return "Let us try again!";

  const off = Math.abs(guess - TOTAL);
  if (off === 0) return "Spot on!";
  if (off <= 2) return "That was close!";
  return "Good try — now we know!";
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

  group.className = "swarm";
  group.style.left = `${screen.fireflies.x}px`;
  group.style.top = `${screen.fireflies.y}px`;

  FIREFLIES.forEach((spot, i) => {
    // A countable light keeper is a real button; a decorative one is not.
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
      el.setAttribute("aria-label", `Light keeper ${i + 1}`);
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

  // Scope the lookups to this beat's own pane — the outgoing pane can still
  // be on screen mid-fade, holding a stale counter of its own.
  const pane = el.closest(".scene");

  const readout = pane?.querySelector(".counter__value");
  if (readout) readout.textContent = counted;

  // The tap hint has done its job once the player gets the idea.
  pane?.querySelector(".hint")?.classList.add("is-done");

  if (counted === TOTAL) advanceIn(AFTER_COUNT);
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
      if (key.confirm) {
        if (!entry.length) return;
        guess = Number(entry);
        return next();
      }

      if (key.clear) entry = "";
      else if (entry.length < 2) entry = (entry + key.label).replace(/^0+(?=\d)/, "");
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

// Side breathing room inside the balloon, and the band at the bottom the tail
// occupies. Both are fractions of the bubble box.
const BUBBLE_PAD_X = 0.1;
const BUBBLE_TAIL = 0.16;

function bubble(spec) {
  const box = document.createElement("div");

  box.className = "bubble";
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

  // Centre the words in the balloon itself, both ways. That means measuring
  // from the art's own box rather than the bubble's — on two screens Figma
  // insets the balloon inside its frame — and keeping clear of the tail.
  const [aTop, aRight, aBottom, aLeft] = spec.artInset ?? [0, 0, 0, 0];
  const padX = BUBBLE_PAD_X * spec.w;

  const line = document.createElement("p");
  line.className = "bubble__text";
  line.textContent = fill(spec.text);
  line.style.left = `${(aLeft / 100) * spec.w + padX}px`;
  line.style.right = `${(aRight / 100) * spec.w + padX}px`;
  line.style.top = `${(aTop / 100) * spec.h}px`;
  line.style.bottom = `${(aBottom / 100) * spec.h + BUBBLE_TAIL * spec.h}px`;

  box.append(art, line);
  return box;
}
