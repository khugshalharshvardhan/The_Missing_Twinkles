// The walk — the prologue to act two.
//
// The pair follow a firefly down a forest path and arrive at the clearing the
// counting game opens on. The world scrolls past them while they walk on the
// spot, each layer at its own speed, which is what gives the depth.
//
// This is drawn in the GAME's frame (1882 x 1059), not the story's, so the
// hand-over at the end needs no frame change and can be a straight cross-fade.
// bg_night.webp — the game's opening screen — is the same painting as these
// layers, so the walk settles onto it rather than cutting.

const PX = "assets/parallax/";
const IMG = "assets/images/";
const GAME = "assets/game/";
const SHEET = "assets/spritesheet/";

export const FRAME_W = 1882;
export const FRAME_H = 1059;

// How long the whole thing runs, and how it is spent.
export const WALK_MS = 8600;
export const SETTLE_MS = 2200; // the last stretch, easing to a standstill
export const HAND_OVER_MS = 900; // cross-fade onto the game's first screen

// How the scene is framed.
//
// The parallax art is not one registered painting cut into bands — that is the
// assumption the first two passes were built on and it is why they looked
// wrong. Rendered on a grey field, each file turns out to be one of two things:
//
//   * a ground plane — `ground` (dirt path) and `grass` are strips with a hard
//     flat bottom edge, drawn to be cropped by the bottom of the frame
//   * a row of props — `rocks`, `bushes`, `shrub` and `dark_leaves` are
//     separate objects standing on a baseline, with nothing below it
//
// So there is no shared scale to find. Each layer is placed on purpose: a prop
// row by standing its baseline on the ground, a plane by running its near edge
// past the frame bottom, and each one sized for its distance — nearer means
// bigger, which is the perspective the speeds already imply.
//
// Measured content extents, as a fraction of each file's own height, are quoted
// per layer below; `h` is the height the whole canvas is scaled to, so a
// baseline at fraction f lands at y + f * h.

// Where their feet land, and the line every prop baseline is placed against.
export const GROUND_Y = 800;

// Back to front. `speed` is a multiple of the walking pace: the sky barely
// moves, the ground moves exactly with them, and the near foliage overtakes.
// Every layer tiles horizontally — measured, not assumed — so each one is a
// repeating background rather than a row of copies in the DOM. Tile width comes
// from `h` and the file's aspect, and every layer is sized so the walk covers
// less than about one tile: the seam never comes round twice.
export const layers = [
  { key: "sky", src: `${PX}sky.webp`, speed: 0.03, y: 0, h: FRAME_H },
  // content 0.25..0.72 — bottom on the skyline, above the hills
  { key: "clouds", src: `${PX}clouds.webp`, speed: 0.09, y: 44, h: 800 },
  // content 0.36..0.72 — bottom at the horizon behind the trees
  { key: "hills", src: `${PX}hills.webp`, speed: 0.2, y: 153, h: 760 },
  // Its own canvas (1774 x 887, so 2:1 against everyone else's 3:1). content
  // 0.03..0.95 — trunk bases at 780, just behind the ground line, so they meet
  // the grass instead of ending in mid-air. 736px pines against a 423px Neel.
  { key: "trees", src: `${PX}trees.webp`, speed: 0.42, y: 20, h: 800 },
  // Solid earth for the two ground planes to sit on. Measured: neither
  // `ground` nor `grass` ever reaches full opacity — they peak at 0.99 and 0.97
  // and fade out at both edges, so they are texture, not surface. Without this
  // the starfield showed through the seam between them as a dark band right
  // under their feet, which is the line that would not go away. Colours are
  // sampled from the cores of the two planes it backs.
  { key: "earth", kind: "earth", speed: 0, y: 700, h: FRAME_H - 700 },
  // A prop row. content 0.28..0.81 — baselines on the path at 800, sized for
  // the middle distance rather than looming.
  { key: "rocks", src: `${PX}rocks.webp`, speed: 0.62, y: 525, h: 340 },
  // A ground plane, and the surface they walk on. content 0.44..0.64 — the
  // dirt path. Its bottom edge is a hard cut, so it is tucked at 870, below
  // where the grass in front of it turns opaque (845); left any higher it draws
  // a line clean across the frame under their feet, which it did.
  { key: "ground", src: `${PX}ground.webp`, speed: 1, y: 166, h: 1100 },
  // A prop row, and a small one: measured content is 0.55..0.585 of the file, a
  // 25px band of tufts. It cannot be scaled up to plant-size without turning to
  // mush, and put in front of the pair at any size it drew a single dark line
  // across their ankles and painted over their contact shadows. So it stays
  // small and stays behind them, where it is what it actually is — scrub along
  // the near edge of the path.
  { key: "shrub", src: `${PX}shrub.webp`, speed: 1, y: 322, h: 800 },
  // The near ground plane. content 0.48..0.71, scaled up so its near edge falls
  // past the bottom of the frame — that is what makes the ground reach the
  // viewer instead of stopping at an edge. Coarser than the path because it is
  // nearer, and a shade darker because nothing lights it.
  { key: "grass", src: `${PX}grass.webp`, speed: 1, y: 180, h: 1250, dim: 0.82 },
  // content 0.33..0.67 — haze lying along the path.
  { key: "mist", src: `${PX}mist.webp`, speed: 0.78, opacity: 0.5, y: 239, h: 900 }
];

