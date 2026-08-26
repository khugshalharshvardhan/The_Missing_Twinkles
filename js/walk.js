// The walk — the prologue to act two. See js/data/walk.js for the layer stack.
//
// Every scrolling layer is one element with a repeating background, moved by
// background-position rather than by translating copies: the art was measured
// to tile, so this needs no duplicated nodes and no wrap-around bookkeeping.
//
// One requestAnimationFrame loop drives all of it, because everything here has
// to stay in step: eleven independent CSS animations would drift apart, the
// deceleration at the end has to apply to all of them at once, and — the reason
// the walkers moved out of CSS and into this loop — the stride is driven by
// distance travelled rather than by a clock, so when the ground stops the feet
// stop with it instead of marching on the spot.

import {
  layers,
  foreground,
  cast,
  guide,
  sparks,
  destinations,
  SPARK_SHEET,
  SPARK_CELLS,
  FRAME_W,
  FRAME_H,
  WALK_MS,
  SETTLE_MS,
  GROUND_Y
} from "./data/walk.js";
import { playCues, clearCues } from "./audio.js";
import { cues } from "./data/audio.js";

const host = document.getElementById("walk");

// Pixels of ground per second at full pace. They are strolling, not running.
const PACE = 285;

// How much of each sprite frame's life is spent cross-fading into the next.
// Nine frames is two steps, so four and a half poses per step — at this pace
// that lands near 13fps, and held hard against a 60fps scroll it reads as a
// stutter. Blending the last part of each frame into the next keeps the poses
// crisp and takes the edge off the snap.
const BLEND = 0.45;

// Ground the walk covers in total: full pace for the first stretch, then the
// integral of the settle's ease. Used to turn scroll into a 0..1 progress, so
// the pair's approach is tied to the ground rather than to a second clock that
// could disagree with it.
const TOTAL_SCROLL = (PACE * (WALK_MS - SETTLE_MS + SETTLE_MS / 2.7)) / 1000;

// The run's own settings — pace, length, direction — so the walk out and the
// walk home share one renderer. Filled in by startWalk().
let run = { reverse: false, pace: PACE, ms: WALK_MS, scrollTotal: TOTAL_SCROLL };

let scroll = 0;
let raf = 0;
let liveRaf = 0;
let startedAt = 0;
let lastNow = 0;
let heldAt = 0;
let onArrive = () => {};
let strips = [];
let walkers = [];
let fades = [];
let masks = [];
// Last value written, so an unchanged settle costs nothing.
let lastSettled = -1;

export function initWalk(handlers) {
  onArrive = handlers.onArrive ?? (() => {});
}

// `dest` picks where this walk ends up — see `destinations` in js/data/walk.js.
// The journey is the same either way; the destination swaps the painting the
// settle dissolves into and the guide leading the pair to it.
export function startWalk(dest = destinations.clearing, mode = null) {
  stopWalk();
  host.replaceChildren();

  run = {
    reverse: Boolean(mode?.reverse),
    pace: PACE * (mode?.paceScale ?? 1),
    ms: mode?.walkMs ?? WALK_MS
  };
  run.scrollTotal = (run.pace * (run.ms - SETTLE_MS + SETTLE_MS / 2.7)) / 1000;
  strips = [];
  walkers = [];
  fades = [];
  masks = [];
  lastSettled = -1;
  scroll = 0;

  // Behind the pair.
  layers.forEach((layer) =>
    host.append(strip(layer.key === "arrive" ? { ...layer, src: dest.arrive } : layer)));
  // Fireflies drifting through the scene, then the pair, then the one they are
  // actually following.
  // These fade out on arrival with everything else that is not in the game's
  // painting: the swarm the game opens on flies in on its own terms.
  sparks.forEach((spec) => {
    const el = spark(spec);
    fades.push({ el, base: 0.85, to: 0 });
    host.append(el);
  });
  // Shadows first, as a group, so neither walker's shadow lands on top of the
  // other one's feet.
  const castRun = mode?.cast
    ? cast.map((who) => ({ ...who, ...mode.cast[who.key] }))
    : cast;
  castRun.forEach((who) => host.append(shadow(who)));
  castRun.forEach((who) => host.append(walker(who)));
  // A run whose arrival painting holds the pair fades the walking sprites out
  // over the settle. The boxes go through the same fade list as everything
  // else; the shadows cannot (place() writes their opacity every frame for the
  // step-beat), so the fade reaches them through run.castOpacity instead.
  run.castOpacity = 1;
  run.fading = Boolean(mode?.fadeCast);
  if (mode?.fadeCast) {
    for (const w of walkers) fades.push({ el: w.box, base: 1, to: 0 });
  }
  for (const spec of mode?.guides ?? [{ ...guide, ...dest.guide }]) {
    const led = flyer(spec);
    fades.push({ el: led, base: 1, to: 0 });
    host.append(led);
  }
  // And the nearest foliage, which passes in front of everything.
  foreground.forEach((layer) => host.append(strip(layer)));

  // Put everyone at their opening mark before the first paint, so the walk
  // never shows a frame with the pair at their arrival positions.
  place(0, 0);
  // A frame late on purpose: the act flip has just taken #walk out of
  // display:none, and an opacity set in that same style pass does not
  // transition — the walk popped to full instead of fading, and a strip still
  // decoding showed as a blank flash. One frame later the 0 -> 1 fade really
  // runs, with the outgoing act visible underneath it the whole way.
  liveRaf = requestAnimationFrame(() => host.classList.add("is-live"));

  clearCues();
  playCues(cues["walk"]);

  startedAt = performance.now();
  lastNow = startedAt;
  raf = requestAnimationFrame(tick);
}

