// Chapter 1 as three pages, built from the story script and the Figma frames
// (Mystry › Story, node 98:269).
//
//   Page 1  Figma 1.1 + 1.2 + 1.3   the walk, the cake, the grin
//   Page 2  Figma 2.1 -> 3          the mist, the lanterns, the dark, the eyes
//   Page 3  Figma 4.2 + 4.3         Agni's spark and the call to adventure
//
// A page owns a background that stays put. Its `steps` are the moments inside
// it, and they play themselves: every step carries a `hold` (run for N ms, then
// move on) except the one that closes the page, which carries `reveal` instead
// (wait for the reader, and fade the chevron in after N ms, once the line has
// landed). That is why the chevron appears exactly three times.
//
// Each step lists only the layers it needs, and the player diffs them by `key`,
// so a layer present in consecutive steps is never rebuilt — the street does
// not re-fade under the dialogue, and the ghost keeps drifting across a step
// change.
//
// Every x / y / w / h is a literal Figma coordinate inside the 1920 x 1080
// frame, so the stage can be scaled as one unit (see stage.js) and the layout
// stays pixel-faithful. Boxes may run off the frame — the stage clips them,
// exactly as Figma clips them.
//
// A layer is:
//   key      identity across steps; a changed key cross-fades, a kept one does not
//   src      the image fill (Figma's own source art, so alpha survives)
//   x y w h  the layer box, in frame coordinates
//   fill     Figma's crop transform, when the fill has one. Without it the
//            fill covers the box, which is what Figma's "fill" mode does.
//   flipX    the fill is mirrored in the design
//   opacity  layer opacity — only honoured alongside `fx`, since a plain
//            layer's fade-in animation would override it
//   fx       motion hook -> .fx-* in css/story.css
// ...or an effect, keyed by `kind` (see effect() in story.js).

const IMG = "assets/images/";

/* ---- shared marks ---------------------------------------------------- */

const TOWN_LIT = { key: "bg-lit", src: `${IMG}bg_town_lit.jpg`, x: 0, y: 0, w: 1920, h: 1080 };
const TOWN_DARK = { key: "bg-dark", src: `${IMG}bg_town_dark.jpg`, x: 0, y: 0, w: 1920, h: 1080 };

const AGNI_WALKING = {
  key: "agni-walk", src: `${IMG}agni_walking.png`, x: 380, y: 442, w: 460, h: 539,
  fill: { left: "-22.65%", top: "0%", width: "175.74%", height: "100%" }
};

const NEEL_WALKING = {
  key: "neel-walk", src: `${IMG}neel_walking.png`, x: 866, y: 399, w: 506, h: 625,
  fill: { left: "-18.23%", top: "-7.68%", width: "158.39%", height: "114.08%" }
};

const NEEL_CHEEKY = {
  key: "neel-cheeky", src: `${IMG}neel_cheeky.png`, x: 908, y: 371, w: 472, h: 622,
  fill: { left: "-16.4%", top: "-0.06%", width: "126.88%", height: "100.13%" }
};

const AGNI_TALKING = {
  key: "agni-talk", src: `${IMG}agni_talking.png`, x: 358, y: 443, w: 550, h: 557
};

// The three eye frames are one shot, hard-cut like the source video.
const EYES = [
  { key: "eyes-1", src: `${IMG}eyes_1.png`, x: 0, y: 0, w: 1920, h: 1080, fx: "blink-1" },
  { key: "eyes-2", src: `${IMG}eyes_2.png`, x: 0, y: 0, w: 1920, h: 1080, fx: "blink-2" },
  { key: "eyes-3", src: `${IMG}eyes_3.png`, x: 0, y: 0, w: 1920, h: 1080, fx: "blink-3" }
];

const NIGHT_PROPS = [
  { key: "ghost", src: `${IMG}ghost.png`, x: -113, y: 487, w: 271, h: 181, fx: "float" },
  { key: "firefly", src: `${IMG}firefly.png`, x: 1787, y: 48, w: 135, h: 90, fx: "flicker" },
  {
    key: "berry", src: `${IMG}berry.png`, x: 1874, y: 758, w: 62, h: 55,
    fill: { left: "-22.76%", top: "-3.04%", width: "143.72%", height: "108.51%" },
    fx: "float"
  }
];

