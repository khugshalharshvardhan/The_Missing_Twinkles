// Picking things up and putting them down.
//
// Every editable thing on the stage is a positioned box whose left / top /
// width / height are inline pixels in the design frame, which is exactly what
// the scene data holds. So an edit here is a straight read of those four
// numbers, and the export can be applied to the data verbatim.
//
// The one thing to keep straight: #stage is scaled to fit the window, so a
// pointer moves further than the element does. Every delta is divided by that
// scale before it is applied.

const stage = document.getElementById("stage");

// What can be picked up, per act.
const TARGETS = {
  story: [
    "#layers > .layer",
    "#layers > .fxlayer",
    "#overlays > .say__bubble",
    "#overlays > .say__text",
    "#overlays > .voice",
    "#overlays > .sfx",
    "#overlays > .sfx-laugh"
  ],
  game: [
    "#game .scene.is-active > .layer",
    "#game .scene.is-active > .bubble",
    "#game .scene.is-active > .keypad",
    "#game .scene.is-active > .swarm",
    // Added with the counter, the number line and the hint. Without these the
    // three newest things on screen were the only ones that could not be moved.
    "#game .scene.is-active > .counter",
    "#game .scene.is-active > .numline",
    "#game .scene.is-active > .hint",
    "#game .scene.is-active > .lamp",
    "#game .scene.is-active > .shout"
  ],
  // The walk lays itself out from js/data/walk.js rather than from Figma
  // coordinates, so the pieces worth grabbing are the pair and the firefly they
  // are following. The scrolling bands are positioned by the loop every frame
  // and would fight anything dragged.
  walk: [
    "#walk > .pw__walker",
    "#walk > .pw__guide"
  ]
};

let onChange = () => {};
let picked = null;
let grip = null;
let baseline = new Map(); // element -> the numbers it had before any edit

export function initEdit(handlers) {
  onChange = handlers.onChange ?? (() => {});

  stage.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("keydown", onKeyDown);
}

export function markTargets(act) {
  for (const el of stage.querySelectorAll(".dv-hit")) el.classList.remove("dv-hit");
  const sel = TARGETS[act];
  if (!sel) return;
  for (const el of stage.querySelectorAll(sel.join(","))) el.classList.add("dv-hit");
}

export function deselect() {
  if (grip) grip.remove();
  grip = null;
  picked?.classList.remove("dv-sel");
  picked = null;
  onChange(null);
}

export function selection() {
  return picked ? { el: picked, ...read(picked) } : null;
}

// Everything selectable right now, named — the panel lists these so a box
// hidden under a bigger one is still reachable.
export function targets() {
  return [...stage.querySelectorAll(".dv-hit")].map((el) => ({
    el,
    name: identify(el),
    picked: el === picked
  }));
}

// Select from the panel rather than by clicking the stage.
export function pick(el) {
  select(el);
}

// Set one field from the panel's number inputs.
export function nudge(field, value) {
  if (!picked) return;
  remember(picked);
  picked.style[field] = `${value}px`;
  onChange(describe(picked));
}

/* ---- what a box currently is ---- */

function read(el) {
  const px = (v) => (v === "" ? null : Math.round(parseFloat(v)));
  const box = el.getBoundingClientRect();
  const scale = stageScale();
  return {
    x: px(el.style.left) ?? 0,
    y: px(el.style.top) ?? 0,
    // Text boxes have no set height; report what it actually occupies so the
    // number is never blank, but only width is editable for them.
    w: px(el.style.width) ?? Math.round(box.width / scale),
    h: px(el.style.height) ?? Math.round(box.height / scale),
    freeH: el.style.height === ""
  };
}

function stageScale() {
  return parseFloat(getComputedStyle(stage).getPropertyValue("--scale")) || 1;
}

