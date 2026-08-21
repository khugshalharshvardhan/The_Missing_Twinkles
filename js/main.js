// Entry point: fit the stage, preload the chapter, then hand control to the
// story player. When the chapter ends we raise `story:complete` — that is the
// seam the puzzle half of the game hooks into.

import { manifest } from "./data/scenes.js";
import { audioManifest, UI_ADVANCE } from "./data/audio.js";
import { watchStage } from "./stage.js";
import { preload } from "./preload.js";
import { initStory, startStory, advance, skip } from "./story.js";
import { initAudio, loadAudio, unlockAudio, playUi, toggleMuted, isMuted, stopAudio } from "./audio.js";

const loader = document.getElementById("loader");
const loaderBar = document.getElementById("loader-bar");
const loaderNote = document.getElementById("loader-note");
const loaderCta = document.getElementById("loader-cta");
const endcard = document.getElementById("endcard");
const hud = document.getElementById("hud");
const soundBtn = document.getElementById("sound");

watchStage();

// The context starts suspended, which is enough to decode the soundtrack while
// the loader runs; unlockAudio() resumes it on the first click.
const hasAudio = initAudio();
paintSound();

initStory({
  onComplete: () => {
    endcard.classList.add("is-active");
    document.dispatchEvent(new CustomEvent("story:complete"));
  }
});

/* ---- loading ---- */

// Images and clips share one bar, weighted by file count.
const total = manifest.length + (hasAudio ? audioManifest.length : 0);
let done = 0;

function step() {
  done += 1;
  loaderBar.style.width = `${Math.round((done / total) * 100)}%`;
}

Promise.all([
  preload(manifest, step),
  hasAudio ? loadAudio(audioManifest, step) : Promise.resolve()
]).then(() => {
  loaderBar.style.width = "100%";
  loaderNote.textContent = "The lamps are lit — for now.";
  loaderCta.hidden = false;
  loaderCta.focus();
});

/* ---- actions ---- */

const actions = {
  begin: () => {
    unlockAudio();
    loader.classList.remove("is-active");
    startStory();
  },
  // Only click back if the tap actually turned the page — a mid-page tap does
  // nothing, and a sound would suggest otherwise.
  next: () => {
    if (advance()) playUi(UI_ADVANCE, 0.5);
  },
  skip: () => {
    playUi(UI_ADVANCE, 0.5);
    stopAudio();
    skip();
  },
  replay: () => {
    unlockAudio();
    endcard.classList.remove("is-active");
    startStory();
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

// Space / Enter / Right arrow advance the story, matching the tap target.
document.addEventListener("keydown", (event) => {
  if (!["Space", "Enter", "ArrowRight"].includes(event.code)) return;
  // Only where the chevron is showing, so the keys match the tap target and
  // the loader and end-card buttons keep their native keyboard behaviour.
  if (!hud.classList.contains("is-waiting")) return;

  event.preventDefault();
  actions.next();
});
