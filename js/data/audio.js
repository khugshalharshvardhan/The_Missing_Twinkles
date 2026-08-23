// The soundtrack, beat by beat, for both acts of the chapter.
//
// `cues` keys are the story step ids in scenes.js; `gameCues` keys are the
// game screen ids in screens.js.
//
// `at` is milliseconds from the moment the beat starts, and the numbers here
// deliberately line up with the animation delays in scenes.js / story.css:
// a bubble pops at 260ms, its text lands at 520ms, and every POP! / BLINK! /
// laugh cue matches the delay on the matching sfx entry. Change one, change
// the other.
//
// gain 0..1, rate is playback speed (also shifts pitch), pan -1..1 mapped from
// the layer's x position as (x / 1920) * 2 - 1, and sweep pans across the clip.

const SFX_DIR = "assets/audios/sfx/";
const VO_DIR = "assets/audios/vo/";

export function clipUrl(id) {
  return id.startsWith("vo_") ? `${VO_DIR}${id}.mp3` : `${SFX_DIR}${id}.mp3`;
}

export const UI_ADVANCE = "ui_tap";

export const cues = {
  /* ---------- Screen 1 ---------- */

  // The lane, still lit. Ambience comes up under it.
  "1.0": {
    bed: "bed_town"
  },

  // "Agni and Neil were taking a walk."
  "1.1": {
    bed: "bed_town",
    sfx: [{ id: "footsteps", at: 150, gain: 0.7 }],
    vo: { id: "vo_narr_walk", at: 500 }
  },

  // Neel catches the bakery on the air.
  "1.2": {
    sfx: [
      { id: "sniff", at: 120, gain: 0.8, pan: 0.25 },
      { id: "bubble", at: 260, gain: 0.6 }
    ],
    vo: { id: "vo_neel_cake", at: 560 }
  },

  "1.3": {
    sfx: [{ id: "bubble", at: 260, gain: 0.6 }],
    vo: { id: "vo_agni_cookie", at: 560 }
  },

  "1.4": {
    sfx: [{ id: "grin_boing", at: 180, gain: 0.7, pan: 0.3 }],
    vo: { id: "vo_narr_grin", at: 480 }
  },

  /* ---------- Screen 2 ---------- */

  // Mist at their feet. The bed turns uneasy and a heartbeat starts.
  "2.1": {
    bed: "bed_uneasy",
    sfx: [
      { id: "mist_rise", at: 0, gain: 0.85 },
      { id: "bubble", at: 260, gain: 0.6 },
      { id: "heartbeat", at: 1500, gain: 0.5 },
      { id: "heartbeat", at: 2400, gain: 0.55 },
      { id: "heartbeat", at: 3300, gain: 0.6 }
    ],
    vo: { id: "vo_neel_what", at: 560 }
  },

  // The mist rushes, four lanterns pop out from the far end in, the last one
  // flickers and dies, then Mr. Giggles is heard. Pops get louder, lower and
  // further left as they come nearer, tracking the POP! positions.
  "2.2": {
    bed: { id: "bed_dark", at: 3200 },
    sfx: [
      { id: "mist_rush", at: 0, gain: 1 },
      // One pop per lamp in LAMP_LIST, panned to where each one stands and
      // pitched down as they come nearer. Change one, change the other.
      { id: "lantern_pop", at: 400, gain: 0.5, rate: 1.25, pan: 0 },
      { id: "lantern_pop", at: 1000, gain: 0.64, rate: 1.14, pan: -0.24 },
      { id: "lantern_pop", at: 1600, gain: 0.8, rate: 1.04, pan: -0.36 },
      { id: "lantern_pop", at: 2300, gain: 1, rate: 0.92, pan: -0.69 },
      { id: "lamp_flicker", at: 3300, gain: 0.8, pan: -0.69 },
      { id: "lamp_out", at: 4000, gain: 0.9, pan: -0.69 },
      { id: "blackout_hit", at: 4100, gain: 1 }
    ],
    vo: { id: "vo_giggles_1", at: 5200, gain: 0.95 }
  },

  /* ---------- Screen 3 ---------- */

  // Agni calls into the dark. Blinks match the BLINK! captions.
  "3.1": {
    bed: "bed_dark",
    sfx: [
      { id: "blink", at: 700, gain: 0.55, pan: -0.42 },
      { id: "blink", at: 1900, gain: 0.55, pan: 0.55 }
    ],
    vo: { id: "vo_agni_neil", at: 420, pan: -0.42 }
  },

  "3.2": {
    sfx: [{ id: "blink", at: 900, gain: 0.55, pan: 0.55 }],
    vo: { id: "vo_neel_here", at: 420, pan: 0.5 }
  },

  // The laugh crosses the frame, so the voice crosses the speakers with it.
  "3.3": {
    vo: { id: "vo_giggles_2", at: 600, gain: 0.95, sweep: [-0.9, 0.9] }
  },

  // Firefly transition — bells, and the bed turns hopeful.
  "3.4": {
    bed: { id: "bed_hope", at: 400 },
    sfx: [{ id: "sparkle", at: 100, gain: 0.9 }]
  },

  /* ---------- Screen 4 ---------- */

  // Agni's spark catches. Twinkles sit on two of the distant glimmers.
  "4.1": {
    bed: "bed_hope",
    sfx: [
      { id: "spark_ignite", at: 150, gain: 0.85, pan: -0.2 },
      { id: "bubble", at: 260, gain: 0.6 },
      { id: "twinkle", at: 900, gain: 0.35, pan: 0.77 },
      { id: "twinkle", at: 2600, gain: 0.3, pan: -0.78 }
    ],
    vo: { id: "vo_agni_giggles", at: 560 }
  },

  "4.2": {
    sfx: [
      { id: "bubble", at: 260, gain: 0.6 },
      { id: "cheer_swell", at: 260, gain: 0.8 },
      { id: "twinkle", at: 1600, gain: 0.35, pan: 0.77 }
    ],
    vo: { id: "vo_agni_light", at: 560 }
  }
};

