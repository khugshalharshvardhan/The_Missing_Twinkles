// Web Audio mixer for the story: three buses (music / sfx / vo) under a
// master, so a beat can duck the ambience under a line without touching
// anything else.
//
// Cues are scheduled on the AudioContext clock rather than with setTimeout,
// so a POP! lands where the animation says it should even if the main thread
// is busy painting. Everything a beat schedules is tracked so advancing early
// can cancel what hasn't sounded yet.

import { clipUrl } from "./data/audio.js";
import { after } from "./clock.js";

const STORE_KEY = "mystry.muted";

// Measured, not guessed: bed_main is a mastered track at -17.0 LUFS and the
// voice lines sit at about -16.5, so at this bus gain the music plays roughly
// 7 dB under the dialogue — present, never competing.
const BUS_GAIN = { music: 0.45, sfx: 0.85, vo: 1 };
// While a line plays, the music drops another ~7 dB. The old value here was
// tuned for quiet ambience and against a real music bed it left nothing at all.
const DUCK_TO = 0.45;
const DUCK_TAIL = 0.35;   // seconds to hold the duck after the line ends
const BED_FADE = 1.4;

let ctx = null;
let master = null;
const buses = {};
const buffers = new Map();
// Sources scheduled for the current beat, each with the window it sounds in so
// a beat change can tell what is mid-sentence from what has not started.
let live = [];
let bed = null;           // { id, el, gain } — the one playing now
// One media element per bed, kept so a track that comes back does not have to
// be fetched again. They are NOT decoded into memory: a bed runs for minutes
// and decoding one costs about fifteen megabytes for every minute of it, which
// on a phone is most of the budget the artwork also needs.
const beds = new Map();
let muted = false;
// A multiplier on the music bus that beats can set, so one continuous track can
// still fall away for the lights-out and come back with the fireflies. Ducking
// works against this rather than the bus constant, so a line heard during a dip
// does not pull the music back up afterwards.
let musicLevel = 1;

const musicBase = () => BUS_GAIN.music * musicLevel;

/* ---- setup ---- */

export function initAudio() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return false;

  // Allowed before a gesture; it just starts out suspended, which still lets
  // us decode the whole soundtrack while the loader runs.
  ctx = new Ctor();
  master = ctx.createGain();
  master.connect(ctx.destination);

  for (const [name, gain] of Object.entries(BUS_GAIN)) {
    buses[name] = ctx.createGain();
    buses[name].gain.value = gain;
    buses[name].connect(master);
  }

  try {
    muted = localStorage.getItem(STORE_KEY) === "1";
  } catch {
    muted = false;
  }
  master.gain.value = muted ? 0 : 1;

  return true;
}

// Browsers only let audio start from a user gesture.
export function unlockAudio() {
  // Not while the chapter is paused: a tap anywhere would otherwise start the
  // sound again under a frozen picture.
  if (paused) return;
  if (ctx && ctx.state !== "running") ctx.resume().catch(() => {});
}

// Stop the sound where it is, and start it again from there.
//
// The whole soundtrack is scheduled against the AudioContext's own clock — a
// line at 500ms, a chime 260ms after that — so suspending the context stops
// that clock and everything hanging off it: the music, the line half said, the
// sparkle that had not landed yet. Nothing has to be found and stopped one by
// one, and nothing is lost: resuming carries every one of them on from the
// sample it stopped at.
let paused = false;

export function setAudioPaused(on) {
  paused = Boolean(on);
  if (!ctx) return;
  // The bed is a media element with a clock of its own: suspending the context
  // makes it silent but does not stop it, so it would come back seconds ahead.
  if (bed) {
    if (paused) bed.el.pause();
    else bed.el.play().catch(() => {});
  }
  if (paused) ctx.suspend().catch(() => {});
  else ctx.resume().catch(() => {});
}

export function isMuted() {
  return muted;
}

export function toggleMuted() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 1;
  try {
    localStorage.setItem(STORE_KEY, muted ? "1" : "0");
  } catch {
    /* private mode — the toggle still works for this session */
  }
  return muted;
}

/* ---- loading ---- */

