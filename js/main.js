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
  artFor,
  commonArt,
  epilogue,
  levels,
  FRAME_W as GAME_W,
  FRAME_H as GAME_H
} from "./data/screens.js";
import { audioManifest } from "./data/audio.js";
import { watchStage, setFrame } from "./stage.js";
import { preload, release } from "./preload.js";
import { initStory, startStory, releaseStory } from "./story.js";
import { initGame, startGame, startEpilogue, releaseHold, armHold, currentLevel } from "./game.js";
import { initWalk, startWalk, endWalk, refitWalk } from "./walk.js";
import { initWarp, playWarp, WARP_HOLD_MS } from "./warp.js";
import { mark, fault, lastRun, watchFaults, deviceNote } from "./watch.js";
import { after, cancel } from "./clock.js";
import { layers as walkLayers, foreground as walkFore, cast as walkCast,
         guide as walkGuide, destinations, homeMode,
         SPARK_SHEET, HAND_OVER_MS, WALK_MS } from "./data/walk.js";
import {
  initAudio,
  loadAudio,
  unlockAudio,
  stopAudio,
  toggleMuted,
  isMuted
} from "./audio.js";

const loader = document.getElementById("loader");
const loaderBar = document.getElementById("loader-bar");
const loaderNote = document.getElementById("loader-note");
const loaderCta = document.getElementById("loader-cta");
const hud = document.getElementById("hud");
const soundBtn = document.getElementById("sound");

// Dev routes: ?act=game opens the second act directly, &beat=N picks the
// screen inside it and &level=N the round (0 = tutorial, 1 = glowberries).
const params = new URLSearchParams(location.search);
const straightToGame = params.get("act") === "game";
const jumpTo = params.get("beat");
const jumpLevel = Math.min(Math.max(Number(params.get("level") ?? 0) || 0, 0), levels.length - 1);

// Dev tooling for laying the chapter out. It is fetched only when the URL
// carries ?dev, so a normal run never loads or runs a byte of it — and
// deleting devtools/ plus this block removes it completely.
const devMode = params.has("dev");

watchStage({ onRefit: refitWalk });

// The context starts suspended, which is enough to decode the soundtrack while
// the loader runs; unlockAudio() resumes it on the first click.
watchFaults();
mark("boot", deviceNote());

// What the run before this one was doing when it stopped, or null. A device
// that kills the tab reloads it, so this is the only trace that survives.
const lastTrail = lastRun();

const hasAudio = initAudio();
paintSound();

initStory({ onComplete: handOver });

initWalk({ onArrive: arrive });
initWarp();

// Which round is playing — an index into `levels`. The chapter runs them in
// order: the story, the walk down the road to the clearing, the tutorial, and
// then the levels one after another, each handing over to the next in a warp
// (js/warp.js). The road is walked twice in the whole chapter — once out of
// the story, and once home at the end — which is what keeps it worth watching.
let chapter = straightToGame ? jumpLevel : 0;

initGame({
  onComplete: gameDone,
  // Arriving from the story, the first screen is built behind the mist and
  // waits — releaseHold() starts its reading clock once the mist has gone, so
  // none of that time is spent under a cover.
  hold: !straightToGame
});

// A round is done: warp to the next level's place — or, after the last lamp,
// they walk home: the same road in reverse, the whole rescued flock flying
// ahead of them, dissolving into the town with every light back on. Home keeps
// its walk. It is the end of the chapter rather than a join between two levels,
// and the flock flying ahead of them down it is the point of the scene.
let goingHome = false;

function gameDone() {
  mark("round:done", String(currentLevel()));
  // The ending just played out: the chapter closes back onto its own cover —
  // "The End", then the title screen, ready to be played again.
  if (currentLevel() === -1) {
    mark("chapter:done");
    resetToTitle();
    return;
  }
  // The game itself knows which round just finished. Reading it here (rather
  // than trusting the counter) makes a dev-menu jump into any level count as
  // "everything before it is done": finish it and the chapter carries on from
  // there.
  chapter = Math.max(chapter, currentLevel());
  if (chapter + 1 < levels.length) {
    chapter += 1;
    warpOn();
    return;
  }
  goingHome = true;
  // The road was let go of when the game began. Fetch it again — off the
  // cache, so this is usually instant — before walking it.
  ready(prefetchWalk()).then(() => enterWalk(destinations.home, homeMode));
}

/* ---- loading ---- */

// The story's art and the whole soundtrack gate the Begin button. The game's
// art is fetched in the background once the story is running, so the opening
// wait stays short and the hand-over has nothing left to wait for.
// One round at a time. The tutorial's art is what the hand-over needs; every
// round after it is fetched while the round before it is being played, so the
// device is never asked for two places at once.
const roundArt = new Map();

function prefetchRound(i) {
  const round = i === -1 ? epilogue : levels[i];
  if (!round) return Promise.resolve([]);
  if (!roundArt.has(i)) {
    roundArt.set(i, preload(
      i === 0 ? [...commonArt, ...artFor(round)] : artFor(round),
      undefined,
      `round:${i}`
    ));
  }
  return roundArt.get(i);
}

