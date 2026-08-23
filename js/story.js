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

const SVG_NS = "http://www.w3.org/2000/svg";

const LAYER_FADE = 700;   // must track .layer's opacity transition in story.css
const SETTLE = 380;       // how long a step is protected from a double-tap

// The lone twinkle's crossing. Both must track .firefly in story.css:
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
  // Names what this is, so devtools/ can report edits against the data.
  if (layer.key) box.dataset.key = layer.key;
  // A glow goes on the box, not on the fill: the fill is clipped by the box, so
  // a shadow drawn on it would be cut off at the edge. The box's own filter is
  // applied after that clip and is free to spill past it.
  if (layer.glow) box.classList.add(`glow--${layer.glow}`);
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
// rather than being spoken by anyone on screen. Each letter is placed on that
// arc as its own element, which is what lets them wave in sequence — a single
// <textPath> could travel but never ripple.
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

    // The seat carries the placement; the glyph inside it does the waving, so
    // each letter bobs along its own local up rather than straight up the frame.
    const seat = document.createElementNS(SVG_NS, "g");
    seat.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${turn.toFixed(1)})`);

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
function ribbonPath({
  from, to, waves = 2, amp = 40, loops = [], radius = 30,
  phase = 0, window: win = 0.11, samples = 340
}) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const inLoop = (t) => loops.some((at) => t >= at && t <= at + win);

  // Pass one: how fast the sweep travels at each sample.
  const speed = [];
  for (let i = 0; i <= samples; i++) speed.push(inLoop(i / samples) ? 0.12 : 1);
  const total = speed.reduce((a, b) => a + b, 0);

  // Pass two: place each sample, adding the spiral offset where one is due.
  const points = [];
  let travelled = 0;

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    travelled += speed[i];
    const s = travelled / total;

    let x = x1 + (x2 - x1) * s;
    let y = y1 + (y2 - y1) * s + amp * Math.sin(s * waves * Math.PI * 2 + phase);

    for (const at of loops) {
      if (t < at || t > at + win) continue;
      const a = ((t - at) / win) * Math.PI * 2;
      x += radius * Math.sin(a);
      y -= radius * (1 - Math.cos(a));
    }

    points.push([Number(x.toFixed(1)), Number(y.toFixed(1))]);
  }

  return { d: `M ${points.map(([x, y]) => `${x},${y}`).join(" L ")}`, points };
}

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
    case "aroma": {
      const uid = `aroma-${++ids}`;

      el.style.left = `${layer.x}px`;
      el.style.top = `${layer.y}px`;
      el.style.width = `${layer.w}px`;
      el.style.height = `${layer.h}px`;

      el.innerHTML = `
        <svg viewBox="0 0 ${layer.w} ${layer.h}" aria-hidden="true">
          <defs>
            <filter id="${uid}-glow" x="-15%" y="-25%" width="130%" height="150%">
              <feGaussianBlur stdDeviation="12" />
            </filter>
            <!-- Brightest at the bakery, thinning as it travels down the lane. -->
            <linearGradient id="${uid}-halo" gradientUnits="userSpaceOnUse"
                            x1="${layer.w}" y1="0" x2="0" y2="0">
              <stop offset="0"    stop-color="#ffa22e" stop-opacity="1" />
              <stop offset="0.55" stop-color="#ffb347" stop-opacity="0.8" />
              <stop offset="1"    stop-color="#ffc46b" stop-opacity="0.3" />
            </linearGradient>
            <linearGradient id="${uid}-core" gradientUnits="userSpaceOnUse"
                            x1="${layer.w}" y1="0" x2="0" y2="0">
              <stop offset="0"    stop-color="#fff6df" stop-opacity="1" />
              <stop offset="0.55" stop-color="#ffe7b0" stop-opacity="0.92" />
              <stop offset="1"    stop-color="#ffdb96" stop-opacity="0.45" />
            </linearGradient>
          </defs>
          <g class="aroma__halo" filter="url(#${uid}-glow)"></g>
          <g class="aroma__core"></g>
        </svg>`;

      const halo = el.querySelector(".aroma__halo");
      const core = el.querySelector(".aroma__core");
      const sparks = [];

      layer.ribbons.forEach((spec, i) => {
        const { d, points } = ribbonPath(spec);

        // The same geometry twice: haze underneath, filament on top.
        [halo, core].forEach((group) => {
          const path = document.createElementNS(SVG_NS, "path");
          path.setAttribute("class", "aroma__ribbon");
          path.setAttribute("d", d);
          path.setAttribute("stroke", `url(#${uid}-${group === halo ? "halo" : "core"})`);
          // Normalised, so one dash can unfurl the whole ribbon whatever its
          // real length, and all three unfurl at the same rate.
          path.setAttribute("pathLength", "1000");
          path.style.animationDelay = `${i * 220}ms`;
          group.append(path);
        });

        // Sparks sit on the ribbon itself, so they always look carried by it.
        if (i === 0) {
          for (let k = 0; k < 6; k++) {
            sparks.push(points[Math.round(((k + 0.5) / 6) * (points.length - 1))]);
          }
        }
      });

      sparks.forEach(([x, y], k) => {
        const spark = document.createElement("i");
        spark.className = "aroma__spark";
        spark.style.left = `${x}px`;
        spark.style.top = `${y}px`;
        spark.style.width = spark.style.height = `${5 + (k % 3) * 3}px`;
        // Staggered so the ribbon twinkles along its length rather than at once.
        spark.style.animationDelay = `${1100 + k * 420}ms`;
        el.append(spark);
      });
      break;
    }

    // One twinkle crosses the dark, shedding glitter as she goes. The
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
      fly.src = "assets/images/firefly.webp";
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
