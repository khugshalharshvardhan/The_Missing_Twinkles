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
// The sheet's formation for eight: two rows of four, equal spacing ("keep
// equal spacing... home positions must stay fixed"). 210px across — 250 like
// the others makes the row 866 wide, which runs into both characters — and
// 250 down, like every other level's rows.
export const FIREFLIES = [
  { x: 0, y: 0, w: 116, h: 122 },
  { x: 170, y: 0, w: 117, h: 123 },
  { x: 340, y: 0, w: 116, h: 122 },
  { x: 510, y: 0, w: 117, h: 123 },
  { x: 0, y: 210, w: 116, h: 122 },
  { x: 170, y: 210, w: 116, h: 122 },
  { x: 340, y: 210, w: 116, h: 122 },
  { x: 510, y: 210, w: 116, h: 122 }
];

export const FIREFLY_SRC = `${IMG}firefly.webp`;

const BG = { src: `${IMG}bg_night.webp`, x: 0, y: 0, w: FRAME_W, h: FRAME_H };

/* ---- Level 1 — the glowberries, in the meadow ----

   Same beats, different place and different thing to count. The meadow render
   (assets/images/location2.png, cut to the frame) stands in for bg_night, and
   the swarm slots hold glowberries instead of twinkles.

   TEN, the sheet's number, now that the pad takes two digits. It shipped as
   nine while a guess was a single tap and no total could exceed the pad.

   The layout is the sheet's design rule made literal — "keep equal spacing" —
   three staggered rows on a 250px pitch, against the tutorial's loose scatter.
   Boxes are 112x123 to match the berry art's own aspect (224x246), since the
   fill covers the box.

   The tenth sits on a fourth row of its own, under the middle column. The nine
   above it keep the exact positions they were measured into, and the swarm
   origin on level 1's beats is unchanged, so nothing that was already right
   has moved — the group simply grows downward, from 423px tall to 573, which
   still leaves it clear of the number line at y 866. A fourth row of one is
   not the tidiest shape for ten; the alternative was re-spacing all nine, and
   keeping nine hand-placed positions was worth more than the symmetry. */
export const BERRY_TOTAL = 7;
export const BERRY_SRC = `${IMG}glowberry.webp`;

