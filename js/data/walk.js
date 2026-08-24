// The walk — the prologue to act two.
//
// The pair follow a firefly down the path and arrive in the clearing the
// counting game opens on. The world scrolls past them while they walk, each
// layer at its own speed, which is what gives the depth.
//
// Everything here is derived from one fact: the parallax files are the elements
// of the game's own opening background, assets/game/bg_night.webp. So the walk
// is not a separate scene that cuts to the game — it is that painting taken
// apart and set moving, and the arrival puts every piece back where the
// painting has it. The numbers below were measured off bg_night itself and off
// the character positions in js/data/screens.js, not chosen by eye.

const PX = "assets/parallax/";
const SHEET = "assets/spritesheet/";
const GAME = "assets/game/";

export const FRAME_W = 1882;
export const FRAME_H = 1059;

// How long the whole thing runs, and how it is spent.
export const WALK_MS = 8600;
export const SETTLE_MS = 2200; // the last stretch, easing to a standstill
export const HAND_OVER_MS = 900; // cross-fade onto the game's first screen

// Where their feet land. Measured: on the game's first screen Agni's soles are
// at y 989 and Neel's at 984, so the walk stands them on the same line and the
// hand-over has nothing to correct.
export const GROUND_Y = 986;

// bg_night's own structure, sampled down the middle 40% of its columns so the
// edge pines and bushes do not pollute the reading:
//
//   0..560     sky
//   560..795   hills, brightening into mist
//   795        the clearing's far edge — a hard hue break, blue to green
//   795..855   far grass
//   855..1059  the dirt clearing, brightest at 920, falling into shadow
//
// Every layer below is placed against those four numbers. A prop row (rocks,
// bushes, shrub, dark_leaves — separate objects standing on a baseline) is
// placed by its baseline; a ground plane (ground, grass — texture with a soft
// top and a hard bottom edge) by running its near edge past the frame bottom.
// `h` is the height the whole canvas scales to, so content at fraction f of the
// file lands at y + f * h. `settle` is an opacity the layer eases to over the
// last stretch: bg_night keeps pines and planting only at the very edges of
// frame and nothing across the middle, so the layers that tile all the way
// across thin out as the pair arrive and the clearing opens. `settleMask` does
// the same job for the pines, but by masking the middle of the frame open and
// leaving the edges standing, because that is where bg_night has its own — fade
// them out altogether and the game's edge pines have nothing to fade into and
// pop in instead. What is left at the hand-over is close enough that the
// cross-fade has little to do. `fadeBottom: [a, b]` fades a layer out between
// those fractions of its own box, for art whose lower edge is a hard cut.
export const layers = [
  { key: "sky", src: `${PX}sky.webp`, speed: 0.03, y: 0, h: FRAME_H },
  // content 0.25..0.72 — high, scattered cloud. Sized down twice: at anything
  // near the file's own scale the puffs come out far larger than the painting's
  // and the sky reads brighter than bg_night's by a measurable margin.
  { key: "clouds", src: `${PX}clouds.webp`, speed: 0.09, y: 8, h: 540 },
  // content 0.36..0.72 — the ridge line, bottom on the 795 break. That bottom is
  // a hard cut in the file, and it measured as the one edge left in the frame
  // that bg_night does not have, so `fadeBottom` dissolves it into the haze the
  // way the painting does.
  { key: "hills", src: `${PX}hills.webp`, speed: 0.2, fadeBottom: [0.66, 0.76], y: 325, h: 653 },
  // content 0.33..0.67 — the haze that brightens the foot of the hills.
  { key: "mist", src: `${PX}mist.webp`, speed: 0.78, opacity: 0.72, y: 583, h: 324 },
  // Its own canvas (1774 x 887, so 2:1 against everyone else's 3:1). content
  // 0.03..0.95 — trunk bases on the 790 line, where bg_night stands its pines.
  { key: "trees", src: `${PX}trees.webp`, speed: 0.42, settleMask: 0.22, y: 211, h: 609 },
  // Solid earth under the two ground planes. Measured: neither plane ever
  // reaches full opacity — they peak at 0.99 and 0.97 and fade out at both
  // edges, so they are texture, not surface, and without this the starfield
  // showed through the seam between them as a band under their feet. The CSS
  // stops are bg_night's own row colours, so where the texture thins, what
  // shows through is the game's ground exactly.
  { key: "earth", kind: "earth", speed: 0, y: 780, h: FRAME_H - 780 },
  // A prop row. content 0.28..0.81 — baselines at 880, on the near grass.
  { key: "rocks", src: `${PX}rocks.webp`, speed: 0.62, settle: 0, y: 575, h: 377 },
  // A ground plane. content 0.48..0.71 — the far grass, 795..870.
  { key: "grass", src: `${PX}grass.webp`, speed: 1, opacity: 0.45, settle: 0.3, y: 639, h: 326 },
  // A prop row, and a small one: content is 0.55..0.585 of the file, a 25px
  // band of tufts. Scaled up to plant size it turns to mush, so it stays as
  // scrub along the grass edge at 870.
  { key: "shrub", src: `${PX}shrub.webp`, speed: 1, settle: 0, y: 118, h: 1286 },
  // The dirt clearing, and the surface they walk on. content 0.44..0.64, its
  // near edge run past the bottom of the frame so the ground reaches the viewer
  // instead of stopping at an edge.
  //
  // Held right back, because it is texture and not tone: measured, this file's
  // own dirt is rgb(30,31,59) where bg_night's is rgb(108,89,166). bg_night is a
  // finished, lit painting and this is the raw element, so at any real opacity it
  // dragged the clearing 38% darker than the screen it hands over to. The earth
  // gradient carries the tone; this supplies the movement over it.
  { key: "ground", src: `${PX}ground.webp`, speed: 1, opacity: 0.3, y: 371, h: 1100 },
  // Where the walk arrives: the game's own opening painting, brought up over the
  // settle so the scrolling pieces dissolve back into the picture they were cut
  // from. Matching the parallax to bg_night by eye got the tones within a
  // luminance point or two but never the structure — the hills are a different
  // shape and the clouds a different size, and at a cross-fade that is exactly
  // what shows. Fading the painting itself in makes the match exact by
  // construction, and leaves the hand-over with nothing at all to change.
  { key: "arrive", kind: "still", src: `${GAME}bg_night.webp`, speed: 0,
    opacity: 0, settle: 1, y: 0, h: FRAME_H }
];