// "Very faint lights blink in distant hiding places" — clear of the characters
// and of the props above, so they read as far away.
const GLIMMERS = [
  { key: "glim-1", kind: "glimmer", x: 1640, y: 430, delay: 0 },
  { key: "glim-2", kind: "glimmer", x: 1700, y: 690, delay: 900 },
  { key: "glim-3", kind: "glimmer", x: 210, y: 300, delay: 1700 },
  { key: "glim-4", kind: "glimmer", x: 95, y: 880, delay: 2600 },
  { key: "glim-5", kind: "glimmer", x: 1500, y: 220, delay: 3400 }
];

const BUBBLE_NEEL = { src: `${IMG}bubble_neel.png`, x: 732, y: 182, w: 420, h: 226, flipX: true };

/* ---- the pages ------------------------------------------------------- */

export const pages = [
  {
    id: "page-1",
    name: "Cupcake Lane",
    // The lit street is painted once and stays for the whole page.
    layers: [TOWN_LIT],
    steps: [
      // Figma 1.2 — they stroll in. This opens the chapter: an establishing
      // shot of the empty lane came first, but the pair should be in the
      // opening frame rather than a bare street.
      {
        id: "1.1",
        hold: 3000,
        layers: [
          { ...AGNI_WALKING, fx: "walk-in-left" },
          { ...NEEL_WALKING, fx: "walk-in-right" }
        ]
      },

      // Neel catches the bakery on the air.
      {
        id: "1.2",
        hold: 3800, // "do I smell cake?" ends at 2.58s
        layers: [
          { ...AGNI_WALKING, fx: "breathe" },
          { ...NEEL_WALKING, fx: "breathe-slow" }
        ],
        say: {
          bubble: BUBBLE_NEEL,
          text: { x: 777, y: 224, w: 342 },
          lines: ["Mmm…", "do I smell cake?"]
        }
      },

      // Figma 1.3 — Agni is unimpressed. The pair changes mark, so these
      // cross-fade over the same street.
      {
        id: "1.3",
        hold: 4900, // "…had a cookie!" ends at 3.68s
        layers: [
          { ...NEEL_CHEEKY, fx: "breathe-slow" },
          { ...AGNI_TALKING, fx: "breathe" }
        ],
        say: {
          bubble: { src: `${IMG}bubble_agni.png`, x: 128, y: 190, w: 586, h: 294, flipX: true },
          text: { x: 179, y: 265.95, w: 482 },
          lines: ["Oh, come on. You just", "had a cookie!"]
        }
      },

      // …and Neil is unrepentant.
      {
        // Last step of the page: waits for the reader, chevron in at 2.1s.
        id: "1.4",
        reveal: 2100,
        layers: [
          { ...NEEL_CHEEKY, fx: "grin" },
          { ...AGNI_TALKING, fx: "breathe" }
        ]
      }
    ]
  },

  {
    id: "page-2",
    name: "Lights Out",
    // This page travels from a moonlit street to pitch dark, so the backdrop
    // belongs to the steps rather than to the page.
    layers: [],
    steps: [
      // Figma 2.1 — mist at their feet.
      {
        id: "2.1",
        hold: 4400, // lets the mist finish rising
        layers: [
          { key: "bg-moonlit", src: `${IMG}bg_town_moonlit.jpg`, x: 0, y: 0, w: 1920, h: 1080 },
          { key: "agni-down", src: `${IMG}agni_looking_down.png`, x: 297, y: 461, w: 613, h: 566, fx: "breathe" },
          {
            key: "neel-scared", src: `${IMG}neel_scared.png`, x: 945, y: 403, w: 489, h: 624,
            fill: { left: "-15.02%", top: "0%", width: "152.56%", height: "104.64%" },
            fx: "shiver"
          },
          { key: "mist-band", src: `${IMG}mist_band.png`, x: 0, y: 510, w: 1920, h: 640, opacity: 0.67, fx: "mist-rise" }
        ],
        say: {
          bubble: BUBBLE_NEEL,
          text: { x: 777, y: 265, w: 342 },
          lines: ["What was that?"]
        }
      },

      // Figma 2.2 — the mist rushes the street and the lanterns go out from
      // the far end in, then the last one flickers and dies.
      {
        id: "2.2",
        hold: 6400,
        layers: [
          { key: "bg-mist", src: `${IMG}bg_mist_full.jpg`, x: 0, y: 0, w: 1920, h: 1080, fx: "drift-slow" },
          { key: "wave", kind: "wave" },
          { key: "lamp-die", kind: "lamp-die" }
        ]
        // The lanterns going out and the laugh are carried by their sound
        // cues; the shouted words that used to sit over the art are gone.
      },

      // Figma 2.3 / 2.4 / 3 — pitch dark, two pairs of eyes. A bubble would
      // light the frame, so these lines are spoken in each character's colour.
      {
        id: "3.1",
        hold: 3800, // "Neil?", then the eyes blink on their own
        layers: [{ key: "night", kind: "night" }, ...EYES],
        voices: [{ x: 355, y: 700, w: 400, tone: "agni", text: "Neil?" }]
      },

      {
        id: "3.2",
        hold: 3600, // "I am here… I think."
        layers: [{ key: "night", kind: "night" }, ...EYES],
        voices: [{ x: 1040, y: 690, w: 560, tone: "neel", text: "I am here… I think." }]
      },

      // The laugh crosses overhead without ever showing him — heard, not read.
      {
        // Last step of the page: chevron in once the laugh has passed.
        id: "3.3",
        reveal: 3400,
        layers: [{ key: "night", kind: "night" }, ...EYES]
      }
    ]
  },

  {
    id: "page-3",
    name: "The Light-Keepers",
    // Fireflies carry us out of the dark and into the last page.
    enter: { id: "3.4", fx: "fireflies", hold: 2800 },
    // Street, distant glimmers and the off-frame props all persist, so nothing
    // restarts between Agni's two lines.
    layers: [TOWN_DARK, ...GLIMMERS, ...NIGHT_PROPS],
    steps: [
      // Figma 4.2 — Agni's spark picks out the two of them.
      {
        id: "4.1",
        hold: 5200, // "…the little light-keepers!" ends at 4.02s
        layers: [{ key: "cast-shock", src: `${IMG}scene_shock.png`, x: 239, y: 191, w: 1276, h: 851, fx: "breathe" }],
        say: {
          bubble: { src: `${IMG}bubble_agni.png`, x: 118, y: 96, w: 586, h: 294, flipX: true },
          text: { x: 169, y: 153, w: 482 },
          lines: ["I think Mr. Giggles", "has scared the little", "light-keepers!"]
        }
      },

      // Figma 4.3 — the call to adventure.
      {
        // Last step of the chapter: chevron in, then the end card.
        id: "4.2",
        reveal: 3100,
        layers: [{ key: "cast-cheer", src: `${IMG}scene_cheer.png`, x: 273, y: 241, w: 1258, h: 839, fx: "breathe" }],
        say: {
          bubble: { src: `${IMG}bubble_agni.png`, x: 54, y: 78, w: 606, h: 326, flipX: true },
          text: { x: 117, y: 169, w: 481 },
          lines: ["Let us find them and", "light the town again!"]
        }
      }
    ]
  }
];

// Flat list of every step, in order, so the player can walk the chapter and
// still know which page each step belongs to.
export const timeline = pages.flatMap((page, p) =>
  page.steps.map((step, s) => ({
    page,
    step,
    p,
    s,
    first: s === 0,
    // Only a page's closing step waits for the reader, which is why the
    // chevron appears exactly three times.
    last: s === page.steps.length - 1
  }))
);

// Everything the story needs on screen, in one list, for the preloader.
export const manifest = [
  ...new Set(
    pages.flatMap((page) => [
      ...page.layers,
      ...page.steps.flatMap((step) => [
        ...step.layers,
        ...(step.say ? [step.say.bubble] : [])
      ])
    ])
      .filter((layer) => layer.src)
      .map((layer) => layer.src)
      // Built at runtime by the firefly transition.
      .concat(`${IMG}firefly.png`)
  )
];
