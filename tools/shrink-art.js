// Brings the heaviest artwork down to the size it is actually drawn at.
//
//   node tools/shrink-art.js
//
// A browser holds every decoded image as width x height x 4 bytes, whatever the
// file compressed to — so a 24KB WebP that happens to be 4344x1448 costs a
// device 24 MEGABYTES the moment it is on screen. The walk was asking a phone
// to hold 171MB of bitmap at once, on top of 101MB of decoded audio, and a
// phone answers that by killing the tab and reloading it: the story plays, the
// walk starts, and the game appears to restart from the title.
//
// Nothing here is a judgement about quality. Each of these is measured against
// the size the layer is drawn at in js/data/walk.js, with headroom, and the
// ones drawn LARGER than their source are left alone unless they carry no
// detail to lose — a sky is a gradient and a ground plane is at 0.3 opacity.
//
// Originals are moved to assets/parallax/full/ rather than overwritten, so this
// can be re-run and nothing is lost.

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

// file -> the height to resize to. Where a layer is drawn at height H, the art
// is given H * 1.15 so it is never upscaled on a large screen.
const SHRINK = [
  // Drawn smaller than they are stored: pure waste, no visible change at all.
  { file: "assets/parallax/mist.webp", to: 373 },      // drawn at 324
  { file: "assets/parallax/grass.webp", to: 375 },     // drawn at 326
  { file: "assets/parallax/rocks.webp", to: 434 },     // drawn at 377
  { file: "assets/parallax/bushes.webp", to: 575 },    // drawn at 500
  { file: "assets/parallax/clouds.webp", to: 621 },    // drawn at 540
  { file: "assets/parallax/dark_leaves.webp", to: 644 },  // drawn at 560
  { file: "assets/parallax/trees.webp", to: 700 },     // drawn at 609

  // Drawn LARGER than they are stored, so they are already being stretched —
  // but there is nothing in them to lose. The sky is a gradient, the ground
  // plane sits at 0.3 opacity, the shrubs are a silhouette, the hills are a
  // soft band behind everything.
  { file: "assets/parallax/sky.webp", to: 400 },
  { file: "assets/parallax/ground.webp", to: 400 },
  { file: "assets/parallax/shrub.webp", to: 500 },
  { file: "assets/parallax/hills.webp", to: 450 },

  // The spark sheet: six twinkles in a strip, each drawn a few dozen pixels
  // across. Stored at 4344x1448, which is 24MB decoded for the smallest thing
  // on the screen.
  { file: "assets/parallax/fireflies.webp", to: 480 },

  // The walk cycles. Each frame is drawn about 300px tall.
  { file: "assets/spritesheet/agni_walk_strip.webp", to: 380 },
  { file: "assets/spritesheet/neel_walk_strip.webp", to: 420 },

  // The smell drifting out of the bakery, drawn 378px tall in the ending.
  { file: "assets/images/smell.webp", to: 460 }
];

const KEEP = path.join(ROOT, "assets/full");
fs.mkdirSync(KEEP, { recursive: true });

function size(file) {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=width,height",
    "-of", "csv=p=0", file], { encoding: "utf8" }).trim().split(",");
  return { w: Number(out[0]), h: Number(out[1]) };
}

const mb = (w, h) => (w * h * 4) / 1048576;

let before = 0;
let after = 0;

for (const { file, to } of SHRINK) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) { console.log(`  missing: ${file}`); continue; }

  // The original goes somewhere safe first, and is the source from then on, so
  // re-running never shrinks an already-shrunken file.
  const kept = path.join(KEEP, path.basename(file));
  if (!fs.existsSync(kept)) fs.copyFileSync(full, kept);

  const was = size(kept);
  if (was.h <= to) { console.log(`  ${path.basename(file).padEnd(26)} already ${was.h} tall`); continue; }

  const w = Math.round((was.w * to) / was.h);
  execFileSync("ffmpeg", ["-hide_banner", "-y", "-i", kept,
    "-vf", `scale=${w}:${to}:flags=lanczos`,
    "-c:v", "libwebp", "-quality", "88", "-compression_level", "6", full]);

  const now = size(full);
  before += mb(was.w, was.h);
  after += mb(now.w, now.h);
  console.log(`  ${path.basename(file).padEnd(26)} ${was.w}x${was.h} -> ${now.w}x${now.h}   ` +
    `${mb(was.w, was.h).toFixed(1)} -> ${mb(now.w, now.h).toFixed(1)} MB decoded`);
}

console.log(`\n${before.toFixed(0)} MB of bitmap becomes ${after.toFixed(0)} MB — ` +
  `${(before - after).toFixed(0)} MB less for a device to hold`);
console.log(`originals kept in assets/full/`);
