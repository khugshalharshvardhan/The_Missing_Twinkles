// Measures every speech balloon and writes js/data/bubbles.js.
//
//   node tools/measure-bubbles.js
//
// Three numbers come out of each balloon, and each answers a question the art
// cannot be asked at runtime:
//
//   face  the round body, without the tail. A balloon is a body plus a tail,
//         so the middle of its layer box is not the middle of the shape the
//         reader sees — the box has to be tall enough to hold the tail too.
//
//   room  the largest rectangle that fits INSIDE the outline. The face is a
//         bounding box, and a bounding box includes the corners the balloon
//         curves away from: text laid out in it runs into the border at the
//         top and bottom of every line. This is the space actually enclosed.
//
//   tail  where the tail sits across the width. A balloon is scaled to fit
//         its own line (js/fit.js), and this is the point that has to stay
//         still while it resizes, or it stops pointing at the mouth.
//
// All three are found by run length. For every row of the art, measure the
// widest run of opaque pixels: the body rows are wide, the tail rows are
// narrow. Numbers come out as fractions of the image, so they hold at any size.

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DIRS = ["assets/game", "assets/images"];
const IS_BUBBLE = /^(bub|bubble)/i;
const S = 240;             // sample grid
const FACE_MIN = 0.55;     // a row this wide, relative to the widest, is body

function measure(file) {
  const d = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-vf", `scale=${S}:${S}`,
    "-pix_fmt", "rgba", "-f", "rawvideo", "-"], { maxBuffer: 1 << 26 });

  // Widest run per row, and where it starts — twice over. The first pass takes
  // any opaque pixel, which is the balloon including its border, and gives the
  // face and the tail. The second takes only the pale paper inside it, so the
  // room a line is given starts where the border ends rather than on top of it.
  const runs = (test) => {
    const out = [];
    let widest = 0;
    for (let y = 0; y < S; y++) {
      let run = 0, start = 0, best = 0, bestAt = 0;
      for (let x = 0; x < S; x++) {
        const i = (y * S + x) * 4;
        if (test(d[i], d[i + 1], d[i + 2], d[i + 3])) {
          if (run === 0) start = x;
          run++;
          if (run > best) { best = run; bestAt = start; }
        } else {
          run = 0;
        }
      }
      out.push({ w: best, x0: bestAt, x1: bestAt + best });
      if (best > widest) widest = best;
    }
    return { out, widest };
  };

  const drawn = runs((r, g, b, a) => a > 40);
  const rows = drawn.out;
  const widest = drawn.widest;

  // The paper inside: opaque, and pale enough not to be the outline. Every
  // balloon in this game is drawn on cream, whatever colour its border is.
  const paper = runs((r, g, b, a) => a > 200 && (r * 0.299 + g * 0.587 + b * 0.114) > 150).out;

  // The longest unbroken band of body-width rows — the tail is thinner, and a
  // stray wide row elsewhere cannot drag the band with it.
  const wide = rows.map((r) => r.w >= widest * FACE_MIN);
  let band = { from: 0, to: -1 };
  let from = -1;
  for (let y = 0; y <= S; y++) {
    if (wide[y] && from < 0) from = y;
    if ((!wide[y] || y === S) && from >= 0) {
      if (y - 1 - from > band.to - band.from) band = { from, to: y - 1 };
      from = -1;
    }
  }

  let x0 = S, x1 = 0;
  for (let y = band.from; y <= band.to; y++) {
    x0 = Math.min(x0, rows[y].x0);
    x1 = Math.max(x1, rows[y].x1);
  }

  // The tail: whatever opaque pixels sit below the body. Its middle is the
  // point a balloon has to hold still when it is resized to fit its line, or
  // it would stop pointing at the mouth it belongs to.
  let tx0 = S, tx1 = 0, hasTail = false;
  for (let y = band.to + 1; y < S; y++) {
    if (rows[y].w <= 0) continue;
    hasTail = true;
    tx0 = Math.min(tx0, rows[y].x0);
    tx1 = Math.max(tx1, rows[y].x1);
  }
  const tailX = hasTail ? (tx0 + tx1) / 2 / S : (x0 + x1) / 2 / S;

  // The room inside: of every rectangle whose rows all lie within the
  // balloon's own runs, the one with the most area. Walking the bottom edge
  // down from each top edge keeps the left and right edges as a running
  // maximum and minimum, so this stays a couple of hundred thousand
  // comparisons rather than a search.
  const biggestBox = (band, lines) => {
    let best = { x0: 0, x1: 0, y0: 0, y1: 0, area: 0 };
    for (let top = band.from; top <= band.to; top++) {
      let left = lines[top].x0;
      let right = lines[top].x1;
      for (let bottom = top; bottom <= band.to; bottom++) {
        left = Math.max(left, lines[bottom].x0);
        right = Math.min(right, lines[bottom].x1);
        if (right <= left) break;
        const area = (right - left) * (bottom + 1 - top);
        if (area > best.area) best = { x0: left, x1: right, y0: top, y1: bottom + 1, area };
      }
    }
    return best;
  };

  // Inside the paper if that reads sensibly, and inside the whole shape if it
  // does not — a balloon drawn on something other than cream would otherwise
  // come back with almost no room at all.
  const outline = biggestBox(band, rows);
  const inside = biggestBox(band, paper);
  const room = inside.area > outline.area * 0.4 ? inside : outline;

  const f = (v) => +(v / S).toFixed(4);
  return {
    face: [f(x0), f(x1), f(band.from), f(band.to + 1)],
    room: [f(room.x0), f(room.x1), f(room.y0), f(room.y1)],
    tail: +tailX.toFixed(4)
  };
}

