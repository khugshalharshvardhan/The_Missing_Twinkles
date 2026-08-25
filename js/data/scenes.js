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

// The story was drawn at 1920 x 1080. The counting game uses its own frame
// (see js/data/screens.js); js/stage.js swaps between them.
export const FRAME_W = 1920;
export const FRAME_H = 1080;

const IMG = "assets/images/";
const VID = "assets/videos/";

/* ---- shared marks ---------------------------------------------------- */

const TOWN_LIT = { key: "bg-lit", src: `${IMG}bg_town_lit.webp`, x: 0, y: 0, w: 1920, h: 1080 };
const TOWN_DARK = { key: "bg-dark", src: `${IMG}bg_town_dark.webp`, x: 0, y: 0, w: 1920, h: 1080 };

/* Where each character stands for a whole page.
   
   Every pose is a separate file drawn at its own Figma box with its own
   transparent margin, so placed as exported they put the character somewhere
   different on every beat — Neel's body centre moves 54px and his feet 34px
   across page one alone. story.js then glides the box between the two marks,
   which makes the movement the thing you watch instead of the change of
   expression.
   
   The Figma coordinates below stay exactly as exported; js/anchor.js shifts each
   character onto its page's mark. Only centre-x and the feet are pinned — arms
   going up genuinely makes a pose taller, and flattening that would squash the
   gesture out of it. Page two is not listed because neither of them changes pose
   on it, so there is nothing to hold still.
   
   The marks are each page's opening pose, so the first thing the reader sees is
   where everyone stays. */
const LANE = {
  agni: { cx: 609, feet: 959 },
  neel: { cx: 1090, feet: 1006 }
};

// Page three draws the pair as one picture, so they anchor as one group.
const CLEARING = {
  cast: { cx: 888, feet: 992 }
};

const AGNI_WALKING = {
  anchor: LANE,
  key: "agni", src: `${IMG}agni_walking.webp`, x: 380, y: 442, w: 460, h: 539,
  fill: { left: "-22.65%", top: "0%", width: "175.74%", height: "100%" }
};

// Figma Screen 1.1 › neel_walking (124:2). The art is trimmed to the box's own
// aspect, so the fill covers it exactly and needs no crop transform.
const NEEL_WALKING = {
  anchor: LANE,
  key: "neel", src: `${IMG}neel_walking.webp`, x: 835, y: 388, w: 510, h: 627
};

// Figma-matched mark for the walking box's centre (1090) and ground line
// (1015), so the pose change reads as a reaction rather than a reposition.
const NEEL_SMELLING = {
  anchor: LANE,
  key: "neel", src: `${IMG}neel_smelling.webp`, x: 836, y: 388, w: 508, h: 627
};

const NEEL_CHEEKY = {
  anchor: LANE,
  key: "neel", src: `${IMG}neel_cheeky.webp`, x: 908, y: 371, w: 472, h: 622,
  fill: { left: "-16.4%", top: "-0.06%", width: "126.88%", height: "100.13%" }
};

const AGNI_TALKING = {
  anchor: LANE,
  key: "agni", src: `${IMG}agni_talking.webp`, x: 358, y: 443, w: 550, h: 557
};

// The darkness. Trimmed out of the supplied footage, played forward then
// reversed so the loop seam is pixel-identical, and silent. It replaces the
// three eye stills that used to be hard-cut in their place.
const EYES = {
  key: "eyes",
  kind: "video",
  src: `${VID}darkness_with_eyes.webm`,
  x: 0, y: 0, w: 1920, h: 1080
};

/* ---- page 2: shared marks, so nothing re-dissolves between its steps ---- */

const TOWN_MOONLIT = { key: "bg-moonlit", src: `${IMG}bg_town_moonlit.webp`, x: 0, y: 0, w: 1920, h: 1080 };

const AGNI_DOWN = { key: "agni", src: `${IMG}agni_looking_down.webp`, x: 297, y: 461, w: 613, h: 566 };

