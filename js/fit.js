// Sizing a speech balloon to the line inside it.
//
// Every balloon was drawn at one fixed size, chosen against the English line it
// used to hold. The Hindi lines are different lengths, so a two-word balloon
// was as big as a three-line one. Both acts now shrink each balloon to its own
// line, and they do it the same way, which is what lives here.
//
// The art always scales UNIFORMLY — the outline keeps its shape, nothing is
// stretched — and never past the size it was drawn at, because those sizes were
// laid out against the characters and a balloon that grew could cover them.

// How small a balloon may go, and how much air to leave around the line once it
// fits.
export const FIT_MIN = 0.5;
export const FIT_AIR = 1.06;

// How far inside the balloon's own room a line is set, as a fraction of that
// room. The room already stops at the inside edge of the border (measured by
// tools/measure-bubbles.js), so this is breathing space rather than clearance:
// without it the words end up resting against the outline, because the fitting
// shrinks a balloon until its line only just fits.
export const ROOM_INSET = 0.05;

// The box a line is given inside a balloon: its measured room, brought in on
// every side. Fractions of the art, in the same shape as everything else here.
export function textRoom(room) {
  const [x0, x1, y0, y1] = room ?? [0, 1, 0, 1];
  const inX = (x1 - x0) * ROOM_INSET;
  const inY = (y1 - y0) * ROOM_INSET;
  return [x0 + inX, x1 - inX, y0 + inY, y1 - inY];
}

// How far past the size it was drawn at a balloon may go for a line too long
// to fit it. Every line in the game is set at ONE size — a beat whose words are
// smaller than the last one's reads as a mistake, and these are children
// learning to read the words as much as to count what is behind them — so it is
// the balloon that gives, never the type.
export const FIT_MAX = 1.35;

// The real size of a piece of text, in stage pixels.
//
// scrollWidth is no use here: the line is centred, so one that is too wide
// spills equally past both edges, and the left half of that spill is not
// scrollable — the box happily reports that it fits when it does not. A Range
// measures what is actually drawn, across every line of it.
export function textBox(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const drawn = range.getBoundingClientRect();

  // The stage is scaled to the viewport, so these come back in screen pixels.
  // The element's own two widths give the scale to convert them back.
  const box = el.getBoundingClientRect();
  const scale = el.offsetWidth > 0 && box.width > 0 ? box.width / el.offsetWidth : 1;

  return { w: drawn.width / scale, h: drawn.height / scale };
}

// How far the INK of a line sits above or below the middle of the box holding
// it, in stage pixels — positive means it is drawn low.
//
// Centring the box is not the same as centring what the reader sees. A font
// reserves the same descent under every line, deep enough for the lowest thing
// the script can draw; Devanagari mostly does not use it, so a line of Hindi
// centred by its box sits four to seven pixels high inside the balloon. This
// measures the line's own ink and hands back the difference, so the box can be
// moved by it and the words end up in the middle of the balloon.
const ruler = document.createElement("canvas").getContext("2d");

export function inkShift(line) {
  const style = getComputedStyle(line);
  const lead = parseFloat(style.lineHeight);
  if (!(lead > 0)) return 0;

  ruler.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const m = ruler.measureText(line.textContent.replace(/s+/g, " "));
  if (!(m.fontBoundingBoxAscent > 0)) return 0;

  // Where the baseline lands inside a line box, and where the ink sits around
  // it. Both are the same on every line, so the answer does not depend on how
  // many lines the balloon ended up holding.
  const baseline = (lead - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2
    + m.fontBoundingBoxAscent;
  const ink = baseline + (m.actualBoundingBoxDescent - m.actualBoundingBoxAscent) / 2;

  return ink - lead / 2;
}

// Move a laid-out line up or down so its ink, rather than its box, is in the
// middle of the balloon. Reads the top the fitting left behind, so it can only
// ever be applied once per fit.
export function centreInk(line) {
  const shift = inkShift(line);
  const top = parseFloat(line.style.top);
  const height = line.clientHeight;
  if (!shift || !height || !Number.isFinite(top)) return;

  // The game pins its line box top AND bottom, the story pins top and height.
  // Moving the top of the first one only makes it taller, and the words then
  // recentre in the taller box — half the correction. Fixing the height it was
  // just given turns both of them into the same box, which can then be moved.
  line.style.height = `${height}px`;
  line.style.bottom = "auto";
  line.style.top = `${top - shift}px`;
}

// The smallest size, between `min` and the size it was drawn at, where `line`
// still fits the box that `place` lays out for it — plus a little air. `place`
// is called repeatedly and left holding the chosen size.
export function fitToText(line, place, { min = FIT_MIN, air = FIT_AIR } = {}) {
  const fits = () => {
    const drawn = textBox(line);
    return drawn.w <= line.clientWidth + 1 && drawn.h <= line.clientHeight + 1;
  };

  // A line too long for the size its balloon was drawn at needs a bigger
  // balloon. It grows from the tail, like every other resize here, so it still
  // points at the same mouth — and it is capped, because these were laid out
  // against the characters and one that grew without limit would cover them.
  place(1);
  if (!fits()) {
    let small = 1;
    let big = FIT_MAX;
    place(big);
    if (!fits()) return big;
    for (let i = 0; i < 8; i++) {
      const mid = (small + big) / 2;
      place(mid);
      if (fits()) big = mid; else small = mid;
    }
    place(Math.min(FIT_MAX, big * air));
    return big;
  }

  let lo = min;
  let hi = 1;
  for (let i = 0; i < 9; i++) {
    const mid = (lo + hi) / 2;
    place(mid);
    if (fits()) hi = mid; else lo = mid;
  }

  const scale = Math.min(1, hi * air);
  place(scale);
  if (fits()) return scale;

  place(1);
  return 1;
}
