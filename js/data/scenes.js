// Story beats, transcribed from Figma › Mystry › Story (node 98:269).
//
// Every x / y / w / h is a literal Figma coordinate inside the 1920 x 1080
// frame, so the stage can be scaled as one unit (see stage.js) and the layout
// stays pixel-faithful to the design. Boxes are free to run off the frame —
// the stage clips them, exactly as Figma clips them.
//
// A layer is:
//   src      the image fill (Figma's own source art, so alpha survives)
//   x y w h  the layer box, in frame coordinates
//   fill     Figma's crop transform for the fill, when it has one. Without it
//            the fill covers the box, which is what Figma's "fill" mode does.
//   flipX    the fill is mirrored in the design
//   opacity  layer opacity
//   fx       motion hook -> .fx-* in css/story.css

const IMG = "assets/images/";

export const scenes = [
  // ---- Screen 1.1 — the town, still lit, nobody about yet (98:270) ----
  {
    id: "1.1",
    beat: "The lamps are still burning on Cupcake Lane.",
    layers: [
      { src: `${IMG}bg_town_lit.jpg`, x: 0, y: 0, w: 1920, h: 1080 }
    ]
  },

  // ---- Screen 1.2 — Agni and Neel stroll in (98:275) ----
  {
    id: "1.2",
    layers: [
      { src: `${IMG}bg_town_lit.jpg`, x: 0, y: 0, w: 1920, h: 1080 },
      {
        src: `${IMG}agni_walking.png`, x: 380, y: 442, w: 460, h: 539,
        fill: { left: "-22.65%", top: "0%", width: "175.74%", height: "100%" },
        fx: "walk-in-left"
      },
      {
        src: `${IMG}neel_walking.png`, x: 866, y: 399, w: 506, h: 625,
        fill: { left: "-18.23%", top: "-7.68%", width: "158.39%", height: "114.08%" },
        fx: "walk-in-right"
      }
    ],
    say: {
      bubble: { src: `${IMG}bubble_neel.png`, x: 732, y: 182, w: 420, h: 226, flipX: true },
      text:   { x: 777, y: 224, w: 342 },
      lines:  ["Mmm…", "do I smell cake?"]
    }
  },

  // ---- Screen 1.3 — Agni is unimpressed (98:282) ----
  {
    id: "1.3",
    layers: [
      { src: `${IMG}bg_town_lit.jpg`, x: 0, y: 0, w: 1920, h: 1080 },
      {
        src: `${IMG}neel_cheeky.png`, x: 908, y: 371, w: 472, h: 622,
        fill: { left: "-16.4%", top: "-0.06%", width: "126.88%", height: "100.13%" },
        fx: "breathe-slow"
      },
      { src: `${IMG}agni_talking.png`, x: 358, y: 443, w: 550, h: 557, fx: "breathe" }
    ],
    say: {
      bubble: { src: `${IMG}bubble_agni.png`, x: 128, y: 190, w: 586, h: 294, flipX: true },
      text:   { x: 179, y: 265.95, w: 482 },
      lines:  ["Oh, come on. You just", "had a cookie!"]
    }
  },

  // ---- Screen 2.1 — mist creeps up the lane (98:289) ----
  {
    id: "2.1",
    beat: "Something cold rolls in off the hills.",
    layers: [
      { src: `${IMG}bg_town_moonlit.jpg`, x: 0, y: 0, w: 1920, h: 1080 },
      { src: `${IMG}agni_looking_down.png`, x: 297, y: 461, w: 613, h: 566, fx: "breathe" },
      {
        src: `${IMG}neel_scared.png`, x: 945, y: 403, w: 489, h: 624,
        fill: { left: "-15.02%", top: "0%", width: "152.56%", height: "104.64%" },
        fx: "shiver"
      },
      { src: `${IMG}mist_band.png`, x: 0, y: 510, w: 1920, h: 640, opacity: 0.67, fx: "drift" }
    ]
  },

  // ---- Screen 2.2 — the mist swallows the street (98:295) ----
  {
    id: "2.2",
    beat: "…and it keeps on rising.",
    layers: [
      { src: `${IMG}bg_mist_full.jpg`, x: 0, y: 0, w: 1920, h: 1080, fx: "drift-slow" }
    ]
  },

  // ---- Screens 2.3 / 2.4 / 3 — lights out (98:298, 98:300, 98:302) ----
  // Three frames of the same blinking-eyes shot, so they play as one beat
  // instead of three near-identical clicks.
  {
    id: "3",
    beat: "Every lamp goes out at once.",
    enter: "blackout",
    layers: [
      { src: `${IMG}eyes_1.png`, x: 0, y: 0, w: 1920, h: 1080, fx: "blink-1" },
      { src: `${IMG}eyes_2.png`, x: 0, y: 0, w: 1920, h: 1080, fx: "blink-2" },
      { src: `${IMG}eyes_3.png`, x: 0, y: 0, w: 1920, h: 1080, fx: "blink-3" }
    ]
  },

  // ---- Screen 4.2 — Agni works out what happened (98:314) ----
  {
    id: "4.2",
    layers: [
      { src: `${IMG}bg_town_dark.jpg`, x: 0, y: 0, w: 1920, h: 1080 },
      { src: `${IMG}scene_shock.png`, x: 239, y: 191, w: 1276, h: 851, fx: "breathe" },
      { src: `${IMG}ghost.png`, x: -113, y: 487, w: 271, h: 181, fx: "float" },
      { src: `${IMG}firefly.png`, x: 1787, y: 48, w: 135, h: 90, fx: "flicker" },
      {
        src: `${IMG}berry.png`, x: 1874, y: 758, w: 62, h: 55,
        fill: { left: "-22.76%", top: "-3.04%", width: "143.72%", height: "108.51%" },
        fx: "float"
      }
    ],
    say: {
      bubble: { src: `${IMG}bubble_agni.png`, x: 118, y: 96, w: 586, h: 294, flipX: true },
      text:   { x: 169, y: 171.95, w: 482 },
      lines:  ["Mr. Giggles has scared", "the little light-keepers!"]
    }
  },

  // ---- Screen 4.3 — the call to adventure (98:304) ----
  {
    id: "4.3",
    layers: [
      { src: `${IMG}bg_town_dark.jpg`, x: 0, y: 0, w: 1920, h: 1080 },
      { src: `${IMG}scene_cheer.png`, x: 273, y: 241, w: 1258, h: 839, fx: "breathe" },
      { src: `${IMG}ghost.png`, x: -113, y: 487, w: 271, h: 181, fx: "float" },
      { src: `${IMG}firefly.png`, x: 1787, y: 48, w: 135, h: 90, fx: "flicker" },
      {
        src: `${IMG}berry.png`, x: 1874, y: 758, w: 62, h: 55,
        fill: { left: "-22.76%", top: "-3.04%", width: "143.72%", height: "108.51%" },
        fx: "float"
      }
    ],
    say: {
      bubble: { src: `${IMG}bubble_agni.png`, x: 54, y: 78, w: 606, h: 326, flipX: true },
      text:   { x: 117, y: 169, w: 481 },
      lines:  ["Let us find them and", "light the town again!"]
    }
  }
];

// Everything the story needs on screen, in one list, for the preloader.
export const manifest = [
  ...new Set(scenes.flatMap((scene) => [
    ...scene.layers.map((layer) => layer.src),
    ...(scene.say ? [scene.say.bubble.src] : [])
  ]))
];
