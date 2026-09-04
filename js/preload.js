// Fetch and decode every scene asset up front so the story never cuts to a
// blank frame. A missing file resolves rather than rejects — one bad asset
// shouldn't stall the whole chapter.

import { fault } from "./watch.js";

// A FEW AT A TIME, which matters far more than it looks. An image being decoded
// holds a full uncompressed bitmap — width x height x 4 bytes — and starting
// sixty of them together asks the device for all sixty at that instant. On a
// desktop it is a spike nobody notices; on a phone it is the entire budget, and
// the browser answers by killing the tab. This is why the hand-over was fatal
// and the story was not: the story loads thirty images, the hand-over fired the
// walk's fifteen and every level's forty-nine at the same moment.
//
// Six in flight turns a spike into a window that moves.
const AT_ONCE = 6;

// A request that never answers must not hold the chapter shut. This is NOT a
// deadline for a slow connection: on a phone on mobile data the whole chapter's
// art and voice share one thin pipe, and a picture can sit queued behind them
// for a long time and then arrive perfectly. Giving up on it at fifteen seconds
// made a slow connection look like a broken one — and the retry that followed
// put the same request back on the same queue, making it slower still. This is
// only for a request that has genuinely stopped answering, and every place that
// waits on art has its own, much shorter, cap (see ready() in js/main.js), so
// nothing on screen is ever waiting on this number.
const STILL_TIMEOUT = 45000;

// HELD, WHICH IS THE POINT OF PRELOADING AT ALL.
//
// An Image nothing points at is collectable, and the moment it is collected the
// only copy left is the HTTP cache — which a phone evicts whenever it likes,
// and which a host can tell the browser not to keep at all. So a picture could
// be preloaded, dropped, and then fetched AGAIN over the network at the instant
// it was finally put on screen. On this machine that refetch comes off
// localhost and nobody sees it; over a real connection it is a character who
// is not there yet, a speech bubble that never draws, a blank screen with the
// voice still playing.
//
// Holding the elements keeps the decoded picture alive for as long as the act
// that needs it is on screen. Each group is released by name when its act is
// done (js/main.js), so this is the same memory shape as before — one place's
// art at a time — with the guarantee that what was loaded is still there.
const held = new Map();

export function release(group) {
  held.delete(group);
}

export function preload(sources, onProgress = () => {}, group = null) {
  let settled = 0;
  let next = 0;
  const keep = [];

  const finish = (src, el) => {
    if (el) keep.push(el);
    else fault(`art: ${src.split("/").pop()}`);
    onProgress(++settled / sources.length);
    return !!el;
  };

  const one = (src) =>
    /\.(webm|mp4)$/i.test(src)
      ? clip(src).then((ok) => finish(src, ok || null))
      : still(src).then((el) => finish(src, el));

  // Each worker takes the next source once it has finished its last, so there
  // are never more than AT_ONCE decodes alive at the same moment.
  const worker = async () => {
    while (next < sources.length) await one(sources[next++]);
  };

  const all = Promise.all(
    Array.from({ length: Math.min(AT_ONCE, sources.length) }, worker)
  ).then(() => keep);

  if (group) held.set(group, all);
  return all;
}

// Resolves with the loaded element, or null. One retry on a real error,
// because a live host drops a connection now and then and the second ask
// almost always lands. A timeout is NOT retried: a request that is merely slow
// is still coming, and asking again only adds to what the pipe is already
// carrying.
function still(src, retry = true) {
  return new Promise((resolve) => {
    const img = new Image();
    let done = false;
    const settle = (el, again) => {
      if (done) return;
      done = true;
      if (el || !again || !retry) resolve(el);
      else still(src, false).then(resolve);
    };
    img.onload = () => settle(img, false);
    img.onerror = () => settle(null, true);
    window.setTimeout(() => settle(null, false), STILL_TIMEOUT);
    img.src = src;
  });
}

// Video needs its own element: an Image() would simply error on a .webm, and
// the eyes have to be ready to play the instant the lights go out.
const CLIP_TIMEOUT = 20000;

function clip(src) {
  return new Promise((resolve) => {
    const film = document.createElement("video");
    let done = false;
    const settle = (ok) => {
      if (done) return;
      done = true;
      resolve(ok);
    };

    film.muted = true;
    film.preload = "auto";
    // The first frame decoded is enough: it guarantees the cut has something
    // to show, and the rest streams in well before it is needed. Waiting for
    // canplaythrough instead held the loader for fifteen seconds.
    film.addEventListener("loadeddata", () => settle(film), { once: true });
    film.addEventListener("error", () => settle(null), { once: true });
    // A clip that never fires either event must not hold the chapter shut.
    window.setTimeout(() => settle(null), CLIP_TIMEOUT);
    film.src = src;
    film.load();
  });
}
