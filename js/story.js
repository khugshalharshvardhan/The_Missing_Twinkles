// The story player.
//
// The chapter is three pages (js/data/scenes.js), each holding several steps.
// Rather than repainting a whole scene per step, the player keeps a map of
// mounted layers keyed by `key` and diffs it: a layer the next step still wants
// is left completely alone, so the street does not re-fade under the dialogue
// and the drifting ghost never restarts. Depth comes from z-index in declared
// order, because re-appending a node to reorder it would restart its animation.
//
// Overlays — bubbles, voice lines, onomatopoeia — are transient by nature and
// are rebuilt every step.
//
// Steps inside a page advance themselves. Only the step that closes a page
// waits for the reader, and only then does the chevron appear — three times
// across the chapter. Mid-page taps are ignored on purpose: with no chevron
// showing there is nothing to invite them, so a stray tap must not skip a line.

import { pages, timeline } from "./data/scenes.js";
import { cues } from "./data/audio.js";
import { clearCues, playCues, stopAudio } from "./audio.js";
import { anchorOffset } from "./anchor.js";
import { roomOf, tailXOf } from "./data/bubbles.js";
import { fitToText, centreInk, textRoom } from "./fit.js";

const layerHost = document.getElementById("layers");
const overlayHost = document.getElementById("overlays");
const transition = document.getElementById("transition");
const hud = document.getElementById("hud");
const beatLine = document.getElementById("beat");

const SVG_NS = "http://www.w3.org/2000/svg";

const LAYER_FADE = 700;   // must track .layer's opacity transition in story.css
const SETTLE = 380;       // how long a step is protected from a double-tap

// The lone twinkle's crossing. Both must track .firefly in story.css:
// FLIGHT_MS its animation-duration, FLIGHT_TOP the lane she flies down.
const FLIGHT_MS = 2600;
const FLIGHT_TOP = 470;

// The warmths in her tail, amber through to white. Four is enough to stop the
// dust reading as one flat colour and few enough that it still reads as gold.
const DUST_TINTS = ["#ffbe3a", "#ffd669", "#fff0bd", "#ffffff"];

