// Dev tools — scaffolding for laying the chapter out.
//
// Loaded only when the URL carries ?dev (see the guarded import in
// js/main.js), so a normal run never fetches or runs any of it. To remove the
// tooling entirely: delete this folder and that one guarded import.
//
// What it gives you:
//   * a hamburger menu of every page and step in the story, the walk between
//     the acts, and every screen in the counting game — click one to jump
//     straight to it. Game rows name what is on the screen, so the beat with the
//     keypad or the number line can be found without counting.
//   * pause, which freezes the artwork, every CSS animation and the video
//   * edit mode: drag to move, drag the corner to resize, arrow keys to nudge
//     (hold shift for 10px), or type exact numbers
//   * an export of what you changed, as JSON to hand back for applying

import { pages, timeline } from "../js/data/scenes.js";
import { levels } from "../js/data/screens.js";
import { destinations, homeMode } from "../js/data/walk.js";
import { epilogue } from "../js/data/screens.js";
import { devGoto as storyGoto, devPause as storyPause } from "../js/story.js";
import { devGoto as gameGoto, devGotoEpilogue as epiGoto, devPause as gamePause } from "../js/game.js";
import { devGoto as walkGoto, devPause as walkPause } from "../js/walk.js";
import { initEdit, markTargets, deselect, nudge, edits, clearEdits, targets, pick } from "./edit.js";

const root = document.documentElement;

let api = {};
let ui = {};
let paused = false;
let editing = false;
let here = { act: "story", index: 0, label: "1.1" };

export function initDevTools(handlers) {
  api = handlers;

  document.head.append(
    Object.assign(document.createElement("link"), {
      rel: "stylesheet",
      href: "devtools/devtools.css"
    })
  );

  build();
  initEdit({ onChange: paintSelection });
  jump({ act: "story", index: 0 });
  console.info("[dev] tools on. Remove ?dev from the URL to play normally.");
}

/* ---- the panel ---- */

function build() {
  const dv = document.createElement("div");
  dv.className = "dv";
  dv.innerHTML = `
    <button class="dv__burger" type="button" aria-label="Dev tools"><i></i><i></i><i></i></button>
    <div class="dv__flag">PAUSED</div>
    <aside class="dv__panel">
      <div class="dv__head">
        <span class="dv__title">DEV <b>TOOLS</b></span>
        <button class="dv__close" type="button" data-dv="close" aria-label="Close dev tools">&times;</button>
      </div>
      <div class="dv__body">
        <div class="dv__section">
          <div class="dv__label">Playback</div>
          <div class="dv__row">
            <button class="dv__btn dv__btn--wide" data-dv="pause">Pause</button>
            <button class="dv__btn dv__btn--wide" data-dv="edit">Edit</button>
          </div>
        </div>

        <div class="dv__section">
          <div class="dv__label">Story</div>
          <div data-dv="story-tree"></div>
        </div>

        <div class="dv__section">
          <div class="dv__label">Counting game</div>
          <div data-dv="game-tree"></div>
        </div>

        <div class="dv__section">
          <div class="dv__label">Elements on this step</div>
          <div class="dv__list" data-dv="parts"></div>
        </div>

        <div class="dv__section">
          <div class="dv__label">Selection</div>
          <div class="dv__pick">
            <div data-dv="pick-name" class="dv__pickNone">nothing selected</div>
            <div class="dv__fields">
              <label class="dv__field"><span>X</span><input data-dv="f-x" type="number" disabled /></label>
              <label class="dv__field"><span>Y</span><input data-dv="f-y" type="number" disabled /></label>
              <label class="dv__field"><span>W</span><input data-dv="f-w" type="number" disabled /></label>
              <label class="dv__field"><span>H</span><input data-dv="f-h" type="number" disabled /></label>
            </div>
            <div class="dv__hint">Edit mode: drag to move, corner to resize,
              arrows to nudge (shift = 10), esc to drop.</div>
          </div>
        </div>

        <div class="dv__section">
          <div class="dv__label">Export <span class="dv__count" data-dv="count"></span></div>
          <div class="dv__row" style="margin-bottom:6px">
            <button class="dv__btn dv__btn--wide" data-dv="copy">Copy JSON</button>
            <button class="dv__btn dv__btn--wide" data-dv="reset">Reset edits</button>
          </div>
          <textarea class="dv__out" data-dv="out" readonly
                    placeholder="Move something, then copy this and hand it over."></textarea>
        </div>
      </div>
    </aside>`;
  document.body.append(dv);

  const q = (name) => dv.querySelector(`[data-dv="${name}"]`);
  ui = {
    dv,
    flag: dv.querySelector(".dv__flag"),
    pause: q("pause"),
    edit: q("edit"),
    storyTree: q("story-tree"),
    gameTree: q("game-tree"),
    pickName: q("pick-name"),
    f: { x: q("f-x"), y: q("f-y"), w: q("f-w"), h: q("f-h") },
    parts: q("parts"),
    count: q("count"),
    out: q("out")
  };

  dv.querySelector(".dv__burger").addEventListener("click", () => dv.classList.add("is-open"));
  q("close").addEventListener("click", () => dv.classList.remove("is-open"));
  ui.pause.addEventListener("click", () => setPaused(!paused));
  ui.edit.addEventListener("click", () => setEditing(!editing));
  q("copy").addEventListener("click", copyOut);
  q("reset").addEventListener("click", () => {
    clearEdits();
    jump(here);
  });

  for (const [field, input] of Object.entries(ui.f)) {
    input.addEventListener("change", () => {
      const v = Number(input.value);
      if (Number.isFinite(v)) nudge({ x: "left", y: "top", w: "width", h: "height" }[field], v);
    });
  }

  buildTrees();
}