/* =========================================================
   Act two — the counting game. Keys are the screen `id` values in screens.js,
   which is why this is a separate map: several ids ("1.1", "3.2", "4.2") exist
   in both halves and mean different beats.

   `bed_hope` is deliberately the same bed the story's last page ends on.
   playBed() ignores a request for the bed already running, so the ambience
   simply carries on under the hand-over instead of restarting — the clearest
   single signal that this is still one product.
   ========================================================= */

export const gameCues = {
  // Agni and Neel spot the light keepers.
  "1.1": { bed: "bed_hope", sfx: [{ id: "bubble", at: 200, gain: 0.6 }, { id: "twinkle", at: 700, gain: 0.4 }] },
  "1.2": { bed: "bed_hope", sfx: [{ id: "bubble", at: 200, gain: 0.6 }] },
  "1.3": { sfx: [{ id: "bubble", at: 200, gain: 0.6 }] },
  "1.4": { sfx: [{ id: "bubble", at: 200, gain: 0.6 }, { id: "grin_boing", at: 120, gain: 0.5, pan: 0.4 }] },
  "1.5": { sfx: [{ id: "bubble", at: 200, gain: 0.6 }, { id: "twinkle", at: 800, gain: 0.35, pan: 0.2 }] },

  // The keypad. Key presses and the tick are played from js/game.js, on the tap.
  "2": { sfx: [{ id: "bubble", at: 200, gain: 0.6 }, { id: "sparkle", at: 520, gain: 0.4 }] },
  "2.2": { sfx: [{ id: "bubble", at: 200, gain: 0.6 }] },

  // "Let us count them together."
  "3": { sfx: [{ id: "bubble", at: 200, gain: 0.6 }] },
  // Counting itself is scored per tap in js/game.js, so this screen stays quiet
  // under the player.
  "3.2": { sfx: [{ id: "bubble", at: 200, gain: 0.6 }] },

  // The total, and how the guess did.
  "4": { sfx: [{ id: "bubble", at: 200, gain: 0.6 }, { id: "sparkle", at: 420, gain: 0.5 }] },
  "16": { sfx: [{ id: "bubble", at: 200, gain: 0.6 }] },
  "4.2": { sfx: [{ id: "bubble", at: 200, gain: 0.6 }] },

  // The lamp. Striking it is played on the tap.
  "5.1": { sfx: [{ id: "bubble", at: 200, gain: 0.6 }] },
  "5.2": { sfx: [{ id: "bubble", at: 200, gain: 0.6 }, { id: "twinkle", at: 500, gain: 0.45 }] },

  // The town is lit again.
  "6.1": { sfx: [{ id: "bubble", at: 200, gain: 0.6 }, { id: "cheer_swell", at: 240, gain: 0.7 }] },
  "6.2": { sfx: [{ id: "bubble", at: 200, gain: 0.6 }, { id: "sparkle", at: 400, gain: 0.5 }] }
};

// Every clip the soundtrack needs, for the preloader — both acts, one list, so
// the game never has to stop and load a sound mid-chapter.
export const audioManifest = [
  ...new Set([
    UI_ADVANCE,
    ...[...Object.values(cues), ...Object.values(gameCues)].flatMap((c) => [
      ...(typeof c.bed === "string" ? [c.bed] : c.bed?.id ? [c.bed.id] : []),
      ...(c.sfx ?? []).map((s) => s.id),
      ...(c.vo ? [c.vo.id] : [])
    ]),
    // Played straight from js/game.js on a tap, not from a cue table.
    "twinkle",
    "sparkle",
    "spark_ignite",
    "cheer_swell"
  ])
];
