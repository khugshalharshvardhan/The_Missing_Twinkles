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

const layerHost = document.getElementById("layers");
const overlayHost = document.getElementById("overlays");
const transition = document.getElementById("transition");
const hud = document.getElementById("hud");
const beatLine = document.getElementById("beat");
const dots = document.getElementById("dots");

const LAYER_FADE = 700;   // must track .layer's opacity transition in story.css
const SETTLE = 380;       // how long a step is protected from a double-tap

// The lone light keeper's crossing. Both must track .firefly in story.css:
// FLIGHT_MS its animation-duration, FLIGHT_TOP the lane she flies down.
const FLIGHT_MS = 2600;
const FLIGHT_TOP = 470;

const mounted = new Map(); // key -> { el, spec } for the layer showing now
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
  // One dot per page, matching how the chapter reads.
  dots.replaceChildren(...pages.map(() => document.createElement("li")));
}

export function startStory() {
  clearTimers();
  stopAudio();
  setWaiting(false);

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
  setWaiting(false);
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
  transition.replaceChildren(
    effect({ kind: "night" }),
    effect({ kind: "firefly-trail" })
  );
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

  beatLine.textContent = step.beat ?? "";
  markProgress(entry);

  // A transition already scheduled its own cues, so don't wipe them.
  if (!silent) clearCues();
  playCues(cues[step.id]);

  if (entry.last) {
    // Closes the page: hand control back once the line has finished.
    revealTimer = window.setTimeout(() => setWaiting(true), step.reveal ?? 0);
  } else {
    holdTimer = window.setTimeout(next, step.hold ?? 2400);
  }
}

// The chevron and the whole-stage tap target live or die together, so the
// affordance and what it does can never disagree.
function setWaiting(on) {
  waiting = on;
  hud.classList.toggle("is-waiting", on);
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
    frag.append(image(step.say.bubble, "layer say__bubble"));
    frag.append(line(step.say));
  }
  (step.voices ?? []).forEach((voice) => frag.append(spoken(voice)));
  (step.sfx ?? []).forEach((cue) =>
    frag.append(cue.kind === "laugh" ? laugh(cue) : shout(cue))
  );

  return frag;
}

// A layer is a clipping box at the designed size, holding the image fill.
// That mirrors how Figma stores it, so a cropped fill lands on the same
// pixels here as it does on the canvas.
function image(layer, className) {
  const box = document.createElement("div");

  box.className = layer.fx ? `${className} fx-${layer.fx}` : className;
  box.style.left = `${layer.x}px`;
  box.style.top = `${layer.y}px`;
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

function line({ text, lines }) {
  const el = document.createElement("p");

  el.className = "say__text";
  el.textContent = lines.join("\n");
  el.style.left = `${text.x}px`;
  el.style.top = `${text.y}px`;
  el.style.width = `${text.w}px`;

  return el;
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
// rather than being spoken by anyone on screen.
function laugh(cue) {
  const wrap = document.createElement("div");
  const path = `laugh-arc-${++ids}`;

  wrap.className = "sfx-laugh";
  wrap.style.top = `${cue.y}px`;
  wrap.style.animationDelay = `${cue.delay ?? 0}ms`;
  wrap.innerHTML = `
    <svg viewBox="0 0 1000 300" width="1000" height="300" aria-hidden="true">
      <path id="${path}" d="M10,250 Q500,10 990,250" fill="none" />
      <text><textPath href="#${path}" startOffset="50%" text-anchor="middle"></textPath></text>
    </svg>`;
  // Set the text as data, not markup.
  wrap.querySelector("textPath").textContent = cue.text;

  return wrap;
}

/* ---- effect layers ---- */

function effect(layer) {
  const el = document.createElement("div");
  el.className = `fxlayer fxlayer--${layer.kind}`;

  switch (layer.kind) {
    // A faint light blinking in a distant hiding place.
    case "glimmer":
      el.style.left = `${layer.x}px`;
      el.style.top = `${layer.y}px`;
      el.style.animationDelay = `${layer.delay ?? 0}ms`;
      break;

    // One light keeper crosses the dark, shedding glitter as she goes. The
    // sparks are laid along her flight path rather than parented to her, so
    // they stay where they fell and wink out behind her.
    case "firefly-trail": {
      const SPARKS = 40;

      for (let i = 0; i < SPARKS; i++) {
        const t = i / (SPARKS - 1);
        const spark = document.createElement("i");

        spark.className = "spark";
        // Same curve as fly-across, sampled: out to the right, rising to the
        // halfway mark, then easing back down.
        spark.style.left = `${t * 2260}px`;
        spark.style.top = `${FLIGHT_TOP + (t <= 0.5 ? -220 * t : -110 + 340 * (t - 0.5))}px`;
        // Scatter them off the line so the trail has body rather than reading
        // as a dotted rule. No random seed — the offsets just have to differ.
        spark.style.marginLeft = `${((i * 37) % 54) - 27}px`;
        spark.style.marginTop = `${((i * 53) % 62) - 31}px`;
        spark.style.width = spark.style.height = `${9 + ((i * 11) % 13)}px`;
        // Each lights as she reaches it, then fades.
        spark.style.animationDelay = `${Math.round(t * FLIGHT_MS)}ms`;
        el.append(spark);
      }

      const fly = document.createElement("img");
      fly.className = "firefly";
      fly.src = "assets/images/firefly.png";
      fly.alt = "";
      fly.style.top = `${FLIGHT_TOP}px`;
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
  hud.classList.remove("is-active");
  markProgress(timeline[timeline.length - 1]);
  onComplete();
}

function markProgress(entry) {
  Array.from(dots.children).forEach((dot, i) => {
    dot.classList.toggle("is-on", i === entry.p);
  });
}
