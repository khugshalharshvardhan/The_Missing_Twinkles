// The mist that carries the chapter from the story into the counting game.
//
// This used to be a page change, which is exactly what made the two halves
// feel like two products: the browser tore down the document, so the ambience
// stopped dead, the audio context needed a fresh gesture to unlock, the stage
// was rebuilt and every image was fetched again. The mist hid the seam but
// could not hide the hitch.
//
// Now both acts live in one document (see index.html) and the mist covers a
// swap of body[data-act] instead. Nothing reloads: the same AudioContext, the
// same stage and the same decoded art carry straight through, so the bed the
// story ends on is still playing under the game's first screen.

import { playSfx } from "./audio.js";

const IMG = "assets/images/";

const host = document.getElementById("handoff");

// must track --handoff-rise in css/handoff.css
export const RISE = 1500;
const THICK = 420; // sit in the thick of it while the acts change underneath

// Resolves once the mist is opaque enough to work behind.
export function closeMist() {
  host.replaceChildren(
    mistLayer(`${IMG}bg_mist_full.jpg`, "handoff__wall"),
    mistLayer(`${IMG}mist_band.png`, "handoff__band")
  );

  // Let the browser see opacity 0 with the layers in place, so the fade has
  // something to run from.
  void host.offsetWidth;
  host.classList.add("is-active");

  playSfx({ id: "mist_rush", gain: 1 });

  return new Promise((resolve) => window.setTimeout(resolve, RISE + THICK));
}

export function openMist() {
  host.classList.remove("is-active");
  // Take the cover out of the page once it has faded, so a stalled transition
  // can never leave a dead full-screen layer over the game.
  window.setTimeout(() => {
    if (!host.classList.contains("is-active")) host.replaceChildren();
  }, RISE);
}

function mistLayer(src, className) {
  const img = document.createElement("img");

  img.className = className;
  img.src = src;
  img.alt = "";

  return img;
}
