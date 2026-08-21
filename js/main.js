// Entry point: fit the stage, preload the chapter, then hand control to the
// story player. When the chapter ends we raise `story:complete` — that is the
// seam the puzzle half of the game hooks into.

import { manifest } from "./data/scenes.js";
import { watchStage } from "./stage.js";
import { preload } from "./preload.js";
import { initStory, startStory, next, skip } from "./story.js";

const loader = document.getElementById("loader");
const loaderBar = document.getElementById("loader-bar");
const loaderNote = document.getElementById("loader-note");
const loaderCta = document.getElementById("loader-cta");
const endcard = document.getElementById("endcard");
const hud = document.getElementById("hud");

watchStage();

initStory({
  onComplete: () => {
    endcard.classList.add("is-active");
    document.dispatchEvent(new CustomEvent("story:complete"));
  }
});

preload(manifest, (ratio) => {
  loaderBar.style.width = `${Math.round(ratio * 100)}%`;
}).then(() => {
  loaderNote.textContent = "The lamps are lit — for now.";
  loaderCta.hidden = false;
  loaderCta.focus();
});

const actions = {
  begin: () => {
    loader.classList.remove("is-active");
    startStory();
  },
  next: () => next(),
  skip: () => skip(),
  replay: () => {
    endcard.classList.remove("is-active");
    startStory();
  }
};

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-action]");
  if (!trigger) return;

  actions[trigger.dataset.action]?.();
});

// Space / Enter / Right arrow advance the story, matching the tap target.
document.addEventListener("keydown", (event) => {
  if (!["Space", "Enter", "ArrowRight"].includes(event.code)) return;
  // Only while the story is on screen, so the loader and end-card buttons
  // keep their native keyboard behaviour.
  if (!hud.classList.contains("is-active")) return;

  event.preventDefault();
  next();
});
