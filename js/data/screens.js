// Game beats, transcribed from Figma › mysterylightoutharshvardhan › "game
// duplicate" (node 99:387).
//
// Every x / y / w / h is a literal Figma coordinate inside the 1882 x 1059
// frame, so the stage scales as one unit (see js/stage.js) and the layout
// stays pixel-faithful to the design.
//
// A layer is:
//   src      the image fill (Figma's own source art, so alpha survives)
//   x y w h  the layer box, in frame coordinates
//   fill     Figma's crop transform for the fill, when it has one. Without it
//            the fill covers the box, which is what Figma's "fill" mode does.
//   flipX    the whole cropped box is mirrored in the design
//   fx       motion hook -> .fx-* in css/game.css
//
// Note on assets: Figma's *node exports* of these layers come back flattened
// onto white, so the art here is the original uploaded source plus the crop
// transform — the same approach js/story.js takes on the story side. The two
// exceptions are bg_night.webp (opaque anyway, and the export is higher
// resolution than the source) and firefly.webp (its export kept its alpha and
// arrives already cropped, so it needs no transform).

const IMG = "assets/game/";
// The tap hand ships with the story art rather than the game's.
const SHARED = "assets/images/";

export const FRAME_W = 1882;
export const FRAME_H = 1059;

// The answer the whole game turns on: the FIREFLYS group holds eight.
export const TOTAL = 8;

// One firefly layout, reused by every screen that shows the swarm. Offsets are
// relative to the group origin, which Figma slides around from screen to
// screen (see `fireflies` on each beat).
export const FIREFLIES = [
  { x: 0, y: 0, w: 116, h: 122 },
  { x: 166, y: 90, w: 117, h: 123 },
  { x: 330, y: 240, w: 116, h: 122 },
  { x: 365, y: 63, w: 117, h: 123 },
  { x: 479, y: 363, w: 116, h: 122 },
  { x: 564, y: 56, w: 116, h: 122 },
  { x: 680, y: 196, w: 116, h: 122 },
  { x: 178, y: 376, w: 116, h: 122 }
];

export const FIREFLY_SRC = `${IMG}firefly.webp`;

const BG = { src: `${IMG}bg_night.webp`, x: 0, y: 0, w: FRAME_W, h: FRAME_H };

/* ---- Level 1 — the glowberries, in the meadow ----

   Same beats, different place and different thing to count. The meadow render
   (assets/images/location2.png, cut to the frame) stands in for bg_night, and
   the swarm slots hold glowberries instead of twinkles.

   NINE for now, not the sheet's ten: the pad takes a single digit, so until
   multi-digit entry lands (parked, per discussion) every total has to stay
   below ten. Bump BERRY_TOTAL and add a row when it does.

   The layout is the sheet's design rule made literal — "keep equal spacing" —
   three staggered rows on a 250px pitch, against the tutorial's loose scatter.
   Boxes are 112x123 to match the berry art's own aspect (224x246), since the
   fill covers the box. */
export const BERRY_TOTAL = 9;
export const BERRY_SRC = `${IMG}glowberry.webp`;

export const BERRIES = [
  { x: 0, y: 0, w: 112, h: 123 },
  { x: 250, y: 0, w: 112, h: 123 },
  { x: 500, y: 0, w: 112, h: 123 },
  { x: 125, y: 150, w: 112, h: 123 },
  { x: 375, y: 150, w: 112, h: 123 },
  { x: 625, y: 150, w: 112, h: 123 },
  { x: 0, y: 300, w: 112, h: 123 },
  { x: 250, y: 300, w: 112, h: 123 },
  { x: 500, y: 300, w: 112, h: 123 }
];

const BG_MEADOW = { src: `${IMG}bg_meadow.webp`, x: 0, y: 0, w: FRAME_W, h: FRAME_H };

/* ---- Level 2 — the starlights, in Starlight Valley ----

   SIX, from the design sheet, in its formation for six: two rows of three.
   Spacing is genuinely equal here — the same 250px pitch across AND down,
   where the berries' three rows had to sit closer (150) to fit nine in.

   Boxes are 120x115 to match the star art's own aspect. starlight.png ships
   with a wide transparent margin (the drawing occupies 984x942 of its
   1536x1024), so it was cropped to that box before scaling: placed untrimmed
   the star would have floated small inside a mostly-empty tap target. At
   120x115 it carries the same visual weight as a 112x123 berry — 13,800 square
   pixels against 13,776 — so no level's swarm reads bigger than another's. */
export const STARLIGHT_TOTAL = 6;
export const STARLIGHT_SRC = `${IMG}starlight.webp`;

export const STARLIGHTS = [
  { x: 0, y: 0, w: 120, h: 115 },
  { x: 250, y: 0, w: 120, h: 115 },
  { x: 500, y: 0, w: 120, h: 115 },
  { x: 0, y: 250, w: 120, h: 115 },
  { x: 250, y: 250, w: 120, h: 115 },
  { x: 500, y: 250, w: 120, h: 115 }
];

const BG_VALLEY = { src: `${IMG}bg_valley.webp`, x: 0, y: 0, w: FRAME_W, h: FRAME_H };

/* ---- Level 3 — the magic seeds, in the forest ----

   NINE, from the design sheet, in its formation for nine: a 3 x 3 grid on the
   same 250px pitch across and down as level 2's two rows, so the three levels
   read as one hand spacing them.

   Nine at an equal 250 pitch is a taller block than level 1's nine (634px
   against 423) because the berries had to squeeze their rows to 150 to fit.
   It still clears everything: the grid spans x 696-1300, inside the gap
   between Agni's box (ends 634) and Neel's (starts 1385), and y 40-674, well
   above the number line at 866.

   Boxes are 104x134 to match the seed art's own aspect. seed.png carries a
   wide transparent margin (the drawing is 692x894 of its 1536x1024) and was
   cropped to it before scaling, as the starlight was. 104x134 is 13,936 square
   pixels against a berry's 13,776, so all three elements weigh the same. */
export const SEED_TOTAL = 9;
export const SEED_SRC = `${IMG}magicseed.webp`;

export const MAGICSEEDS = [
  { x: 0, y: 0, w: 104, h: 134 },
  { x: 250, y: 0, w: 104, h: 134 },
  { x: 500, y: 0, w: 104, h: 134 },
  { x: 0, y: 250, w: 104, h: 134 },
  { x: 250, y: 250, w: 104, h: 134 },
  { x: 500, y: 250, w: 104, h: 134 },
  { x: 0, y: 500, w: 104, h: 134 },
  { x: 250, y: 500, w: 104, h: 134 },
  { x: 500, y: 500, w: 104, h: 134 }
];

