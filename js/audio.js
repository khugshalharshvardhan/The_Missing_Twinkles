// Web Audio mixer for the story: three buses (music / sfx / vo) under a
// master, so a beat can duck the ambience under a line without touching
// anything else.
//
// Cues are scheduled on the AudioContext clock rather than with setTimeout,
// so a POP! lands where the animation says it should even if the main thread
// is busy painting. Everything a beat schedules is tracked so advancing early
// can cancel what hasn't sounded yet.

import { clipUrl } from "./data/audio.js";

const STORE_KEY = "mystry.muted";

const BUS_GAIN = { music: 0.5, sfx: 0.85, vo: 1 };
const DUCK_TO = 0.3;      // ambience level while a line plays
const DUCK_TAIL = 0.35;   // seconds to hold the duck after the line ends
const BED_FADE = 1.4;

let ctx = null;
let master = null;
const buses = {};
const buffers = new Map();
let live = [];            // sources scheduled for the current beat
let bed = null;           // { id, source, gain }
let muted = false;

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
  if (ctx && ctx.state !== "running") ctx.resume().catch(() => {});
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
  live.push(src);

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

export function playVo(cue) {
  return ctx ? fire(typeof cue === "string" ? { id: cue } : cue, "vo") : null;
}

/* ---- ambience ---- */

export function playBed(id, at = 0) {
  if (!ctx) return;

  const when = ctx.currentTime + at / 1000;
  if (bed?.id === id) return;

  if (bed) {
    const old = bed;
    old.gain.gain.cancelScheduledValues(when);
    old.gain.gain.setValueAtTime(old.gain.gain.value, when);
    old.gain.gain.linearRampToValueAtTime(0, when + BED_FADE);
    old.source.stop(when + BED_FADE + 0.1);
    bed = null;
  }

  if (!id) return;

  const node = source(id, "music");
  if (!node) return;

  node.src.loop = true;
  node.gain.gain.setValueAtTime(0, when);
  node.gain.gain.linearRampToValueAtTime(1, when + BED_FADE);
  node.src.start(when);

  bed = { id, source: node.src, gain: node.gain };
}

// Dip the ambience so a line sits on top of it.
function duck(when, seconds) {
  const g = buses.music.gain;
  const back = when + seconds + DUCK_TAIL;

  g.cancelScheduledValues(when);
  g.setValueAtTime(g.value, when);
  g.linearRampToValueAtTime(BUS_GAIN.music * DUCK_TO, when + 0.18);
  g.setValueAtTime(BUS_GAIN.music * DUCK_TO, back);
  g.linearRampToValueAtTime(BUS_GAIN.music, back + 0.5);
}

/* ---- beat lifecycle ---- */

// Stop whatever the previous beat had queued but had not yet played, so
// clicking ahead doesn't fire a POP! over the next scene.
export function clearCues() {
  live.forEach((src) => {
    try {
      src.stop();
    } catch {
      /* already finished */
    }
  });
  live = [];

  if (ctx) {
    const g = buses.music.gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(BUS_GAIN.music, ctx.currentTime);
  }
}

export function playCues(cues) {
  if (!ctx || !cues) return;

  if (cues.bed !== undefined) {
    const b = typeof cues.bed === "string" || cues.bed === null
      ? { id: cues.bed, at: 0 }
      : cues.bed;
    playBed(b.id, b.at ?? 0);
  }

  (cues.sfx ?? []).forEach((cue) => fire(cue, "sfx"));
  if (cues.vo) fire(cues.vo, "vo");
}

export function stopAudio() {
  clearCues();
  playBed(null);
}
