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

// One twinkle crossing the dark while Neel answers. Same effect as the
// fireflies that carry the reader into page 3, deliberately: smaller, dimmer,
// slower and higher up, so it reads as the first single one to come back rather
// than as the swarm arriving early — and so that when the swarm does arrive a
// beat later it is plainly more of the same thing.
const LONE_TWINKLE = {
  key: "lone-twinkle", kind: "firefly-trail",
  // The tease, in phases: in to the centre (1.4s), a full stop where she
  // notices the reader (1.2s), a short hop onward (1s), and a dissolve — 4.3s
  // all told, with her dust staying lit after her. `pause` picks the phased
  // flight (fly-pause in story.css and the piecewise trail in js/story.js —
  // the three must agree); `vanish` is how far across she gets. The delay
  // waits out Neel's line (voice at 300 + 2.04s + a breath).
  top: 250, scale: 0.78, ms: 4300, motes: 210, delay: 2550,
  vanish: 0.58, pause: true
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

// Only one lamp is put out by hand now: the near one, standing right beside
// Agni. Positions were measured off bg_town_moonlit.webp — its lantern head is
// at (304, 380) and the pool it throws lands under it on the cobbles. The rest
// of the street no longer pops one lantern at a time; it falters, and then the
// light simply leaves it.
//
// Two layers over the one lamp, because the two halves of putting it out blend
// in opposite directions: the flare screens light on, the extinguish multiplies
// it off. They are given separate boxes on purpose — the flare belongs to the
// lantern head, which is the thing the reader is watching, while what has to go
// dark is the far larger pool underneath it. The blend mode has to sit on the
// container: the player gives every layer a z-index, which makes it a stacking
// context, so a blend mode on the blobs inside would have no backdrop to work
// against.
const LAMP_FLARE_AT = { x: 304, y: 380, rx: 215, ry: 205, at: 4950 };
const LAMP_POOL = { x: 300, y: 560, rx: 345, ry: 460, at: 4950 };

// The lamp alone gutters: the same dark blob over the same pool, stuttering its
// light off and back on twice without quite putting it out. On 2.1, straight
// after "What was that?" lands — the line, then the answer. One lamp in trouble,
// in a street that is otherwise still perfectly fine.
const LAMP_GUTTER = {
  key: "lamp-gutter", kind: "lamps", mode: "gutter",
  lamps: [{ ...LAMP_POOL, at: 3950 }]
};

const LAMPS_FLARE = { key: "lamp-flare", kind: "lamps", mode: "flare", lamps: [LAMP_FLARE_AT] };
const LAMPS_OUT = { key: "lamp-out", kind: "lamps", mode: "out", lamps: [LAMP_POOL] };

// What the lamp lets go of as it dies: a ring of sparks out of the glass,
// drifting up and burning out on the air.
const LAMP_SPARKS = {
  key: "lamp-sparks", kind: "sparkle",
  x: 304, y: 380, count: 26, spread: 265, at: 4850
};

// The same street with every light off — bg_town_moonlight_wide is the moonlit
// render re-done with the lamps and windows dark, pixel-registered with it (a
// 50/50 blend of the two reads as one picture). That registration is the whole
// transition: the lit street cross-fades to this and every edge stays exactly
// where it was, so nothing reads as a picture being replaced — only the lights
// in it going out. The blackout-by-hand layers this replaces (a multiply pass
// down to black, then bg_town_dark rising out of it) existed because
// bg_town_dark is a different camera; none of that is needed against art that
// lines up.
const TOWN_WIDE_OUT = { key: "bg-wide-out", src: `${IMG}bg_town_moonlight_wide.webp`, x: 0, y: 0, w: 1920, h: 1080 };

// What the swap cannot do: the pair are drawn lit, and stay lit through it.
// This takes the lamplight off them and the mist, gently, once the town behind
// them has gone dark.
const STREET_DUSK = { key: "street-dusk", kind: "dusk" };

// The one twinkle they have, and the little story it tells across the page:
// cupped in Agni's hand while she works out what happened, and gone from it by
// the time she says let us go — up and off to the right, where it hangs in the
// dark as the thing they are about to chase. It keeps its key across both
// steps, so the player's layer diffing GLIDES it out of her hand rather than
// re-drawing it somewhere else (see .layer's transition in css/story.css).
//
// The shock mark is measured, not guessed: the gold swirl painted into the new
// art sits at (0.4318, 0.5111) of the picture, so the sprite is centred there
// through the layer box below. The cheer mark is where the ghost used to
// hover, which is the far side of the street from her hand.
const FIREFLY_IN_HAND = {
  shock: { key: "firefly", src: `${IMG}firefly.webp`, x: 731, y: 587, w: 118, h: 79, glow: "spark" },
  cheer: { key: "firefly", src: `${IMG}firefly.webp`, x: 1695, y: 481, w: 118, h: 79, glow: "spark" }
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
// Cake on the air — the supplied art, assets/images/smell.webp, rather than a
// drawn one. The box is worked backwards from two points in the picture: the
// thick head of the trail sits at (0.872, 0.102) of the art and has to land on
// the bakery's chimney at (1768, 152), and its wisp of a tail sits at
// (0.150, 0.885) and has to finish on Neel's nose at (1191, 533). Solving both
// gives the box below. It stretches the art about 19% taller than square, which
// on a soft glow is invisible and is what lets both ends land where they mean
// something instead of only one of them. It unfurls from the chimney end — see
// .fx-smell in css/story.css.
const AROMA = {
  key: "aroma",
  src: `${IMG}smell.webp`,
  x: 1071, y: 102, w: 799, h: 487,
  fx: "smell"
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
        hold: 3500, // "…taking a walk" ends at 2.54s; a beat of air after it
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
        layers: [AGNI_WALKING, NEEL_SMELLING, AROMA],
        say: {
          bubble: BUBBLE_NEEL,
          text: { x: 777, y: 224, w: 342 },
          lines: ["हम्म…", "केक की खुशबू?"]
        }
      },

      // Figma 1.3 — Agni is unimpressed. Only she changes mark: Neel holds the
      // walking pose all the way through her line, and reacts after it.
      {
        id: "1.3",
        // "…had a cookie!" ends at 3.68s. At 3800 the line had 120ms to land
        // before his grin and the chuckle walked over it; now it gets a full
        // beat, and the grin reads as an answer instead of an interruption.
        hold: 4700,
        layers: [NEEL_SMELLING, AGNI_TALKING],
        say: {
          bubble: { src: `${IMG}bubble_agni.webp`, x: 128, y: 190, w: 586, h: 294, flipX: true },
          text: { x: 179, y: 265.95, w: 482 },
          lines: ["नील! अभी तो तुमने", "कुछ खाया था!"]
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
        // The line lands at 3.9s; the lamp answers it — gutters to 4.95s, then
        // flares, pops, throws its sparks and goes out, all while the rest of
        // the town is still lit. The step turns at 6.3s with the lamp already
        // dark, so the town going out on 2.2 plainly follows from it.
        hold: 6300,
        layers: [
          TOWN_MOONLIT,
          LAMP_GUTTER, LAMPS_FLARE, LAMPS_OUT,
          AGNI_DOWN, NEEL_SCARED, MIST_LOW,
          // On the lit street only — the sparks are the lamp's, not the dark's.
          LAMP_SPARKS
        ],
        say: {
          // The mist takes 3.2s to cover the cobbles. He speaks after it has,
          // not over the top of it — the sound cue is held back to match.
          at: 2600,
          bubble: BUBBLE_NEEL,
          text: { x: 777, y: 265, w: 342 },
          lines: ["अरे! ये क्या हो रहा है?"]
        }
      },
      // Figma 2.2 — the near lamp has just died, and now the town goes with
      // it. The lit street cross-fades to the same render with every light off
      // (see TOWN_WIDE_OUT), the last warmth settles off the pair, and the dark
      // drains into the black the eyes open out of on 3.1.
      {
        id: "2.2",
        // The swap takes the layer fade's 700ms; the dark town then has to be
        // seen before lamp-die takes it at 2.6s. Ends as that finishes.
        hold: 3900,
        layers: [
          TOWN_WIDE_OUT,
          AGNI_DOWN, NEEL_SCARED, MIST_LOW, MIST_HIGH,
          STREET_DUSK,
          { key: "lamp-die", kind: "lamp-die" }
        ]
      },

      // Figma 2.3 / 2.4 / 3 — pitch dark, two pairs of eyes. The eyes open the
      // moment the light has gone, and Mr Giggles crosses overhead: once, heard
      // and read, but never shown. A bubble would light the frame, so the two
      // lines after him are spoken in each character's own colour.
      //
      // The holds across these three used to be set by the round number rather
      // than by the lines, which left roughly a second of nothing after every
      // one of them — worst on 3.2, where "Neil?" lasts 0.69s and the beat ran
      // for 3.8. Each now ends a beat after its own line lands, so Agni calls
      // into the dark and Neel answers her rather than answering three seconds
      // later.
      {
        id: "3.1",
        // One blink (900ms, see the cue), then the hehes: three of them
        // popping at scattered spots while the giggle roams the dark. The last
        // fades out around 4.1s.
        hold: 4600,
        layers: [{ key: "night", kind: "night" }, EYES],
        sfx: [{ kind: "hehes", count: 3, delay: 1250, gap: 1000 }]
      },

      {
        id: "3.2",
        hold: 1900, // "Neil?" runs 0.69s from 340; the rest is one blink
        layers: [{ key: "night", kind: "night" }, EYES],
        voices: [{ x: 355, y: 700, w: 400, tone: "agni", text: "नील?" }]
      },

      {
        // Last step of the page: chevron in once the twinkle has gone. His
        // line lands first ("I am here… I think." runs 2.04s from 300); only
        // THEN one twinkle enters — the first light since the lamp — and
        // dissolves halfway across, a tease the next page chases.
        id: "3.3",
        reveal: 7300,
        layers: [
          { key: "night", kind: "night" },
          EYES,
          LONE_TWINKLE
        ],
        voices: [{ x: 1040, y: 690, w: 560, tone: "neel", text: "हाँ, मैं यहीं हूँ!" }]
      }
    ]
  },

  {
    id: "page-3",
    name: "The Twinkles",
    // A short black cover over the page swap, and the music coming back up
    // under it. It used to run for 2.8s because there was a firefly crossing it
    // worth watching; there is not any more, and black held that long is a
    // pause rather than a page turn.
    enter: { id: "3.4", fx: "fireflies", hold: 1600 },
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
          { key: "cast", anchor: CLEARING, src: `${IMG}scene_shock1.webp`, x: 263, y: 219, w: 1221, h: 798 },
          DIM,
          ...GLIMMERS,
          FIREFLY_IN_HAND.shock
        ],
        say: {
          bubble: { src: `${IMG}bubble_agni.webp`, x: 118, y: 96, w: 586, h: 294, flipX: true },
          text: { x: 169, y: 153, w: 482 },
          lines: ["लगता है मिस्टर गिगल्स ने", "सभी जुगनुओं को", "डरा दिया है।"]
        }
      },

      // Figma 4.3 — the call to adventure.
      {
        // Last step of the chapter: chevron in, then the end card.
        id: "4.2",
        reveal: 3100,
        layers: [
          { key: "cast", anchor: CLEARING, src: `${IMG}scene_cheer1.webp`, x: 258, y: 217, w: 1298, h: 804 },
          DIM,
          ...GLIMMERS,
          FIREFLY_IN_HAND.cheer
        ],
        say: {
          bubble: { src: `${IMG}bubble_agni.webp`, x: 54, y: 78, w: 606, h: 326, flipX: true },
          text: { x: 117, y: 169, w: 481 },
          lines: ["चलो, उन्हें ढूँढ़कर", "शहर को फिर से रोशन करें!"]
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