const BG_FOREST = { src: `${IMG}bg_forest.webp`, x: 0, y: 0, w: FRAME_W, h: FRAME_H };

/* ---- crop transforms, named where a pose is reused ---- */

const CROP = {
  agniPoint: { left: "-18.61%", top: "-0.07%", width: "143.15%", height: "100.14%" },
  agniTalk: { left: "-5.94%", top: "0%", width: "110.83%", height: "100%" },
  agniA: { left: "-77.78%", top: "-17.43%", width: "251.9%", height: "136.68%" },
  agniB: { left: "-101.52%", top: "-26.77%", width: "303.31%", height: "153.6%" },
  agniC: { left: "-125.38%", top: "-27.44%", width: "351.01%", height: "143.43%" },
  agniD: { left: "-128.46%", top: "-21.09%", width: "390.24%", height: "134%" },
  agniE: { left: "-121.55%", top: "-16.26%", width: "362.95%", height: "147.54%" },
  agniG: { left: "-4.36%", top: "0%", width: "115.3%", height: "100%" },

  neelPointUp: { left: "-19.98%", top: "0%", width: "147.93%", height: "100%" },
  neelA: { left: "-41.39%", top: "-3.46%", width: "194.74%", height: "107.58%" },
  neelB: { left: "-44.48%", top: "0%", width: "199%", height: "100%" },
  neelC: { left: "-35.91%", top: "0%", width: "168.01%", height: "100%" },
  neelD: { left: "-68.54%", top: "0%", width: "229.67%", height: "100%" },
  neelE: { left: "10.23%", top: "8.82%", width: "293.37%", height: "187.5%" },
  neelG: { left: "-12.53%", top: "-2.97%", width: "123.7%", height: "110.57%" },
  neelThink: { left: "-105.57%", top: "-5.34%", width: "503.61%", height: "202.37%" },
  neelTurn: { left: "-179.27%", top: "-112.91%", width: "279.27%", height: "224.07%" },

  lampOff: { left: "-64.34%", top: "0%", width: "227.21%", height: "100%" },
  lampOn: { left: "-57.98%", top: "0%", width: "215.13%", height: "100%" },
  key: { left: "0%", top: "-15.82%", width: "100%", height: "135.86%" },
  numDisplay: { left: "0%", top: "-5.48%", width: "100%", height: "111.23%" }
};

/* Where each character stands, for a whole run of beats.
   
   Every pose is a separate file drawn at its own Figma box with its own
   transparent margin, so placed as exported they put the character somewhere
   different on every beat — measured, Agni's body centre wanders 118px and her
   feet 30px across the first scene, Neel's 133px and 41px. Cross-fading between
   two poses that far apart reads as the character sliding, not as a change of
   expression.
   
   So the Figma coordinates below stay exactly as exported, and js/anchor.js
   shifts each character onto the mark for its scene. Only centre-x and the feet
   are pinned: arms going up genuinely makes a pose taller, and flattening that
   would squash the gesture out of it.
   
   THE_CLEARING is where the walk sets them down — the same marks the arrival
   was built against, so the pair never move from the moment they stop walking
   until the town is theirs. TOGETHER is the deliberate re-stage on 6.1, where
   they come in from the edges to hand the game over. */
const THE_CLEARING = {
  agni: { cx: 329, feet: 989 },
  neel: { cx: 1618, feet: 984 }
};

const TOGETHER = {
  agni: { cx: 635, feet: 992 },
  neel: { cx: 1307, feet: 977 }
};

/* Speech bubbles.
   Each screen has its own balloon art, so `art` is per beat. `mirror` matches
   the design's flip — Figma mirrors the balloon on most screens but not on the
   last three; the words are never mirrored. `artInset` is Figma's own inset of
   the balloon inside its frame, as [top, right, bottom, left] percentages of
   the bubble box, on the two screens that have one. The text is centred in the
   balloon by js/game.js, so it needs no inset of its own.
   {guess} / {total} / {verdict} are filled in at render time. */