// Story: one group per page, one row per step. Game: one group, one row per
// screen. Both jump straight to the moment and hold it there.
function buildTrees() {
  pages.forEach((page, p) => {
    const steps = timeline
      .map((entry, i) => ({ entry, i }))
      .filter(({ entry }) => entry.p === p);

    ui.storyTree.append(
      group(`Page ${p + 1} — ${page.name}`, `${steps.length} steps`,
        steps.map(({ entry, i }) => ({
          label: `${entry.step.id}${entry.step.say ? "  ·  bubble" : ""}${entry.step.voices ? "  ·  voice" : ""}`,
          act: "story",
          index: i
        })), p === 0)
    );
  });

  // The walks are one moment each rather than a list, but they belong in the
  // menu: each is the act leading into a level. `dest` picks where it ends up.
  // Read off the levels rather than listed by hand, so a new level brings its
  // own walk into the menu the same way it brings its own beats.
  ui.gameTree.append(
    group("The walks", "between the acts",
      [
        ...levels.map((level) => (
          { label: `walk  ·  to the ${level.walkTo}`, act: "walk", index: 0, dest: level.walkTo }
        )),
        // The one walk that is not on the way to a level.
        { label: "walk  ·  home, all together", act: "walk", index: 0, dest: "home", home: true }
      ], false)
  );

  // The ending, after the walk home.
  ui.gameTree.append(
    group(epilogue.name, `${epilogue.screens.length} screens`,
      epilogue.screens.map((screen, i) =>
        ({ label: `${screen.id}${parts(screen)}`, act: "game", index: i, epi: true })), false)
  );

  // One group per level — the tutorial and every round after it.
  levels.forEach((level, li) => {
    ui.gameTree.append(
      group(level.name, `${level.screens.length} screens`,
        level.screens.map((screen, i) =>
          ({ label: `${screen.id}${parts(screen)}`, act: "game", index: i, level: li })), false)
    );
  });
}