export async function loadAudio(ids, onProgress = () => {}) {
  if (!ctx) return;

  let done = 0;
  await Promise.all(
    ids.map(async (id) => {
      try {
        const res = await fetch(clipUrl(id));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        buffers.set(id, await ctx.decodeAudioData(await res.arrayBuffer()));
      } catch (err) {
        // A missing clip must never take the story down with it.
        console.warn(`Audio clip unavailable: ${id}`, err);
      } finally {
        onProgress(++done / ids.length);
      }
    })
  );
}

/* ---- playback ---- */

function source(id, bus) {
  const buffer = buffers.get(id);
  if (!buffer || !ctx) return null;

  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  src.buffer = buffer;
  src.connect(gain).connect(buses[bus]);
  return { src, gain, buffer };
}

// `at` is milliseconds from now; `pan` is -1..1; `sweep` pans across the clip.
function fire(cue, bus) {
  const node = source(cue.id, bus);
  if (!node) return null;

  const { src, gain, buffer } = node;
  const when = ctx.currentTime + (cue.at ?? 0) / 1000;

  gain.gain.value = cue.gain ?? 1;
  if (cue.rate) src.playbackRate.value = cue.rate;

  if (cue.pan != null || cue.sweep) {
    const panner = ctx.createStereoPanner();
    gain.disconnect();
    gain.connect(panner).connect(buses[bus]);

    if (cue.sweep) {
      // The script has Mr. Giggles' laugh cross the screen, so the voice
      // travels with it.
      panner.pan.setValueAtTime(cue.sweep[0], when);
      panner.pan.linearRampToValueAtTime(cue.sweep[1], when + buffer.duration);
    } else {
      panner.pan.value = cue.pan;
    }
  }

  src.start(when);
  live.push({ src, bus, from: when, to: when + buffer.duration / (cue.rate || 1) });

  // Some clips outlast the beat that starts them — the walking loop runs 19s
  // under an 8.6s walk — so they are taken out rather than cut off. This has to
  // come after start(): stop() on a source that has not been started throws.
  if (cue.fade) {
    const out = when + cue.fade.at / 1000;
    gain.gain.setValueAtTime(gain.gain.value, out);
    gain.gain.linearRampToValueAtTime(0, out + cue.fade.over);
    src.stop(out + cue.fade.over + 0.05);
  }

  if (bus === "vo") duck(when, buffer.duration / (cue.rate || 1));
  return src;
}

export function playSfx(cue) {
  return ctx ? fire(typeof cue === "string" ? { id: cue } : cue, "sfx") : null;
}

// Interface sounds are deliberately untracked: the click that plays one also
// starts the next beat, and clearCues() would cut it off mid-tap.
export function playUi(id, gain = 0.7) {
  const node = source(id, "sfx");
  if (!node) return;
  node.gain.gain.value = gain;
  node.src.start();
}

// How long a clip runs, in ms, once it is decoded. Beats use this to wait for
// their own line rather than guessing from the length of the caption — the two
// disagree badly enough that lines were being cut off by the next beat.
// Returns 0 for anything not loaded, which reads as "nothing to wait for".
export function clipLength(id) {
  return (buffers.get(id)?.duration ?? 0) * 1000;
}

export function playVo(cue) {
  return ctx ? fire(typeof cue === "string" ? { id: cue } : cue, "vo") : null;
}

/* ---- ambience ---- */

// A bed's element and its own gain, made once and kept. Routed into the music
// bus like everything else, so ducking, the mute and the level a beat sets all
// reach it unchanged.
function bedNode(id) {
  let node = beds.get(id);
  if (node) return node;

  const el = new Audio(clipUrl(id));
  el.loop = true;
  el.preload = "auto";
  const gain = ctx.createGain();
  gain.gain.value = 0;
  ctx.createMediaElementSource(el).connect(gain).connect(buses.music);

  node = { el, gain };
  beds.set(id, node);
  return node;
}