export const screens = [
  // ---- SCREEN 1.1 — the swarm is out, both of them spot it (99:388) ----
  {
    id: "1.1",
    anchor: THE_CLEARING,
    layers: [
      BG,
      { src: `${IMG}agni_point.webp`, x: 64, y: 498, w: 525, h: 501, fill: CROP.agniPoint, fx: "breathe" },
      { src: `${IMG}neel_point_up.webp`, x: 1382, y: 447, w: 465, h: 559, fill: CROP.neelPointUp, flipX: true, fx: "breathe-slow" }
    ],
    // The arrival. `enter: "left"` streams the swarm in from off the left of
    // frame, and `dwell` holds the beat open long enough to watch all of it —
    // in, five seconds to be looked at, and the vanish. Without the dwell the
    // beat runs on its reading pace, which for three words is about two
    // seconds, and the swarm would still be flying in when the next screen
    // arrived.
    //
    // Timing lives in @keyframes ff-swarm in css/game.css: 0.9s in, 5s held,
    // 0.7s to vanish where they stand. Change one, change the other.
    fireflies: { x: 586, y: 115, enter: "left" },
    dwell: 7100,
    bubble: {
      art: `${IMG}bub_11.webp`, who: "agni",
      x: 213, y: 263, w: 416, h: 229,
      text: "Look, twinkles!"
    }
  },

  // ---- SCREEN 1.2 — the swarm is gone (99:426) ----
  {
    id: "1.2",
    anchor: THE_CLEARING,
    layers: [
      BG,
      { src: `${IMG}agni_talk.webp`, x: 10, y: 485, w: 576, h: 532, fill: CROP.agniTalk, flipX: true, fx: "breathe" },
      { src: `${IMG}neel_a.webp`, x: 1327, y: 434, w: 377, h: 573, fill: CROP.neelA, flipX: true, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_12.webp`, who: "agni",
      x: 216, y: 209, w: 495, h: 253,
      text: "Huh? Where did they go?"
    }
  },

  // ---- SCREEN 1.3 — the problem is stated (99:436) ----
  {
    id: "1.3",
    anchor: THE_CLEARING,
    layers: [
      BG,
      { src: `${IMG}agni_a.webp`, x: 25, y: 415, w: 590, h: 612, fill: CROP.agniA, fx: "breathe" },
      { src: `${IMG}neel_b.webp`, x: 1347, y: 400, w: 376, h: 611, fill: CROP.neelB, flipX: true, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_13.webp`, who: "agni",
      x: 234, y: 130, w: 596, h: 314,
      artInset: [8.7, 0, 0, 3.23],
      text: "We need to find how many twinkles were there."
    }
  },

  // ---- SCREEN 1.4 — Neel supplies the motive (99:601) ----
  {
    id: "1.4",
    anchor: THE_CLEARING,
    layers: [
      BG,
      { src: `${IMG}agni_f.webp`, x: 34, y: 461, w: 605, h: 553, fx: "breathe" },
      { src: `${IMG}neel_e.webp`, x: 1146, y: 344, w: 567, h: 667, fill: CROP.neelE, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_neel.webp`, who: "neel",
      x: 1183, y: 142, w: 400, h: 237,
      text: "Then we can catch them!"
    }
  },

  // ---- SCREEN 1.5 — look before you guess (99:620) ----
  {
    id: "1.5",
    anchor: THE_CLEARING,
    layers: [
      BG,
      { src: `${IMG}agni_b.webp`, x: 25, y: 445, w: 553, h: 614, fill: CROP.agniB, fx: "breathe" },
      { src: `${IMG}neel_think.webp`, x: 1327, y: 395, w: 372, h: 617, fill: CROP.neelThink, flipX: true, fx: "breathe-slow" }
    ],
    // The last look before the keypad. Nothing is on screen while Agni speaks;
    // the moment her line ends the bubble goes and the swarm materialises where
    // it stands — the same magic it vanishes on, run forward: each twinkle
    // grows out of a burst of gold (`at` is when, ms into the beat — the line
    // runs 500 to 2581), holds its five seconds, and vanishes the same way.
    // The player is asked to guess at something they have just watched appear
    // and disappear by magic.
    fireflies: { x: 600, y: 115, enter: "magic", at: 2650 },
    dwell: 10000,
    bubble: {
      art: `${IMG}bub_15.webp`, who: "agni",
      x: 224, y: 107, w: 514, h: 277,
      text: "Look closely and make a guess!"
    }
  },

  // ---- SCREEN 2 — the keypad. First interaction (99:449) ----
  {
    id: "2",
    anchor: THE_CLEARING,
    interact: "keypad",
    counter: "guess",
    layers: [
      BG,
      // She asks the question on this beat and was missing from it entirely.
      { src: `${IMG}agni_talk.webp`, x: 10, y: 485, w: 576, h: 532, fill: CROP.agniTalk, flipX: true, fx: "breathe" },
      { src: `${IMG}neel_think.webp`, x: 1369, y: 386, w: 372, h: 617, fill: CROP.neelThink, flipX: true, fx: "breathe-slow" }
    ],
    keypad: true,
    // The pad appears only once the question has been asked in full — her line
    // runs 500 to 2216 — and it arrives on a burst of sparkle.
    keypadAt: 2300,
    bubble: {
      art: `${IMG}bub_15.webp`, who: "agni",
      x: 0, y: 185, w: 514, h: 277,
      text: "How many twinkles were there?"
    }
  },

  // ---- SCREEN 2.2 — Neel reads the guess back (101:642) ----
  {
    id: "2.2",
    anchor: THE_CLEARING,
    // `role` names what js/game.js has to add to the beat beyond its cue —
    // here, Neel's voice finishing the stem with the number the player typed.
    // Roles rather than ids, so every level's version of the beat gets the
    // same treatment without game.js keeping a list of ids per level.
    role: "readback",
    counter: "guess",
    layers: [
      BG,
      { src: `${IMG}agni_c.webp`, x: 23, y: 396, w: 473, h: 651, fill: CROP.agniC, fx: "breathe" },
      { src: `${IMG}neel_c.webp`, x: 1382, y: 428, w: 434, h: 611, fill: CROP.neelC, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_neel.webp`, who: "neel",
      x: 1157, y: 209, w: 400, h: 237,
      text: "Hmm… I think there were {guess}."
    }
  },

  // ---- SCREEN 3 — the swarm is back, time to count (99:459) ----
  {
    id: "3",
    anchor: THE_CLEARING,
    counter: "guess",
    layers: [
      BG,
      { src: `${IMG}agni_point.webp`, x: 64, y: 498, w: 525, h: 501, fill: CROP.agniPoint, fx: "breathe" },
      { src: `${IMG}neel_d.webp`, x: 1344, y: 417, w: 449, h: 581, fill: CROP.neelD, flipX: true, fx: "breathe-slow" }
    ],
    fireflies: { x: 606, y: 120, dim: true },
    bubble: {
      art: `${IMG}bub_3.webp`, who: "agni",
      x: 220, y: 216, w: 557, h: 282,
      artInset: [18.09, 9.69, 0, 17.06],
      text: "Let us count to check."
    }
  },

  // ---- SCREEN 3.2 — tap each one. Second interaction (99:469) ----
  {
    id: "3.2",
    anchor: THE_CLEARING,
    interact: "count",
    layers: [
      BG,
      { src: `${IMG}agni_g.webp`, x: 80, y: 490, w: 554, h: 512, fill: CROP.agniG, fx: "breathe" },
      { src: `${IMG}neel_c.webp`, x: 1385, y: 484, w: 396, h: 557, fill: CROP.neelC, fx: "breathe-slow" }
    ],
    fireflies: { x: 664, y: 120 },
    counter: "guess",
    numberLine: true,
    hint: { src: `${SHARED}hand_nudge.svg`, x: 568, y: 103, w: 308.396, h: 308.396 },
    bubble: {
      art: `${IMG}bub_32.webp`, who: "agni",
      x: 190, y: 248, w: 489, h: 256,
      text: "Tap each twinkle to count."
    }
  },

  // ---- SCREEN 4 — the true count (99:491) ----
  {
    id: "4",
    anchor: THE_CLEARING,
    role: "totalline",
    numberLine: true,
    // Long enough to watch the number travel down to the line and then read
    // it there. On reading pace alone this beat ended about a tenth of a
    // second after the marker landed.
    dwell: 3800,
    layers: [
      BG,
      { src: `${IMG}agni_f.webp`, x: 9, y: 481, w: 605, h: 553, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1372, y: 424, w: 465, h: 589, fx: "breathe-slow" }
    ],
    fireflies: { x: 576, y: 130 },
    counter: "total",
    bubble: {
      art: `${IMG}bub_4.webp`, who: "agni",
      x: 254, y: 251, w: 417, h: 201,
      text: "There are {total} twinkles"
    }
  },

  // ---- SCREEN 16 — the guess, next to the truth (119:734) ----
  {
    id: "16",
    anchor: THE_CLEARING,
    role: "guessline",
    numberLine: true,
    // Long enough to watch the number travel down to the line and then read
    // it there. On reading pace alone this beat ended about a tenth of a
    // second after the marker landed.
    dwell: 4600,
    layers: [
      BG,
      { src: `${IMG}agni_f.webp`, x: 9, y: 481, w: 605, h: 553, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1372, y: 424, w: 465, h: 589, fx: "breathe-slow" }
    ],
    fireflies: { x: 576, y: 130 },
    counter: "guess",
    bubble: {
      art: `${IMG}bub_4.webp`, who: "agni",
      x: 254, y: 251, w: 417, h: 201,
      text: "You guessed {guess}."
    }
  },

  // ---- SCREEN 4.2 — the verdict (106:657) ----
  {
    id: "4.2",
    anchor: THE_CLEARING,
    role: "verdict",
    layers: [
      BG,
      { src: `${IMG}agni_d.webp`, x: 84, y: 474, w: 342, h: 560, fill: CROP.agniD, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1355, y: 408, w: 465, h: 589, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_42.webp`, who: "agni",
      x: 276, y: 222, w: 376, h: 226,
      text: "{verdict}"
    }
  },

  // ---- SCREEN 5.1 — tap the lamp. Third interaction (99:575) ----
  {
    id: "5.1",
    anchor: THE_CLEARING,
    interact: "lamp",
    layers: [
      BG,
      { src: `${IMG}agni_g.webp`, x: 70, y: 489, w: 554, h: 512, fill: CROP.agniG, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1294, y: 412, w: 465, h: 589, fx: "breathe-slow" }
    ],
    lamp: { src: `${IMG}lamp_off.webp`, x: 807, y: 74, w: 272, h: 927, fill: CROP.lampOff },
    // What the tap turns it into — the exact art screen 5.2 stands on, so the
    // cut after it changes nothing about the lamp. It fades up as the flock
    // arrives; see strike() in js/game.js.
    lampLit: { src: `${IMG}lamp_on.webp`, x: 799, y: 74, w: 287, h: 927, fill: CROP.lampOn },
    // Where the glass is, in frame coordinates — the point the flock pours
    // into. Matches the firefly 5.2 draws inside it at (832..857, 263..289).
    lampGlass: { x: 902, y: 254 },
    bubble: {
      art: `${IMG}bub_51.webp`, who: "agni",
      x: 314, y: 300, w: 383, h: 184,
      text: "Tap the lamp!"
    }
  },

  // ---- SCREEN 5.2 — the lamp catches one (112:132) ----
  {
    id: "5.2",
    anchor: THE_CLEARING,
    layers: [
      BG,
      { src: `${IMG}agni_g.webp`, x: 70, y: 489, w: 554, h: 512, fill: CROP.agniG, fx: "breathe" },
      { src: `${IMG}neel_turn.webp`, x: 1125, y: 391, w: 735, h: 610, fill: CROP.neelTurn, flipX: true, fx: "breathe-slow" },
      { src: `${IMG}lamp_on.webp`, x: 799, y: 74, w: 287, h: 927, fill: CROP.lampOn, fx: "lamp-glow" },
      { src: FIREFLY_SRC, x: 832, y: 263, w: 25, h: 26, fx: "flicker" }
    ],
    // Neel's cheer, drawn as well as heard: comic-burst lettering over his
    // head as he spins to the lit lamp. Matches vo_neel_yay in the cue table.
    shout: { text: "YAY!", x: 1264, y: 258, tilt: -9 }
  },

  // ---- SCREEN 6.1 — handing over (99:587) ----
  {
    id: "6.1",
    anchor: TOGETHER,
    layers: [
      BG,
      { src: `${IMG}agni_b.webp`, x: 398, y: 460, w: 495, h: 549, fill: CROP.agniB, fx: "breathe" },
      { src: `${IMG}neel_e.webp`, x: 945, y: 310, w: 567, h: 667, fill: CROP.neelE, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_61.webp`, who: "agni",
      x: 646, y: 186, w: 361, h: 199,
      text: "Now, it is your turn."
    }
  },

  // ---- SCREEN 6.1b — the loop restated (106:672) ----
  {
    id: "6.2",
    anchor: TOGETHER,
    layers: [
      BG,
      { src: `${IMG}agni_e.webp`, x: 441, y: 389, w: 450, h: 623, fill: CROP.agniE, fx: "breathe" },
      { src: `${IMG}neel_g.webp`, x: 1039, y: 366, w: 462, h: 646, fill: CROP.neelG, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_62.webp`, who: "agni",
      x: 667, y: 77, w: 492, h: 281,
      text: "Make a guess, and count to check!"
    }
  }
];

/* ---- Level 1 — the practice round in the meadow (sheet: Practice Game
   Screens). The tutorial's own loop, run by the player: look, guess, count,
   verdict, lamp. The four story beats that set the problem up (1.1..1.4) and
   the two that hand the game over (6.1, 6.2) belong to the tutorial and are
   not repeated; the readback beat (2.2) is not either — there Neel models a
   guess, and here the guess is the player's own.

   Poses, marks, bubbles and fittings are the tutorial's: the pair stand on
   THE_CLEARING anchors (on the meadow they land on the grass flanking the
   stone path), and the keypad, counter, number line and lamp keep their
   coordinates. What changes is the painting behind them and what there is to
   count. */
export const level1 = [
  // ---- P1 — look before you guess ----
  {
    id: "p1",
    anchor: THE_CLEARING,
    layers: [
      BG_MEADOW,
      { src: `${IMG}agni_b.webp`, x: 25, y: 445, w: 553, h: 614, fill: CROP.agniB, fx: "breathe" },
      { src: `${IMG}neel_think.webp`, x: 1327, y: 395, w: 372, h: 617, fill: CROP.neelThink, flipX: true, fx: "breathe-slow" }
    ],
    // Same clock as tutorial 1.5: her line ends (vo_g_guess runs 500 to 2581),
    // the bubble goes, the berries materialise, hold five seconds, vanish.
    fireflies: { x: 630, y: 145, enter: "magic", at: 2650 },
    dwell: 10000,
    bubble: {
      art: `${IMG}bub_15.webp`, who: "agni",
      x: 224, y: 107, w: 514, h: 277,
      text: "Look closely and make a guess!"
    }
  },

  // ---- P2 — the keypad ----
  {
    id: "p2",
    anchor: THE_CLEARING,
    interact: "keypad",
    counter: "guess",
    layers: [
      BG_MEADOW,
      { src: `${IMG}agni_talk.webp`, x: 10, y: 485, w: 576, h: 532, fill: CROP.agniTalk, flipX: true, fx: "breathe" },
      { src: `${IMG}neel_think.webp`, x: 1369, y: 386, w: 372, h: 617, fill: CROP.neelThink, flipX: true, fx: "breathe-slow" }
    ],
    keypad: true,
    // vo_l1_howmany runs 500 to 2250.
    keypadAt: 2350,
    bubble: {
      art: `${IMG}bub_15.webp`, who: "agni",
      x: 0, y: 185, w: 514, h: 277,
      text: "How many glowberries were there?"
    }
  },

  // ---- P3 — the berries come back, dim, to be counted ----
  {
    id: "p3",
    anchor: THE_CLEARING,
    counter: "guess",
    layers: [
      BG_MEADOW,
      { src: `${IMG}agni_point.webp`, x: 64, y: 498, w: 525, h: 501, fill: CROP.agniPoint, fx: "breathe" },
      { src: `${IMG}neel_d.webp`, x: 1344, y: 417, w: 449, h: 581, fill: CROP.neelD, flipX: true, fx: "breathe-slow" }
    ],
    fireflies: { x: 630, y: 145, dim: true },
    bubble: {
      art: `${IMG}bub_3.webp`, who: "agni",
      x: 220, y: 216, w: 557, h: 282,
      artInset: [18.09, 9.69, 0, 17.06],
      text: "Let us count to check."
    }
  },

  // ---- P3.2 — tap each one ----
  {
    id: "p3.2",
    anchor: THE_CLEARING,
    interact: "count",
    layers: [
      BG_MEADOW,
      { src: `${IMG}agni_g.webp`, x: 80, y: 490, w: 554, h: 512, fill: CROP.agniG, fx: "breathe" },
      { src: `${IMG}neel_c.webp`, x: 1385, y: 484, w: 396, h: 557, fill: CROP.neelC, fx: "breathe-slow" }
    ],
    fireflies: { x: 630, y: 145 },
    counter: "guess",
    numberLine: true,
    hint: { src: `${SHARED}hand_nudge.svg`, x: 596, y: 128, w: 308.396, h: 308.396 },
    bubble: {
      art: `${IMG}bub_32.webp`, who: "agni",
      x: 190, y: 248, w: 489, h: 256,
      text: "Tap each glowberry to count."
    }
  },

  // ---- P4 — the true count ----
  {
    id: "p4",
    anchor: THE_CLEARING,
    role: "totalline",
    numberLine: true,
    dwell: 3800,
    layers: [
      BG_MEADOW,
      { src: `${IMG}agni_f.webp`, x: 9, y: 481, w: 605, h: 553, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1372, y: 424, w: 465, h: 589, fx: "breathe-slow" }
    ],
    fireflies: { x: 630, y: 145 },
    counter: "total",
    bubble: {
      art: `${IMG}bub_4.webp`, who: "agni",
      x: 254, y: 251, w: 417, h: 201,
      text: "There are {total} glowberries"
    }
  },

  // ---- P16 — the guess, next to the truth ----
  {
    id: "p16",
    anchor: THE_CLEARING,
    role: "guessline",
    numberLine: true,
    dwell: 4600,
    layers: [
      BG_MEADOW,
      { src: `${IMG}agni_f.webp`, x: 9, y: 481, w: 605, h: 553, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1372, y: 424, w: 465, h: 589, fx: "breathe-slow" }
    ],
    fireflies: { x: 630, y: 145 },
    counter: "guess",
    bubble: {
      art: `${IMG}bub_4.webp`, who: "agni",
      x: 254, y: 251, w: 417, h: 201,
      text: "You guessed {guess}."
    }
  },

  // ---- P4.2 — the verdict ----
  {
    id: "p4.2",
    anchor: THE_CLEARING,
    role: "verdict",
    layers: [
      BG_MEADOW,
      { src: `${IMG}agni_d.webp`, x: 84, y: 474, w: 342, h: 560, fill: CROP.agniD, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1355, y: 408, w: 465, h: 589, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_42.webp`, who: "agni",
      x: 276, y: 222, w: 376, h: 226,
      text: "{verdict}"
    }
  },

  // ---- P5.1 — tap the lamp ----
  {
    id: "p5.1",
    anchor: THE_CLEARING,
    interact: "lamp",
    layers: [
      BG_MEADOW,
      { src: `${IMG}agni_g.webp`, x: 70, y: 489, w: 554, h: 512, fill: CROP.agniG, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1294, y: 412, w: 465, h: 589, fx: "breathe-slow" }
    ],
    lamp: { src: `${IMG}lamp_off.webp`, x: 807, y: 74, w: 272, h: 927, fill: CROP.lampOff },
    lampLit: { src: `${IMG}lamp_on.webp`, x: 799, y: 74, w: 287, h: 927, fill: CROP.lampOn },
    lampGlass: { x: 902, y: 254 },
    bubble: {
      art: `${IMG}bub_51.webp`, who: "agni",
      x: 314, y: 300, w: 383, h: 184,
      text: "Tap the lamp!"
    }
  },

  // ---- P5.2 — the lamp catches a berry, and Neel cheers ----
  {
    id: "p5.2",
    anchor: THE_CLEARING,
    layers: [
      BG_MEADOW,
      { src: `${IMG}agni_g.webp`, x: 70, y: 489, w: 554, h: 512, fill: CROP.agniG, fx: "breathe" },
      { src: `${IMG}neel_turn.webp`, x: 1125, y: 391, w: 735, h: 610, fill: CROP.neelTurn, flipX: true, fx: "breathe-slow" },
      { src: `${IMG}lamp_on.webp`, x: 799, y: 74, w: 287, h: 927, fill: CROP.lampOn, fx: "lamp-glow" },
      // The caught one, glowing in the glass where the tutorial kept its
      // firefly.
      { src: BERRY_SRC, x: 833, y: 262, w: 24, h: 27, fx: "flicker" }
    ],
    shout: { text: "YAY!", x: 1264, y: 258, tilt: -9 }
  }
];

/* ---- Level 2 — the starlights, in Starlight Valley ----

   Level 1's nine beats again, in the valley. Everything the round does not
   care about is held identical on purpose — the pair keep THE_CLEARING marks
   (on the valley they land on the stone path and the grass beside it), and the
   keypad, counter, number line and lamp keep their coordinates, so the child
   meets the same machine in a new place. Only four things move: the painting
   behind them, what there is to count, the word for it, and the ids.

   The swarm origin puts the two rows of three exactly where the berries sat —
   both groups centre on (998, 356), so the eye does not have to re-find the
   countable when the place changes. */
export const level2 = [
  // ---- S1 — look before you guess ----
  {
    id: "s1",
    anchor: THE_CLEARING,
    layers: [
      BG_VALLEY,
      { src: `${IMG}agni_b.webp`, x: 25, y: 445, w: 553, h: 614, fill: CROP.agniB, fx: "breathe" },
      { src: `${IMG}neel_think.webp`, x: 1327, y: 395, w: 372, h: 617, fill: CROP.neelThink, flipX: true, fx: "breathe-slow" }
    ],
    // Same clock as level 1's p1: her line ends (vo_g_guess runs 500 to 2581),
    // the bubble goes, the stars materialise, hold five seconds, vanish.
    fireflies: { x: 688, y: 174, enter: "magic", at: 2650 },
    dwell: 10000,
    bubble: {
      art: `${IMG}bub_15.webp`, who: "agni",
      x: 224, y: 107, w: 514, h: 277,
      text: "Look closely and make a guess!"
    }
  },

  // ---- S2 — the keypad ----
  {
    id: "s2",
    anchor: THE_CLEARING,
    interact: "keypad",
    counter: "guess",
    layers: [
      BG_VALLEY,
      { src: `${IMG}agni_talk.webp`, x: 10, y: 485, w: 576, h: 532, fill: CROP.agniTalk, flipX: true, fx: "breathe" },
      { src: `${IMG}neel_think.webp`, x: 1369, y: 386, w: 372, h: 617, fill: CROP.neelThink, flipX: true, fx: "breathe-slow" }
    ],
    keypad: true,
    // vo_l2_howmany runs 500 to 2250 — same length as level 1's question.
    keypadAt: 2350,
    bubble: {
      art: `${IMG}bub_15.webp`, who: "agni",
      x: 0, y: 185, w: 514, h: 277,
      text: "How many starlights were there?"
    }
  },

  // ---- S3 — the stars come back, dim, to be counted ----
  {
    id: "s3",
    anchor: THE_CLEARING,
    counter: "guess",
    layers: [
      BG_VALLEY,
      { src: `${IMG}agni_point.webp`, x: 64, y: 498, w: 525, h: 501, fill: CROP.agniPoint, fx: "breathe" },
      { src: `${IMG}neel_d.webp`, x: 1344, y: 417, w: 449, h: 581, fill: CROP.neelD, flipX: true, fx: "breathe-slow" }
    ],
    fireflies: { x: 688, y: 174, dim: true },
    bubble: {
      art: `${IMG}bub_3.webp`, who: "agni",
      x: 220, y: 216, w: 557, h: 282,
      artInset: [18.09, 9.69, 0, 17.06],
      text: "Let us count to check."
    }
  },

  // ---- S3.2 — tap each one ----
  {
    id: "s3.2",
    anchor: THE_CLEARING,
    interact: "count",
    layers: [
      BG_VALLEY,
      { src: `${IMG}agni_g.webp`, x: 80, y: 490, w: 554, h: 512, fill: CROP.agniG, fx: "breathe" },
      { src: `${IMG}neel_c.webp`, x: 1385, y: 484, w: 396, h: 557, fill: CROP.neelC, fx: "breathe-slow" }
    ],
    fireflies: { x: 688, y: 174 },
    counter: "guess",
    numberLine: true,
    // The hand keeps the offset it has from the first countable on level 1
    // (-34, -17 from that box's own origin), so it points at the first star
    // the same way it points at the first berry.
    hint: { src: `${SHARED}hand_nudge.svg`, x: 654, y: 157, w: 308.396, h: 308.396 },
    bubble: {
      art: `${IMG}bub_32.webp`, who: "agni",
      x: 190, y: 248, w: 489, h: 256,
      text: "Tap each starlight to count."
    }
  },

  // ---- S4 — the true count ----
  {
    id: "s4",
    anchor: THE_CLEARING,
    role: "totalline",
    numberLine: true,
    dwell: 3800,
    layers: [
      BG_VALLEY,
      { src: `${IMG}agni_f.webp`, x: 9, y: 481, w: 605, h: 553, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1372, y: 424, w: 465, h: 589, fx: "breathe-slow" }
    ],
    fireflies: { x: 688, y: 174 },
    counter: "total",
    bubble: {
      art: `${IMG}bub_4.webp`, who: "agni",
      x: 254, y: 251, w: 417, h: 201,
      text: "There are {total} starlights"
    }
  },

  // ---- S16 — the guess, next to the truth ----
  {
    id: "s16",
    anchor: THE_CLEARING,
    role: "guessline",
    numberLine: true,
    dwell: 4600,
    layers: [
      BG_VALLEY,
      { src: `${IMG}agni_f.webp`, x: 9, y: 481, w: 605, h: 553, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1372, y: 424, w: 465, h: 589, fx: "breathe-slow" }
    ],
    fireflies: { x: 688, y: 174 },
    counter: "guess",
    bubble: {
      art: `${IMG}bub_4.webp`, who: "agni",
      x: 254, y: 251, w: 417, h: 201,
      text: "You guessed {guess}."
    }
  },

  // ---- S4.2 — the verdict ----
  {
    id: "s4.2",
    anchor: THE_CLEARING,
    role: "verdict",
    layers: [
      BG_VALLEY,
      { src: `${IMG}agni_d.webp`, x: 84, y: 474, w: 342, h: 560, fill: CROP.agniD, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1355, y: 408, w: 465, h: 589, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_42.webp`, who: "agni",
      x: 276, y: 222, w: 376, h: 226,
      text: "{verdict}"
    }
  },

  // ---- S5.1 — tap the lamp ----
  {
    id: "s5.1",
    anchor: THE_CLEARING,
    interact: "lamp",
    layers: [
      BG_VALLEY,
      { src: `${IMG}agni_g.webp`, x: 70, y: 489, w: 554, h: 512, fill: CROP.agniG, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1294, y: 412, w: 465, h: 589, fx: "breathe-slow" }
    ],
    lamp: { src: `${IMG}lamp_off.webp`, x: 807, y: 74, w: 272, h: 927, fill: CROP.lampOff },
    lampLit: { src: `${IMG}lamp_on.webp`, x: 799, y: 74, w: 287, h: 927, fill: CROP.lampOn },
    lampGlass: { x: 902, y: 254 },
    bubble: {
      art: `${IMG}bub_51.webp`, who: "agni",
      x: 314, y: 300, w: 383, h: 184,
      text: "Tap the lamp!"
    }
  },

  // ---- S5.2 — the lamp catches a star, and Neel cheers ----
  {
    id: "s5.2",
    anchor: THE_CLEARING,
    layers: [
      BG_VALLEY,
      { src: `${IMG}agni_g.webp`, x: 70, y: 489, w: 554, h: 512, fill: CROP.agniG, fx: "breathe" },
      { src: `${IMG}neel_turn.webp`, x: 1125, y: 391, w: 735, h: 610, fill: CROP.neelTurn, flipX: true, fx: "breathe-slow" },
      { src: `${IMG}lamp_on.webp`, x: 799, y: 74, w: 287, h: 927, fill: CROP.lampOn, fx: "lamp-glow" },
      // The caught one, in the glass where level 1 keeps its berry. Sized to
      // the star's aspect on the same centre (845, 276), so all three levels
      // hold their catch in exactly the same spot.
      { src: STARLIGHT_SRC, x: 832, y: 263, w: 26, h: 25, fx: "flicker" }
    ],
    shout: { text: "YAY!", x: 1264, y: 258, tilt: -9 }
  }
];

/* ---- Level 3 — the magic seeds, in the forest ----

   The same nine beats a third time, in the Magic Seed Forest. As with level 2,
   everything the round does not care about is held identical — THE_CLEARING
   marks, the poses, the bubbles, and the keypad, counter, number line and lamp
   coordinates — so only the place, the countable, its name and the ids move.

   The 3 x 3 grid centres on (998, 357), the same point the berries and the
   starlights centre on, so the countable is always in the same place on screen
   whatever it happens to be that round. */
export const level3 = [
  // ---- M1 — look before you guess ----
  {
    id: "m1",
    anchor: THE_CLEARING,
    layers: [
      BG_FOREST,
      { src: `${IMG}agni_b.webp`, x: 25, y: 445, w: 553, h: 614, fill: CROP.agniB, fx: "breathe" },
      { src: `${IMG}neel_think.webp`, x: 1327, y: 395, w: 372, h: 617, fill: CROP.neelThink, flipX: true, fx: "breathe-slow" }
    ],
    // Same clock as p1 and s1: her line ends (vo_g_guess runs 500 to 2581),
    // the bubble goes, the seeds materialise, hold five seconds, vanish.
    fireflies: { x: 696, y: 40, enter: "magic", at: 2650 },
    dwell: 10000,
    bubble: {
      art: `${IMG}bub_15.webp`, who: "agni",
      x: 224, y: 107, w: 514, h: 277,
      text: "Look closely and make a guess!"
    }
  },

  // ---- M2 — the keypad ----
  {
    id: "m2",
    anchor: THE_CLEARING,
    interact: "keypad",
    counter: "guess",
    layers: [
      BG_FOREST,
      { src: `${IMG}agni_talk.webp`, x: 10, y: 485, w: 576, h: 532, fill: CROP.agniTalk, flipX: true, fx: "breathe" },
      { src: `${IMG}neel_think.webp`, x: 1369, y: 386, w: 372, h: 617, fill: CROP.neelThink, flipX: true, fx: "breathe-slow" }
    ],
    keypad: true,
    // vo_l3_howmany runs 500 to 2250 — the same length as the other two.
    keypadAt: 2350,
    bubble: {
      art: `${IMG}bub_15.webp`, who: "agni",
      x: 0, y: 185, w: 514, h: 277,
      text: "How many magic seeds were there?"
    }
  },

  // ---- M3 — the seeds come back, dim, to be counted ----
  {
    id: "m3",
    anchor: THE_CLEARING,
    counter: "guess",
    layers: [
      BG_FOREST,
      { src: `${IMG}agni_point.webp`, x: 64, y: 498, w: 525, h: 501, fill: CROP.agniPoint, fx: "breathe" },
      { src: `${IMG}neel_d.webp`, x: 1344, y: 417, w: 449, h: 581, fill: CROP.neelD, flipX: true, fx: "breathe-slow" }
    ],
    fireflies: { x: 696, y: 40, dim: true },
    bubble: {
      art: `${IMG}bub_3.webp`, who: "agni",
      x: 220, y: 216, w: 557, h: 282,
      artInset: [18.09, 9.69, 0, 17.06],
      text: "Let us count to check."
    }
  },

  // ---- M3.2 — tap each one ----
  {
    id: "m3.2",
    anchor: THE_CLEARING,
    interact: "count",
    layers: [
      BG_FOREST,
      { src: `${IMG}agni_g.webp`, x: 80, y: 490, w: 554, h: 512, fill: CROP.agniG, fx: "breathe" },
      { src: `${IMG}neel_c.webp`, x: 1385, y: 484, w: 396, h: 557, fill: CROP.neelC, fx: "breathe-slow" }
    ],
    fireflies: { x: 696, y: 40 },
    counter: "guess",
    numberLine: true,
    // The hand keeps level 1's offset from the first countable's own box
    // origin (-34, -17), so it points at the first seed the same way.
    hint: { src: `${SHARED}hand_nudge.svg`, x: 662, y: 23, w: 308.396, h: 308.396 },
    bubble: {
      art: `${IMG}bub_32.webp`, who: "agni",
      x: 190, y: 248, w: 489, h: 256,
      text: "Tap each magic seed to count."
    }
  },

  // ---- M4 — the true count ----
  {
    id: "m4",
    anchor: THE_CLEARING,
    role: "totalline",
    numberLine: true,
    dwell: 3800,
    layers: [
      BG_FOREST,
      { src: `${IMG}agni_f.webp`, x: 9, y: 481, w: 605, h: 553, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1372, y: 424, w: 465, h: 589, fx: "breathe-slow" }
    ],
    fireflies: { x: 696, y: 40 },
    counter: "total",
    bubble: {
      art: `${IMG}bub_4.webp`, who: "agni",
      x: 254, y: 251, w: 417, h: 201,
      text: "There are {total} magic seeds"
    }
  },

  // ---- M16 — the guess, next to the truth ----
  {
    id: "m16",
    anchor: THE_CLEARING,
    role: "guessline",
    numberLine: true,
    dwell: 4600,
    layers: [
      BG_FOREST,
      { src: `${IMG}agni_f.webp`, x: 9, y: 481, w: 605, h: 553, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1372, y: 424, w: 465, h: 589, fx: "breathe-slow" }
    ],
    fireflies: { x: 696, y: 40 },
    counter: "guess",
    bubble: {
      art: `${IMG}bub_4.webp`, who: "agni",
      x: 254, y: 251, w: 417, h: 201,
      text: "You guessed {guess}."
    }
  },

  // ---- M4.2 — the verdict ----
  {
    id: "m4.2",
    anchor: THE_CLEARING,
    role: "verdict",
    layers: [
      BG_FOREST,
      { src: `${IMG}agni_d.webp`, x: 84, y: 474, w: 342, h: 560, fill: CROP.agniD, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1355, y: 408, w: 465, h: 589, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_42.webp`, who: "agni",
      x: 276, y: 222, w: 376, h: 226,
      text: "{verdict}"
    }
  },

  // ---- M5.1 — tap the lamp ----
  {
    id: "m5.1",
    anchor: THE_CLEARING,
    interact: "lamp",
    layers: [
      BG_FOREST,
      { src: `${IMG}agni_g.webp`, x: 70, y: 489, w: 554, h: 512, fill: CROP.agniG, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1294, y: 412, w: 465, h: 589, fx: "breathe-slow" }
    ],
    lamp: { src: `${IMG}lamp_off.webp`, x: 807, y: 74, w: 272, h: 927, fill: CROP.lampOff },
    lampLit: { src: `${IMG}lamp_on.webp`, x: 799, y: 74, w: 287, h: 927, fill: CROP.lampOn },
    lampGlass: { x: 902, y: 254 },
    bubble: {
      art: `${IMG}bub_51.webp`, who: "agni",
      x: 314, y: 300, w: 383, h: 184,
      text: "Tap the lamp!"
    }
  },

  // ---- M5.2 — the lamp catches a seed, and Neel cheers ----
  {
    id: "m5.2",
    anchor: THE_CLEARING,
    layers: [
      BG_FOREST,
      { src: `${IMG}agni_g.webp`, x: 70, y: 489, w: 554, h: 512, fill: CROP.agniG, fx: "breathe" },
      { src: `${IMG}neel_turn.webp`, x: 1125, y: 391, w: 735, h: 610, fill: CROP.neelTurn, flipX: true, fx: "breathe-slow" },
      { src: `${IMG}lamp_on.webp`, x: 799, y: 74, w: 287, h: 927, fill: CROP.lampOn, fx: "lamp-glow" },
      // The caught one, sized to the seed's aspect on the shared centre
      // (845, 276) — the same spot all four levels hold their catch.
      { src: SEED_SRC, x: 834, y: 261, w: 22, h: 29, fx: "flicker" }
    ],
    shout: { text: "YAY!", x: 1264, y: 258, tilt: -9 }
  }
];

/* ---- the levels, in playing order ----

   Everything js/game.js needs to run a round with a different element in a
   different place: which screens, what is counted (art, layout, how many), what
   the thing is called, and the class that restyles the swarm's glow. The
   tutorial is level zero — same machine, plus its extra story beats. `walkTo`
   names the walk destination (js/data/walk.js) that leads INTO the level. */
export const levels = [
  {
    name: "Tutorial — the twinkles",
    word: "Twinkle",
    total: TOTAL,
    swarmSrc: FIREFLY_SRC,
    layout: FIREFLIES,
    swarmClass: "",
    walkTo: "clearing",
    screens
  },
  {
    name: "Level 1 — the glowberries",
    word: "Glowberry",
    total: BERRY_TOTAL,
    swarmSrc: BERRY_SRC,
    layout: BERRIES,
    swarmClass: "is-berries",
    walkTo: "meadow",
    screens: level1
  },
  {
    name: "Level 2 — the starlights",
    word: "Starlight",
    total: STARLIGHT_TOTAL,
    swarmSrc: STARLIGHT_SRC,
    layout: STARLIGHTS,
    // The star art already glows gold, like the firefly the swarm styling was
    // built for, so it needs no restyling of its own.
    swarmClass: "",
    walkTo: "valley",
    screens: level2
  },
  {
    name: "Level 3 — the magic seeds",
    word: "Magic seed",
    total: SEED_TOTAL,
    swarmSrc: SEED_SRC,
    layout: MAGICSEEDS,
    // The seed is a lit thing rather than a light source, like the berry, and
    // it sits on the darkest background in the game — so it carries its own
    // amber halo and a dim state the forest cannot swallow. See css/game.css.
    swarmClass: "is-seeds",
    walkTo: "forest",
    screens: level3
  }
];

/* The keypad, from the `keypad` group (108:12). Key boxes are 116 x 85 on a
   120px pitch, which is what the design's 4px gaps work out to.

   The readout above it and both action keys are gone: the guess is one digit,
   so tapping a number is the whole interaction and there is nothing to clear or
   confirm. The ten digits keep the positions they had, which is why 0 still sits
   alone in the middle of the bottom row — and the panel is still behind them,
   because without it they had nothing holding them together. */
export const keypad = {
  // The panel behind the keys, back where Figma has it. Without it the digits
  // floated on the background with nothing holding them together.
  frame: { src: `${IMG}keypad.webp`, x: 665, y: 184, w: 553, h: 691 },
  keyW: 116,
  keyH: 85,
  keyArt: `${IMG}key.webp`,
  keyFill: CROP.key,
  // Every row is 60px above where Figma has it. The readout used to fill the top
  // of the panel and the keys sat under it; with the readout gone that left a
  // third of the panel empty. Measured off the art: the cream face runs from
  // y 267 to 802, centre 534, and the key block's own centre was 594.
  keys: [
    { label: "1", x: 766, y: 361 },
    { label: "2", x: 886, y: 361 },
    { label: "3", x: 1006, y: 361 },
    { label: "4", x: 766, y: 448 },
    { label: "5", x: 886, y: 448 },
    { label: "6", x: 1006, y: 448 },
    { label: "7", x: 766, y: 535 },
    { label: "8", x: 886, y: 535 },
    { label: "9", x: 1006, y: 535 },
    { label: "0", x: 886, y: 622 }
  ]
};

/* The number line under the count, where the guess and the answer are put side
   by side. Eleven marks, 0 to 10, kept clear of both characters — Agni's box
   ends at 634 and Neel's begins at 1385. */
export const numberLine = { x: 500, y: 866, w: 900, max: 10 };

// The counter card (99:487).
export const counter = { src: `${IMG}counter.webp`, x: 1490, y: 57, w: 338, h: 190 };

// Everything the game needs on screen, in one list, for the preloader —
// every level's screens and every level's countable, so a later level never
// stops to fetch mid-chapter.
export const manifest = [
  ...new Set([
    ...levels.flatMap((level) => [
      ...level.screens.flatMap((screen) => [
        ...screen.layers.map((layer) => layer.src),
        ...(screen.lamp ? [screen.lamp.src] : []),
        ...(screen.lampLit ? [screen.lampLit.src] : []),
        ...(screen.hint ? [screen.hint.src] : []),
        ...(screen.bubble ? [screen.bubble.art] : [])
      ]),
      level.swarmSrc
    ]),
    keypad.frame.src,
    keypad.keyArt,
    counter.src
  ])
];