export function stopWalk() {
  cancelAnimationFrame(raf);
  cancelAnimationFrame(liveRaf);
  raf = 0;
  liveRaf = 0;
}

export function endWalk() {
  stopWalk();
  host.classList.remove("is-live");
  window.setTimeout(() => host.replaceChildren(), 1200);
}

/* ---- the loop ---- */

function tick(now) {
  const t = now - startedAt;
  // Measured, not assumed: a fixed per-frame step would run the walk at double
  // pace on a 120Hz screen. Clamped so a stalled tab cannot jump the scroll.
  const dt = Math.min(64, now - lastNow);
  lastNow = now;

  // Full pace, then ease to a standstill over the last stretch so they arrive
  // rather than stopping dead.
  const left = run.ms - t;
  const ease = left >= SETTLE_MS ? 1 : Math.max(0, left / SETTLE_MS) ** 1.7;
  const step = (run.pace * ease * dt) / 1000;
  scroll += step;

  for (const { el, speed } of strips) {
    el.style.backgroundPositionX = `${(run.reverse ? scroll : -scroll) * speed}px`;
  }

  // The clearing opens over the same stretch the scroll is easing down. Both
  // of these are guarded: writing a mask string every frame re-rasters the whole
  // tiled layer behind it, which measured 41fps against 60 for the sake of a
  // value that does not change until the last two seconds.
  const settled = 1 - Math.min(1, Math.max(0, left / SETTLE_MS));
  if (Math.abs(settled - lastSettled) > 0.004) {
    lastSettled = settled;
    if (run.fading) run.castOpacity = 1 - settled;
    for (const f of fades) {
      f.el.style.opacity = String(f.base + (f.to - f.base) * settled);
    }
    // The middle of the frame opens out while the edges stay: a mask whose
    // centre goes from opaque to clear, so what is left standing is where
    // bg_night has its own pines.
    for (const m of masks) {
      const k = 1 - settled;
      const g = `linear-gradient(to right, #000 0%, rgba(0,0,0,${k}) ${m.edge * 100}%,` +
        ` rgba(0,0,0,${k}) ${100 - m.edge * 100}%, #000 100%)`;
      m.el.style.maskImage = g;
      m.el.style.webkitMaskImage = g;
    }
  }

  place(scroll, step);

  if (t >= run.ms) {
    onArrive();
    return;
  }
  raf = requestAnimationFrame(tick);
}

