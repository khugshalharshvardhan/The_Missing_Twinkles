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
    sfx: [{ id: "sniff", at: 120, gain: 0.8, pan: 0.25 }
    ],
    vo: { id: "vo_neel_cake", at: 560 }
  },

  "1.3": {
        vo: { id: "vo_agni_cookie", at: 560 }
  },

  // No narration on this beat: it is Neel grinning, and describing a grin says
  // less than the drawing already does. He chuckles instead — his own voice, no
  // caption, panned to where he is standing. vo_narr_grin is still on disk,
  // simply unreferenced, which also drops it from audioManifest since that is
  // derived from these tables.
  "1.4": {
    sfx: [{ id: "grin_boing", at: 180, gain: 0.7, pan: 0.3 }],
    vo: { id: "vo_neel_hehe", at: 420, pan: 0.3 }
  },

  /* ---------- Screen 2 ---------- */

  // Mist at their feet. The bed turns uneasy and a heartbeat starts.
  "2.1": {
    // The first turn: the music pulls back as the mist arrives.
    music: { to: 0.7, at: 0, over: 1.6 },
    sfx: [{ id: "mist_rise", at: 0, gain: 0.85 },
      // The heartbeats carry the rise; he only speaks once it has covered the
      // ground, so the bubble and the line wait for it. Matches `say.at` on
      // step 2.1 in scenes.js — change one, change the other.
      { id: "heartbeat", at: 900, gain: 0.5 },
      { id: "heartbeat", at: 1700, gain: 0.55 },
      { id: "heartbeat", at: 2500, gain: 0.6 },
      // The lamp answers his line: two stutters, the pop, its sparks, and its
      // light going out — all panned hard left, where it stands. Times match
      // LAMP_GUTTER / LAMPS_FLARE / LAMP_SPARKS in scenes.js and the keyframes
      // in story.css.
      { id: "lamp_flicker", at: 4000, gain: 0.72, pan: -0.69 },
      { id: "lamp_flicker", at: 4400, gain: 0.78, pan: -0.69 },
      { id: "lantern_pop", at: 4950, gain: 1, rate: 0.92, pan: -0.69 },
      { id: "sparkle", at: 4990, gain: 0.75, pan: -0.6 },
      { id: "lamp_out", at: 5150, gain: 0.8, pan: -0.69 }
    ],
    vo: { id: "vo_neel_what", at: 3160 }
  },

  // The town follows its lamp: the lit street cross-fades to the same render
  // with every light off, the last warmth settles off the pair, and the dark
  // drains into the black the eyes open out of.
  "2.2": {
    // Down to almost nothing under blackout_hit — the lights going out wants
    // air behind it, not a cheerful loop.
    music: { to: 0.18, at: 0, over: 1.4 },
    sfx: [{ id: "mist_rush", at: 0, gain: 0.9 },
      { id: "blackout_hit", at: 2750, gain: 1 }
    ]
    // No laugh here: it belongs over the eyes, and there is only ever one.
  },

  /* ---------- Screen 3 ---------- */

  // Agni calls into the dark. Blinks match the BLINK! captions.
  // The eyes open, and he crosses overhead. The pan sweeps with the text.
  // The dip from 2.2 carries: nothing here puts the music back.
  "3.1": {
    sfx: [{ id: "blink", at: 900, gain: 0.55, pan: -0.42 },
      { id: "blink", at: 2100, gain: 0.55, pan: 0.55 }
    ],
    vo: { id: "vo_giggles_2", at: 500, gain: 0.95, sweep: [-0.9, 0.9] }
  },

  // She calls a beat sooner than she used to. The whole exchange was carrying a
  // second of silence at the end of every line; the lines themselves have not
  // moved, only the waiting after them. Matches the holds on 3.2 and 3.3 in
  // scenes.js — change one, change the other.
  "3.2": {
    sfx: [{ id: "blink", at: 620, gain: 0.55, pan: -0.42 }],
    vo: { id: "vo_agni_neil", at: 340, pan: -0.42 }
  },

  // His answer, and one twinkle going past while he gives it — the first light
  // in the frame since the lamp, and the one the next page follows.
  "3.3": {
    sfx: [{ id: "blink", at: 820, gain: 0.55, pan: 0.55 },
      { id: "twinkle", at: 520, gain: 0.42, sweep: [-0.75, 0.75] }
    ],
    vo: { id: "vo_neel_here", at: 300, pan: 0.5 }
  },

  // Firefly transition — bells, and the music comes back up with them.
  "3.4": {
    music: { to: 1, at: 300, over: 1.8 },
    sfx: [{ id: "sparkle", at: 100, gain: 0.9 }]
  },

  /* ---------- Screen 4 ---------- */

  // Agni's spark catches. Twinkles sit on two of the distant glimmers.
  "4.1": {
    sfx: [{ id: "spark_ignite", at: 150, gain: 0.85, pan: -0.2 },
      { id: "twinkle", at: 900, gain: 0.35, pan: 0.77 },
      { id: "twinkle", at: 2600, gain: 0.3, pan: -0.78 }
    ],
    vo: { id: "vo_agni_giggles", at: 560 }
  },

  "4.2": {
    sfx: [{ id: "cheer_swell", at: 260, gain: 0.8 },
      { id: "twinkle", at: 1600, gain: 0.35, pan: 0.77 }
    ],
    vo: { id: "vo_agni_light", at: 560 }
  },

  // The walk between the acts. The music is already running, so it carries
  // straight through; the footsteps and the twinkle are what is new.
  //
  // One walking loop, faded out across the settle — WALK_MS is 4000 with
  // SETTLE_MS 1100, so it starts leaving at 2900 and is gone as they stop.
  // Change those, change this.
  walk: {
    bed: "bed_main",
    sfx: [{ id: "footsteps_walk", at: 120, gain: 0.55, fade: { at: 2850, over: 1.1 } },
      { id: "twinkle", at: 700, gain: 0.4, pan: 0.5 },
      { id: "twinkle", at: 2100, gain: 0.35, pan: 0.3 },
      { id: "sparkle", at: 3300, gain: 0.5 }
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
  /* ---- the ending — see epilogueScreens in js/data/screens.js ---- */
  // The high-five lands with the beat: a clap, then her line.
  "e1": {
    sfx: [{ id: "hand_clap", at: 350, gain: 0.9 }],
    vo: { id: "vo_ep_wedidit", at: 700, pan: -0.2 }
  },
  "e2": { vo: { id: "vo_ep_shining", at: 500, pan: -0.2 } },
  // She turns to where he was.
  "e3": { vo: { id: "vo_ep_neel", at: 500, pan: -0.35 } },
  // Over the film, whose own soundtrack is stripped: the smell's twinkle, his
  // dreamy line as it reaches him, and a sparkle as his feet leave the ground.
  "ev": {
    sfx: [
      { id: "twinkle", at: 500, gain: 0.45 },
      { id: "sparkle", at: 4400, gain: 0.6 },
      // The iris closing over the last frame.
      { id: "mist_rush", at: 6050, gain: 0.35 }
    ],
    vo: { id: "vo_ep_cake", at: 2600, pan: 0.4 }
  },
  // The words land on the dark the iris left behind.
  "eend": {
    sfx: [{ id: "sparkle", at: 550, gain: 0.55 }]
  },

  // Each beat: the bubble pops at 200ms and the line starts at 500, the same
  // 300ms gap the story uses between a bubble and the voice inside it.
  //
  // Three lines are not here, because they depend on what the player did:
  // 2.2 and 16 end in the number they typed and 4.2 is one of four verdicts,
  // so js/game.js plays the stem's number and picks the verdict.

  // ---- they notice the twinkles, and the problem is stated ----
  "1.1": {
    bed: "bed_main",
    sfx: [{ id: "twinkle", at: 700, gain: 0.4 },
      // The swarm vanishing on its magic, 5.9s after it set out.
      { id: "sparkle", at: 5950, gain: 0.6 }],
    vo: { id: "vo_g_look", at: 500, pan: -0.55 }
  },
  "1.2": {
    bed: "bed_main",
        vo: { id: "vo_g_gone", at: 500, pan: -0.55 }
  },
  "1.3": {
        vo: { id: "vo_g_howmany", at: 500, pan: -0.5 }
  },
  // Neel's line, so it comes from his side of the frame.
  "1.4": {
    sfx: [{ id: "grin_boing", at: 120, gain: 0.5, pan: 0.4 }],
    vo: { id: "vo_g_catch", at: 500, pan: 0.5 }
  },
  // The swarm waits for her line (fireflies.at 2650 in screens.js): a twinkle
  // as they arrive, the sparkle as they vanish 5.9s later.
  "1.5": {
    sfx: [{ id: "twinkle", at: 2750, gain: 0.4, pan: 0.2 },
      { id: "sparkle", at: 8600, gain: 0.6 }],
    vo: { id: "vo_g_guess", at: 500, pan: -0.5 }
  },

  // ---- the keypad. Key presses are played from js/game.js, on the tap ----
  // The pad arrives on its own sparkle once the question is asked — matches
  // keypadAt on screen 2 in screens.js.
  "2": {
    sfx: [{ id: "page_air", at: 0, gain: 0.5 },
      { id: "sparkle", at: 2300, gain: 0.55 }],
    vo: { id: "vo_g_howmany_q", at: 500, pan: -0.6 }
  },
  // Stem only: js/game.js says the number after it.
  "2.2": {
        vo: { id: "vo_g_ithink", at: 500, pan: 0.55 }
  },

  // ---- counting ----
  "3": {
        vo: { id: "vo_g_count", at: 500, pan: -0.5 }
  },
  // The counting itself is scored per tap in js/game.js — a pip and the spoken
  // number — so this beat only sets it up and then stays out of the way.
  "3.2": {
    sfx: [{ id: "page_air", at: 0, gain: 0.5 }],
    vo: { id: "vo_g_tapcount", at: 500, pan: -0.5 }
  },

  // ---- the total, and how the guess did ----
  "4": {
    sfx: [{ id: "sparkle", at: 420, gain: 0.5 }],
    vo: { id: "vo_g_total", at: 500, pan: -0.5 }
  },
  // Stem only: js/game.js says the number after it.
  "16": {
        vo: { id: "vo_g_youguessed", at: 500, pan: -0.5 }
  },
  // The verdict line and its chime are chosen in js/game.js.
  "4.2": {},

  // ---- the lamp. Striking it is played on the tap ----
  "5.1": {
    sfx: [{ id: "page_air", at: 0, gain: 0.5 }],
    vo: { id: "vo_g_taplamp", at: 500, pan: -0.5 }
  },
  // He cheers as he spins to the lit lamp — his own voice, from his side of
  // the frame, landing with the YAY! lettering (screens.js draws it from 180ms).
  "5.2": {
    sfx: [{ id: "catch_pop", at: 120, gain: 0.8 }, { id: "twinkle", at: 500, gain: 0.45 }],
    vo: { id: "vo_neel_yay", at: 260, pan: 0.5 }
  },

  // ---- the town is theirs to light ----
  "6.1": {
    sfx: [{ id: "cheer_swell", at: 240, gain: 0.7 }],
    vo: { id: "vo_g_yourturn", at: 620 }
  },
  "6.2": {
    sfx: [{ id: "sparkle", at: 400, gain: 0.5 }],
    vo: { id: "vo_g_guesscount", at: 500 }
  },

  /* ---------- Level 1 — the glowberries ----------
     The tutorial's own cues on the meadow's beats. Lines that do not name the
     element are the same clips; only the three that say "glowberries" out loud
     are new (vo_l1_*, tools/gen-vo-game.js). Timings mirror the tutorial's —
     the berries wait for the line, the pad arrives on its sparkle. */

  // Look closely — the berries materialise after the line (fireflies.at 2650
  // in screens.js) and vanish on their sparkle 5.9s later.
  "p1": {
    bed: "bed_main",
    sfx: [{ id: "twinkle", at: 2750, gain: 0.4, pan: 0.2 },
      { id: "sparkle", at: 8600, gain: 0.6 }],
    vo: { id: "vo_g_guess", at: 500, pan: -0.5 }
  },
  // The keypad — the pad appears once the question is asked (keypadAt 2350).
  "p2": {
    sfx: [{ id: "page_air", at: 0, gain: 0.5 },
      { id: "sparkle", at: 2350, gain: 0.55 }],
    vo: { id: "vo_l1_howmany", at: 500, pan: -0.6 }
  },

  // ---- counting ----
  "p3": {
        vo: { id: "vo_g_count", at: 500, pan: -0.5 }
  },
  "p3.2": {
    sfx: [{ id: "page_air", at: 0, gain: 0.5 }],
    vo: { id: "vo_l1_tapcount", at: 500, pan: -0.5 }
  },

  // ---- the total, and how the guess did ----
  "p4": {
    sfx: [{ id: "sparkle", at: 420, gain: 0.5 }],
    vo: { id: "vo_l1_total", at: 500, pan: -0.5 }
  },
  // Stem only: js/game.js says the number after it (role "guessline").
  "p16": {
        vo: { id: "vo_g_youguessed", at: 500, pan: -0.5 }
  },
  // The verdict line and its chime are chosen in js/game.js.
  "p4.2": {},

  // ---- the lamp ----
  "p5.1": {
    sfx: [{ id: "page_air", at: 0, gain: 0.5 }],
    vo: { id: "vo_g_taplamp", at: 500, pan: -0.5 }
  },
  "p5.2": {
    sfx: [{ id: "catch_pop", at: 120, gain: 0.8 }, { id: "twinkle", at: 500, gain: 0.45 }],
    vo: { id: "vo_neel_yay", at: 260, pan: 0.5 }
  },

  /* ---------- Level 2 — the starlights ----------
     Level 1's cue sheet on the valley's beats, offsets unchanged. Again only
     the three lines that name the element are new (vo_l2_*); every line that
     does not say "starlight" out loud is the same clip the tutorial and the
     meadow use, which is what keeps one narrator across three places. */

  // Look closely — the stars materialise after the line (fireflies.at 2650 in
  // screens.js) and vanish on their sparkle 5.9s later.
  "s1": {
    bed: "bed_main",
    sfx: [{ id: "twinkle", at: 2750, gain: 0.4, pan: 0.2 },
      { id: "sparkle", at: 8600, gain: 0.6 }],
    vo: { id: "vo_g_guess", at: 500, pan: -0.5 }
  },
  // The keypad — the pad appears once the question is asked (keypadAt 2350).
  "s2": {
    sfx: [{ id: "page_air", at: 0, gain: 0.5 },
      { id: "sparkle", at: 2350, gain: 0.55 }],
    vo: { id: "vo_l2_howmany", at: 500, pan: -0.6 }
  },

  // ---- counting ----
  "s3": {
    vo: { id: "vo_g_count", at: 500, pan: -0.5 }
  },
  "s3.2": {
    sfx: [{ id: "page_air", at: 0, gain: 0.5 }],
    vo: { id: "vo_l2_tapcount", at: 500, pan: -0.5 }
  },

  // ---- the total, and how the guess did ----
  "s4": {
    sfx: [{ id: "sparkle", at: 420, gain: 0.5 }],
    vo: { id: "vo_l2_total", at: 500, pan: -0.5 }
  },
  // Stem only: js/game.js says the number after it (role "guessline").
  "s16": {
    vo: { id: "vo_g_youguessed", at: 500, pan: -0.5 }
  },
  // The verdict line and its chime are chosen in js/game.js.
  "s4.2": {},

  // ---- the lamp ----
  "s5.1": {
    sfx: [{ id: "page_air", at: 0, gain: 0.5 }],
    vo: { id: "vo_g_taplamp", at: 500, pan: -0.5 }
  },
  "s5.2": {
    sfx: [{ id: "catch_pop", at: 120, gain: 0.8 }, { id: "twinkle", at: 500, gain: 0.45 }],
    vo: { id: "vo_neel_yay", at: 260, pan: 0.5 }
  },

  /* ---------- Level 3 — the magic seeds ----------
     The same cue sheet a third time, on the forest's beats, offsets unchanged.
     Only the three lines that name the element are new (vo_l3_*). */

  // Look closely — the seeds materialise after the line (fireflies.at 2650 in
  // screens.js) and vanish on their sparkle 5.9s later.
  "m1": {
    bed: "bed_main",
    sfx: [{ id: "twinkle", at: 2750, gain: 0.4, pan: 0.2 },
      { id: "sparkle", at: 8600, gain: 0.6 }],
    vo: { id: "vo_g_guess", at: 500, pan: -0.5 }
  },
  // The keypad — the pad appears once the question is asked (keypadAt 2350).
  "m2": {
    sfx: [{ id: "page_air", at: 0, gain: 0.5 },
      { id: "sparkle", at: 2350, gain: 0.55 }],
    vo: { id: "vo_l3_howmany", at: 500, pan: -0.6 }
  },

  // ---- counting ----
  "m3": {
    vo: { id: "vo_g_count", at: 500, pan: -0.5 }
  },
  "m3.2": {
    sfx: [{ id: "page_air", at: 0, gain: 0.5 }],
    vo: { id: "vo_l3_tapcount", at: 500, pan: -0.5 }
  },

  // ---- the total, and how the guess did ----
  "m4": {
    sfx: [{ id: "sparkle", at: 420, gain: 0.5 }],
    vo: { id: "vo_l3_total", at: 500, pan: -0.5 }
  },
  // Stem only: js/game.js says the number after it (role "guessline").
  "m16": {
    vo: { id: "vo_g_youguessed", at: 500, pan: -0.5 }
  },
  // The verdict line and its chime are chosen in js/game.js.
  "m4.2": {},

  // ---- the lamp ----
  "m5.1": {
    sfx: [{ id: "page_air", at: 0, gain: 0.5 }],
    vo: { id: "vo_g_taplamp", at: 500, pan: -0.5 }
  },
  "m5.2": {
    sfx: [{ id: "catch_pop", at: 120, gain: 0.8 }, { id: "twinkle", at: 500, gain: 0.45 }],
    vo: { id: "vo_neel_yay", at: 260, pan: 0.5 }
  },

  /* ---------- Level 4 — the glow flowers ----------
     The cue sheet a fourth and last time, offsets unchanged. Only the three
     lines that name the element are new (vo_l4_*). */

  // Look closely — the flowers open after the line (fireflies.at 2650 in
  // screens.js) and vanish on their sparkle 5.9s later.
  "f1": {
    bed: "bed_main",
    sfx: [{ id: "twinkle", at: 2750, gain: 0.4, pan: 0.2 },
      { id: "sparkle", at: 8600, gain: 0.6 }],
    vo: { id: "vo_g_guess", at: 500, pan: -0.5 }
  },
  // The keypad — the pad appears once the question is asked (keypadAt 2350).
  "f2": {
    sfx: [{ id: "page_air", at: 0, gain: 0.5 },
      { id: "sparkle", at: 2350, gain: 0.55 }],
    vo: { id: "vo_l4_howmany", at: 500, pan: -0.6 }
  },

  // ---- counting ----
  "f3": {
    vo: { id: "vo_g_count", at: 500, pan: -0.5 }
  },
  "f3.2": {
    sfx: [{ id: "page_air", at: 0, gain: 0.5 }],
    vo: { id: "vo_l4_tapcount", at: 500, pan: -0.5 }
  },

  // ---- the total, and how the guess did ----
  "f4": {
    sfx: [{ id: "sparkle", at: 420, gain: 0.5 }],
    vo: { id: "vo_l4_total", at: 500, pan: -0.5 }
  },
  // Stem only: js/game.js says the number after it (role "guessline").
  "f16": {
    vo: { id: "vo_g_youguessed", at: 500, pan: -0.5 }
  },
  // The verdict line and its chime are chosen in js/game.js.
  "f4.2": {},

  // ---- the lamp ----
  "f5.1": {
    sfx: [{ id: "page_air", at: 0, gain: 0.5 }],
    vo: { id: "vo_g_taplamp", at: 500, pan: -0.5 }
  },
  "f5.2": {
    sfx: [{ id: "catch_pop", at: 120, gain: 0.8 }, { id: "twinkle", at: 500, gain: 0.45 }],
    vo: { id: "vo_neel_yay", at: 260, pan: 0.5 }
  }
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
    // Played straight from js/game.js rather than from a cue table: on a tap,
    // or chosen from what the player did.
    "twinkle",
    "sparkle",
    "spark_ignite",
    "cheer_swell",
    "key_press",
    "key_clear",
    "key_confirm",
    "count_pip",
    "magic_tap",
    "count_done",
    "lamp_strike",
    "catch_pop",
    "correct_chime",
    "near_chime",
    "try_chime",
    // The four verdicts on screen 4.2.
    "vo_g_spoton",
    "vo_g_close",
    "vo_g_goodtry",
    "vo_g_tryagain",
    // Agni counting, and finishing the two lines that end in a number the
    // player chose. Zero to twenty covers every count and every guess the
    // keypad can hold that is worth speaking.
    ...Array.from({ length: 21 }, (_, n) => `vo_n_${n}`),
    // Neel's own nought to nine, for the number that finishes his sentence on
    // screen 2.2. Without these listed here nothing fetches them, and the call
    // to play one finds no buffer and quietly does nothing.
    ...Array.from({ length: 10 }, (_, n) => `vo_nn_${n}`)
  ])
];
