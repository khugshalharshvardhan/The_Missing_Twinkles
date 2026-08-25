// Keeping a character still while its pose changes.
//
// Every pose is a separate file, drawn in Figma at its own box with its own
// transparent margin. Two poses placed at their designed boxes therefore do not
// put the character in the same place: measured, Agni's body centre wanders
// 118px and her feet 30px across one scene of the game, and Neel's 133px and
// 41px. Cross-fade between two poses that far apart and it does not read as a
// change of expression — it reads as the character sliding.
//
// So a scene declares an `anchor` — where that character stands for the whole
// scene — and every pose is shifted so its drawn body lands on it. The Figma
// coordinates in the data stay exactly as exported; the correction happens here,
// which keeps a future re-export from silently undoing it.
//
// The anchor is the body's centre-x and the bottom of its feet, and nothing
// else. Height is deliberately left alone: arms going up genuinely makes a pose
// taller, and normalising that would squash the gesture out of it.

import { POSE_BOX } from "./data/poses.js";

// Bubble art is named after whoever speaks through it, so the name alone is not
// enough — `bub_neel.webp` is a balloon, not Neel.
export function castOf(src) {
  if (!src) return null;
  const file = src.split("/").pop();
  if (/^bub/i.test(file)) return null;
  if (/agni/i.test(file)) return "agni";
  if (/neel/i.test(file)) return "neel";
  // Page 3 of the story draws the pair as one picture, so the two of them
  // anchor together as a single group.
  if (/^scene_/i.test(file)) return "cast";
  return null;
}

function poseBox(src) {
  const file = src.split("/").pop();
  for (const key of Object.keys(POSE_BOX)) {
    if (key.endsWith(`/${file}`)) return POSE_BOX[key];
  }
  return null;
}

// Where the drawn body lands on screen, in frame pixels, once Figma's crop and
// flip have been applied to the layer's box.
export function bodyBox(layer) {
  const pose = poseBox(layer.src);
  if (!pose) return null;

  const [ax0, ax1, ay0, ay1] = pose;
  const pct = (v) => parseFloat(v) / 100;
  const f = layer.fill
    ? { l: pct(layer.fill.left), t: pct(layer.fill.top), w: pct(layer.fill.width), h: pct(layer.fill.height) }
    : { l: 0, t: 0, w: 1, h: 1 };

  const fx = f.l * layer.w;
  const fw = f.w * layer.w;
  const fy = f.t * layer.h;
  const fh = f.h * layer.h;

  let x0 = fx + ax0 * fw;
  let x1 = fx + ax1 * fw;
  // The renderers mirror the whole box, so the body mirrors within it.
  if (layer.flipX) [x0, x1] = [layer.w - x1, layer.w - x0];

  // Clamped to the box, because the box clips: art outside it is not on screen
  // and must not drag the anchor around.
  const clamp = (v) => Math.max(0, Math.min(layer.w, v));
  const clampY = (v) => Math.max(0, Math.min(layer.h, v));

  return {
    x0: layer.x + clamp(x0),
    x1: layer.x + clamp(x1),
    y0: layer.y + clampY(fy + ay0 * fh),
    y1: layer.y + clampY(fy + ay1 * fh)
  };
}

// How far to move a layer so its body sits on the scene's anchor. Returns null
// when there is nothing to anchor — no anchor declared for this character, or
// art with no measurement, in which case the layer keeps its Figma position.
export function anchorOffset(layer, anchors) {
  if (!anchors) return null;

  const cast = castOf(layer.src);
  const mark = cast && anchors[cast];
  if (!mark) return null;

  const box = bodyBox(layer);
  if (!box) return null;

  return {
    dx: Math.round(mark.cx - (box.x0 + box.x1) / 2),
    dy: Math.round(mark.feet - box.y1)
  };
}
