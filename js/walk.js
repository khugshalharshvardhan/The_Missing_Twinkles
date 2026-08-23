// The walk — the prologue to act two. See js/data/walk.js for the layer stack.
//
// Every scrolling layer is one element with a repeating background, moved by
// background-position rather than by translating copies: the art was measured
// to tile, so this needs no duplicated nodes and no wrap-around bookkeeping.
//
// One requestAnimationFrame loop drives all of it, because the layers have to
// stay in step with each other — eleven independent CSS animations would drift
// apart, and the deceleration at the end has to apply to all of them at once.

import {
  layers,
  foreground,
  cast,
  guide,
  sparks,
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

// Pixels of ground per second at full pace. They are strolling, not running,
// so this is deliberately slow — the ground covers about a third of a tile in
// the time the walk runs, which also keeps the repeat well out of sight.
const PACE = 285;

let scroll = 0;
let raf = 0;
let startedAt = 0;
let lastNow = 0;
let heldAt = 0;
let onArrive = () => {};
let strips = [];

export function initWalk(handlers) {
  onArrive = handlers.onArrive ?? (() => {});
}

export function startWalk() {
  stopWalk();
  host.replaceChildren();
  strips = [];
  scroll = 0;

  // Behind the pair.
  layers.forEach((layer) => host.append(strip(layer)));
  // Fireflies drifting through the scene, then the pair, then the one they are
  // actually following.
  sparks.forEach((spec) => host.append(spark(spec)));
  // Shadows first, as a group, so neither walker's shadow lands on top of the
  // other one's feet.
  cast.forEach((who) => { if (who.shadow) host.append(shadow(who)); });
  cast.forEach((who) => host.append(walker(who)));
  host.append(flyer(guide));
  // And the nearest foliage, which passes in front of everything.
  foreground.forEach((layer) => host.append(strip(layer)));

  host.classList.add("is-live");

  clearCues();
  playCues(cues["walk"]);

  startedAt = performance.now();
  lastNow = startedAt;
  raf = requestAnimationFrame(tick);
}

export function stopWalk() {
  cancelAnimationFrame(raf);
  raf = 0;
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
  const left = WALK_MS - t;
  const ease = left >= SETTLE_MS ? 1 : Math.max(0, left / SETTLE_MS) ** 1.7;
  scroll += (PACE * ease * dt) / 1000;

  for (const { el, speed } of strips) {
    el.style.backgroundPositionX = `${-scroll * speed}px`;
  }

  if (t >= WALK_MS) {
    onArrive();
    return;
  }
  raf = requestAnimationFrame(tick);
}

/* ---- building ---- */

function strip(layer) {
  const el = document.createElement("i");

  el.className = layer.kind === "earth" ? "pw__strip pw__earth" : "pw__strip";
  el.dataset.key = layer.key;
  el.style.top = `${layer.y ?? 0}px`;
  el.style.height = `${layer.h ?? FRAME_H}px`;
  if (layer.opacity != null) el.style.opacity = String(layer.opacity);
  // Distance, not transparency: the nearest foliage is unlit, so it darkens
  // rather than fading — opacity would let the trees show through the leaves.
  if (layer.dim != null) el.style.filter = `brightness(${layer.dim})`;

  // The earth is a flat colour under the ground planes, so it neither tiles nor
  // scrolls — nothing about a uniform fill would read as moving anyway.
  if (layer.kind === "earth") return el;

  el.style.backgroundImage = `url("${layer.src}")`;
  strips.push({ el, speed: layer.speed });
  return el;
}

// The patch of dark under a walker's feet. It squashes on the same clock as the
// stride, so it tightens as the weight lands. Centred on the ground line rather
// than on the box bottom — the boxes sit a few pixels lower to account for the
// empty space under each character's feet, but they share one ground.
function shadow(who) {
  const el = document.createElement("i");

  el.className = "pw__shadow";
  el.style.left = `${who.x + (who.w - who.shadow.w) / 2}px`;
  el.style.top = `${GROUND_Y - who.shadow.h / 2}px`;
  el.style.width = `${who.shadow.w}px`;
  el.style.height = `${who.shadow.h}px`;
  el.style.setProperty("--step-ms", `${who.step.ms}ms`);
  el.style.animationDelay = `${who.step.delay}ms`;

  return el;
}

// A walker is a box showing one cell of its sprite strip at a time. The strip
// is positioned in pixels rather than percentages: with a background wider than
// its box, a percentage background-position resolves against (box - image), so
// the nine cells would land at 0%..100% in eight steps rather than nine. Pixels
// have no such surprise.
function walker(who) {
  const box = document.createElement("div");
  const span = who.sheet.frames * who.w;

  box.className = "pw__walker";
  box.dataset.key = who.key;
  box.style.left = `${who.x}px`;
  box.style.top = `${who.feet - who.h}px`;
  box.style.width = `${who.w}px`;
  box.style.height = `${who.h}px`;
  box.style.backgroundImage = `url("${who.src}")`;
  box.style.backgroundSize = `${span}px ${who.h}px`;
  box.style.setProperty("--sheet-end", `${-span}px`);
  box.style.setProperty("--step-ms", `${who.step.ms}ms`);
  // Set here rather than in the stylesheet: steps() takes a plain integer, and
  // the count belongs with the sheet it describes.
  box.style.animationTimingFunction = `steps(${who.sheet.frames})`;
  box.style.animationDelay = `${who.step.delay}ms`;

  return box;
}

// One firefly out of the sheet. background-size 600% wide makes each of the six
// cells exactly the width of the box, so the cell is chosen by shifting a whole
// box width per index.
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

  return el;
}

function flyer(spec) {
  const box = document.createElement("div");

  box.className = "pw__guide";
  box.dataset.key = spec.key;
  box.style.left = `${spec.x}px`;
  box.style.top = `${spec.y}px`;
  box.style.width = `${spec.w}px`;
  box.style.height = `${spec.h}px`;

  const img = document.createElement("img");
  img.className = "pw__fill";
  img.src = spec.src;
  img.alt = "";

  box.append(img);
  return box;
}

/* ---- dev hook (devtools/, only reached with ?dev) ---- */

export function devGoto() {
  startWalk();
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
