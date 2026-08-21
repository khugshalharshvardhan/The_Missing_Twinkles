// Closes the chapter. The mist comes up over the town, and once it is thick
// enough to hide the change, the counting game opens underneath it.
//
// The game is its own page — it keeps a different design frame (1882 x 1059,
// against the story's 1920 x 1080) and its own stylesheet, so merging the two
// documents would mean renaming a great deal on one side. The mist is what
// makes the page change invisible: game/ opens under the same two images and
// clears them once it has its art, so the player sees one continuous wipe.

import { playSfx, stopAudio } from "./audio.js";

const IMG = "assets/images/";

// `from=story` tells the game to open under the mist rather than on its
// title card, and to start itself.
const GAME_URL = "game/index.html?from=story";

const RISE = 1500; // must track --handoff-rise in css/handoff.css
const HOLD = 520; // sit in the thick of it before the page turns

let running = false;

export function playHandoff() {
  if (running) return;
  running = true;

  const host = document.getElementById("handoff");

  host.replaceChildren(
    mistLayer(`${IMG}bg_mist_full.jpg`, "handoff__wall"),
    mistLayer(`${IMG}mist_band.png`, "handoff__band")
  );

  // Let the browser see opacity 0 with the layers in place, so the fade has
  // something to run from.
  void host.offsetWidth;
  host.classList.add("is-active");

  playSfx({ id: "mist_rush", gain: 1 });

  // The story's soundtrack should not still be playing under the game.
  window.setTimeout(stopAudio, RISE);
  window.setTimeout(() => {
    location.href = GAME_URL;
  }, RISE + HOLD);
}

function mistLayer(src, className) {
  const img = document.createElement("img");

  img.className = className;
  img.src = src;
  img.alt = "";

  return img;
}