// A stable pseudo-random: same index, same answer, every run. Math.random would
// make the trail different on each replay, which for a hand-placed effect reads
// as a fault rather than as variety.
function noise(i, k) {
  const n = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

const mounted = new Map(); // key -> { el, spec } for the layer showing now
// Pages already read to the end. A read page hands its Next button over
// immediately on a revisit instead of making the reader sit through it again.
const completed = new Set();
// The deepest page reached, for the first page's Prev: on a first read it
// shows nothing but Next, and only coming BACK to it puts the dim Prev beside
// the live one — finishing page 1 is not the same as returning to it.
let reached = 0;
let cursor = -1;
let busy = false;
let holdTimer = 0;
let revealTimer = 0;
let waiting = false;
let transitionTimers = [];
let ids = 0;
let onComplete = () => {};

export function initStory(handlers) {
  onComplete = handlers.onComplete;
}

export function startStory() {
  clearTimers();
  stopAudio();
  setWaiting(false);
  completed.clear();
  reached = 0;

  mounted.clear();
  layerHost.replaceChildren();
  overlayHost.replaceChildren();
  transition.classList.remove("is-active");
  transition.replaceChildren();

  cursor = -1;
  busy = false;
  hud.classList.add("is-active");
  next();
}

// Internal: also used by a step's own hold timer, so it must not be gated.
function next() {
  if (busy) return;
  if (cursor >= timeline.length - 1) return finish();
  go(cursor + 1);
}

// What a tap or a key press calls. Ignored unless the current step is the one
// that closes its page and its chevron has been offered. Reports whether it
// did anything, so the caller can avoid clicking at the reader for nothing.
export function advance() {
  if (!waiting) return false;
  next();
  return true;
}

// The Next button. On a first read it is only offered where the old chevron
// was — the step that closes a page — and turning it is advance(). On a page
// already read it is offered from the first step, and pressing it mid-page
// jumps to the head of the NEXT page rather than to the next step: the button
// says "next page", so that is what it must do wherever it is pressed.
export function nextPage() {
  if (busy || !waiting) return false;

  const entry = timeline[cursor];
  if (!entry) return false;
  if (entry.last) { next(); return true; }

  const target = timeline.findIndex((e) => e.p === entry.p + 1);
  // Past the last page (only reachable re-reading it): the chapter is over.
  if (target < 0) { finish(); return true; }
  go(target);
  return true;
}

// The Prev button: back to the top of the page before this one, replaying it.
// Offered on any page with one behind it, finished or not.
export function prevPage() {
  if (busy) return false;

  const entry = timeline[cursor];
  if (!entry || entry.p === 0) return false;
  go(timeline.findIndex((e) => e.p === entry.p - 1));
  return true;
}

// "Skip" jumps the whole chapter, not one step.
export function skip() {
  clearTimers();
  clearCues();
  setWaiting(false);
  cursor = timeline.length - 1;
  busy = false;
  finish();
}

function clearTimers() {
  window.clearTimeout(holdTimer);
  window.clearTimeout(revealTimer);
  transitionTimers.forEach(window.clearTimeout);
  transitionTimers = [];
}

// Tapping through a transition cancels its timers, so the teardown cannot live
// in one of them or the cover would be left stuck over the next page. It fades
// out on its own clock and only empties once nothing has re-shown it.
function endTransition() {
  transition.classList.remove("is-active");
  window.setTimeout(() => {
    if (!transition.classList.contains("is-active")) transition.replaceChildren();
  }, LAYER_FADE);
}

function go(target) {
  const entry = timeline[target];
  const prev = cursor >= 0 ? timeline[cursor] : null;
  const crossingPages = !prev || prev.p !== entry.p;

  clearTimers();
  endTransition();
  // A page already read to the end offers its Next button from the first
  // step — the reader has seen this one, so they may move on at will. A page
  // being read for the first time earns it at the end, as ever.
  setWaiting(completed.has(entry.p));
  cursor = target;
  busy = true;

  // A page can cover its own arrival — the fireflies out of the dark.
  const cover = crossingPages ? entry.page.enter : null;
  if (cover) return playTransition(cover, entry);

  paint(entry);
  window.setTimeout(() => { busy = false; }, SETTLE);
}

// Fade a cover in, swap the page underneath it, fade it back out.
function playTransition(cover, entry) {
  // Black, and nothing else. There is no second crossing here — one twinkle
  // already goes past on 3.3, a beat before this — and no field of glitter
  // either: page 2 ends on eyes in the dark and page 3 opens on an unlit street,
  // so anything put between them is a third picture nobody asked for. A plain
  // cover long enough to hide the swap is the whole job.
  transition.replaceChildren(effect({ kind: "night" }));
  transition.classList.add("is-active");

  clearCues();
  playCues(cues[cover.id]);

  const hold = cover.hold ?? 2400;
  transitionTimers.push(
    // Swap once the cover is opaque enough to hide it.
    window.setTimeout(() => paint(entry, { silent: true }), hold * 0.36),
    window.setTimeout(() => { busy = false; }, hold * 0.36 + SETTLE),
    window.setTimeout(endTransition, hold * 0.75)
  );
}

function paint(entry, { silent = false } = {}) {
  const { page, step } = entry;

  diffLayers([...page.layers, ...step.layers]);
  overlayHost.replaceChildren(overlays(step));
  // Now that the line is on the page it can be measured, and the balloon
  // around it sized to fit. The overlay is still faded out at this point, so
  // the reader never sees it settle.
  overlayHost.querySelectorAll(".say__bubble").forEach(fitSay);

  beatLine.textContent = step.beat ?? "";
  reached = Math.max(reached, entry.p);
  paintNav(entry);

  // A transition already scheduled its own cues, so don't wipe them.
  if (!silent) clearCues();
  playCues(cues[step.id]);

  if (entry.last) {
    // Closes the page: hand control back once the line has finished, and
    // remember the page has been read — from here on it offers Next at once.
    revealTimer = window.setTimeout(() => {
      completed.add(entry.p);
      setWaiting(true);
      paintNav(entry);
    }, step.reveal ?? 0);
  } else {
    holdTimer = window.setTimeout(next, step.hold ?? 2400);
  }
}

// Which page-turn buttons this step offers. Prev is live wherever there is a
// page behind this one. On the first page it has nothing to point at: a first
// read shows nothing but Next, and only coming back to it from further on puts
// the dim, dead Prev beside the live one, so the return presents the pair
// rather than one orphan. Next's own visibility is `waiting`, handled by
// setWaiting().
function paintNav(entry) {
  hud.classList.toggle("has-prev", entry.p > 0);
  hud.classList.toggle("has-prev-off", entry.p === 0 && reached > 0);
}

// The chevron and the whole-stage tap target live or die together, so the
// affordance and what it does can never disagree.
function setWaiting(on) {
  waiting = on;
  hud.classList.toggle("is-waiting", on);
}

/* ---- dev hook (devtools/, only reached with ?dev) ---- */

// Jump to a step and carry on playing from there, exactly as arriving at it
// normally would. The layers are rebuilt from nothing first so the step looks
// as it does on arrival rather than inheriting whatever was on screen. Only
// devPause() stops the clock — jumping never does.
export function devGoto(index) {
  clearTimers();
  endTransition();
  setWaiting(false);
  clearCues();

  const at = Math.max(0, Math.min(index, timeline.length - 1));
  const entry = timeline[at];
  cursor = at;
  busy = false;

  mounted.clear();
  layerHost.replaceChildren();
  hud.classList.add("is-active");
  paint(entry);

  return entry;
}

// Hold the chapter where it is, or set it going again. Pausing only cancels
// what was queued; releasing re-arms the current step from the top, which is
// predictable in a way that trying to resume a part-elapsed timer is not.
export function devPause(on) {
  if (on) return clearTimers();

  const entry = timeline[cursor];
  if (!entry) return;

  if (entry.last) {
    revealTimer = window.setTimeout(() => setWaiting(true), entry.step.reveal ?? 0);
  } else {
    holdTimer = window.setTimeout(next, entry.step.hold ?? 2400);
  }
}

/* ---- layer diffing ---- */

function diffLayers(want) {
  const keep = new Set(want.map((layer) => layer.key));

  for (const [key, held] of [...mounted]) {
    if (keep.has(key)) continue;
    mounted.delete(key);
    held.el.style.opacity = "0";
    window.setTimeout(() => held.el.remove(), LAYER_FADE);
  }

  want.forEach((layer, depth) => {
    const held = mounted.get(layer.key);

    if (!held) {
      const el = layer.kind ? effect(layer) : image(layer, "layer");
      mounted.set(layer.key, { el, spec: layer });
      layerHost.append(el);

      // Image layers fade in from nothing. One whose fx animates opacity — the
      // walk-ins, the blinking eyes — ignores this, because an animation
      // outranks an inline style on the same property, which is what we want.
      //
      // Effect layers are skipped: each drives its own opacity from CSS
      // (lamp-die waits at 0 for 2.4s, glimmers pulse), and an inline value
      // would override the rule that holds them back.
      if (!layer.kind) {
        const target = layer.opacity ?? 1;
        el.style.opacity = "0";
        requestAnimationFrame(() => { el.style.opacity = String(target); });
      }

      // Depth by z-index, never by DOM order: moving a node restarts its
      // animation, and these layers are mid-drift.
      el.style.zIndex = String(depth + 1);
      return;
    }

    // A character who is already on stage and changes pose keeps the same
    // layer: the box glides to its new mark while the art dissolves inside
    // it. Cross-fading two separate layers instead would put two copies of
    // the same character on screen at once, at different marks.
    if (!layer.kind && restyled(held.spec, layer)) {
      dissolve(held.el, layer);
      held.spec = layer;
    }

    held.el.style.zIndex = String(depth + 1);
  });
}

// Has anything about this layer's art or mark actually moved?
function restyled(before, after) {
  return (
    before.src !== after.src ||
    before.x !== after.x ||
    before.y !== after.y ||
    before.w !== after.w ||
    before.h !== after.h ||
    before.fx !== after.fx ||
    before.flipX !== after.flipX ||
    JSON.stringify(before.fill ?? null) !== JSON.stringify(after.fill ?? null)
  );
}

// Swap a layer's art in place. The new fill fades up over the old one inside
// the same box, and the box itself transitions to the new mark, so the two
// poses stay registered and read as one character changing.
function dissolve(box, layer) {
  box.className = layer.fx ? `layer fx-${layer.fx}` : "layer";
  box.style.left = `${layer.x}px`;
  box.style.top = `${layer.y}px`;
  box.style.width = `${layer.w}px`;
  box.style.height = `${layer.h}px`;
  if (layer.opacity != null) box.style.opacity = String(layer.opacity);

  const outgoing = [...box.querySelectorAll(".fill")];
  const incoming = fillImage(layer);

  incoming.style.opacity = "0";
  box.append(incoming);
  requestAnimationFrame(() => { incoming.style.opacity = "1"; });

  outgoing.forEach((img) => {
    img.style.opacity = "0";
    window.setTimeout(() => img.remove(), LAYER_FADE);
  });
}

/* ---- rendering ---- */

function overlays(step) {
  const frag = document.createDocumentFragment();

  if (step.say) {
    const bubble = image(step.say.bubble, "layer say__bubble");
    bubble.dataset.role = "say.bubble";

    const text = line(step.say);
    text.dataset.role = "say.text";

    // The balloon is sized to its own line rather than to the box it was drawn
    // at — see fitSay(). It can only be measured once it is on the page, so
    // the fitting itself happens back in paint().
    bubble._say = { spec: step.say.bubble, text };

    // A step can hold its line back until the scene has settled — page 2 lets
    // the mist cover the ground before Neel says anything. This adds to the
    // pop and settle delays the stylesheet already gives them.
    if (step.say.at) {
      bubble.style.animationDelay = `${step.say.at + 260}ms`;
      text.style.animationDelay = `${step.say.at + 520}ms`;
    }

    frag.append(bubble, text);
  }
  (step.voices ?? []).forEach((voice, i) => {
    const el = spoken(voice);
    el.dataset.role = "voice";
    el.dataset.index = String(i);
    frag.append(el);
  });
  (step.sfx ?? []).forEach((cue) =>
    frag.append(cue.kind === "laugh" ? laugh(cue) : cue.kind === "hehes" ? hehes(cue) : shout(cue))
  );

  return frag;
}

// A layer is a clipping box at the designed size, holding the image fill.
// That mirrors how Figma stores it, so a cropped fill lands on the same
// pixels here as it does on the canvas.
function image(layer, className) {
  const box = document.createElement("div");

  box.className = layer.fx ? `${className} fx-${layer.fx}` : className;
  // Names what this is, so devtools/ can report edits against the data.
  if (layer.key) box.dataset.key = layer.key;
  // A glow goes on the box, not on the fill: the fill is clipped by the box, so
  // a shadow drawn on it would be cut off at the edge. The box's own filter is
  // applied after that clip and is free to spill past it.
  if (layer.glow) box.classList.add(`glow--${layer.glow}`);
  // A change of pose should change the pose and nothing else. Each pose is
  // drawn at its own Figma box with its own margin, so left alone they put the
  // character somewhere different from one beat to the next — and the box then
  // glides between the two, which is the movement rather than the fix. Anchored,
  // there is nothing to glide and the art simply dissolves in place.
  const nudge = anchorOffset(layer, layer.anchor);
  box.style.left = `${layer.x + (nudge ? nudge.dx : 0)}px`;
  box.style.top = `${layer.y + (nudge ? nudge.dy : 0)}px`;
  box.style.width = `${layer.w}px`;
  box.style.height = `${layer.h}px`;

  box.append(fillImage(layer));
  return box;
}

// The art inside a layer box. Kept separate from image() so a pose change can
// fade a new fill in over the old one without rebuilding the box.
function fillImage(layer) {
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
  if (layer.flipX) img.style.transform = "scaleX(-1)";

  return img;
}

// The line, laid inside the space the balloon's outline encloses rather than
// sat at a hand-placed mark — js/data/bubbles.js carries that space, measured
// off the art and mirrored when the art is. This is only where the words start:
// fitSay() below sizes the balloon to them and lays them out again. `text`
// decides nothing but the width, and only for a balloon nobody has measured.
function line({ bubble, text, lines }) {
  const el = document.createElement("p");

  el.className = "say__text";
  el.textContent = lines.join("\n");

  const room = bubble && roomOf(bubble.src, Boolean(bubble.flipX));
  if (room) {
    const [rx0, rx1, ry0, ry1] = textRoom(room);
    el.style.left = `${bubble.x + rx0 * bubble.w}px`;
    el.style.top = `${bubble.y + ry0 * bubble.h}px`;
    el.style.width = `${(rx1 - rx0) * bubble.w}px`;
    el.style.height = `${(ry1 - ry0) * bubble.h}px`;
  } else {
    el.style.left = `${text.x}px`;
    el.style.top = `${text.y}px`;
    el.style.width = `${text.w}px`;
  }

  return el;
}

// A balloon should be the size of what it is saying.
//
// Each one was drawn at a fixed size, chosen against the English line it used
// to hold. The Hindi lines are different lengths, so a two-word balloon was as
// big as a two-line one. This shrinks each balloon to its own line: the art
// scales uniformly, so the outline keeps its shape and nothing is stretched,
// and the scale is anchored at the TAIL, so a smaller balloon still points at
// the same mouth. It never grows past the drawn size — those were placed
// against the characters, and a balloon that grew could cover them.
const SAY_MIN = 0.5;

// Lay a balloon and its line out at any size, tail held still.
function placeSay(box, spec, scale) {
  const { text, room, tailX } = box._say;
  const w = spec.w * scale;
  const h = spec.h * scale;
  const x = spec.x + tailX * spec.w - tailX * w;
  const y = spec.y + spec.h - h;

  box.style.left = `${x}px`;
  box.style.top = `${y}px`;
  box.style.width = `${w}px`;
  box.style.height = `${h}px`;
  // What the balloon was drawn at, and where the fitting has just put it, so
  // devtools/edit.js can report an edit in the numbers the scene data holds.
  box._design = { x: spec.x, y: spec.y, w: spec.w, h: spec.h };
  box._fitAt = { x, y, w, h };

  const [rx0, rx1, ry0, ry1] = room;
  text.style.left = `${x + rx0 * w}px`;
  text.style.top = `${y + ry0 * h}px`;
  text.style.width = `${(rx1 - rx0) * w}px`;
  text.style.height = `${(ry1 - ry0) * h}px`;
}

// Shrink one balloon to its own line, anchored at the tail so it still points
// at the same mouth. Called once the overlay is on the page, because it
// measures the line as drawn rather than guessing at it.
function fitSay(box) {
  const say = box._say;
  if (!say) return;

  const spec = say.spec;
  // The space this balloon's outline encloses, brought in for air. Art nobody
  // has measured keeps the size and the mark it was drawn at.
  const room = roomOf(spec.src, Boolean(spec.flipX));
  if (!room) return;

  say.room = textRoom(room);
  say.tailX = tailXOf(spec.src, Boolean(spec.flipX));

  // A balloon is a .layer, and layers glide between marks over 700ms — that is
  // for a character changing pose, not for this. Sizing has to land in one go,
  // or the balloon pops in at the size it was drawn and is then seen shrinking
  // onto its line. Nothing moves after the fit, so the transition can come
  // straight back.
  box.style.transition = "none";
  fitToText(say.text, (scale) => placeSay(box, spec, scale), { min: SAY_MIN });
  centreInk(say.text);
  box.style.transition = "";
}

// Dialogue for the pitch-dark steps: the speaker's own colour, no bubble.
function spoken(voice) {
  const el = document.createElement("p");

  el.className = `voice voice--${voice.tone}`;
  el.textContent = voice.text;
  el.style.left = `${voice.x}px`;
  el.style.top = `${voice.y}px`;
  el.style.width = `${voice.w}px`;

  return el;
}

/* ---- onomatopoeia ---- */

function shout(cue) {
  const el = document.createElement("p");

  el.className = `sfx sfx--${cue.kind}`;
  el.textContent = cue.text;
  el.style.left = `${cue.x}px`;
  el.style.top = `${cue.y}px`;
  el.style.animationDelay = `${cue.delay ?? 0}ms`;

  return el;
}

// The laugh rides an arc across the top edge, so it reads as travelling past
// rather than being spoken by anyone on screen. Each letter is placed on that
// arc as its own element, which is what lets them wave in sequence — a single
// <textPath> could travel but never ripple.
// Mr. Giggles teasing from the dark: little "hehe"s popping up at scattered
// spots, one after another, each gone again in about a second. Positions come
// off the noise hash, so the scatter is the same on every read — and they keep
// away from the middle band, where the eyes are.
function hehes(cue) {
  const wrap = document.createElement("div");
  wrap.className = "sfx-hehes";

  // Three zones the eyes can never be under: left of Agni's pair, the gap
  // between the two pairs, and high above Neel's. The eyes sit at roughly
  // x 400-710 and 1110-1540, y 360-680 (frame px), and every zone keeps a
  // text-width of clearance from both.
  const ZONES = [
    { x: 60, y: 340, w: 120, h: 240 },
    { x: 780, y: 280, w: 120, h: 260 },
    { x: 1180, y: 90, w: 300, h: 110 }
  ];

  const count = cue.count ?? 3;
  for (let i = 0; i < count; i++) {
    const b = document.createElement("b");
    b.className = "sfx-hehe";
    b.textContent = "ही ही";
    const z = ZONES[i % ZONES.length];
    const x = z.x + noise(i, 21) * z.w;
    const y = z.y + noise(i, 22) * z.h;
    b.style.left = `${Math.round(x)}px`;
    b.style.top = `${Math.round(y)}px`;
    b.style.fontSize = `${Math.round(58 + noise(i, 23) * 26)}px`;
    b.style.setProperty("--tilt", `${Math.round(noise(i, 24) * 28 - 14)}deg`);
    b.style.animationDelay = `${(cue.delay ?? 0) + i * (cue.gap ?? 850)}ms`;
    wrap.append(b);
  }

  return wrap;
}

function laugh(cue) {
  const wrap = document.createElement("div");
  const W = 1000;
  const H = 300;

  wrap.className = "sfx-laugh";
  wrap.style.top = `${cue.y}px`;
  wrap.style.animationDelay = `${cue.delay ?? 0}ms`;

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("width", String(W));
  svg.setAttribute("height", String(H));
  svg.setAttribute("aria-hidden", "true");

  // The arc the letters sit on, as a quadratic through the top of the box.
  // It is evaluated here rather than measured off a rendered <path>, so the
  // laugh can be built before it is ever in the document.
  const P0 = [20, 250];
  const P1 = [500, 20];
  const P2 = [980, 250];

  const at = (t) => {
    const u = 1 - t;
    return [
      u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0],
      u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1]
    ];
  };
  const slope = (t) => {
    const u = 1 - t;
    return [
      2 * u * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]),
      2 * u * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1])
    ];
  };

  // Walk the curve once for a length table, so the letters come out evenly
  // spaced along it instead of bunching where it turns.
  const STEPS = 240;
  const run = [0];
  let last = at(0);
  for (let i = 1; i <= STEPS; i++) {
    const p = at(i / STEPS);
    run.push(run[i - 1] + Math.hypot(p[0] - last[0], p[1] - last[1]));
    last = p;
  }
  const total = run[STEPS];
  const tAtLength = (len) => {
    const i = run.findIndex((d) => d >= len);
    if (i <= 0) return 0;
    const span = run[i] - run[i - 1] || 1;
    return (i - 1 + (len - run[i - 1]) / span) / STEPS;
  };

  const chars = [...cue.text];
  const start = total * 0.06;
  const width = total * 0.88;

  chars.forEach((ch, i) => {
    if (ch === " ") return;

    const t = tAtLength(start + (width * (i + 0.5)) / chars.length);
    const [x, y] = at(t);
    const [dx, dy] = slope(t);
    const turn = (Math.atan2(dy, dx) * 180) / Math.PI;

    // Every letter its own size, tilt and height off the line. A word set
    // evenly on a curve reads as typography; the same word with each letter
    // sitting a little wrong reads as a voice — which is the whole trick behind
    // the lettering this is after. Off the index rather than Math.random, so it
    // is the same laugh every time.
    const lift = ((i * 29) % 17) - 8;
    const tilt = ((i * 47) % 21) - 10;
    const size = 0.84 + ((i * 13) % 10) / 22;

    // The seat carries the placement; the glyph inside it does the waving, so
    // each letter bobs along its own local up rather than straight up the frame.
    const seat = document.createElementNS(SVG_NS, "g");
    seat.setAttribute(
      "transform",
      `translate(${x.toFixed(1)} ${(y + lift).toFixed(1)}) ` +
        `rotate(${(turn + tilt).toFixed(1)}) scale(${size.toFixed(3)})`
    );

    const glyph = document.createElementNS(SVG_NS, "text");
    glyph.setAttribute("class", "laugh__ch");
    glyph.setAttribute("text-anchor", "middle");
    // Staggered, so the ripple runs along the word instead of bobbing as one.
    glyph.style.animationDelay = `${i * 70}ms`;
    glyph.textContent = ch;

    seat.append(glyph);
    svg.append(seat);
  });

  wrap.append(svg);
  return wrap;
}