// Move the pair along their approach and advance their strides.
//
// `progress` is how far through the walk the ground has got, so the approach and
// the scroll can never disagree — when one stops the other does. `step` is the
// ground covered since the last frame, which is what turns the stride over.
function place(travelled, step) {
  const progress = Math.min(1, travelled / run.scrollTotal);

  for (const w of walkers) {
    const { who } = w;
    const dx = (who.from.cx - who.to.cx) * (1 - progress);
    const scale = 1 - (1 - who.from.h / who.to.h) * (1 - progress);

    // Each of them covers slightly different ground: Agni drifts back through
    // the frame as Neel pulls ahead, so their own travel is the scroll plus
    // however far they have moved across it. Their stride follows that, not the
    // scroll, or the one falling behind would over-step.
    // Walking the other way flips which drift direction covers extra ground.
    const drift = dx - w.dx;
    const own = step + (run.reverse ? -drift : drift);
    w.dx = dx;
    // `per` is measured at full size, so it shortens as they do.
    w.cycles += own / (who.step.per * scale);

    const f = (w.cycles % 1) * who.sheet.frames;
    const cell = Math.floor(f);
    const frac = f - cell;
    const cellW = w.span / who.sheet.frames;

    w.a.style.backgroundPositionX = `${-cell * cellW}px`;
    w.b.style.backgroundPositionX = `${-((cell + 1) % who.sheet.frames) * cellW}px`;
    w.b.style.opacity = frac <= 1 - BLEND ? "0" : String((frac - (1 - BLEND)) / BLEND);

    // Homeward they face the other way: the sprite strips are drawn walking
    // right, so the box is mirrored around its own centre.
    const flip = run.reverse ? " scaleX(-1)" : "";
    w.box.style.transform = `translateX(${dx}px) scale(${scale})${flip}`;
    // The shadow tightens on the down-beat, which is twice per cycle.
    const beat = 0.88 + 0.12 * Math.abs(Math.cos(Math.PI * w.cycles * 2));
    w.shadow.style.transform = `translateX(${dx}px) scale(${scale * beat})`;
    w.shadow.style.opacity = String((0.72 + 0.28 * (beat - 0.88) / 0.12) * (run.castOpacity ?? 1));
  }
}

/* ---- building ---- */

function strip(layer) {
  const el = document.createElement("i");

  el.className = layer.kind === "earth" ? "pw__strip pw__earth" : "pw__strip";
  el.dataset.key = layer.key;
  el.style.top = `${layer.y ?? 0}px`;
  el.style.height = `${layer.h ?? FRAME_H}px`;
  const base = layer.opacity ?? 1;
  if (layer.opacity != null) el.style.opacity = String(base);
  // Distance, not transparency: the nearest foliage is unlit, so it darkens
  // rather than fading — opacity would let the trees show through the leaves.
  if (layer.dim != null) el.style.filter = `brightness(${layer.dim})`;

  // The earth is a flat colour under the ground planes, so it neither tiles nor
  // scrolls — nothing about a uniform fill would read as moving anyway.
  if (layer.kind === "earth") return el;

  // A still layer is one whole picture rather than a tile, so it covers the
  // frame and stays put while everything else slides past underneath it.
  if (layer.kind === "still") {
    el.style.backgroundImage = `url("${layer.src}")`;
    el.style.backgroundSize = "cover";
    el.style.backgroundRepeat = "no-repeat";
    if (layer.settle != null) fades.push({ el, base, to: layer.settle });
    return el;
  }

  el.style.backgroundImage = `url("${layer.src}")`;
  strips.push({ el, speed: layer.speed });
  if (layer.settle != null) fades.push({ el, base, to: layer.settle });
  if (layer.settleMask != null) masks.push({ el, edge: layer.settleMask });
  // Static, so it goes on once: art with a hard lower edge dissolved into what
  // is behind it.
  if (layer.fadeBottom) {
    const [a, b] = layer.fadeBottom;
    const g = `linear-gradient(to bottom, #000 ${a * 100}%, transparent ${b * 100}%)`;
    el.style.maskImage = g;
    el.style.webkitMaskImage = g;
  }
  return el;
}

// The geometry of a walker at its arrival size. The box carries the cell's own
// aspect so nothing is stretched, and it is laid out at the arrival mark — the
// approach is a transform on top, which keeps the sprite's raster fixed instead
// of re-scaling a 4000px strip every frame.
function boxOf(who) {
  const [cellW, cellH] = who.sheet.cell;
  const h = (who.to.h * cellH) / who.sheet.sole;
  const w = (h * cellW) / cellH;
  return {
    w,
    h,
    left: who.to.cx - w / 2,
    // `sole` is a row inside the cell, so the box bottom sits just under it.
    top: who.feet - (h * who.sheet.sole) / cellH
  };
}