const out = {};
for (const dir of DIRS) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) continue;
  for (const name of fs.readdirSync(full).sort()) {
    if (!/\.(webp|png)$/i.test(name)) continue;
    if (!IS_BUBBLE.test(name)) continue;
    const key = `${dir.split("/").pop()}/${name}`;
    const m = measure(path.join(full, name));
    out[key] = m;
    console.log(
      `  ${name.padEnd(18)} face ${m.face.join(" ")}   room ${m.room.join(" ")}   tail ${m.tail}`);
  }
}

const body = Object.entries(out)
  .map(([k, v]) => `  "${k}": { face: [${v.face.join(", ")}], room: [${v.room.join(", ")}], tail: ${v.tail} }`)
  .join(",\n");

fs.writeFileSync(path.join(ROOT, "js/data/bubbles.js"),
`// The measured shape of every speech balloon, as fractions of its own image.
//
// GENERATED by tools/measure-bubbles.js — do not edit by hand. Re-run it when
// a balloon's art changes.
//
//   face  the round body without the tail. Centring inside the layer box does
//         NOT centre inside the balloon: the box is sized to hold the tail
//         too, so the words drift towards whichever side the tail is not on.
//   room  the largest rectangle that fits inside the outline. The face is a
//         bounding box and includes the corners the balloon curves away from,
//         so text laid out in the face runs into the border; this is the space
//         actually enclosed, and it is what a line is given.
//   tail  where the tail sits across the width, 0 at the left edge and 1 at
//         the right — the point a balloon holds still while it is scaled to
//         fit its line.
export const BUBBLE_ART = {
${body}
};

function shapeOf(src) {
  return BUBBLE_ART[src.split("/").slice(-2).join("/")] ?? null;
}

// A box mirrored with its art, when the balloon is flipped so its tail points
// at whoever is speaking.
function flip([x0, x1, y0, y1], mirrored) {
  return mirrored ? [1 - x1, 1 - x0, y0, y1] : [x0, x1, y0, y1];
}

export function faceOf(src, mirrored = false) {
  const shape = shapeOf(src);
  return shape ? flip(shape.face, mirrored) : null;
}

// Where a line of text is allowed to go. js/fit.js insets this a little
// further, so the words have air around them rather than sitting against the
// outline.
export function roomOf(src, mirrored = false) {
  const shape = shapeOf(src);
  return shape ? flip(shape.room, mirrored) : null;
}

export function tailXOf(src, mirrored = false) {
  const shape = shapeOf(src);
  if (!shape) return 0.5;
  return mirrored ? 1 - shape.tail : shape.tail;
}
`);

console.log(`\nwrote js/data/bubbles.js — ${Object.keys(out).length} balloons`);