// Drawn after the cast, nearest last, both prop rows with their baselines held
// below the frame. Both fade to nothing on arrival: they are in front of the
// cast, so anything left of them would be sitting on top of the game's painting
// once it lands.
// below the frame so only the tops are in shot. They close across the pair's
// soles, which with the contact shadows is what puts the two of them in the
// scene rather than on top of it — and bg_night has planting in exactly these
// bottom corners, which is where the pair end up standing.
export const foreground = [
  // content 0.24..0.82 — baseline at 1230, tops in at 940.
  { key: "bushes", src: `${PX}bushes.webp`, speed: 1.32, settle: 0, y: 820, h: 500, dim: 0.82 },
  // content 0.13..0.85 — the nearest thing in shot. Darkened hard: nothing
  // lights it, so it reads as a silhouette framing the scene.
  { key: "leaves", src: `${PX}dark_leaves.webp`, speed: 1.5, settle: 0, y: 884, h: 560, dim: 0.5 }
];

// fireflies.webp is a sheet: six of them in a row across a 3:1 strip. Tiled as
// a layer they come out shoulder to shoulder at any size small enough to read
// as fireflies, so they are placed one at a time instead — `cell` picks which
// of the six, and the box is twice as tall as it is wide because that is the
// cell's own shape.
export const SPARK_CELLS = 6;
export const SPARK_SHEET = `${PX}fireflies.webp`;

export const sparks = [
  { cell: 0, x: 150, y: 402, w: 42, drift: 5.4, delay: 0 },
  { cell: 2, x: 505, y: 296, w: 33, drift: 6.8, delay: -2.1 },
  { cell: 4, x: 1015, y: 448, w: 38, drift: 6.1, delay: -3.6 },
  { cell: 1, x: 1470, y: 330, w: 30, drift: 7.4, delay: -1.2 },
  { cell: 5, x: 1755, y: 492, w: 40, drift: 5.8, delay: -4.4 },
  { cell: 3, x: 790, y: 610, w: 28, drift: 8.2, delay: -5.5 }
];

// The two of them.
//
// Each is a nine-frame sprite strip laid out horizontally, re-cut from the 3x3
// sheets the generator returned: cells cropped to the union of all nine
// bounding boxes, and every frame shifted until its lowest opaque row lines up.
// The sheets came with 14px (Agni) and 25px (Neel) of baseline drift, which read
// as bouncing against the ground; aligning it leaves the height variation, and
// height variation over a fixed baseline is the head bob a walk wants.
//
// `to` is where the game's first screen puts them — measured through Figma's
// crop transforms rather than read off the layer boxes, so it is the centre and
// height of the character's own opaque pixels. `from` is where the walk starts
// them, close together mid-frame. Between the two they spread out and grow: they
// are walking towards the viewer as well as along it, and Neel pulls ahead,
// which is in character. So the walk ends with both already standing where the
// game draws them, and the hand-over has nothing left to move.
//
// `per` is the ground distance one full cycle covers at the `to` size, measured
// off the contact strip of each cell — widest foot span less one foot length,
// doubled for the two steps. The cycle is driven by distance rather than by a
// clock, so as the scroll eases to a stop the feet stop with it.
export const cast = [
  {
    key: "agni",
    src: `${SHEET}agni_walk_strip.webp`,
    sheet: { frames: 9, cell: [460, 552], sole: 550 },
    from: { cx: 700, h: 358 },
    to: { cx: 329, h: 484 },
    feet: 989,
    shadow: { w: 250, h: 42 },
    step: { per: 260, phase: 0 }
  },
  {
    key: "neel",
    src: `${SHEET}neel_walk_strip.webp`,
    sheet: { frames: 9, cell: [445, 604], sole: 600 },
    from: { cx: 1080, h: 418 },
    to: { cx: 1618, h: 511 },
    feet: 984,
    shadow: { w: 245, h: 44 },
    // Started half a cycle along, so the two are never in lockstep.
    step: { per: 396, phase: 0.5 }
  }
];

// The firefly they are following: out ahead, weaving, and the reason they are
// walking this way at all. Kept high, where the game's swarm is.
export const guide = {
  key: "guide",
  src: `${GAME}firefly.webp`,
  w: 104,
  h: 109,
  x: 1180,
  y: 402
};