// A place that has been left behind. Dropping the memo as well as the hold
// means coming back to it fetches again — off the cache, in practice — rather
// than trusting art nothing is holding on to any more.
function dropRound(i) {
  roundArt.delete(i);
  release(`round:${i}`);
}

// Wait for the art, but never for ever. A connection that has died must not
// leave a child looking at a frozen screen: the round starts anyway, and the
// pictures arrive into it. Every working connection is far inside this.
const ART_WAIT = 12000;

function ready(art) {
  return Promise.race([art, new Promise((go) => after(go, ART_WAIT))]);
}

function prefetchGame() {
  return prefetchRound(0);
}

// Everything the walk puts on screen. Fetched alongside the game's art, since
// the two run back to back. Every destination's painting and guide are in the
// list — the walk to level 1 starts the moment the tutorial ends, so its art
// cannot wait to be fetched then.
const walkManifest = [
  ...new Set([
    ...[...walkLayers, ...walkFore, ...walkCast, walkGuide]
      .map((l) => l.src)
      .filter(Boolean),
    ...Object.values(destinations).flatMap((d) => [d.arrive, d.guide.src]),
    // Not a layer — the sheet the drifting fireflies are cut from.
    SPARK_SHEET
  ])
];

let walkArt = null;

function prefetchWalk() {
  walkArt ??= preload(walkManifest, undefined, "walk");
  return walkArt;
}

// Going straight to act two, its art is needed up front instead.
// Going straight to a level, its art is in `upFront` already, so the round
// fetch has nothing left to do.
const upFront = straightToGame ? [...manifest, ...gameManifest] : manifest;
if (straightToGame) roundArt.set(jumpLevel, Promise.resolve([]));

// Images and clips share one bar, weighted by file count.
const total = upFront.length + (hasAudio ? audioManifest.length : 0);
let done = 0;

function step() {
  done += 1;
  loaderBar.style.width = `${Math.round((done / total) * 100)}%`;
}

Promise.all([
  preload(upFront, step, "story"),
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
  mark("loader:ready");
  // If the run before this one stopped somewhere, say where — on a phone that
  // killed the tab, this is the only trace of it that survives.
  showLastRun();
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
    preload(gameManifest);
  }
});

// Back to the cover, everything wound down: the next press of Play runs the
// whole chapter again from the top. The loader kept its is-ready state from
// boot, so the button is already waiting on it.
// Everything the story was holding, put down.
//
// A device holds every image the document still points at as width x height x
// four bytes, whatever the file compressed to. The story's pages came to about
// forty megabytes and the cover to eight, and none of it is on screen once the
// chapter has moved on — but the walk is about to ask for a dozen more images,
// and on a phone that sum is the difference between running and having the tab
// killed and reloaded. startStory() builds it all again from the data, and
// resetToTitle() puts the cover back for the title screen it belongs to.
function leaveStory() {
  releaseStory();
  // releaseStory() unmounts the pages; this lets go of the pictures behind
  // them, which is the half that the preloader was still holding.
  release("story");
  loader.classList.add("is-spent");
}

// What the run before this one was doing when it stopped. A device that kills
// the tab reloads it, so this is the only place the reason can surface.
// The road killed the last run. On a device that cannot hold the walk this is
// the only thing standing between a child and the game, and it is a scene they
// have already seen once by the time it matters — so the chapter goes straight
// on instead, rather than dying in the same place every time.
function walkIsUnsafe() {
  const last = lastTrail?.[lastTrail.length - 1] ?? "";
  // Only a trail that STOPS inside the walk. A tab closed or navigated away
  // from ends in pagehide wherever it was, and that is not the road's fault —
  // counting it would take the walk away from a device that was fine.
  return last.includes("walk:") && !last.includes("walk:arrive");
}

function showLastRun() {
  const trail = lastTrail;
  if (!trail) return;

  loaderNote.textContent = `stopped at ${trail[trail.length - 1]}`;
  loaderNote.title = trail.join("\n");
  loaderNote.classList.add("is-report");
  console.warn("the run before this one:\n" + trail.join("\n"));
}

function resetToTitle() {
  loader.classList.remove("is-spent");
  goingHome = false;
  chapter = 0;
  stopAudio();
  endWalk();
  hud.classList.remove("is-active", "is-waiting", "has-prev", "has-prev-off");
  document.body.dataset.act = "story";
  setFrame(STORY_W, STORY_H);
  loader.classList.add("is-active");
}

/* ---- the hand-over ---- */

// Story, then the walk down the path, then the game. Both changes are plain
// cross-fades: the outgoing act stays on screen at falling opacity while the
// incoming one comes up, which is why neither needs a cover over it.
async function handOver() {
  mark("story:done");
  // Still raised for anything outside the chapter that wants to know.
  document.dispatchEvent(new CustomEvent("story:complete"));

  // The road is the heaviest thing in the chapter. If it took the last run
  // down, do not ask this device for it again — go straight to the clearing.
  if (walkIsUnsafe()) {
    mark("walk:skipped");
    await prefetchGame();
    armHold();
    enterGame();
    after(releaseHold, 600);
    return;
  }

  await Promise.all([prefetchWalk(), prefetchGame()]);
  mark("art:ready");
  enterWalk(destinations[levels[chapter].walkTo]);
}