export function playBed(id, at = 0) {
  if (!ctx) return;

  const when = ctx.currentTime + at / 1000;
  if (bed?.id === id) return;

  if (bed) {
    const old = bed;
    old.gain.gain.cancelScheduledValues(when);
    old.gain.gain.setValueAtTime(old.gain.gain.value, when);
    old.gain.gain.linearRampToValueAtTime(0, when + BED_FADE);
    // Stopped once it is inaudible. A media element cannot be scheduled on the
    // audio clock, so this is the one place a timer stands in for it.
    after(() => { old.el.pause(); old.el.currentTime = 0; }, at + BED_FADE * 1000 + 120);
    bed = null;
  }

  if (!id) return;

  const node = bedNode(id);
  node.gain.gain.cancelScheduledValues(when);
  node.gain.gain.setValueAtTime(0, when);
  node.gain.gain.linearRampToValueAtTime(1, when + BED_FADE);

  const go = () => {
    node.el.currentTime = 0;
    if (!paused) node.el.play().catch(() => {});
  };
  if (at > 0) after(go, at); else go();

  bed = { id, el: node.el, gain: node.gain };
}

// Dip the music so a line sits on top of it, then bring it back to whatever
// level the story currently wants — not to the bus constant.
function duck(when, seconds) {
  const g = buses.music.gain;
  const back = when + seconds + DUCK_TAIL;
  const to = musicBase() * DUCK_TO;

  g.cancelScheduledValues(when);
  g.setValueAtTime(g.value, when);
  g.linearRampToValueAtTime(to, when + 0.18);
  g.setValueAtTime(to, back);
  g.linearRampToValueAtTime(musicBase(), back + 0.5);
}

// Where the music sits between lines. `to` is a fraction of the bus level, so
// the story can pull the track down for the blackout and let it back up for the
// fireflies without a second track to cross-fade to.
export function setMusic(to, at = 0, over = 1.2) {
  if (!ctx) return;

  musicLevel = to;
  const g = buses.music.gain;
  const when = ctx.currentTime + at / 1000;

  g.cancelScheduledValues(when);
  g.setValueAtTime(g.value, when);
  g.linearRampToValueAtTime(musicBase(), when + over);
}

/* ---- beat lifecycle ---- */

// Stop whatever the previous beat had queued but had not yet played, so
// clicking ahead doesn't fire a POP! over the next scene.
// `keepVoice` lets a line that is already sounding run out over the next beat,
// instead of being chopped off. Used when the player is what moved the game on:
// they tapped the keypad or the lamp while Agni was still talking, and cutting
// her off mid-word to answer is worse than letting her finish.
export function clearCues({ keepVoice = false } = {}) {
  const now = ctx ? ctx.currentTime : 0;
  const spared = [];

  live.forEach((entry) => {
    if (keepVoice && entry.bus === "vo" && now >= entry.from && now < entry.to) {
      spared.push(entry);
      return;
    }
    try {
      entry.src.stop();
    } catch {
      /* already finished */
    }
  });
  live = spared;

  if (ctx) {
    // Drop any pending duck, but leave the level the story asked for alone.
    const g = buses.music.gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(musicBase(), ctx.currentTime);
  }
}

// `swarmAt` is when the twinkles land on this beat. A sound marked
// `onSwarm` is timed from that rather than from the top of the beat, because
// the swarm now waits for the line that introduces it and its arrival can no
// longer be written down as a fixed number — see swarmDelay() in js/game.js.
export function playCues(cues, { swarmAt = 0 } = {}) {
  if (!ctx || !cues) return;

  if (cues.bed !== undefined) {
    const b = typeof cues.bed === "string" || cues.bed === null
      ? { id: cues.bed, at: 0 }
      : cues.bed;
    playBed(b.id, b.at ?? 0);
  }

  // Before the voice, so a dip and a duck on the same beat do not fight over
  // the one gain node.
  if (cues.music) setMusic(cues.music.to, cues.music.at ?? 0, cues.music.over);

  (cues.sfx ?? []).forEach((cue) =>
    fire(cue.onSwarm ? { ...cue, at: (cue.at ?? 0) + swarmAt } : cue, "sfx"));
  if (cues.vo) fire(cues.vo, "vo");
}

export function stopAudio() {
  musicLevel = 1;
  clearCues();
  playBed(null);
}

// What the sound is doing, for the dev tools and for tests.
export function audioState() {
  return ctx ? ctx.state : "none";
}

// What the music is doing. The bed is a detached media element, so this is the
// only way to see it — the dev tools show it, and the tests read it.
export function bedState() {
  if (!bed) return { id: null };
  return {
    id: bed.id,
    playing: !bed.el.paused,
    at: Number(bed.el.currentTime.toFixed(1)),
    gain: Number(bed.gain.gain.value.toFixed(2))
  };
}