// Drawn after the cast, nearest last. Both are prop rows with their baselines
// held below the frame, so only the tops are in shot and they close across the
// pair's soles — which, with the contact shadows, is what puts the two of them
// in the scene rather than on top of it.
export const foreground = [
  // content 0.24..0.82 — baseline held below the frame at 1120, so the tops
  // come in at 819, just under their feet: enough to plant them, not enough to
  // hide the stride.
  { key: "bushes", src: `${PX}bushes.webp`, speed: 1.32, y: 694, h: 520, dim: 0.82 },
  // content 0.13..0.85 — the nearest thing in shot. Kept a little slower than
  // its distance would suggest, so its short tile does not come round twice,
  // and darkened hard: nothing lights it, so it should read as a silhouette
  // framing the scene. Undimmed it competed with the bushes instead.
  { key: "leaves", src: `${PX}dark_leaves.webp`, speed: 1.5, y: 764, h: 560, dim: 0.5 }
];

// fireflies.webp is a sheet: six of them in a row across a 3:1 strip. Tiled as
// a layer they come out shoulder to shoulder at any size small enough to read
// as fireflies, so they are placed one at a time instead — `cell` picks which
// of the six, and the box is twice as tall as it is wide because that is the
// cell's own shape.
export const SPARK_CELLS = 6;
export const SPARK_SHEET = `${PX}fireflies.webp`;

export const sparks = [
  { cell: 0, x: 150, y: 430, w: 42, drift: 5.4, delay: 0 },
  { cell: 2, x: 505, y: 336, w: 33, drift: 6.8, delay: -2.1 },
  { cell: 4, x: 1015, y: 470, w: 38, drift: 6.1, delay: -3.6 },
  { cell: 1, x: 1470, y: 362, w: 30, drift: 7.4, delay: -1.2 },
  { cell: 5, x: 1755, y: 512, w: 40, drift: 5.8, delay: -4.4 },
  { cell: 3, x: 790, y: 604, w: 28, drift: 8.2, delay: -5.5 }
];

// The two of them, walking on the spot.
//
// Each is a nine-frame sprite strip laid out horizontally, re-cut from the 3x3
// sheets the generator returned. Two things were fixed in the re-cut: the cells
// are cropped to the union of all nine bounding boxes, so they are uniform and
// tight, and every frame is shifted vertically until its lowest opaque row
// lines up. The sheets came with 14px (Agni) and 25px (Neel) of baseline drift,
// which would have read as bouncing against the ground. Aligning the baseline
// keeps the height variation, and height variation with a fixed baseline is
// exactly the head bob a walk should have — 13px and 30px of it respectively.
//
// `cell` is the strip's own cell size, `sole` the row the baseline sits on.
// Boxes keep the cell's aspect so nothing is stretched, and `feet` allows for
// the couple of empty rows under the sole.
//
// `step.ms` is one full cycle — two steps, confirmed by counting bobs in the
// frames — and is matched to stride so the feet do not skate. Stride was taken
// from the contact strip of each cell: the widest foot span less one foot
// length gives about 96px for Agni and 162px on screen for Neel, which at the
// 285 px/s ground pace wants a 700ms and an 1120ms cycle. Tracking the planted
// heel directly would be better, but these frames do not plant a foot
// consistently enough for that to be measurable. Agni's quicker cycle is not
// an accident of the numbers — a shorter stride means more steps per second.
export const cast = [
  {
    key: "agni",
    src: `${SHEET}agni_walk_strip.webp`,
    sheet: { frames: 9, cell: [460, 552], sole: 550 },
    x: 568, w: 300, h: 360, feet: GROUND_Y + 1,
    shadow: { w: 186, h: 32 },
    step: { ms: 700, delay: 0 }
  },
  {
    key: "neel",
    src: `${SHEET}neel_walk_strip.webp`,
    sheet: { frames: 9, cell: [445, 604], sole: 600 },
    x: 889, w: 310, h: 421, feet: GROUND_Y + 3,
    shadow: { w: 200, h: 36 },
    // Offset a little over half a cycle, so the two are never in lockstep.
    step: { ms: 1120, delay: -560 }
  }
];

// The firefly they are following: out ahead, weaving, and the reason they are
// walking this way at all.
export const guide = {
  key: "guide",
  src: `${GAME}firefly.webp`,
  w: 104,
  h: 109,
  // Out ahead of Neel and above the path, so they read as following it.
  x: 1330,
  y: GROUND_Y - 430
};