const NEEL_SCARED = {
  key: "neel", src: `${IMG}neel_scared.webp`, x: 945, y: 403, w: 489, h: 624,
  fill: { left: "-15.02%", top: "0%", width: "152.56%", height: "104.64%" },
  fx: "shiver"
};

const MIST_LOW = { key: "mist-band", src: `${IMG}mist_band.webp`, x: 0, y: 510, w: 1920, h: 640, opacity: 0.67, fx: "mist-rise" };

// A second, wider pass of the same mist art sitting further up the frame, so
// the street can thicken over without cutting to a different render.
// Taller than Figma draws it, and deliberately so. The art is dense right to
// its own bottom edge, so wherever that edge lands is a straight cut across the
// frame — and `mist-swell` finishes at translateY(-20px) scale(1.1), which put
// this box's bottom at y 1028, fifty pixels short of the frame. That visible
// horizontal edge is what made the second bank read as a picture laid on top.
// At h 900 it finishes at 1175, well past the bottom, so the only edges on
// screen are the soft ones the art draws itself. MIST_LOW already clears it.
//
// The box is now 2240x900 against the art's 3:1, so `object-fit: cover` crops
// it horizontally rather than stretching it — no distortion, just less of the
// width, which on the blurred far bank costs nothing.
const MIST_HIGH = { key: "mist-high", src: `${IMG}mist_band.webp`, x: -160, y: 250, w: 2240, h: 900, opacity: 0.28, fx: "mist-swell" };

// The lamps are painted into the background, so putting them out means taking
// the light back out of the picture where each one stands. Positions were
// measured off bg_town_moonlit.webp: every entry is one lamp — or a cluster of
// distant ones — and the pool of light it throws, ordered from the far end of
// the lane in towards the pair's feet. `at` is when it pops, ms into the step.
const LAMP_LIST = [
  { x: 965, y: 578, rx: 205, ry: 100, at: 400 },  // the two farthest lamps
  { x: 733, y: 607, rx: 145, ry: 85, at: 1000 },  // the receding row behind them
  { x: 615, y: 570, rx: 160, ry: 205, at: 1600 }, // the mid lamp
  { x: 300, y: 520, rx: 345, ry: 475, at: 2300 }  // the near lamp and its pool
];

// Two layers over the same list, because the two halves of putting a lamp out
// blend in opposite directions: the flare screens light on, the extinguish
// multiplies it off. The blend mode has to sit on the container — the player
// gives every layer a z-index, which makes it a stacking context, so a blend
// mode on the blobs inside would have no backdrop to work against.
const LAMPS_FLARE = { key: "lamp-flare", kind: "lamps", mode: "flare", lamps: LAMP_LIST };
const LAMPS_OUT = { key: "lamp-out", kind: "lamps", mode: "out", lamps: LAMP_LIST };

// The three little lights on the last page. Each one glows — see .glow--* in
// css/story.css — because on that page they are the only light there is.
const NIGHT_PROPS = [
  // Off the right edge now, and mirrored so the pair face into the street.
  {
    key: "ghost", src: `${IMG}ghost.webp`, x: 1618, y: 430, w: 271, h: 181,
    flipX: true, glow: "ghost", fx: "float"
  },
  {
    // Figma has this at x 1874, which put most of it and nearly all of its
    // glow past the right edge. Pulled in so the light it gives off is on
    // screen, since on this page it is one of only three sources.
    key: "berry", src: `${IMG}berry.webp`, x: 1800, y: 742, w: 62, h: 55,
    fill: { left: "-22.76%", top: "-3.04%", width: "143.72%", height: "108.51%" },
    glow: "berry", fx: "float"
  }
];

// The firefly sits in Agni's hand, on the spark already painted into the art,
// so it moves with her between the two poses.
//
// Both marks come from measuring the swirl in the source art — (255,336) in
// scene_shock, (240,343) in scene_cheer, both 1024px wide — then scaling by the
// layer box's own width over 1024 and adding the box origin. Skipping that
// scale is what first put the firefly up by her wing instead of in her hand.
const FIREFLY_IN_HAND = {
  shock: { key: "firefly", src: `${IMG}firefly.webp`, x: 498, y: 570, w: 118, h: 79, glow: "spark" },
  cheer: { key: "firefly", src: `${IMG}firefly.webp`, x: 509, y: 622, w: 118, h: 79, glow: "spark" }
};