// What a screen actually carries, so a beat can be found by what is on it
// rather than by counting rows.
function parts(screen) {
  // `interact` names the same thing twice on two screens — the keypad beat is
  // both `interact: "keypad"` and `keypad: true` — so the list is deduped.
  const bits = new Set();
  if (screen.interact) bits.add(screen.interact);
  if (screen.keypad) bits.add("keypad");
  if (screen.counter) bits.add(`counter:${screen.counter}`);
  if (screen.numberLine) bits.add("number line");
  if (screen.fireflies) {
    const f = screen.fireflies;
    bits.add(`swarm${f.enter ? ` ⇢ ${f.enter}` : ""}${f.at ? ` @${f.at}ms` : ""}${f.dim ? " · dim" : ""}`);
  }
  if (screen.keypadAt) bits.add(`pad @${screen.keypadAt}ms`);
  if (screen.lamp) bits.add(screen.lampLit ? "lamp ⇢ lit" : "lamp");
  if (screen.shout) bits.add(`shout "${screen.shout.text}"`);
  if (screen.flight) bits.add(`flight @${screen.flight.at}ms`);
  if (screen.video) bits.add("video");
  if (screen.hint) bits.add("hint");
  if (screen.bubble) bits.add(screen.bubble.idle ? "nudge @8s" : "bubble");
  return bits.size ? `  ·  ${[...bits].join("  ·  ")}` : "";
}

function group(name, note, rows, open) {
  const box = document.createElement("div");
  box.className = `dv__group${open ? " is-open" : ""}`;

  const head = document.createElement("button");
  head.type = "button";
  head.className = "dv__groupName";
  head.innerHTML = `${name}<span>${note}</span>`;
  head.addEventListener("click", () => box.classList.toggle("is-open"));

  const list = document.createElement("div");
  list.className = "dv__steps";
  for (const row of rows) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dv__step";
    btn.textContent = row.label;
    btn.dataset.act = row.act;
    btn.dataset.index = String(row.index);
    // What tells two rows with the same act and index apart: which level a
    // game row belongs to, and which destination a walk row leads to.
    btn.dataset.sub = String(row.level ?? row.dest ?? "");
    btn.addEventListener("click", () => jump(row));
    list.append(btn);
  }

  box.append(head, list);
  return box;
}

/* ---- jumping ---- */

function jump(row) {
  const { act, index } = row;
  deselect();

  if (act !== api.act()) api.setAct(act);

  // Progression follows the jump: landing in a level means everything before
  // it is done, and a walk leads into the level it walks to.
  if (act === "game") api.setChapter?.(row.level ?? 0, false);
  if (act === "walk") {
    const li = row.home ? levels.length - 1 : levels.findIndex((l) => l.walkTo === row.dest);
    api.setChapter?.(Math.max(0, li), Boolean(row.home));
  }

  // The walk plays itself from the top rather than seeking, so entering it is
  // a restart — of the walk to wherever the row leads.
  const at =
    act === "walk" ? walkGoto(destinations[row.dest ?? "clearing"], row.home ? homeMode : null)
    : act === "game" ? (row.epi ? epiGoto(index) : gameGoto(index, row.level ?? 0))
    : storyGoto(index);
  here = { ...row, label: at?.step?.id ?? at?.id ?? String(index) };

  const sub = String(row.level ?? row.dest ?? "");
  for (const btn of ui.dv.querySelectorAll(".dv__step")) {
    btn.classList.toggle("is-on",
      btn.dataset.act === act && Number(btn.dataset.index) === index && btn.dataset.sub === sub);
  }

  if (editing) markTargets(act);
  paintParts();
  // A fresh step brings a fresh clock and fresh animations, so re-apply the
  // hold over both. Jumping never pauses on its own.
  if (paused) {
    pauseAct(act, true);
    requestAnimationFrame(() => freeze(true));
  }
  paintOut();
}

/* ---- pause ---- */

function pauseAct(act, on) {
  if (act === "walk") return walkPause(on);
  if (act === "game") return gamePause(on);
  return storyPause(on);
}

