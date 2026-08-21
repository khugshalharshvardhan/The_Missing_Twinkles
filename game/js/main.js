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

preload(manifest, (ratio) => {
  loaderBar.style.width = `${Math.round(ratio * 100)}%`;
}).then(() => {
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
