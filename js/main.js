// Entry point for the chapter.
//
// One document, two acts. The story reads, the mist closes over the town, and
// the counting game opens underneath the same cover — no navigation, so the
// audio context, the stage and every decoded image carry straight through.
// js/handoff.js has the detail on why that matters.

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
import { closeMist, openMist, RISE as MIST_FADE } from "./handoff.js";
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

watchStage();

// The context starts suspended, which is enough to decode the soundtrack while
// the loader runs; unlockAudio() resumes it on the first click.
const hasAudio = initAudio();
paintSound();

initStory({ onComplete: handOver });

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
    ? "The light keepers are waiting."
    : "The lamps are lit — for now.";
  loaderCta.textContent = straightToGame ? "Start the game" : "Begin";
  loaderCta.hidden = false;
  loaderCta.focus();
});

/* ---- the hand-over ---- */

// Story to game, behind one continuous wipe.
async function handOver() {
  // Still raised for anything outside the chapter that wants to know.
  document.dispatchEvent(new CustomEvent("story:complete"));

  await closeMist(); // the town goes under the mist
  await prefetchGame(); // normally long since resolved
  enterGame();
  openMist(); // the mist clears onto the game

  window.setTimeout(releaseHold, MIST_FADE);
}

function enterGame(at = 0) {
  document.body.dataset.act = "game";
  // The game was drawn at its own size; the stage takes that frame on.
  setFrame(GAME_W, GAME_H);
  hud.classList.remove("is-waiting");
  startGame(at);
}

function enterStory() {
  document.body.dataset.act = "story";
  setFrame(STORY_W, STORY_H);
  startStory();
  prefetchGame();
}

/* ---- actions ---- */

const actions = {
  begin: () => {
    unlockAudio();
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
    if (document.body.dataset.act === "game") skipGame();
    else skipStory();
  },
  replay: () => {
    unlockAudio();
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
