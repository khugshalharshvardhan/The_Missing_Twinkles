// The story player. Builds each beat from js/data/scenes.js into one of two
// panes and cross-fades between them, so the outgoing scene is still on
// screen while the incoming one paints.

import { scenes } from "./data/scenes.js";

const panes = [
  document.getElementById("scene-a"),
  document.getElementById("scene-b")
];
const blackout = document.getElementById("blackout");
const hud = document.getElementById("hud");
const beatLine = document.getElementById("beat");
const dots = document.getElementById("dots");

const CROSSFADE = 900;   // must track --speed-slow in css/stage.css
const CUT_TO_BLACK = 380; // swap panes while the blackout is at full opacity

let index = -1;
let front = 0;
let busy = false;
let onComplete = () => {};

export function initStory(handlers) {
  onComplete = handlers.onComplete;
  dots.replaceChildren(...scenes.map(() => document.createElement("li")));
}

export function startStory() {
  index = -1;
  front = 0;
  panes.forEach((pane) => {
    pane.classList.remove("is-active");
    pane.replaceChildren();
  });
  hud.classList.add("is-active");
  next();
}

export function next() {
  if (busy) return;
  if (index >= scenes.length - 1) return finish();
  go(index + 1);
}

// "Skip" jumps the whole chapter, not one beat.
export function skip() {
  if (busy) return;
  index = scenes.length - 1;
  finish();
}

function go(target) {
  const scene = scenes[target];
  const back = panes[1 - front];

  index = target;
  busy = true;
  back.replaceChildren(render(scene));

  const swap = () => {
    panes[front].classList.remove("is-active");
    back.classList.add("is-active");
    front = 1 - front;
    beatLine.textContent = scene.beat ?? "";
    markProgress();
  };

  if (scene.enter === "blackout") {
    // Restart the wipe even if it just played.
    blackout.classList.remove("is-firing");
    void blackout.offsetWidth;
    blackout.classList.add("is-firing");

    window.setTimeout(swap, CUT_TO_BLACK);
    window.setTimeout(release, 1150);
    return;
  }

  swap();
  window.setTimeout(release, CROSSFADE * 0.45);
}

function release() {
  busy = false;
}

function finish() {
  hud.classList.remove("is-active");
  markProgress();
  onComplete();
}

function markProgress() {
  Array.from(dots.children).forEach((dot, i) => {
    dot.classList.toggle("is-on", i === index);
  });
}

/* ---- rendering ---- */

function render(scene) {
  const frag = document.createDocumentFragment();

  scene.layers.forEach((layer) => frag.append(image(layer, "layer")));

  if (scene.say) {
    frag.append(image(scene.say.bubble, "layer say__bubble"));
    frag.append(line(scene.say));
  }

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
  if (layer.opacity != null) box.style.opacity = layer.opacity;

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

  box.append(img);
  return box;
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