// Level to level. The next round is built inside the glare — held, like every
// other arrival, so its first line does not start under the light — and begins
// as the light draws off it.
async function warpOn() {
  armHold();
  // The next place is fetched a beat into the round before this one, so by now
  // it is almost always already here and this waits for nothing. Almost
  // always is not always — a slow connection would otherwise land them in a
  // room with no walls and Agni talking — so the warp does not begin until the
  // art has arrived, or ART_WAIT has passed.
  await ready(prefetchRound(chapter));
  mark("warp:art-ready", String(chapter));
  playWarp(() => enterGame());
  after(releaseHold, WARP_HOLD_MS);
}

// If the road does not deliver them, the chapter goes on without it. A stalled
// frame loop — a tab throttled in the background, a device that cannot keep up
// — used to leave a child looking at a still picture with nothing to press.
let walkGuard = 0;

function enterWalk(dest, mode = null) {
  mark("walk:enter", dest?.key ?? "");
  cancel(walkGuard);
  walkGuard = after(() => {
    mark("walk:guard");
    arrive();
  }, (mode?.walkMs ?? WALK_MS) + 4000);
  leaveStory();
  document.body.dataset.act = "walk";
  // The walk borrows the game's frame, so arriving is a cross-fade, not a cut.
  setFrame(GAME_W, GAME_H);
  hud.classList.remove("is-waiting");
  hud.classList.add("is-active");
  startWalk(dest, mode);
}

// They have arrived: bring the game up underneath and fade the path out over it.
// Every arrival holds the first beat until the hand-over is done — the walk to
// level 1 needs the same grace the story's did.
function arrive() {
  // Whichever gets here first — the walk finishing or the guard — the other
  // must not fire too.
  cancel(walkGuard);
  walkGuard = 0;
  mark("walk:arrive");
  if (document.body.dataset.act !== "walk") return;
  // Home: the walk dissolved into the celebration painting the first end
  // screen stands on, so the ending begins exactly like any other arrival —
  // built under the fade, held until it is done.
  if (goingHome) {
    armHold();
    document.body.dataset.act = "game";
    setFrame(GAME_W, GAME_H);
    hud.classList.remove("is-waiting");
    startEpilogue();
    endWalk();
    after(releaseHold, HAND_OVER_MS);
    return;
  }
  armHold();
  enterGame();
  endWalk();
  after(releaseHold, HAND_OVER_MS);
}

function enterGame(at = 0) {
  mark("game:enter", String(chapter));
  // The places behind this one, put down: their pictures were held so that
  // nothing could be evicted out from under them while they were on screen,
  // and that reason has gone. The road too — it is the heaviest thing in the
  // chapter and is not walked again until the very end.
  for (const i of [...roundArt.keys()]) if (i !== chapter && i !== -1) dropRound(i);
  if (!goingHome) {
    walkArt = null;
    release("walk");
  }
  // The next place, fetched while this one is being played. By the time the
  // warp hands over, it is already here.
  after(() => {
    prefetchRound(chapter + 1 < levels.length ? chapter + 1 : -1);
  }, 1500);
  leaveStory();
  document.body.dataset.act = "game";
  // The game was drawn at its own size; the stage takes that frame on. Coming
  // from the walk this is already the frame, so nothing moves.
  setFrame(GAME_W, GAME_H);
  hud.classList.remove("is-waiting");
  startGame(at, chapter);
}

async function enterStory() {
  await ready(preload(manifest, undefined, "story"));
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
  if (act !== "story") leaveStory();
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
    mark("begin");
    unlockAudio();
    goFullscreen();
    loader.classList.remove("is-active");

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
        setAct: devSetAct,
        // A dev jump says where the chapter now is, so walks arrive into the
        // right level and the walk-home row ends on the card.
        setChapter: (i, home = false) => {
          chapter = Math.min(Math.max(i, 0), levels.length - 1);
          goingHome = Boolean(home);
        },
        // Play the hand-over itself, from wherever the menu has left us: it
        // warps on to the next round, wrapping back to the tutorial after the
        // last one so the row can be pressed again.
        warp: () => {
          if (document.body.dataset.act !== "game") devSetAct("game");
          chapter = (Math.max(chapter, currentLevel()) + 1) % levels.length;
          warpOn();
        }
      }))
    .catch((err) => console.warn("dev tools failed to load", err));
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-action]");
  if (!trigger) return;

  actions[trigger.dataset.action]?.();
});

// No page-turn keys either. They existed to match the two buttons, and with
// the buttons gone a key that turned a page would be a control nothing on
// screen offers — and would let a keyboard run ahead of the voice. The loader
// and end-card buttons keep their own native keyboard behaviour.