function setPaused(on) {
  paused = on;
  ui.pause.classList.toggle("is-on", on);
  ui.pause.textContent = on ? "Play" : "Pause";
  ui.flag.classList.toggle("is-on", on);

  // Both halves: hold the clock so the step cannot move on underneath a frozen
  // picture, and freeze the picture itself.
  pauseAct(here.act, on);
  freeze(on);
}

// getAnimations() covers CSS animations and transitions both, which is what
// the artwork is built out of; the video needs asking separately.
function freeze(on) {
  for (const anim of document.getAnimations()) {
    try {
      on ? anim.pause() : anim.play();
    } catch {
      /* a finished animation cannot be paused; nothing to do */
    }
  }
  for (const film of document.querySelectorAll("video")) {
    if (on) film.pause();
    else film.play().catch(() => {});
  }
}

/* ---- edit mode ---- */

function setEditing(on) {
  editing = on;
  ui.edit.classList.toggle("is-on", on);
  ui.edit.textContent = on ? "Editing" : "Edit";

  if (on) {
    root.setAttribute("data-dev-edit", "");
    markTargets(here.act);
  } else {
    root.removeAttribute("data-dev-edit");
    deselect();
  }
  paintParts();
}

// One row per selectable box, so anything sitting under a bigger layer can
// still be reached by name.
function paintParts() {
  ui.parts.replaceChildren();
  if (!editing) {
    ui.parts.innerHTML = '<div class="dv__hint">Turn on Edit to list them.</div>';
    return;
  }

  const list = targets();
  if (!list.length) {
    ui.parts.innerHTML = '<div class="dv__hint">Nothing selectable here.</div>';
    return;
  }

  for (const part of list) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `dv__part${part.picked ? " is-on" : ""}`;
    btn.textContent = part.name;
    btn.addEventListener("click", () => {
      pick(part.el);
      paintParts();
    });
    ui.parts.append(btn);
  }
}

/* ---- readouts ---- */

function paintSelection(sel) {
  if (!sel) {
    ui.pickName.textContent = "nothing selected";
    ui.pickName.className = "dv__pickNone";
    for (const input of Object.values(ui.f)) {
      input.value = "";
      input.disabled = true;
    }
    paintOut();
    return;
  }

  ui.pickName.textContent = `${here.act} · ${here.label} · ${sel.name}`;
  ui.pickName.className = "dv__pickName";

  ui.f.x.value = sel.to.x;
  ui.f.y.value = sel.to.y;
  ui.f.w.value = sel.to.w;
  ui.f.h.value = sel.to.h;
  for (const input of Object.values(ui.f)) input.disabled = false;
  // Text sizes itself vertically; offering the number would only mislead.
  ui.f.h.disabled = Boolean(sel.to.freeH);

  paintOut();
}

// Edits are collected per step, so one export can carry work from several
// screens at once.
const book = new Map();

function paintOut() {
  const mine = edits();
  if (mine.length) book.set(`${here.act}|${here.label}`, { act: here.act, step: here.label, changes: mine });
  else book.delete(`${here.act}|${here.label}`);

  const all = [...book.values()];
  const n = all.reduce((sum, s) => sum + s.changes.length, 0);
  ui.count.textContent = n ? `(${n})` : "";
  ui.out.value = n
    ? JSON.stringify({ devEdits: all }, null, 2)
    : "";
}

async function copyOut() {
  if (!ui.out.value) return;
  try {
    await navigator.clipboard.writeText(ui.out.value);
    flash("Copied");
  } catch {
    // Clipboard can be refused; selecting it is the fallback.
    ui.out.select();
    flash("Press Ctrl+C");
  }
}

function flash(text) {
  const btn = ui.dv.querySelector('[data-dv="copy"]');
  const was = btn.textContent;
  btn.textContent = text;
  window.setTimeout(() => { btn.textContent = was; }, 1200);
}
