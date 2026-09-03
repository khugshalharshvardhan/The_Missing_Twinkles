// The warp: how one level hands over to the next.
//
// The road between the locations is walked once out of the story and once home
// again, and that is where it earns its keep. Walking it after every level made
// the same six seconds of parallax the price of finishing a round, so from the
// tutorial on the hand-over is this instead: the road without the walking.
//
// The place they have just finished slides away to the left and the next one
// arrives behind it — the same direction they have travelled all chapter — and
// where the two meet, a line of the light they have been collecting runs down
// the join and throws sparks off it.
//
// The scene that leaves is the real one: the live pane is cloned before the
// swap, so the game is free to empty its panes and build the next round while
// both places are on screen. The clone is put INSIDE #game, which matters —
// every rule that styles a screen is scoped to #game, so a clone anywhere else
// loses its layout entirely and its speech balloon fills the frame.
//
// Timings here and in css/warp.css are one clock. Change one, change both.

import { playCues } from "./audio.js";
import { cues } from "./data/audio.js";

// The whole hand-over. The next round is built at the top of it, behind the
// place that is still leaving, and held until it has arrived.
const WARP_MS = 1050;

// Sparks off the seam.
const SPARKS = 22;

// A stable pseudo-random: same index, same answer, every run — the same one
// js/story.js uses. Math.random would throw the sparks differently on every
// replay, which for a hand-placed effect reads as a fault rather than variety.
function noise(i, k) {
  const n = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

let game = null;
let running = null;

export function initWarp() {
  game = document.getElementById("game");
}

// One spark thrown off the seam: where on it, how big, how long it lives, and
// which way it drifts once it is off.
function spark(i) {
  const el = document.createElement("i");
  el.className = "warp__spark";

  el.style.setProperty("--x", `${((noise(i, 1) - 0.5) * 46).toFixed(0)}px`);
  el.style.setProperty("--y", `${noise(i, 2) * 100}%`);
  el.style.setProperty("--size", `${(9 + noise(i, 3) * 22).toFixed(1)}px`);

  // They fall behind the seam, which is travelling left — so they drift right
  // relative to it — and scatter a little up or down as they go.
  el.style.setProperty("--dx", `${(70 + noise(i, 4) * 210).toFixed(0)}px`);
  el.style.setProperty("--dy", `${((noise(i, 5) - 0.5) * 130).toFixed(0)}px`);

  el.style.setProperty("--delay", `${Math.round(noise(i, 6) * 620)}ms`);
  el.style.setProperty("--life", `${Math.round(420 + noise(i, 7) * 380)}ms`);

  return el;
}

// Hand over. `swap` builds the next round, and is called at the top — behind
// the place that is still on its way out. Resolves once the new one has landed.
export function playWarp(swap) {
  if (!game) return Promise.resolve(swap?.());
  // A second call while one is running would restart the travel under the
  // player; let the first one finish.
  if (running) return running;

  // The scene they are leaving, kept exactly as it stands. Cloned before the
  // swap, because the swap empties the panes it was built in.
  const live = game.querySelector(".scene.is-active");
  const away = document.createElement("div");
  away.className = "warp";
  if (live) {
    const copy = live.cloneNode(true);
    copy.classList.remove("is-active");
    // The clone is scenery now, not a screen: nothing on it is to be tapped,
    // and its own fade-in must not replay under the hand-over.
    copy.style.opacity = "1";
    copy.style.transition = "none";
    copy.style.pointerEvents = "none";
    away.append(copy);
  }

  const dim = document.createElement("i");
  dim.className = "warp__dim";

  const seam = document.createElement("i");
  seam.className = "warp__seam";
  for (let i = 0; i < SPARKS; i++) seam.append(spark(i));

  away.append(dim, seam);
  game.append(away);
  game.style.setProperty("--warp-ms", `${WARP_MS}ms`);

  // Build the next round now, under the cover of the place still leaving, so
  // it is ready to travel in rather than appearing when it gets here.
  swap?.();

  running = new Promise((resolve) => {
    // One frame, so the clone and the new round start their travel together.
    requestAnimationFrame(() => {
      game.classList.add("is-warping");
      playCues(cues.warp);

      window.setTimeout(() => {
        game.classList.remove("is-warping");
        away.remove();
        running = null;
        resolve();
      }, WARP_MS);
    });
  });

  return running;
}

// How long the new level is held before it plays: the whole trip, so its first
// line starts once it has arrived rather than while it is still moving.
export const WARP_HOLD_MS = WARP_MS;
