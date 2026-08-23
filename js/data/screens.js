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
// exceptions are bg_night.png (opaque anyway, and the export is higher
// resolution than the source) and firefly.png (its export kept its alpha and
// arrives already cropped, so it needs no transform).

const IMG = "assets/game/";

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

export const FIREFLY_SRC = `${IMG}firefly.png`;

const BG = { src: `${IMG}bg_night.png`, x: 0, y: 0, w: FRAME_W, h: FRAME_H };

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
    layers: [
      BG,
      { src: `${IMG}agni_point.png`, x: 64, y: 498, w: 525, h: 501, fill: CROP.agniPoint, fx: "breathe" },
      { src: `${IMG}neel_point_up.png`, x: 1382, y: 447, w: 465, h: 559, fill: CROP.neelPointUp, flipX: true, fx: "breathe-slow" }
    ],
    fireflies: { x: 586, y: 42 },
    bubble: {
      art: `${IMG}bub_11.png`, mirror: true,
      x: 213, y: 291, w: 416, h: 229,
      text: "Look, light keepers!"
    }
  },

  // ---- SCREEN 1.2 — the swarm is gone (99:426) ----
  {
    id: "1.2",
    layers: [
      BG,
      { src: `${IMG}agni_talk.png`, x: 10, y: 485, w: 576, h: 532, fill: CROP.agniTalk, flipX: true, fx: "breathe" },
      { src: `${IMG}neel_a.png`, x: 1327, y: 434, w: 377, h: 573, fill: CROP.neelA, flipX: true, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_12.png`, mirror: true,
      x: 216, y: 242, w: 495, h: 253,
      text: "Huh? Where did they go?"
    }
  },

  // ---- SCREEN 1.3 — the problem is stated (99:436) ----
  {
    id: "1.3",
    layers: [
      BG,
      { src: `${IMG}agni_a.png`, x: 25, y: 415, w: 590, h: 612, fill: CROP.agniA, fx: "breathe" },
      { src: `${IMG}neel_b.png`, x: 1347, y: 400, w: 376, h: 611, fill: CROP.neelB, flipX: true, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_13.png`, mirror: true,
      x: 234, y: 130, w: 596, h: 314,
      artInset: [8.7, 0, 0, 3.23],
      text: "We need to find how many lightkeepers were there."
    }
  },

  // ---- SCREEN 1.4 — Neel supplies the motive (99:601) ----
  {
    id: "1.4",
    layers: [
      BG,
      { src: `${IMG}agni_f.png`, x: 34, y: 461, w: 605, h: 553, fx: "breathe" },
      { src: `${IMG}neel_e.png`, x: 1146, y: 344, w: 567, h: 667, fill: CROP.neelE, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_neel.png`, mirror: true,
      x: 1183, y: 176, w: 400, h: 237,
      text: "Then we can catch them!"
    }
  },

  // ---- SCREEN 1.5 — look before you guess (99:620) ----
  {
    id: "1.5",
    layers: [
      BG,
      { src: `${IMG}agni_b.png`, x: 25, y: 445, w: 553, h: 614, fill: CROP.agniB, fx: "breathe" },
      { src: `${IMG}neel_think.png`, x: 1327, y: 395, w: 372, h: 617, fill: CROP.neelThink, flipX: true, fx: "breathe-slow" }
    ],
    fireflies: { x: 600, y: 19 },
    bubble: {
      art: `${IMG}bub_15.png`, mirror: true,
      x: 224, y: 200, w: 514, h: 277,
      text: "Look closely and make a guess!"
    }
  },

  // ---- SCREEN 2 — the keypad. First interaction (99:449) ----
  {
    id: "2",
    interact: "keypad",
    layers: [
      BG,
      { src: `${IMG}neel_think.png`, x: 1369, y: 386, w: 372, h: 617, fill: CROP.neelThink, flipX: true, fx: "breathe-slow" }
    ],
    keypad: true,
    bubble: {
      art: `${IMG}bub_15.png`, mirror: true,
      x: 0, y: 202, w: 514, h: 277,
      text: "How many light keepers were there?"
    }
  },

  // ---- SCREEN 2.2 — Neel reads the guess back (101:642) ----
  {
    id: "2.2",
    layers: [
      BG,
      { src: `${IMG}agni_c.png`, x: 23, y: 396, w: 473, h: 651, fill: CROP.agniC, fx: "breathe" },
      { src: `${IMG}neel_c.png`, x: 1382, y: 428, w: 434, h: 611, fill: CROP.neelC, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_neel.png`, mirror: true,
      x: 1218, y: 207, w: 400, h: 237,
      text: "Hmm… I think there were {guess}."
    }
  },

  // ---- SCREEN 3 — the swarm is back, time to count (99:459) ----
  {
    id: "3",
    layers: [
      BG,
      { src: `${IMG}agni_point.png`, x: 64, y: 498, w: 525, h: 501, fill: CROP.agniPoint, fx: "breathe" },
      { src: `${IMG}neel_d.png`, x: 1344, y: 417, w: 449, h: 581, fill: CROP.neelD, flipX: true, fx: "breathe-slow" }
    ],
    fireflies: { x: 606, y: 63 },
    bubble: {
      art: `${IMG}bub_3.png`, mirror: true,
      x: 220, y: 216, w: 557, h: 282,
      artInset: [18.09, 9.69, 0, 17.06],
      text: "Let us count to check."
    }
  },

  // ---- SCREEN 3.2 — tap each one. Second interaction (99:469) ----
  {
    id: "3.2",
    interact: "count",
    layers: [
      BG,
      { src: `${IMG}agni_g.png`, x: 80, y: 490, w: 554, h: 512, fill: CROP.agniG, fx: "breathe" },
      { src: `${IMG}neel_c.png`, x: 1385, y: 484, w: 396, h: 557, fill: CROP.neelC, fx: "breathe-slow" }
    ],
    fireflies: { x: 664, y: 60 },
    counter: "live",
    hint: { src: `${IMG}tap_hint.gif`, x: 568, y: 43, w: 308.396, h: 308.396 },
    bubble: {
      art: `${IMG}bub_32.png`, mirror: true,
      x: 220, y: 242, w: 489, h: 256,
      text: "Tap each light keeper to count."
    }
  },

  // ---- SCREEN 4 — the true count (99:491) ----
  {
    id: "4",
    layers: [
      BG,
      { src: `${IMG}agni_f.png`, x: 9, y: 481, w: 605, h: 553, fx: "breathe" },
      { src: `${IMG}neel_f.png`, x: 1372, y: 424, w: 465, h: 589, fx: "breathe-slow" }
    ],
    fireflies: { x: 576, y: 92 },
    counter: "total",
    bubble: {
      art: `${IMG}bub_4.png`, mirror: true,
      x: 254, y: 280, w: 417, h: 201,
      text: "There are {total} lightkeepers"
    }
  },

  // ---- SCREEN 16 — the guess, next to the truth (119:734) ----
  {
    id: "16",
    layers: [
      BG,
      { src: `${IMG}agni_f.png`, x: 9, y: 481, w: 605, h: 553, fx: "breathe" },
      { src: `${IMG}neel_f.png`, x: 1372, y: 424, w: 465, h: 589, fx: "breathe-slow" }
    ],
    fireflies: { x: 576, y: 92 },
    counter: "total",
    bubble: {
      art: `${IMG}bub_4.png`, mirror: true,
      x: 254, y: 280, w: 417, h: 201,
      text: "You guessed {guess}."
    }
  },

  // ---- SCREEN 4.2 — the verdict (106:657) ----
  {
    id: "4.2",
    layers: [
      BG,
      { src: `${IMG}agni_d.png`, x: 84, y: 474, w: 342, h: 560, fill: CROP.agniD, fx: "breathe" },
      { src: `${IMG}neel_f.png`, x: 1355, y: 408, w: 465, h: 589, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_42.png`, mirror: true,
      x: 276, y: 248, w: 376, h: 226,
      text: "{verdict}"
    }
  },

  // ---- SCREEN 5.1 — tap the lamp. Third interaction (99:575) ----
  {
    id: "5.1",
    interact: "lamp",
    layers: [
      BG,
      { src: `${IMG}agni_g.png`, x: 70, y: 489, w: 554, h: 512, fill: CROP.agniG, fx: "breathe" },
      { src: `${IMG}neel_f.png`, x: 1294, y: 412, w: 465, h: 589, fx: "breathe-slow" }
    ],
    lamp: { src: `${IMG}lamp_off.png`, x: 807, y: 74, w: 272, h: 927, fill: CROP.lampOff },
    bubble: {
      art: `${IMG}bub_51.png`, mirror: false,
      x: 314, y: 300, w: 383, h: 184,
      text: "Tap the lamp!"
    }
  },

  // ---- SCREEN 5.2 — the lamp catches one (112:132) ----
  {
    id: "5.2",
    layers: [
      BG,
      { src: `${IMG}agni_g.png`, x: 70, y: 489, w: 554, h: 512, fill: CROP.agniG, fx: "breathe" },
      { src: `${IMG}neel_turn.png`, x: 1125, y: 391, w: 735, h: 610, fill: CROP.neelTurn, flipX: true, fx: "breathe-slow" },
      { src: `${IMG}lamp_on.png`, x: 799, y: 74, w: 287, h: 927, fill: CROP.lampOn, fx: "lamp-glow" },
      { src: FIREFLY_SRC, x: 832, y: 263, w: 25, h: 26, fx: "flicker" }
    ]
  },

  // ---- SCREEN 6.1 — handing over (99:587) ----
  {
    id: "6.1",
    layers: [
      BG,
      { src: `${IMG}agni_b.png`, x: 398, y: 460, w: 495, h: 549, fill: CROP.agniB, fx: "breathe" },
      { src: `${IMG}neel_e.png`, x: 945, y: 310, w: 567, h: 667, fill: CROP.neelE, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_61.png`, mirror: false,
      x: 646, y: 186, w: 361, h: 199,
      text: "Now, it is your turn."
    }
  },

  // ---- SCREEN 6.1b — the loop restated (106:672) ----
  {
    id: "6.2",
    layers: [
      BG,
      { src: `${IMG}agni_e.png`, x: 441, y: 389, w: 450, h: 623, fill: CROP.agniE, fx: "breathe" },
      { src: `${IMG}neel_g.png`, x: 1039, y: 366, w: 462, h: 646, fill: CROP.neelG, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_62.png`, mirror: false,
      x: 667, y: 108, w: 492, h: 281,
      text: "Make a guess, and count to check!"
    }
  }
];

/* The keypad, from the `keypad` group (108:12). Key boxes are 116 x 85 on a
   120px pitch, which is what the design's 4px gaps work out to. */
export const keypad = {
  frame: { src: `${IMG}keypad.png`, x: 665, y: 184, w: 553, h: 691 },
  display: { src: `${IMG}num_display.png`, x: 766, y: 289, w: 356, h: 121, fill: CROP.numDisplay },
  keyW: 116,
  keyH: 85,
  keyArt: `${IMG}key.png`,
  keyFill: CROP.key,
  clearArt: `${IMG}key_x.png`,
  confirmArt: `${IMG}key_ok.png`,
  // The tick sits inset inside its key, at the size Figma gives it (146:12).
  tick: { src: `${IMG}tick.svg`, x: 30, y: 14, w: 56, h: 56 },
  keys: [
    { label: "1", x: 766, y: 421 },
    { label: "2", x: 886, y: 421 },
    { label: "3", x: 1006, y: 421 },
    { label: "4", x: 766, y: 508 },
    { label: "5", x: 886, y: 508 },
    { label: "6", x: 1006, y: 508 },
    { label: "7", x: 766, y: 595 },
    { label: "8", x: 886, y: 595 },
    { label: "9", x: 1006, y: 595 },
    { label: "X", x: 766, y: 682, clear: true },
    { label: "0", x: 886, y: 682 },
    { label: "OK", x: 1006, y: 682, confirm: true }
  ]
};

// The counter card (99:487).
export const counter = { src: `${IMG}counter.png`, x: 1490, y: 57, w: 338, h: 190 };

// Everything the game needs on screen, in one list, for the preloader.
export const manifest = [
  ...new Set([
    ...screens.flatMap((screen) => [
      ...screen.layers.map((layer) => layer.src),
      ...(screen.lamp ? [screen.lamp.src] : []),
      ...(screen.hint ? [screen.hint.src] : []),
      ...(screen.bubble ? [screen.bubble.art] : [])
    ]),
    FIREFLY_SRC,
    `${IMG}lamp_on.png`,
    keypad.frame.src,
    keypad.display.src,
    keypad.keyArt,
    keypad.clearArt,
    keypad.confirmArt,
    keypad.tick.src,
    counter.src
  ])
];
