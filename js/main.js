// Entry point for the chapter.
//
// One document, three acts: the story reads, the pair walk down the path, and
// the counting game opens at the end of it. Nothing navigates, so the audio
// context, the stage and every decoded image carry straight through — which is
// what makes the three read as one thing rather than three.
//
// Every change between acts is a cross-fade. The stage frame does change from
// the story's 1920x1080 to the game's 1882x1059, but that is a 2% resize
// happening underneath a fade, so it is not something you can see.

import { manifest, FRAME_W as STORY_W, FRAME_H as STORY_H } from "./data/scenes.js";
import {
  manifest as gameManifest,
  FRAME_W as GAME_W,
  FRAME_H as GAME_H
} from "./data/screens.js";
import { audioManifest, UI_ADVANCE } from "./data/audio.js";
import { watchStage, setFrame } from "./stage.js";
import { preload } from "./preload.js";
import { initStory, startStory, advance, skip as skipStory } from "./story.js";
import { initGame, startGame, skipGame, releaseHold } from "./game.js";
import { initWalk, startWalk, endWalk } from "./walk.js";
import { layers as walkLayers, foreground as walkFore, cast as walkCast,
         guide as walkGuide, SPARK_SHEET, HAND_OVER_MS } from "./data/walk.js";
import {
  initAudio,
  loadAudio,
  unlockAudio,
  playUi,
  toggleMuted,
  isMuted
} from "./audio.js";

const loader = document.getElementById("loader");
const loaderBar = document.getElementById("loader-bar");
const loaderNote = document.getElementById("loader-note");
const loaderCta = document.getElementById("loader-cta");
const endcard = document.getElementById("endcard");
const hud = document.getElementById("hud");
const soundBtn = document.getElementById("sound");

// Dev routes: ?act=game opens the second act directly, and &beat=N picks the
// screen inside it.
const params = new URLSearchParams(location.search);
const straightToGame = params.get("act") === "game";
const jumpTo = params.get("beat");

// Dev tooling for laying the chapter out. It is fetched only when the URL
// carries ?dev, so a normal run never loads or runs a byte of it — and
// deleting devtools/ plus this block removes it completely.
const devMode = params.has("dev");

watchStage();

// The context starts suspended, which is enough to decode the soundtrack while
// the loader runs; unlockAudio() resumes it on the first click.
const hasAudio = initAudio();
paintSound();

initStory({ onComplete: handOver });

initWalk({ onArrive: arrive });

initGame({
  onComplete: () => endcard.classList.add("is-active"),
  // Arriving from the story, the first screen is built behind the mist and
  // waits — releaseHold() starts its reading clock once the mist has gone, so
  // none of that time is spent under a cover.
  hold: !straightToGame
});

/* ---- loading ---- */

// The story's art and the whole soundtrack gate the Begin button. The game's
// art is fetched in the background once the story is running, so the opening
// wait stays short and the hand-over has nothing left to wait for.
let gameArt = null;

function prefetchGame() {
  gameArt ??= preload(gameManifest);
  return gameArt;
}

// Everything the walk puts on screen. Fetched alongside the game's art, since
// the two run back to back.
const walkManifest = [
  ...new Set([
    ...[...walkLayers, ...walkFore, ...walkCast, walkGuide]
      .map((l) => l.src)
      .filter(Boolean),
    // Not a layer — the sheet the drifting fireflies are cut from.
    SPARK_SHEET
  ])
];

let walkArt = null;

function prefetchWalk() {
  walkArt ??= preload(walkManifest);
  return walkArt;
}

// Going straight to act two, its art is needed up front instead.
const upFront = straightToGame ? [...manifest, ...gameManifest] : manifest;
if (straightToGame) gameArt = Promise.resolve([]);

// Images and clips share one bar, weighted by file count.
const total = upFront.length + (hasAudio ? audioManifest.length : 0);
let done = 0;

function step() {
  done += 1;
  loaderBar.style.width = `${Math.round((done / total) * 100)}%`;
}

Promise.all([
  preload(upFront, step),
  hasAudio ? loadAudio(audioManifest, step) : Promise.resolve()
]).then(() => {
  loaderBar.style.width = "100%";
  loaderNote.textContent = straightToGame
    ? "The twinkles are waiting."
    : "The lamps are lit — for now.";
  // The button is an icon, so there is no label to swap; `is-ready` takes the
  // bar and the note off and leaves the cover with one thing to press.
  loader.classList.add("is-ready");
  loaderCta.hidden = false;
  // Deliberately not focused. Chrome treats a programmatic focus as
  // focus-visible, so auto-focusing drew the focus ring as a bright circle
  // around the button for everyone, not just keyboard users. It is the only
  // control on the cover, so Tab reaches it immediately and the ring shows then,
  // which is when it is actually wanted.

  // The tools pick the moment to show, so skip straight past the title card,
  // and fetch the game's art now since any screen is one click away.
  if (devMode) {
    loader.classList.remove("is-active");
    prefetchWalk();
    prefetchGame();
  }
});

/* ---- the hand-over ---- */