/* ---- effect layers ---- */

// Sample a ribbon of scent: a long sweep from `from` to `to` that undulates
// `waves` times with amplitude `amp`, and turns one full spiral at each
// fraction in `loops`.
//
// Sampling this analytically rather than hand-authoring beziers keeps the curls
// round and leaves the shape as tunable numbers. The trick for a spiral that
// actually closes is the weighting below: the sweep almost stops while a curl is
// being drawn, so the circular offset laps the forward travel instead of being
// stretched out into a bump.
function effect(layer) {
  const el = document.createElement("div");
  el.className = `fxlayer fxlayer--${layer.kind}`;
  if (layer.key) el.dataset.key = layer.key;

  switch (layer.kind) {
    // A faint light blinking in a distant hiding place.
    case "glimmer":
      el.style.left = `${layer.x}px`;
      el.style.top = `${layer.y}px`;
      el.style.animationDelay = `${layer.delay ?? 0}ms`;
      break;

    // The lamps going out, one at a time. They are painted into the
    // background, so each one is put out by taking the light back out of the
    // picture where it stands: a warm flare as the filament goes, then a
    // multiply blob over the pool of light it was throwing. Multiply rather
    // than a flat patch is the whole trick — it darkens the cobbles and the
    // leaves while keeping their texture, where a solid shape reads as a smudge.
    // The near lamp letting go: a ring of sparks thrown out of the glass,
    // drifting up and burning out on the air. Angles and reach come off the
    // index rather than Math.random, so the burst is identical on a replay —
    // a scene that sparkles differently every time reads as a fault.
    case "sparkle": {
      el.style.left = `${layer.x}px`;
      el.style.top = `${layer.y}px`;

      const count = layer.count ?? 16;
      const spread = layer.spread ?? 160;

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.21;
        const reach = spread * (0.45 + ((i * 37) % 55) / 100);
        const bit = document.createElement("i");
        bit.className = "sparkle__bit";
        bit.style.setProperty("--dx", `${(Math.cos(angle) * reach).toFixed(1)}px`);
        // Squashed vertically and lifted, so the ring reads as sparks on rising
        // air rather than as a firework going off flat against the street.
        bit.style.setProperty("--dy", `${(Math.sin(angle) * reach * 0.7 - 46).toFixed(1)}px`);
        bit.style.width = bit.style.height = `${6 + (i % 4) * 3.5}px`;
        bit.style.animationDelay = `${(layer.at ?? 0) + (i % 5) * 70}ms`;
        el.append(bit);
      }
      break;
    }

    case "lamps":
      // One pass per blend direction — see LAMPS_FLARE / LAMPS_OUT in the data
      // for why the mode cannot just be a class on the blobs.
      el.classList.add(`is-${layer.mode}`);
      layer.lamps.forEach((lamp) => {
        const blob = document.createElement("i");
        blob.className = `lamp__${layer.mode}`;
        blob.style.left = `${lamp.x - lamp.rx}px`;
        blob.style.top = `${lamp.y - lamp.ry}px`;
        blob.style.width = `${lamp.rx * 2}px`;
        blob.style.height = `${lamp.ry * 2}px`;
        // The flare fires on the beat; the darkness follows it in.
        blob.style.animationDelay = `${lamp.at + (layer.mode === "out" ? 170 : 0)}ms`;
        el.append(blob);
      });
      break;

    // A silent, looping video layer — the darkness with the eyes in it.
    case "video": {
      el.style.left = `${layer.x}px`;
      el.style.top = `${layer.y}px`;
      el.style.width = `${layer.w}px`;
      el.style.height = `${layer.h}px`;

      const film = document.createElement("video");
      film.src = layer.src;
      film.loop = true;
      film.autoplay = true;
      // Muted and inline are what let it start without a gesture of its own.
      // The clip carries no audio track either way.
      film.muted = true;
      film.playsInline = true;
      film.preload = "auto";
      film.setAttribute("aria-hidden", "true");
      el.append(film);
      // Autoplay can still be refused; ask once more now it is in the page.
      film.play?.().catch(() => {});
      break;
    }

    // Cake on the air: a warm ribbon of scent that unfurls out of the bakery
    // and sweeps the lane, spiralling as it goes, with sparks caught in it.
    // Each ribbon is drawn twice — a wide blurred pass for the glow, a thin
    // crisp pass for the filament — which is what makes it read as luminous
    // rather than as a line.

    // One twinkle crosses the dark, shedding glitter as she goes. The
    // sparks are laid along her flight path rather than parented to her, so
    // they stay where they fell and wink out behind her.
    // The crossing. Used twice: full size as the cover that carries the reader
    // from page 2 into page 3, and small, slow and dim as the single twinkle
    // that goes past while Neel answers in the dark. Everything the two differ
    // by is a field on the layer, so they cannot drift apart.
    // The crossing, and the dust she leaves behind her.
    //
    // The tail is not a row of sparks any more, it is a cloud: a few hundred
    // motes scattered around her flight path, most of them a pixel or two of
    // gold and a handful of them full four-pointed glints, in four warmths from
    // amber through to white. Each lights as she reaches it and drifts outward
    // as it dies, so the ribbon spreads on the air behind her instead of
    // sitting there as a dotted line. Everything is drawn from a hash of the
    // index rather than Math.random, so the same dust falls on every replay.
    case "firefly-trail": {
      const top = layer.top ?? FLIGHT_TOP;
      const ms = layer.ms ?? FLIGHT_MS;
      const scale = layer.scale ?? 1;
      const delay = layer.delay ?? 0;
      const MOTES = layer.motes ?? 340;
      // A vanishing flight only travels this fraction of the crossing, so the
      // dust is laid only that far and each mote still lights as she passes.
      const span = layer.vanish ?? 1;
      // The phased flight's clock: how long each stretch takes. Must track the
      // fly-pause keyframes in story.css.
      const IN_MS = 1400;
      const HOLD_MS = 1200;
      const AHEAD_MS = 1000;
      // When she passes the point at t — linear for a plain flight, and for
      // the phased one: the run-in, then nothing moves through the hold, then
      // the short hop covers the rest.
      const passAt = (t) => !layer.pause
        ? (t / span) * ms
        : t <= 0.5
          ? (t / 0.5) * IN_MS
          : IN_MS + HOLD_MS + ((t - 0.5) / (span - 0.5)) * AHEAD_MS;

      for (let i = 0; i < MOTES; i++) {
        const t = (i / (MOTES - 1)) * span;

        // Where she is at t. The same curve as fly-across, and deliberately
        // unscaled: her own flight is a fixed keyframe, so scaling the dust's
        // arc would slide the cloud off the thing that is supposed to be
        // shedding it. Only the sizes and the drift take the scale.
        const x = t * 2260 - 190;
        const y = top + (t <= 0.5 ? -220 * t : -110 + 340 * (t - 0.5));

        const angle = noise(i, 1) * Math.PI * 2;
        // Biased hard toward the middle, so the cloud is dense along her line
        // and thins into a haze at its edges rather than filling a tube evenly.
        const reach = Math.pow(noise(i, 2), 1.8) * 96 * scale;
        // A tenth of them are glints. The rest are dust, sized on a cubed roll
        // so nearly all are specks and just a few are bright enough to bloom.
        const glint = noise(i, 3) > 0.88;
        const size = glint
          ? (8 + noise(i, 4) * 10) * scale
          : (1.5 + Math.pow(noise(i, 4), 3) * 9) * scale;

        const bit = document.createElement("i");
        bit.className = glint ? "spark" : "dust";
        bit.style.left = `${(x + Math.cos(angle) * reach * 1.7).toFixed(1)}px`;
        bit.style.top = `${(y + Math.sin(angle) * reach * 0.9).toFixed(1)}px`;
        bit.style.width = bit.style.height = `${size.toFixed(1)}px`;
        bit.style.setProperty("--tint", DUST_TINTS[Math.floor(noise(i, 5) * DUST_TINTS.length)]);
        // Outward and a little upward: dust that only fades reads as switching
        // off, dust that drifts reads as being carried away.
        bit.style.setProperty("--dx", `${(Math.cos(angle) * 26 * scale).toFixed(1)}px`);
        bit.style.setProperty("--dy", `${(Math.sin(angle) * 18 * scale - 20 * scale).toFixed(1)}px`);
        if (glint) bit.style.setProperty("--turn", `${Math.round(noise(i, 6) * 90)}deg`);
        // She lights each one as she passes it; the jitter keeps the leading
        // edge of the cloud ragged rather than a clean advancing rule.
        bit.style.animationDelay = `${delay + Math.round(passAt(t) + noise(i, 7) * 200)}ms`;
        // A pausing flight leaves a trail that outlives her — the point of the
        // tease is the dust still hanging where she was.
        bit.style.animationDuration = layer.pause
          ? `${2400 + Math.round(noise(i, 8) * 2200)}ms`
          : `${1400 + Math.round(noise(i, 8) * 1500)}ms`;
        el.append(bit);
      }

      const fly = document.createElement("img");
      fly.className = layer.pause ? "firefly firefly--pause"
        : layer.vanish ? "firefly firefly--tease" : "firefly";
      fly.src = "assets/images/firefly.webp";
      fly.alt = "";
      fly.style.top = `${top}px`;
      fly.style.animationDuration = `${ms}ms`;
      fly.style.animationDelay = `${delay}ms`;
      if (scale !== 1) {
        fly.style.width = `${135 * scale}px`;
        fly.style.height = `${90 * scale}px`;
      }
      el.append(fly);
      break;
    }

    default:
      break;
  }

  return el;
}

/* ---- chapter end ---- */

function finish() {
  clearTimers();
  setWaiting(false);
  hud.classList.remove("is-active", "has-prev", "has-prev-off");
  onComplete();
}