// The patch of dark under a walker's feet. Centred on the ground line and moved
// with them, so it stays under the soles as they spread out and grow.
function shadow(who) {
  const el = document.createElement("i");
  const g = boxOf(who);

  el.className = "pw__shadow";
  el.dataset.key = `${who.key}-shadow`;
  el.style.left = `${g.left + (g.w - who.shadow.w) / 2}px`;
  el.style.top = `${GROUND_Y - who.shadow.h / 2}px`;
  el.style.width = `${who.shadow.w}px`;
  el.style.height = `${who.shadow.h}px`;

  return el;
}

// A walker is a box holding two copies of its sprite strip, one showing the
// current cell and one the next, cross-faded near the end of each frame. Cells
// are picked in pixels rather than percentages: with a background wider than its
// box, a percentage background-position resolves against (box - image), so nine
// cells would land in eight steps.
function walker(who) {
  const box = document.createElement("div");
  const g = boxOf(who);
  const span = who.sheet.frames * g.w;

  box.className = "pw__walker";
  box.dataset.key = who.key;
  box.style.left = `${g.left}px`;
  box.style.top = `${g.top}px`;
  box.style.width = `${g.w}px`;
  box.style.height = `${g.h}px`;

  const cel = () => {
    const el = document.createElement("i");
    el.className = "pw__cell";
    el.style.backgroundImage = `url("${who.src}")`;
    el.style.backgroundSize = `${span}px ${g.h}px`;
    box.append(el);
    return el;
  };

  const a = cel();
  const b = cel();
  walkers.push({
    who,
    box,
    a,
    b,
    span,
    shadow: host.querySelector(`[data-key="${who.key}-shadow"]`),
    cycles: who.step.phase ?? 0,
    dx: who.from.cx - who.to.cx
  });

  return box;
}

// One firefly out of the sheet. The strip is six cells wide, so a whole box
// width per index picks one.
function spark(spec) {
  const el = document.createElement("i");

  el.className = "pw__spark";
  el.style.left = `${spec.x}px`;
  el.style.top = `${spec.y}px`;
  el.style.width = `${spec.w}px`;
  el.style.height = `${spec.w * 2}px`;
  el.style.backgroundImage = `url("${SPARK_SHEET}")`;
  el.style.backgroundSize = `${SPARK_CELLS * 100}% 100%`;
  el.style.backgroundPositionX = `${-spec.cell * 100}%`;
  el.style.animationDuration = `${spec.drift}s`;
  el.style.animationDelay = `${spec.delay}s`;
  // On the way home they fly the other way, like everything else.
  if (run.reverse) el.classList.add("is-flipped");

  return el;
}

function flyer(spec) {
  const box = document.createElement("div");

  box.className = "pw__guide";
  box.dataset.key = spec.key;
  if (spec.delay) box.style.animationDelay = `${spec.delay}s`;
  box.style.left = `${spec.x}px`;
  box.style.top = `${spec.y}px`;
  box.style.width = `${spec.w}px`;
  box.style.height = `${spec.h}px`;

  const img = document.createElement("img");
  img.className = "pw__fill";
  img.src = spec.src;
  img.alt = "";
  // The weave lives on the box, so the fill can mirror without fighting it.
  if (spec.flip) img.style.transform = "scaleX(-1)";

  box.append(img);
  return box;
}

/* ---- dev hook (devtools/, only reached with ?dev) ---- */

export function devGoto(dest, mode) {
  startWalk(dest, mode);
  return { id: "walk" };
}

// Pause holds the clock where it stopped, so releasing carries the walk on
// instead of starting it again.
export function devPause(on) {
  if (on) {
    heldAt = performance.now() - startedAt;
    stopWalk();
    return;
  }
  if (!host.classList.contains("is-live")) return;

  startedAt = performance.now() - Math.min(heldAt, WALK_MS - 50);
  lastNow = performance.now();
  if (!raf) raf = requestAnimationFrame(tick);
}