// Story, then the walk down the path, then the game. Both changes are plain
// cross-fades: the outgoing act stays on screen at falling opacity while the
// incoming one comes up, which is why neither needs a cover over it.
async function handOver() {
  // Still raised for anything outside the chapter that wants to know.
  document.dispatchEvent(new CustomEvent("story:complete"));

  await Promise.all([prefetchWalk(), prefetchGame()]);
  enterWalk();
}

function enterWalk() {
  document.body.dataset.act = "walk";
  // The walk borrows the game's frame, so arriving is a cross-fade, not a cut.
  setFrame(GAME_W, GAME_H);
  hud.classList.remove("is-waiting");
  hud.classList.add("is-active");
  startWalk();
}

// They have arrived: bring the game up underneath and fade the path out over it.
function arrive() {
  enterGame();
  endWalk();
  window.setTimeout(releaseHold, HAND_OVER_MS);
}

function enterGame(at = 0) {
  document.body.dataset.act = "game";
  // The game was drawn at its own size; the stage takes that frame on. Coming
  // from the walk this is already the frame, so nothing moves.
  setFrame(GAME_W, GAME_H);
  hud.classList.remove("is-waiting");
  startGame(at);
}

function enterStory() {
  document.body.dataset.act = "story";
  setFrame(STORY_W, STORY_H);
  endWalk();
  startStory();
  prefetchWalk();
  prefetchGame();
}

// Dev only: put an act on stage without starting it playing. The tools pick
// the moment themselves, so kicking off a run first would only be undone.
function devSetAct(act) {
  // The walk is drawn in the game's frame, not the story's — see js/data/walk.js.
  const wide = act === "game" || act === "walk";
  document.body.dataset.act = act;
  setFrame(wide ? GAME_W : STORY_W, wide ? GAME_H : STORY_H);
  hud.classList.add("is-active");
  hud.classList.remove("is-waiting");
}

/* ---- full screen ---- */

// Asked for from the click that starts the chapter, because that is the only
// time a browser will grant it. Prefixed spellings are still what Safari
// answers to, and the promise rejects rather than throws when the user or the
// platform says no — a phone browser that only allows it on video, an iframe
// without the permission — so both paths are swallowed. Nothing about the
// chapter depends on it: the stage letterboxes itself either way.
function goFullscreen() {
  const el = document.documentElement;
  const ask =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.msRequestFullscreen;
  if (!ask || document.fullscreenElement) return;

  try {
    const r = ask.call(el, { navigationUI: "hide" });
    if (r && typeof r.catch === "function") r.catch(() => {});
  } catch {
    /* not permitted here — the chapter plays windowed */
  }
}

/* ---- actions ---- */

const actions = {
  begin: () => {
    unlockAudio();
    goFullscreen();
    loader.classList.remove("is-active");

    if (straightToGame) {
      enterGame(jumpTo === null ? 0 : Number(jumpTo));
      return;
    }
    enterStory();
  },
  // Only click back if the tap actually turned the page — a mid-page tap does
  // nothing, and a sound would suggest otherwise.
  next: () => {
    if (advance()) playUi(UI_ADVANCE, 0.5);
  },
  // Skip leaves the act you are in. Skipping the story still hands over to the
  // game: it is one chapter, not two things to opt out of separately.
  skip: () => {
    playUi(UI_ADVANCE, 0.5);
    const act = document.body.dataset.act;
    if (act === "game") skipGame();
    else if (act === "walk") arrive();
    else skipStory();
  },
  replay: () => {
    unlockAudio();
    // Same as play: if they left full screen between chapters, go back in.
    goFullscreen();
    endcard.classList.remove("is-active");

    if (straightToGame) {
      enterGame(jumpTo === null ? 0 : Number(jumpTo));
      return;
    }
    enterStory();
  },
  sound: () => {
    unlockAudio();
    toggleMuted();
    paintSound();
  }
};

function paintSound() {
  const off = hasAudio ? isMuted() : true;
  soundBtn.classList.toggle("is-off", off);
  soundBtn.setAttribute("aria-pressed", String(!off));
  soundBtn.setAttribute("aria-label", off ? "Turn sound on" : "Turn sound off");
  soundBtn.disabled = !hasAudio;
}

if (devMode) {
  import("../devtools/devtools.js")
    .then(({ initDevTools }) =>
      initDevTools({
        act: () => document.body.dataset.act,
        setAct: devSetAct
      }))
    .catch((err) => console.warn("dev tools failed to load", err));
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-action]");
  if (!trigger) return;

  actions[trigger.dataset.action]?.();
});

// Space / Enter / Right arrow turn a story page, matching the tap target. The
// game's own beats read themselves, so there is nothing to advance there.
document.addEventListener("keydown", (event) => {
  if (!["Space", "Enter", "ArrowRight"].includes(event.code)) return;
  // Only where the chevron is showing, so the keys match the tap target and
  // the loader and end-card buttons keep their native keyboard behaviour.
  if (!hud.classList.contains("is-waiting")) return;

  event.preventDefault();
  actions.next();
});