// "Very faint lights blink in distant hiding places" — clear of the characters
// and of the props above, so they read as far away.
const GLIMMERS = [
  { key: "glim-1", kind: "glimmer", x: 1640, y: 430, delay: 0 },
  { key: "glim-2", kind: "glimmer", x: 1700, y: 690, delay: 900 },
  { key: "glim-3", kind: "glimmer", x: 210, y: 300, delay: 1700 },
  { key: "glim-4", kind: "glimmer", x: 95, y: 880, delay: 2600 },
  { key: "glim-5", kind: "glimmer", x: 1500, y: 220, delay: 3400 }
];

// Cake on the air, drawn as a warm ribbon of scent that unfurls out of the
// bakery and sweeps the length of the street. Figma has no art for this — it is
// the cartoon beat the script asks for.
//
// The ribbons are specified as numbers rather than bezier strings so the curls
// stay perfectly round and the shape is tunable: `waves` is how many times it
// undulates across the sweep, `amp` how far, `loops` the fractions along it
// that turn a full spiral, and `radius` how big those spirals are. See
// ribbonPath() in js/story.js. Coordinates are local to the box below.
const AROMA = {
  key: "aroma",
  kind: "aroma",
  x: 300, y: 100, w: 1400, h: 640,
  ribbons: [
    // The main ribbon: out of the shop doorway, up past the cupcake sign, then
    // the length of the lane to the tree at the far end.
    { from: [1270, 450], to: [60, 250], waves: 1.6, amp: 62, loops: [0.28, 0.68], radius: 42 },
    // One strand riding above it, curling once on the offbeat.
    { from: [1240, 360], to: [200, 220], waves: 2, amp: 40, loops: [0.5], radius: 30, phase: 2 }
  ]
};

// Takes the brightness out of the last page, so the street and the pair read as
// still being in the dark and the only light on screen is what the firefly, the
// berry and the ghost are giving off. Everything meant to glow is layered above
// this; everything meant to be dark sits below it.
const DIM = { key: "dim", kind: "dim" };

