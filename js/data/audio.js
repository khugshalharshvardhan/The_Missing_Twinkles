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
// `fade: { at, over }` takes a clip out instead of cutting it.
//
// One piece of music, bed_main, runs unbroken from the first page to the end
// card — it is never swapped, because playBed() ignores a request for the bed
// already playing. What used to be four mood beds cross-fading is now `music`
// on the beats where the mood turns: the track falls away for the lights-out and
// comes back with the fireflies. `music.to` is a fraction of the bus level.

const SFX_DIR = "assets/audios/sfx/";
const VO_DIR = "assets/audios/vo/";

export function clipUrl(id) {
  return id.startsWith("vo_") ? `${VO_DIR}${id}.mp3` : `${SFX_DIR}${id}.mp3`;
}

export const UI_ADVANCE = "ui_tap";

export const cues = {
  /* ---------- Screen 1 ---------- */

  // The lane, still lit. The music comes up under it and runs from here to the
  // end card. `music` is reset explicitly so a dev jump back to the start does
  // not inherit a dip from further on.
  "1.0": {
    bed: "bed_main",
    music: { to: 1, at: 0, over: 0.6 }
  },

  // "Agni and Neil were taking a walk." The walking loop plays under the line
  // and is faded out, rather than the old one-shot: same footsteps as the walk
  // between the acts, so the two match.
  "1.1": {
    bed: "bed_main",
    sfx: [{ id: "footsteps_walk", at: 150, gain: 0.34, fade: { at: 2400, over: 1.1 } }],
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
    // The first turn: the music pulls back as the mist arrives.
    music: { to: 0.7, at: 0, over: 1.6 },
    sfx: [
      { id: "mist_rise", at: 0, gain: 0.85 },
      // The heartbeats carry the rise; he only speaks once it has covered the
      // ground, so the bubble and the line wait for it. Matches `say.at` on
      // step 2.1 in scenes.js — change one, change the other.
      { id: "heartbeat", at: 900, gain: 0.5 },
      { id: "heartbeat", at: 1700, gain: 0.55 },
      { id: "heartbeat", at: 2500, gain: 0.6 },
      { id: "bubble", at: 2860, gain: 0.6 }
    ],
    vo: { id: "vo_neel_what", at: 3160 }
  },

  // The mist rushes, four lanterns pop out from the far end in, the last one
  // flickers and dies, then Mr. Giggles is heard. Pops get louder, lower and
  // further left as they come nearer, tracking the POP! positions.
  "2.2": {
    // Down to almost nothing, reaching bottom under blackout_hit at 4100 — the
    // lights going out wants air behind it, not a cheerful loop.
    music: { to: 0.18, at: 2500, over: 1.5 },
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
    ]
    // No laugh here: it belongs over the eyes, and there is only ever one.
  },

  /* ---------- Screen 3 ---------- */

  // Agni calls into the dark. Blinks match the BLINK! captions.
  // The eyes open, and he crosses overhead. The pan sweeps with the text.
  // The dip from 2.2 carries: nothing here puts the music back.
  "3.1": {
    sfx: [
      { id: "blink", at: 900, gain: 0.55, pan: -0.42 },
      { id: "blink", at: 2100, gain: 0.55, pan: 0.55 }
    ],
    vo: { id: "vo_giggles_2", at: 500, gain: 0.95, sweep: [-0.9, 0.9] }
  },

  "3.2": {
    sfx: [{ id: "blink", at: 700, gain: 0.55, pan: -0.42 }],
    vo: { id: "vo_agni_neil", at: 420, pan: -0.42 }
  },

  // The laugh crosses the frame, so the voice crosses the speakers with it.
  "3.3": {
    sfx: [{ id: "blink", at: 900, gain: 0.55, pan: 0.55 }],
    vo: { id: "vo_neel_here", at: 420, pan: 0.5 }
  },

  // Firefly transition — bells, and the music comes back up with them.
  "3.4": {
    music: { to: 1, at: 300, over: 1.8 },
    sfx: [{ id: "sparkle", at: 100, gain: 0.9 }]
  },

  /* ---------- Screen 4 ---------- */

  // Agni's spark catches. Twinkles sit on two of the distant glimmers.
  "4.1": {
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
  },

  // The walk between the acts. The music is already running, so it carries
  // straight through; the footsteps and twinkles are what is new.
  //
  // One continuous walking loop rather than three one-shots, faded out across
  // the settle — WALK_MS is 8600 with SETTLE_MS 2200, so it starts leaving at
  // 6400 and is gone as they stop. Change those, change this.
  walk: {
    bed: "bed_main",
    sfx: [
      { id: "footsteps_walk", at: 120, gain: 0.55, fade: { at: 6280, over: 2.2 } },
      { id: "twinkle", at: 700, gain: 0.4, pan: 0.5 },
      { id: "twinkle", at: 2600, gain: 0.35, pan: 0.3 },
      { id: "twinkle", at: 4600, gain: 0.4, pan: 0.6 },
      { id: "sparkle", at: 6100, gain: 0.5 }
    ]
  }
};

/* =========================================================
   Act two — the counting game. Keys are the screen `id` values in screens.js,
   which is why this is a separate map: several ids ("1.1", "3.2", "4.2") exist
   in both halves and mean different beats.

   `bed_main` is the same track the story has been playing since page one.
   playBed() ignores a request for the bed already running, so the music simply
   carries on under the hand-over instead of restarting — the clearest single
   signal that this is still one product.
   ========================================================= */

export const gameCues = {
  // Agni and Neel spot the light keepers.
  "1.1": { bed: "bed_main", sfx: [{ id: "bubble", at: 200, gain: 0.6 }, { id: "twinkle", at: 700, gain: 0.4 }] },
  "1.2": { bed: "bed_main", sfx: [{ id: "bubble", at: 200, gain: 0.6 }] },
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
