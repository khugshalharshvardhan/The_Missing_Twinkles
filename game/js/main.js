// Entry point: fit the stage, preload the art, then hand control to the game
// player. Kept separate from the story half for now — the two only meet on the
// home screen.

import { manifest } from "./data/screens.js";
import { watchStage } from "./stage.js";
import { preload } from "./preload.js";
import { initGame, startGame } from "./game.js";

const loader = document.getElementById("loader");
const loaderBar = document.getElementById("loader-bar");
const loaderNote = document.getElementById("loader-note");
const loaderCta = document.getElementById("loader-cta");
const endcard = document.getElementById("endcard");

watchStage();

// Dev shortcuts: ?beat=9 opens straight on that beat, and &hold stops dialogue
// advancing on its own so a single screen can be looked at properly.
const params = new URLSearchParams(location.search);
const jumpTo = params.get("beat");

initGame({
  onComplete: () => endcard.classList.add("is-active"),
  hold: params.has("hold")
});

// Arriving straight from the story: no title card, the mist is the only cover.
const mist = document.getElementById("mist");
const fromStory = document.documentElement.classList.contains("from-story");
const MIST_FADE = 900; // must track .mist's opacity transition in css/game.css

if (fromStory) {
  // The same two images the story closes on, so the wipe reads as one move.
  mist.append(
    mistLayer("../assets/images/bg_mist_full.jpg", "mist__wall"),
    mistLayer("../assets/images/mist_band.png", "mist__band")
  );
} else {
  // Nothing to cover — drop it rather than leave a dead full-screen layer.
  mist.remove();
}

function mistLayer(src, className) {
  const img = document.createElement("img");
  img.className = className;
  img.src = src;
  img.alt = "";
  return img;
}

preload(manifest, (ratio) => {
  loaderBar.style.width = `${Math.round(ratio * 100)}%`;
}).then(() => {
  if (fromStory) {
    loader.classList.remove("is-active");

    // startGame() paints the first beat and starts its clock together, so lift
    // the mist in the same turn — waiting on a frame callback here would risk
    // the opening lines playing out behind the cover.
    startGame();
    document.documentElement.classList.remove("from-story");

    // Take the cover out of the page for good, so a stalled transition can
    // never leave it sitting over the game.
    window.setTimeout(() => mist.remove(), MIST_FADE + 200);
    return;
  }

  if (jumpTo !== null) {
    loader.classList.remove("is-active");
    startGame(Number(jumpTo));
    return;
  }

  loaderNote.textContent = "The light keepers are waiting.";
  loaderCta.hidden = false;
  loaderCta.focus();
});

const actions = {
  begin: () => {
    loader.classList.remove("is-active");
    startGame();
  },
  replay: () => {
    endcard.classList.remove("is-active");
    startGame();
  }
};

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-action]");
  if (!trigger) return;

  actions[trigger.dataset.action]?.();
});