const BUBBLE_NEEL ={ src: `${IMG}bubble_neel.webp`, x: 732, y: 182, w: 420, h: 226, flipX: true };

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
        hold: 5200, // "do I smell cake?" ends at 2.58s; the swirl needs 4.2s
        // Agni holds her mark exactly; Neel takes the sniffing pose on the
        // same centre and ground line, so only his drawing changes.
        layers: [AROMA, AGNI_WALKING, NEEL_SMELLING],
        say: {
          bubble: BUBBLE_NEEL,
          text: { x: 777, y: 224, w: 342 },
          lines: ["Mmm…", "do I smell cake?"]
        }
      },

      // Figma 1.3 — Agni is unimpressed. Only she changes mark: Neel holds the
      // walking pose all the way through her line, and reacts after it.
      {
        id: "1.3",
        hold: 3800, // "…had a cookie!" ends at 3.68s — his pose turns on that beat
        layers: [NEEL_SMELLING, AGNI_TALKING],
        say: {
          bubble: { src: `${IMG}bubble_agni.webp`, x: 128, y: 190, w: 586, h: 294, flipX: true },
          text: { x: 179, y: 265.95, w: 482 },
          lines: ["Oh, come on. You just", "had a cookie!"]
        }
      },

      // Her line has landed, and now Neil answers it with a face. This is the
      // one place his pose changes on this page.
      {
        // Last step of the page: waits for the reader, chevron in at 2.1s.
        id: "1.4",
        reveal: 2100,
        layers: [NEEL_CHEEKY, AGNI_TALKING]
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
        hold: 5200,
        layers: [TOWN_MOONLIT, AGNI_DOWN, NEEL_SCARED, MIST_LOW],
        say: {
          // The mist takes 3.2s to cover the cobbles. He speaks after it has,
          // not over the top of it — the sound cue is held back to match.
          at: 2600,
          bubble: BUBBLE_NEEL,
          text: { x: 777, y: 265, w: 342 },
          lines: ["What was that?"]
        }
      },

      // Figma 2.2 — the mist thickens and the lamps go out one at a time, far
      // end of the lane first, in towards the pair. The street is the same
      // layer it was in 2.1 and never cross-fades: only the light leaves it,
      // lamp by lamp, and the last of it drains away after the near one.
      {
        id: "2.2",
        // Ends as the last of the light drains, so the eyes open straight out
        // of the blackout instead of leaving the screen black and waiting.
        hold: 4900,
        layers: [
          TOWN_MOONLIT,
          // Over the street they light, under the faces they must not stain.
          LAMPS_FLARE, LAMPS_OUT,
          AGNI_DOWN, NEEL_SCARED, MIST_LOW, MIST_HIGH,
          { key: "lamp-die", kind: "lamp-die" }
        ]
      },

      // Figma 2.3 / 2.4 / 3 — pitch dark, two pairs of eyes. The eyes open the
      // moment the light has gone, and Mr Giggles crosses overhead: once, heard
      // and read, but never shown. A bubble would light the frame, so the two
      // lines after him are spoken in each character's own colour.
      {
        id: "3.1",
        hold: 4200, // he crosses at 500ms and takes 2.6s to pass
        layers: [{ key: "night", kind: "night" }, EYES],
        sfx: [{ kind: "laugh", y: 70, text: "Hee-hee-hee-hee!", delay: 500 }]
      },

      {
        id: "3.2",
        hold: 3800, // "Neil?", then the eyes blink on their own
        layers: [{ key: "night", kind: "night" }, EYES],
        voices: [{ x: 355, y: 700, w: 400, tone: "agni", text: "Neil?" }]
      },

      {
        // Last step of the page: chevron in once his answer has landed.
        id: "3.3",
        reveal: 3000,
        layers: [{ key: "night", kind: "night" }, EYES],
        voices: [{ x: 1040, y: 690, w: 560, tone: "neel", text: "I am here… I think." }]
      }
    ]
  },

  {
    id: "page-3",
    name: "The Twinkles",
    // Fireflies carry us out of the dark and into the last page.
    enter: { id: "3.4", fx: "fireflies", hold: 2800 },
    // Only the street belongs to the page. Everything else sits above the dim,
    // which is what makes the little lights the only light on this page — and
    // they all keep their keys, so nothing restarts between Agni's two lines.
    layers: [TOWN_DARK],
    steps: [
      // Figma 4.2 — Agni's spark picks out the two of them.
      {
        id: "4.1",
        hold: 5200, // "…the little twinkles!" ends at 3.83s (VO at 560 + 3.27s)
        layers: [
          { key: "cast", anchor: CLEARING, src: `${IMG}scene_shock.webp`, x: 239, y: 191, w: 1276, h: 851 },
          DIM,
          ...GLIMMERS,
          FIREFLY_IN_HAND.shock,
          ...NIGHT_PROPS
        ],
        say: {
          bubble: { src: `${IMG}bubble_agni.webp`, x: 118, y: 96, w: 586, h: 294, flipX: true },
          text: { x: 169, y: 153, w: 482 },
          lines: ["I think Mr. Giggles", "has scared the little", "twinkles!"]
        }
      },

      // Figma 4.3 — the call to adventure.
      {
        // Last step of the chapter: chevron in, then the end card.
        id: "4.2",
        reveal: 3100,
        layers: [
          { key: "cast", anchor: CLEARING, src: `${IMG}scene_cheer.webp`, x: 273, y: 241, w: 1258, h: 839 },
          DIM,
          ...GLIMMERS,
          FIREFLY_IN_HAND.cheer,
          ...NIGHT_PROPS
        ],
        say: {
          bubble: { src: `${IMG}bubble_agni.webp`, x: 54, y: 78, w: 606, h: 326, flipX: true },
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
      // Built at runtime by the firefly transition, so not in any scene.
      .concat(`${IMG}firefly.webp`)
  )
];