// The sheet's own formation for the berries: a winding zigzag — one, a pair,
// one, a pair, one — rather than rows. Singles sit centred between the pair
// columns, so the path reads as a wander down the screen.
export const BERRIES = [
  { x: 170, y: 0, w: 112, h: 123 },
  { x: 0, y: 115, w: 112, h: 123 },
  { x: 340, y: 115, w: 112, h: 123 },
  { x: 170, y: 230, w: 112, h: 123 },
  { x: 0, y: 345, w: 112, h: 123 },
  { x: 340, y: 345, w: 112, h: 123 },
  { x: 170, y: 460, w: 112, h: 123 }
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

/* ---- Level 4 — the glow flowers, in the meadow ----

   ELEVEN, from the design sheet, in its formation for eleven: a row of five, a
   single one centred below them, and a row of five under that. Spacing is
   equal across and down, as the sheet asks.

   The pitch is 160 rather than the 250 levels 2 and 3 use, because five across
   at 250 would be 1116px wide and run straight through both characters — Agni's
   box ends at 634 and Neel's starts at 1385, leaving about 750px of clear
   frame between them. At 160 the group is exactly 750 wide and 437 tall, which
   is the same band the berries occupy (737 x 573), so the widest formation in
   the game still sits in the same window as the others.

   Boxes are 110x117, close to the flower art's own aspect (1794x1900 of the
   source, cropped from its transparent margin). That is 12,870 square pixels
   against a berry's 13,776 — slightly smaller, which is what buys the 50px of
   air between five flowers in a row. */
export const FLOWER_TOTAL = 11;
export const FLOWER_SRC = `${IMG}glowflower.webp`;

export const GLOWFLOWERS = [
  { x: 0, y: 0, w: 110, h: 117 },
  { x: 160, y: 0, w: 110, h: 117 },
  { x: 320, y: 0, w: 110, h: 117 },
  { x: 480, y: 0, w: 110, h: 117 },
  { x: 640, y: 0, w: 110, h: 117 },
  { x: 320, y: 160, w: 110, h: 117 },
  { x: 0, y: 320, w: 110, h: 117 },
  { x: 160, y: 320, w: 110, h: 117 },
  { x: 320, y: 320, w: 110, h: 117 },
  { x: 480, y: 320, w: 110, h: 117 },
  { x: 640, y: 320, w: 110, h: 117 }
];

const BG_FLOWERMEADOW = { src: `${IMG}bg_flowermeadow.webp`, x: 0, y: 0, w: FRAME_W, h: FRAME_H };

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

/* The lamp beats' own re-stage: the lamp takes the left of frame and the two
   of them stand together on the right, watching it light. Mirrors TOGETHER's
   trick — a deliberate move between beats reads as staging, not sliding. */
const LAMP_STAGE = {
  agni: { cx: 823, feet: 978 },
  neel: { cx: 264, feet: 984 }
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
    // The first twinkles a child ever sees here, and the longest they are ever
    // held: five seconds.
    fireflies: { x: 628, y: 197, enter: "left", life: 5000 },
    bubble: {
      art: `${IMG}bub_11.webp`, who: "agni",
      x: 80, y: 263, w: 416, h: 229,
      text: "वो देखो, जुगनू!"
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
      x: 59, y: 209, w: 495, h: 253,
      text: "अरे! कहाँ गए?"
    }
  },

  // ---- SCREEN 1.3 — the problem is stated (99:436) ----
  {
    id: "1.3",
    anchor: THE_CLEARING,
    layers: [
      BG,
      { src: `${IMG}agni_talk.webp`, x: 10, y: 485, w: 576, h: 532, fill: CROP.agniTalk, flipX: true, fx: "breathe" },
      { src: `${IMG}neel_a.webp`, x: 1327, y: 434, w: 377, h: 573, fill: CROP.neelA, flipX: true, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_13.webp`, who: "agni",
      x: 20, y: 130, w: 596, h: 314,
      artInset: [8.7, 0, 0, 3.23],
      text: "हमें पता लगाना होगा कि कुल कितने जुगनू थे।"
    }
  },

  // ---- SCREEN 1.4 — Neel supplies the motive (99:601) ----
  {
    id: "1.4",
    anchor: THE_CLEARING,
    layers: [
      BG,
      { src: `${IMG}agni_talk.webp`, x: 10, y: 485, w: 576, h: 532, fill: CROP.agniTalk, flipX: true, fx: "breathe" },
      { src: `${IMG}neel_c.webp`, x: 1382, y: 428, w: 434, h: 611, fill: CROP.neelC, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_neel.webp`, who: "neel",
      x: 1169, y: 197, w: 400, h: 237,
      text: "तो इस बार ध्यान से देखो!"
    }
  },

  // ---- SCREEN 1.5 — look before you guess (99:620) ----
  {
    id: "1.5",
    anchor: THE_CLEARING,
    layers: [
      BG,
      { src: `${IMG}agni_talk.webp`, x: 10, y: 485, w: 576, h: 532, fill: CROP.agniTalk, flipX: true, fx: "breathe" },
      { src: `${IMG}neel_c.webp`, x: 1382, y: 428, w: 434, h: 611, fill: CROP.neelC, fx: "breathe-slow" }
    ],
    // The last look before the keypad. Nothing is on screen while Agni speaks;
    // the moment her line ends the bubble goes and the swarm materialises where
    // it stands — the same magic it vanishes on, run forward: each twinkle
    // grows out of a burst of gold (`at` is when, ms into the beat — the line
    // runs 500 to 2581), holds its five seconds, and vanishes the same way.
    // The player is asked to guess at something they have just watched appear
    // and disappear by magic.
    fireflies: { x: 628, y: 197, enter: "magic", at: 2650, life: 4000 },
    bubble: {
      art: `${IMG}bub_15.webp`, who: "agni",
      x: -5, y: 181, w: 514, h: 277,
      text: "और अंदाज़ा लगाओ कि कितने जुगनू हैं।"
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
      text: "तो कितने जुगनू थे?"
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
      { src: `${IMG}agni_talk.webp`, x: 10, y: 485, w: 576, h: 532, fill: CROP.agniTalk, flipX: true, fx: "breathe" },
      { src: `${IMG}neel_think.webp`, x: 1327, y: 395, w: 372, h: 617, fill: CROP.neelThink, flipX: true, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_neel.webp`, who: "neel",
      x: 1109, y: 207, w: 400, h: 237,
      text: "हम्म… मुझे लगता है {guess} जुगनू थे।"
    }
  },

  // ---- SCREEN 3 — the swarm is back, time to count (99:459) ----
  {
    id: "3",
    anchor: THE_CLEARING,
    counter: "guess",
    layers: [
      BG,
      { src: `${IMG}agni_g.webp`, x: 80, y: 490, w: 554, h: 512, fill: CROP.agniG, fx: "breathe" },
      { src: `${IMG}neel_c.webp`, x: 1382, y: 428, w: 434, h: 611, fill: CROP.neelC, fx: "breathe-slow" }
    ],
    fireflies: { x: 628, y: 197, dim: true },
    bubble: {
      art: `${IMG}bub_3.webp`, who: "agni", tail: "right",
      // The box IS the art here. Figma's inset put the balloon in the middle
      // third of a much larger box, which left the longest line in the game a
      // third of the room it looked like it had — so it grew to a full 1.35x
      // and sat on the twinkles beside it. Given the whole box, and given more
      // height than width, the line fits without the balloon growing at all.
      x: 60, y: 150, w: 520, h: 380,
      text: "चलो, गिनकर देखते हैं कि हमारा अंदाज़ा कितना सही था।"
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
      { src: `${IMG}neel_c.webp`, x: 1382, y: 428, w: 434, h: 611, fill: CROP.neelC, fx: "breathe-slow" }
    ],
    fireflies: { x: 628, y: 197 },
    counter: "guess",
    numberLine: true,
    hint: { src: `${SHARED}hand_nudge.svg`, x: 532, y: 180, w: 308.396, h: 308.396 },
    bubble: {
      art: `${IMG}bub_32.webp`, who: "agni",
      x: 33, y: 252, w: 489, h: 256,
      text: "गिनने के लिए हर जुगनू पर टैप करो।"
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
    fireflies: { x: 628, y: 197 },
    counter: "guess",
    bubble: {
      art: `${IMG}bub_4.webp`, who: "agni",
      x: 61, y: 269, w: 417, h: 201,
      text: "तुम्हारा अंदाज़ा था {guess}!"
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
    fireflies: { x: 628, y: 197 },
    counter: "total",
    bubble: {
      art: `${IMG}bub_neel.webp`, who: "neel", tail: "right",
      // His line, so his balloon and his side of the frame. It sits in the
      // gap the beat leaves on the right: under the counter card, above his
      // head, and clear of the swarm still hanging in the middle.
      // Under the counter card and over Neel's head, tail on the right so it
      // comes down at him rather than into the sky beside him. Wide and short
      // on purpose: at this width the line takes two lines rather than three,
      // which is what lets it sit in the gap between the card and his horns
      // without the fitter having to grow it.
      x: 1252, y: 200, w: 408, h: 208,
      text: "{but}वहाँ कुल {total} जुगनू थे!"
    }
  },
  // ---- SCREEN 4.2 — the verdict (106:657) ----
  {
    id: "4.2",
    anchor: THE_CLEARING,
    role: "verdict",
    numberLine: true,
    layers: [
      BG,
      { src: `${IMG}agni_f.webp`, x: 9, y: 481, w: 605, h: 553, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1355, y: 408, w: 465, h: 589, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_42.webp`, who: "agni",
      x: 94, y: 222, w: 376, h: 226,
      text: "{verdict}"
    }
  },

  // ---- SCREEN 5.1 — tap the lamp. Third interaction (99:575) ----
  {
    id: "5.1",
    anchor: LAMP_STAGE,
    interact: "lamp",
    layers: [
      BG,
      { src: `${IMG}agni_g.webp`, x: 70, y: 489, w: 554, h: 512, fill: CROP.agniG, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1294, y: 412, w: 465, h: 589, flipX: true, fx: "breathe-slow" }
    ],
    lamp: { src: `${IMG}lamp_off.webp`, x: 1415, y: 74, w: 272, h: 927, fill: CROP.lampOff },
    // What the tap turns it into — the exact art screen 5.2 stands on, so the
    // cut after it changes nothing about the lamp. It fades up as the flock
    // arrives; see strike() in js/game.js.
    lampLit: { src: `${IMG}lamp_on.webp`, x: 1408, y: 74, w: 287, h: 927, fill: CROP.lampOn },
    // Where the glass is, in frame coordinates — the point the flock pours
    // into. Matches the element 5.2 draws inside it.
    lampGlass: { x: 1592, y: 254 },
    bubble: {
      art: `${IMG}bub_51.webp`, who: "agni",
      x: 694, y: 282, w: 383, h: 184,
      text: "लैंप पर टैप करो!"
    }
  },

  // ---- SCREEN 5.2 — the lamp catches one (112:132) ----
  // There is deliberately no twinkle drawn beside the lamp here. The beat
  // before this pours the whole flock into the glass, so one left sitting
  // outside it reads as one that got away — the opposite of what the scene is
  // saying. The light in the glass is where they all are.
  {
    id: "5.2",
    anchor: LAMP_STAGE,
    layers: [
      BG,
      { src: `${IMG}agni_celebrating.webp`, x: 579, y: 465, w: 549, h: 528, fx: "breathe" },
      { src: `${IMG}neel_turn.webp`, x: 1125, y: 391, w: 735, h: 610, fill: CROP.neelTurn, fx: "breathe-slow" },
      { src: `${IMG}lamp_on.webp`, x: 1408, y: 74, w: 287, h: 927, fill: CROP.lampOn, fx: "lamp-glow" }
    ],
    // No caption on this beat. They cheer — vo_neel_yay and vo_agni_yay in
    // the cue table — and a word on the screen only says again, more slowly,
    // what two voices have already said.
  },

  // ---- SCREEN 6.1 — handing over (99:587) ----
  {
    id: "6.1",
    anchor: TOGETHER,
    layers: [
      BG,
      { src: `${IMG}agni_e.webp`, x: 441, y: 389, w: 450, h: 623, fill: CROP.agniE, fx: "breathe" },
      { src: `${IMG}neel_g.webp`, x: 1039, y: 366, w: 462, h: 646, fill: CROP.neelG, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_61.webp`, who: "agni",
      x: 406, y: 186, w: 361, h: 199,
      text: "अब तुम्हारी बारी है।"
    }
  },
];

/* ---- Level 1 — the practice round in the meadow (sheet: Practice Game
   Screens). The tutorial's own loop, run by the player: look, guess, count,
   verdict, lamp. The four story beats that set the problem up (1.1..1.4) and
   the one that hands the game over (6.1) belongs to the tutorial and is not
   repeated; the readback beat (2.2) is not either — there Neel models a
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
      { src: `${IMG}agni_talk.webp`, x: 10, y: 485, w: 576, h: 532, fill: CROP.agniTalk, flipX: true, fx: "breathe" },
      { src: `${IMG}neel_think.webp`, x: 1327, y: 395, w: 372, h: 617, fill: CROP.neelThink, flipX: true, fx: "breathe-slow" }
    ],
    // Same clock as tutorial 1.5: her line ends (vo_g_guess runs 500 to 2581),
    // the bubble goes, the berries materialise, hold five seconds, vanish.
    fireflies: { x: 716, y: 140, enter: "magic", at: 2650, life: 3500 },
    bubble: {
      art: `${IMG}bub_15.webp`, who: "agni",
      x: -1, y: 181, w: 514, h: 277,
      text: "ध्यान से देखो और अंदाज़ा लगाओ।"
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
    // Nothing is said here: the pad arriving IS the question. It comes in on
    // its own sparkle, straight after the pane change.
    keypadAt: 800,
    bubble: {
      art: `${IMG}bub_15.webp`, who: "agni",
      x: 0, y: 185, w: 514, h: 277,
      // Not part of the beat's opening — see idle in js/game.js. It comes up
      // only if nobody has typed for a while, and goes again by itself.
      idle: true,
      text: "अपना अंदाज़ा लिखो।"
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
      { src: `${IMG}neel_c.webp`, x: 1382, y: 428, w: 434, h: 611, fill: CROP.neelC, fx: "breathe-slow" }
    ],
    fireflies: { x: 716, y: 140 },
    counter: "guess",
    numberLine: true,
    hint: { src: `${SHARED}hand_nudge.svg`, x: 852, y: 123, w: 308.396, h: 308.396 },
    bubble: {
      art: `${IMG}bub_32.webp`, who: "agni",
      x: 40, y: 252, w: 489, h: 256,
      text: "गिनने के लिए हर बेर पर टैप करो।"
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
    fireflies: { x: 716, y: 140 },
    counter: "guess",
    bubble: {
      art: `${IMG}bub_4.webp`, who: "agni",
      x: 61, y: 269, w: 417, h: 201,
      text: "तुम्हारा अंदाज़ा था {guess}!"
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
    fireflies: { x: 716, y: 140 },
    counter: "total",
    bubble: {
      art: `${IMG}bub_neel.webp`, who: "neel", tail: "right",
      // His line, so his balloon and his side of the frame. It sits in the
      // gap the beat leaves on the right: under the counter card, above his
      // head, and clear of the swarm still hanging in the middle.
      // Under the counter card and over Neel's head, tail on the right so it
      // comes down at him rather than into the sky beside him. Wide and short
      // on purpose: at this width the line takes two lines rather than three,
      // which is what lets it sit in the gap between the card and his horns
      // without the fitter having to grow it.
      x: 1252, y: 200, w: 408, h: 208,
      text: "{but}वहाँ कुल {total} बेर थे!"
    }
  },
  // ---- P4.2 — the verdict ----
  {
    id: "p4.2",
    anchor: THE_CLEARING,
    role: "verdict",
    numberLine: true,
    layers: [
      BG_MEADOW,
      { src: `${IMG}agni_f.webp`, x: 9, y: 481, w: 605, h: 553, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1355, y: 408, w: 465, h: 589, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_42.webp`, who: "agni",
      x: 96, y: 222, w: 376, h: 226,
      text: "{verdict}"
    }
  },

  // ---- P5.1 — tap the lamp ----
  {
    id: "p5.1",
    anchor: LAMP_STAGE,
    interact: "lamp",
    layers: [
      BG_MEADOW,
      { src: `${IMG}agni_g.webp`, x: 70, y: 489, w: 554, h: 512, fill: CROP.agniG, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1294, y: 412, w: 465, h: 589, flipX: true, fx: "breathe-slow" }
    ],
    lamp: { src: `${IMG}lamp_off.webp`, x: 1405, y: 74, w: 272, h: 927, fill: CROP.lampOff },
    lampLit: { src: `${IMG}lamp_on.webp`, x: 1398, y: 74, w: 287, h: 927, fill: CROP.lampOn },
    lampGlass: { x: 1582, y: 254 },
    bubble: {
      art: `${IMG}bub_51.webp`, who: "agni",
      x: 694, y: 282, w: 383, h: 184,
      text: "लैंप पर टैप करो!"
    }
  },

  // ---- P5.2 — the lamp catches a berry, and Neel cheers ----
  {
    id: "p5.2",
    anchor: LAMP_STAGE,
    layers: [
      BG_MEADOW,
      { src: `${IMG}agni_celebrating.webp`, x: 579, y: 465, w: 549, h: 528, fx: "breathe" },
      { src: `${IMG}neel_turn.webp`, x: 1125, y: 391, w: 735, h: 610, fill: CROP.neelTurn, fx: "breathe-slow" },
      { src: `${IMG}lamp_on.webp`, x: 1398, y: 74, w: 287, h: 927, fill: CROP.lampOn, fx: "lamp-glow" }
    ],
    // No caption on this beat. They cheer — vo_neel_yay and vo_agni_yay in
    // the cue table — and a word on the screen only says again, more slowly,
    // what two voices have already said.
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
      { src: `${IMG}agni_talk.webp`, x: 10, y: 485, w: 576, h: 532, fill: CROP.agniTalk, flipX: true, fx: "breathe" },
      { src: `${IMG}neel_think.webp`, x: 1327, y: 395, w: 372, h: 617, fill: CROP.neelThink, flipX: true, fx: "breathe-slow" }
    ],
    // Same clock as level 1's p1: her line ends (vo_g_guess runs 500 to 2581),
    // the bubble goes, the stars materialise, hold five seconds, vanish.
    fireflies: { x: 631, y: 174, enter: "magic", at: 2650, life: 3500 },
    bubble: {
      art: `${IMG}bub_15.webp`, who: "agni",
      x: -1, y: 181, w: 514, h: 277,
      text: "ध्यान से देखो और अंदाज़ा लगाओ।"
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
    // Nothing is said here: the pad arriving IS the question. It comes in on
    // its own sparkle, straight after the pane change.
    keypadAt: 800,
    bubble: {
      art: `${IMG}bub_15.webp`, who: "agni",
      x: 0, y: 185, w: 514, h: 277,
      // Not part of the beat's opening — see idle in js/game.js. It comes up
      // only if nobody has typed for a while, and goes again by itself.
      idle: true,
      text: "अपना अंदाज़ा लिखो।"
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
      { src: `${IMG}neel_c.webp`, x: 1382, y: 428, w: 434, h: 611, fill: CROP.neelC, fx: "breathe-slow" }
    ],
    fireflies: { x: 631, y: 174 },
    counter: "guess",
    numberLine: true,
    // The hand keeps the offset it has from the first countable on level 1
    // (-34, -17 from that box's own origin), so it points at the first star
    // the same way it points at the first berry.
    hint: { src: `${SHARED}hand_nudge.svg`, x: 597, y: 157, w: 308.396, h: 308.396 },
    bubble: {
      art: `${IMG}bub_32.webp`, who: "agni",
      x: 40, y: 252, w: 489, h: 256,
      text: "गिनने के लिए हर तारे पर टैप करो।"
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
    fireflies: { x: 631, y: 174 },
    counter: "guess",
    bubble: {
      art: `${IMG}bub_4.webp`, who: "agni",
      x: 61, y: 269, w: 417, h: 201,
      text: "तुम्हारा अंदाज़ा था {guess}!"
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
    fireflies: { x: 631, y: 174 },
    counter: "total",
    bubble: {
      art: `${IMG}bub_neel.webp`, who: "neel", tail: "right",
      // His line, so his balloon and his side of the frame. It sits in the
      // gap the beat leaves on the right: under the counter card, above his
      // head, and clear of the swarm still hanging in the middle.
      // Under the counter card and over Neel's head, tail on the right so it
      // comes down at him rather than into the sky beside him. Wide and short
      // on purpose: at this width the line takes two lines rather than three,
      // which is what lets it sit in the gap between the card and his horns
      // without the fitter having to grow it.
      x: 1252, y: 200, w: 408, h: 208,
      text: "{but}वहाँ कुल {total} तारे थे!"
    }
  },
  // ---- S4.2 — the verdict ----
  {
    id: "s4.2",
    anchor: THE_CLEARING,
    role: "verdict",
    numberLine: true,
    layers: [
      BG_VALLEY,
      { src: `${IMG}agni_f.webp`, x: 9, y: 481, w: 605, h: 553, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1355, y: 408, w: 465, h: 589, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_42.webp`, who: "agni",
      x: 94, y: 222, w: 376, h: 226,
      text: "{verdict}"
    }
  },

  // ---- S5.1 — tap the lamp ----
  {
    id: "s5.1",
    anchor: LAMP_STAGE,
    interact: "lamp",
    layers: [
      BG_VALLEY,
      { src: `${IMG}agni_g.webp`, x: 70, y: 489, w: 554, h: 512, fill: CROP.agniG, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1294, y: 412, w: 465, h: 589, flipX: true, fx: "breathe-slow" }
    ],
    lamp: { src: `${IMG}lamp_off.webp`, x: 1405, y: 74, w: 272, h: 927, fill: CROP.lampOff },
    lampLit: { src: `${IMG}lamp_on.webp`, x: 1398, y: 74, w: 287, h: 927, fill: CROP.lampOn },
    lampGlass: { x: 1582, y: 254 },
    bubble: {
      art: `${IMG}bub_51.webp`, who: "agni",
      x: 694, y: 282, w: 383, h: 184,
      text: "लैंप पर टैप करो!"
    }
  },

  // ---- S5.2 — the lamp catches a star, and Neel cheers ----
  {
    id: "s5.2",
    anchor: LAMP_STAGE,
    layers: [
      BG_VALLEY,
      { src: `${IMG}agni_celebrating.webp`, x: 579, y: 465, w: 549, h: 528, fx: "breathe" },
      { src: `${IMG}neel_turn.webp`, x: 1125, y: 391, w: 735, h: 610, fill: CROP.neelTurn, fx: "breathe-slow" },
      { src: `${IMG}lamp_on.webp`, x: 1398, y: 74, w: 287, h: 927, fill: CROP.lampOn, fx: "lamp-glow" }
    ],
    // No caption on this beat. They cheer — vo_neel_yay and vo_agni_yay in
    // the cue table — and a word on the screen only says again, more slowly,
    // what two voices have already said.
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
      { src: `${IMG}agni_talk.webp`, x: 10, y: 485, w: 576, h: 532, fill: CROP.agniTalk, flipX: true, fx: "breathe" },
      { src: `${IMG}neel_think.webp`, x: 1327, y: 395, w: 372, h: 617, fill: CROP.neelThink, flipX: true, fx: "breathe-slow" }
    ],
    // Same clock as p1 and s1: her line ends (vo_g_guess runs 500 to 2581),
    // the bubble goes, the seeds materialise, hold five seconds, vanish.
    fireflies: { x: 639, y: 85, enter: "magic", at: 2650, life: 2500 },
    bubble: {
      art: `${IMG}bub_15.webp`, who: "agni",
      x: -1, y: 181, w: 514, h: 277,
      text: "ध्यान से देखो और अंदाज़ा लगाओ।"
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
    // Nothing is said here: the pad arriving IS the question. It comes in on
    // its own sparkle, straight after the pane change.
    keypadAt: 800,
    bubble: {
      art: `${IMG}bub_15.webp`, who: "agni",
      x: 0, y: 185, w: 514, h: 277,
      // Not part of the beat's opening — see idle in js/game.js. It comes up
      // only if nobody has typed for a while, and goes again by itself.
      idle: true,
      text: "अपना अंदाज़ा लिखो।"
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
      { src: `${IMG}neel_c.webp`, x: 1382, y: 428, w: 434, h: 611, fill: CROP.neelC, fx: "breathe-slow" }
    ],
    fireflies: { x: 639, y: 85 },
    counter: "guess",
    numberLine: true,
    // The hand keeps level 1's offset from the first countable's own box
    // origin (-34, -17), so it points at the first seed the same way.
    hint: { src: `${SHARED}hand_nudge.svg`, x: 605, y: 68, w: 308.396, h: 308.396 },
    bubble: {
      art: `${IMG}bub_32.webp`, who: "agni",
      x: 38, y: 252, w: 489, h: 256,
      text: "गिनने के लिए हर बीज पर टैप करो।"
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
    fireflies: { x: 639, y: 85 },
    counter: "guess",
    bubble: {
      art: `${IMG}bub_4.webp`, who: "agni",
      x: 61, y: 269, w: 417, h: 201,
      text: "तुम्हारा अंदाज़ा था {guess}!"
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
    fireflies: { x: 639, y: 85 },
    counter: "total",
    bubble: {
      art: `${IMG}bub_neel.webp`, who: "neel", tail: "right",
      // His line, so his balloon and his side of the frame. It sits in the
      // gap the beat leaves on the right: under the counter card, above his
      // head, and clear of the swarm still hanging in the middle.
      // Under the counter card and over Neel's head, tail on the right so it
      // comes down at him rather than into the sky beside him. Wide and short
      // on purpose: at this width the line takes two lines rather than three,
      // which is what lets it sit in the gap between the card and his horns
      // without the fitter having to grow it.
      x: 1252, y: 200, w: 408, h: 208,
      text: "{but}वहाँ कुल {total} जादुई बीज थे!"
    }
  },
  // ---- M4.2 — the verdict ----
  {
    id: "m4.2",
    anchor: THE_CLEARING,
    role: "verdict",
    numberLine: true,
    layers: [
      BG_FOREST,
      { src: `${IMG}agni_f.webp`, x: 9, y: 481, w: 605, h: 553, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1355, y: 408, w: 465, h: 589, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_42.webp`, who: "agni",
      x: 94, y: 222, w: 376, h: 226,
      text: "{verdict}"
    }
  },

  // ---- M5.1 — tap the lamp ----
  {
    id: "m5.1",
    anchor: LAMP_STAGE,
    interact: "lamp",
    layers: [
      BG_FOREST,
      { src: `${IMG}agni_g.webp`, x: 70, y: 489, w: 554, h: 512, fill: CROP.agniG, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1294, y: 412, w: 465, h: 589, flipX: true, fx: "breathe-slow" }
    ],
    lamp: { src: `${IMG}lamp_off.webp`, x: 1460, y: 74, w: 272, h: 927, fill: CROP.lampOff },
    lampLit: { src: `${IMG}lamp_on.webp`, x: 1453, y: 74, w: 287, h: 927, fill: CROP.lampOn },
    lampGlass: { x: 1637, y: 254 },
    bubble: {
      art: `${IMG}bub_51.webp`, who: "agni",
      x: 694, y: 282, w: 383, h: 184,
      text: "लैंप पर टैप करो!"
    }
  },

  // ---- M5.2 — the lamp catches a seed, and Neel cheers ----
  {
    id: "m5.2",
    anchor: LAMP_STAGE,
    layers: [
      BG_FOREST,
      { src: `${IMG}agni_celebrating.webp`, x: 579, y: 465, w: 549, h: 528, fx: "breathe" },
      { src: `${IMG}neel_turn.webp`, x: 1125, y: 391, w: 735, h: 610, fill: CROP.neelTurn, fx: "breathe-slow" },
      { src: `${IMG}lamp_on.webp`, x: 1453, y: 74, w: 287, h: 927, fill: CROP.lampOn, fx: "lamp-glow" }
    ],
    // No caption on this beat. They cheer — vo_neel_yay and vo_agni_yay in
    // the cue table — and a word on the screen only says again, more slowly,
    // what two voices have already said.
  }
];

/* ---- Level 4 — the glow flowers, in the meadow ----

   The last round, and the nine beats one final time. Held identical to the
   three before it in everything but place, countable, name and ids: the pair
   stand on THE_CLEARING marks, and the keypad, counter, number line and lamp
   keep their coordinates.

   This is the round the two-digit keypad exists for — eleven is the first total
   a child cannot type with one tap. The number line runs to twelve for the
   same reason (see `numberLine`), so eleven has a tick of its own to land on. */
export const level4 = [
  // ---- F1 — look before you guess ----
  {
    id: "f1",
    anchor: THE_CLEARING,
    layers: [
      BG_FLOWERMEADOW,
      { src: `${IMG}agni_talk.webp`, x: 10, y: 485, w: 576, h: 532, fill: CROP.agniTalk, flipX: true, fx: "breathe" },
      { src: `${IMG}neel_think.webp`, x: 1327, y: 395, w: 372, h: 617, fill: CROP.neelThink, flipX: true, fx: "breathe-slow" }
    ],
    // Same clock as every other look beat: her line ends (vo_g_guess runs 500
    // to 2581), the bubble goes, the flowers open, hold five seconds, vanish.
    fireflies: { x: 566, y: 138, enter: "magic", at: 2650, life: 2500 },
    bubble: {
      art: `${IMG}bub_15.webp`, who: "agni",
      x: -1, y: 181, w: 514, h: 277,
      text: "ध्यान से देखो और अंदाज़ा लगाओ।"
    }
  },

  // ---- F2 — the keypad. Two digits, for the first time in the game ----
  {
    id: "f2",
    anchor: THE_CLEARING,
    interact: "keypad",
    counter: "guess",
    layers: [
      BG_FLOWERMEADOW,
      { src: `${IMG}agni_talk.webp`, x: 10, y: 485, w: 576, h: 532, fill: CROP.agniTalk, flipX: true, fx: "breathe" },
      { src: `${IMG}neel_think.webp`, x: 1369, y: 386, w: 372, h: 617, fill: CROP.neelThink, flipX: true, fx: "breathe-slow" }
    ],
    keypad: true,
    // Nothing is said here: the pad arriving IS the question. It comes in on
    // its own sparkle, straight after the pane change.
    keypadAt: 800,
    bubble: {
      art: `${IMG}bub_15.webp`, who: "agni",
      x: 0, y: 185, w: 514, h: 277,
      // Not part of the beat's opening — see idle in js/game.js. It comes up
      // only if nobody has typed for a while, and goes again by itself.
      idle: true,
      text: "अपना अंदाज़ा लिखो।"
    }
  },

  // ---- F3.2 — tap each one ----
  {
    id: "f3.2",
    anchor: THE_CLEARING,
    interact: "count",
    layers: [
      BG_FLOWERMEADOW,
      { src: `${IMG}agni_g.webp`, x: 80, y: 490, w: 554, h: 512, fill: CROP.agniG, fx: "breathe" },
      { src: `${IMG}neel_c.webp`, x: 1382, y: 428, w: 434, h: 611, fill: CROP.neelC, fx: "breathe-slow" }
    ],
    fireflies: { x: 566, y: 138 },
    counter: "guess",
    numberLine: true,
    // The hand keeps level 1's offset from the first countable's own box
    // origin (-34, -17), so it points at the first flower the same way.
    hint: { src: `${SHARED}hand_nudge.svg`, x: 532, y: 121, w: 308.396, h: 308.396 },
    bubble: {
      art: `${IMG}bub_32.webp`, who: "agni",
      x: 38, y: 252, w: 489, h: 256,
      text: "गिनने के लिए हर फूल पर टैप करो।"
    }
  },

  // ---- F16 — the guess, next to the truth ----
  {
    id: "f16",
    anchor: THE_CLEARING,
    role: "guessline",
    numberLine: true,
    dwell: 4600,
    layers: [
      BG_FLOWERMEADOW,
      { src: `${IMG}agni_f.webp`, x: 9, y: 481, w: 605, h: 553, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1372, y: 424, w: 465, h: 589, fx: "breathe-slow" }
    ],
    fireflies: { x: 566, y: 138 },
    counter: "guess",
    bubble: {
      art: `${IMG}bub_4.webp`, who: "agni",
      x: 61, y: 269, w: 417, h: 201,
      text: "तुम्हारा अंदाज़ा था {guess}!"
    }
  },


  // ---- F4 — the true count ----
  {
    id: "f4",
    anchor: THE_CLEARING,
    role: "totalline",
    numberLine: true,
    dwell: 3800,
    layers: [
      BG_FLOWERMEADOW,
      { src: `${IMG}agni_f.webp`, x: 9, y: 481, w: 605, h: 553, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1372, y: 424, w: 465, h: 589, fx: "breathe-slow" }
    ],
    fireflies: { x: 566, y: 138 },
    counter: "total",
    bubble: {
      art: `${IMG}bub_neel.webp`, who: "neel", tail: "right",
      // His line, so his balloon and his side of the frame. It sits in the
      // gap the beat leaves on the right: under the counter card, above his
      // head, and clear of the swarm still hanging in the middle.
      // Under the counter card and over Neel's head, tail on the right so it
      // comes down at him rather than into the sky beside him. Wide and short
      // on purpose: at this width the line takes two lines rather than three,
      // which is what lets it sit in the gap between the card and his horns
      // without the fitter having to grow it.
      // 83px right of where the other rounds put it: the glowflowers are the
      // widest formation in the game and their right column reaches this far.
      x: 1335, y: 200, w: 408, h: 208,
      text: "{but}वहाँ कुल {total} फूल थे!"
    }
  },
  // ---- F4.2 — the verdict ----
  {
    id: "f4.2",
    anchor: THE_CLEARING,
    role: "verdict",
    numberLine: true,
    layers: [
      BG_FLOWERMEADOW,
      { src: `${IMG}agni_f.webp`, x: 9, y: 481, w: 605, h: 553, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1355, y: 408, w: 465, h: 589, fx: "breathe-slow" }
    ],
    bubble: {
      art: `${IMG}bub_42.webp`, who: "agni",
      x: 68, y: 222, w: 376, h: 226,
      text: "{verdict}"
    }
  },

  // ---- F5.1 — tap the lamp ----
  {
    id: "f5.1",
    anchor: LAMP_STAGE,
    interact: "lamp",
    layers: [
      BG_FLOWERMEADOW,
      { src: `${IMG}agni_g.webp`, x: 70, y: 489, w: 554, h: 512, fill: CROP.agniG, fx: "breathe" },
      { src: `${IMG}neel_f.webp`, x: 1294, y: 412, w: 465, h: 589, flipX: true, fx: "breathe-slow" }
    ],
    lamp: { src: `${IMG}lamp_off.webp`, x: 1460, y: 74, w: 272, h: 927, fill: CROP.lampOff },
    lampLit: { src: `${IMG}lamp_on.webp`, x: 1453, y: 74, w: 287, h: 927, fill: CROP.lampOn },
    lampGlass: { x: 1637, y: 254 },
    bubble: {
      art: `${IMG}bub_51.webp`, who: "agni",
      x: 694, y: 282, w: 383, h: 184,
      text: "लैंप पर टैप करो!"
    }
  },

  // ---- F5.2 — the lamp catches a flower, and Neel cheers ----
  {
    id: "f5.2",
    anchor: LAMP_STAGE,
    layers: [
      BG_FLOWERMEADOW,
      { src: `${IMG}agni_celebrating.webp`, x: 579, y: 465, w: 549, h: 528, fx: "breathe" },
      { src: `${IMG}neel_turn.webp`, x: 1125, y: 391, w: 735, h: 610, fill: CROP.neelTurn, fx: "breathe-slow" },
      { src: `${IMG}lamp_on.webp`, x: 1453, y: 74, w: 287, h: 927, fill: CROP.lampOn, fx: "lamp-glow" }
    ],
    // No caption on this beat. They cheer — vo_neel_yay and vo_agni_yay in
    // the cue table — and a word on the screen only says again, more slowly,
    // what two voices have already said.
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
    // The answer beat names what was counted, so its voice belongs to the
    // round rather than to the beat: "लेकिन वहाँ कुल 8 जुगनू थे" cannot be
    // played over a meadow full of berries. `but` is the take for a guess that
    // was wrong and `plain` the one for a guess that was right — see
    // dynamicVoice() in js/game.js. A round with none recorded says nothing,
    // which is what the four levels do until theirs exist.
    totalVo: { but: "vo_g_total", plain: "vo_g_total_plain" },
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
    totalVo: { but: "vo_l1_total", plain: "vo_l1_total_plain" },
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
    totalVo: { but: "vo_l2_total", plain: "vo_l2_total_plain" },
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
    totalVo: { but: "vo_l3_total", plain: "vo_l3_total_plain" },
    swarmSrc: SEED_SRC,
    layout: MAGICSEEDS,
    // The seed is a lit thing rather than a light source, like the berry, and
    // it sits on the darkest background in the game — so it carries its own
    // amber halo and a dim state the forest cannot swallow. See css/game.css.
    swarmClass: "is-seeds",
    walkTo: "forest",
    screens: level3
  },
  {
    name: "Level 4 — the glow flowers",
    word: "Glow flower",
    total: FLOWER_TOTAL,
    totalVo: { but: "vo_l4_total", plain: "vo_l4_total_plain" },
    swarmSrc: FLOWER_SRC,
    layout: GLOWFLOWERS,
    // Warm orange petals round a gold face. The art was violet once and was
    // very hard to find against this meadow's violet sky — the new one carries
    // its own glow in exactly the colour the swarm styling was built for, so it
    // still needs no restyling of its own.
    swarmClass: "",
    walkTo: "flowermeadow",
    screens: level4
  }
];

/* ---- The ending — the owner's Figma end screens (Mystry, 149-102) ----

   Four beats after the walk home, all dialogue: the pair high-five in the lit
   town (two lines over one painting), then Agni turns and Neel is gone — he is
   at the bakery, eyes shut, the cake smell curling to his nose. The town
   paintings ship with the characters' poses baked in where the design has
   them; the 7.2 beats layer the pair and the smell over one clean street
   plate (the design's PG3 and PG4 differ only by compression).

   Boxes are the Figma frames' own coordinates scaled by 1882/1920 — the design
   is drawn at the story's frame size, this act runs at the game's.

   No anchors: these arts are not in POSE_BOX, and each is placed exactly once.
   ep_street is also where the walk home arrives (destinations.home), so the
   hand-over dissolves into the very painting the first beat stands on, and the
   pair — faded out with the walk — reappear in it mid-high-five. */

// One street plate serves all four beats — the design's PG1..PG4 are the same
// painting re-exported (30dB+ PSNR apart). The high-five pair are their own
// layer (the design's Subtract node, exported with alpha), drawn over it on
// the first two beats; its box bottom lands exactly on the frame bottom, as
// the design has it.
const EP_STREET = { src: `${IMG}ep_street.webp`, x: 0, y: 0, w: FRAME_W, h: FRAME_H };
// Every cutout below is the design's own source art (the raw uploads keep
// their alpha; node exports flatten onto white), cropped to its opaque pixels
// and seated by measuring where those pixels sit in the design's render.
const EP_PAIR = { src: `${IMG}ep_pair.webp`, x: 414, y: 434, w: 895, h: 560, flipX: true };

// The same switch as the story's (js/data/scenes.js): with the gag cut, the
// chapter ends on what they came to say — they did it, the town is lit — and
// then the word. Neel wandering off after the smell, and the clip of him
// floating to the bakery, are the gag's other half and go with it. Nothing is
// deleted.
const CAKE = false;

// The smell drifting out of the bakery is the gag's setup; with no gag to set
// up it is a thread that goes nowhere, so it is on the switch too.
const AROMA = (fx) =>
  CAKE ? [{ src: `${SHARED}smell.webp`, x: 1180, y: 150, w: 620, h: 378, fx }] : [];

export const epilogueScreens = [
  // ---- E1 — "We did it, Neel!" (149:356) ----
  {
    id: "e1",
    layers: [EP_STREET, EP_PAIR, ...AROMA("aroma-1")],
    bubble: {
      art: `${IMG}bub_51.webp`, who: "agni",
      x: 679, y: 268, w: 322, h: 167,
      text: "हमने कर दिखाया, नील!"
    }
  },

  // ---- E2 — "The town is shining again!" (149:365, same painting) ----
  {
    id: "e2",
    layers: [EP_STREET, EP_PAIR, ...AROMA("aroma-2")],
    bubble: {
      art: `${IMG}bub_51.webp`, who: "agni",
      x: 657, y: 238, w: 400, h: 196,
      text: "शहर फिर से चमक रहा है!"
    }
  },

  ...(CAKE ? [

  // ---- E3 — "Neel?" — he has wandered off (149:375) ----
  {
    id: "e3",
    layers: [
      EP_STREET,
      { src: `${IMG}ep_agni_wonder.webp`, x: 418, y: 520, w: 459, h: 454 },
      { src: `${IMG}ep_neel_sniff.webp`, x: 1163, y: 489, w: 199, h: 384 },
      { src: `${SHARED}smell.webp`, x: 1180, y: 150, w: 620, h: 378, fx: "aroma-3" }
    ],
    bubble: {
      art: `${IMG}bub_51.webp`, who: "agni",
      x: 490, y: 385, w: 280, h: 157,
      text: "नील?"
    }
  },

  // ---- EV — the owner's animated telling of the gag: the smell reaches
  // him and off he floats to the bakery. The clip's own soundtrack is
  // stripped at conversion (assets/videos/neel_floating.webm, from the .mp4
  // beside it); the cue table plays ours over it, including his dreamy
  // "Caaaake!". Runs 5.9s; the dwell gives it air either side.
  {
    id: "ev",
    layers: [],
    video: { src: "assets/videos/neel_floating.webm" },
    // The clip runs 5.9s; the iris (2s, fired by the video's ended event)
    // closes over its last frame, and the beat turns once it is dark.
    dwell: 8400
  },

  ] : []),

  // ---- EEND — the words the chapter closes on ----
  {
    id: "eend",
    // The street they just lit, and the circle closing over it. The word waits
    // for the dark: the iris takes 1.6s from 200ms, so 2000ms lands it just
    // after the last of the picture has gone.
    layers: [EP_STREET, EP_PAIR],
    iris: { at: 200, over: 1600 },
    shout: { text: "समाप्त", centre: true, tilt: -3, size: 150, at: 2000 },
    dwell: 6200
  }
];

// Shaped like a level so the one game machine can play it, but it is not in
// `levels`: it has no walk of its own, nothing to count, and finishing it ends
// the chapter (see gameDone in js/main.js).
export const epilogue = {
  name: "The ending",
  word: "",
  total: 0,
  swarmSrc: FIREFLY_SRC,
  layout: [],
  swarmClass: "",
  screens: epilogueScreens
};

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
  // Scaled up by 1.3 from the Figma size, about a new origin at (582, 92):
  // measured, the keys already filled the panel's cream interior edge to edge,
  // so the only way to give a child bigger buttons was to grow the whole pad.
  // Everything below is that one transform — panel, readout, key pitch, key
  // size and the tick inside the confirm key — so the pad is still exactly the
  // design, just larger. It stays clear of both characters (Agni's art ends
  // near x 503, Neel's box starts at 1369) and of the counter card.
  frame: { src: `${IMG}keypad.webp`, x: 582, y: 92, w: 719, h: 898 },
  // The readout, back in the place Figma drew it (the `num` layer, 108:51).
  // A guess can now be two digits, so there has to be somewhere to see it
  // being built — and with the readout back, the key rows return to their own
  // designed y rather than the 60px lift they were given while the top of the
  // panel was empty.
  display: { src: `${IMG}num_display.webp`, x: 713, y: 228, w: 463, h: 157, fill: CROP.numDisplay },
  keyW: 150,
  keyH: 110,
  keyArt: `${IMG}key.webp`,
  keyFill: CROP.key,
  // Both action keys are back too, in the bottom row Figma gives them: clear
  // on the left, confirm on the right. Confirm is what a two-digit guess needs
  // — nothing else can know whether "1" is the whole answer or the start of
  // "11" — and clear is what makes a mistyped digit survivable, which matters
  // more now that a guess takes two taps to build.
  clearArt: `${IMG}key_x.webp`,
  confirmArt: `${IMG}key_ok.webp`,
  // The tick sits inset inside its key, at the size Figma gives it (146:12).
  tick: { src: `${IMG}tick.svg`, x: 39, y: 18, w: 73, h: 73 },
  // A guess is capped at two digits and at 19 — the largest number Neel can
  // read back (vo_nn_0..19), and comfortably past every total in the game.
  maxDigits: 2,
  maxValue: 19,
  keys: [
    { label: "1", x: 713, y: 400 },
    { label: "2", x: 869, y: 400 },
    { label: "3", x: 1025, y: 400 },
    { label: "4", x: 713, y: 513 },
    { label: "5", x: 869, y: 513 },
    { label: "6", x: 1025, y: 513 },
    { label: "7", x: 713, y: 626 },
    { label: "8", x: 869, y: 626 },
    { label: "9", x: 1025, y: 626 },
    { label: "X", x: 713, y: 739, clear: true },
    { label: "0", x: 869, y: 739 },
    { label: "OK", x: 1025, y: 739, confirm: true }
  ]
};

/* The number line under the count, where the guess and the answer are put side
   by side. Eleven marks, 0 to 10, kept clear of both characters — Agni's box
   ends at 634 and Neel's begins at 1385. */
// Runs to twelve, which is the largest total in the game (eleven glow flowers)
// with one tick to spare. A guess above twelve simply is not placed — mark()
// returns null past `max` — so the line never has to squeeze in a number no
// round is about. The counter still shows whatever was typed.
export const numberLine = { x: 500, y: 866, w: 900, max: 12 };

// The counter card (99:487).
export const counter = { src: `${IMG}counter.webp`, x: 1490, y: 57, w: 338, h: 190 };

// What one round puts on screen. The chapter fetches a round at a time rather
// than all of them at the hand-over: forty-nine images decoding at once is
// forty-nine full-size bitmaps alive at the same instant, which is more than a
// phone will give a tab. A round is fetched while the one before it is being
// played, so nothing ever waits.
export function artFor(round) {
  return [...new Set([
    ...round.screens.flatMap((screen) => [
      ...screen.layers.map((layer) => layer.src),
      ...(screen.lamp ? [screen.lamp.src] : []),
      ...(screen.lampLit ? [screen.lampLit.src] : []),
      ...(screen.hint ? [screen.hint.src] : []),
      ...(screen.bubble ? [screen.bubble.art] : []),
      // The ending's clip. It is a screen's picture like any other, and being
      // left off this list meant it began downloading at the moment it was
      // due to play.
      ...(screen.video ? [screen.video.src] : [])
    ]),
    round.swarmSrc
  ])].filter(Boolean);
}

// The furniture every round shares. All of it: the pad is seven pieces, not
// three, and the four that were left off this list were fetched only when the
// keypad first drew itself — which on a real connection is a pad that arrives
// in parts while a child is looking at it.
export const commonArt = [
  keypad.frame.src,
  keypad.display.src,
  keypad.keyArt,
  keypad.clearArt,
  keypad.confirmArt,
  keypad.tick.src,
  counter.src
];

// Everything the game needs on screen, in one list — the dev tools jump
// anywhere, so they fetch the lot.
export const manifest = [
  ...new Set([
    ...[...levels, epilogue].flatMap((level) => [
      ...level.screens.flatMap((screen) => [
        ...screen.layers.map((layer) => layer.src),
        ...(screen.lamp ? [screen.lamp.src] : []),
        ...(screen.lampLit ? [screen.lampLit.src] : []),
        ...(screen.hint ? [screen.hint.src] : []),
        ...(screen.bubble ? [screen.bubble.art] : []),
        ...(screen.video ? [screen.video.src] : [])
      ]),
      level.swarmSrc
    ]),
    ...commonArt
  ])
];