// Name the thing in the words the scene data uses, so an edit can be placed.
function identify(el) {
  if (el.dataset.role) {
    return el.dataset.index === undefined
      ? el.dataset.role
      : `${el.dataset.role}[${el.dataset.index}]`;
  }
  if (el.dataset.key) return el.dataset.key;

  const fx = [...el.classList].find((c) => c.startsWith("fxlayer--"));
  if (fx) return fx.replace("fxlayer--", "kind:");
  return el.className.split(" ")[0] || "unknown";
}

function remember(el) {
  if (!baseline.has(el)) baseline.set(el, read(el));
}

function describe(el) {
  const was = baseline.get(el) ?? read(el);
  const now = read(el);
  return { name: identify(el), from: was, to: now, moved: changed(was, now) };
}

function changed(a, b) {
  return a.x !== b.x || a.y !== b.y || a.w !== b.w || (!b.freeH && a.h !== b.h);
}

/* ---- pick up, drag, resize ---- */

function onPointerDown(event) {
  if (!document.documentElement.hasAttribute("data-dev-edit")) return;

  // The resize grip lives on the selection, so check it before hit-testing.
  if (event.target === grip) return startResize(event);

  // Everything selectable under the pointer, front to back. Clicking the same
  // spot again steps one deeper, so a box beneath a bigger one is reachable
  // without hunting for a gap.
  const stack = document
    .elementsFromPoint(event.clientX, event.clientY)
    .filter((el) => el.classList?.contains("dv-hit"));
  if (!stack.length) return;

  const at = stack.indexOf(picked);
  const hit = at === -1 ? stack[0] : stack[(at + 1) % stack.length];

  event.preventDefault();
  select(hit);
  startDrag(event, hit);
}

function select(el) {
  if (picked === el) return;
  picked?.classList.remove("dv-sel");
  grip?.remove();

  picked = el;
  el.classList.add("dv-sel");
  remember(el);

  grip = document.createElement("i");
  grip.className = "dv-grip";
  el.append(grip);

  onChange(describe(el));
}

function startDrag(event, el) {
  const scale = stageScale();
  const from = read(el);
  const x0 = event.clientX;
  const y0 = event.clientY;

  const move = (e) => {
    el.style.left = `${Math.round(from.x + (e.clientX - x0) / scale)}px`;
    el.style.top = `${Math.round(from.y + (e.clientY - y0) / scale)}px`;
    onChange(describe(el));
  };
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}

function startResize(event) {
  event.preventDefault();
  event.stopPropagation();

  const el = picked;
  const scale = stageScale();
  const from = read(el);
  const x0 = event.clientX;
  const y0 = event.clientY;

  const move = (e) => {
    const w = Math.max(8, Math.round(from.w + (e.clientX - x0) / scale));
    el.style.width = `${w}px`;
    // A text box keeps its automatic height — forcing one would just clip the
    // words. Everything else resizes on both axes.
    if (!from.freeH) {
      el.style.height = `${Math.max(8, Math.round(from.h + (e.clientY - y0) / scale))}px`;
    }
    onChange(describe(el));
  };
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}

function onKeyDown(event) {
  if (!picked) return;
  if (!document.documentElement.hasAttribute("data-dev-edit")) return;
  if (/^(INPUT|TEXTAREA)$/.test(event.target.tagName)) return;

  const step = event.shiftKey ? 10 : 1;
  const by = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.code];

  if (event.code === "Escape") return deselect();
  if (!by) return;

  event.preventDefault();
  remember(picked);
  const now = read(picked);
  picked.style.left = `${now.x + by[0]}px`;
  picked.style.top = `${now.y + by[1]}px`;
  onChange(describe(picked));
}

/* ---- what to hand back ---- */

// Only the boxes that actually moved, each with where it started and where it
// ended up, so the change can be checked before it is applied.
export function edits() {
  const out = [];
  for (const [el, was] of baseline) {
    if (!el.isConnected) continue;
    const now = read(el);
    if (!changed(was, now)) continue;
    out.push({ target: identify(el), from: trim(was), to: trim(now) });
  }
  return out;
}

export function clearEdits() {
  baseline = new Map();
}

function trim({ x, y, w, h, freeH }) {
  return freeH ? { x, y, w } : { x, y, w, h };
}
