// Fetch and decode every scene asset up front so the story never cuts to a
// blank frame. A missing file resolves rather than rejects — one bad asset
// shouldn't stall the whole chapter.

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

export function preload(sources, onProgress = () => {}) {
  let settled = 0;
  let next = 0;

  const finish = (src, ok) => {
    if (!ok) console.warn(`Story asset failed to load: ${src}`);
    onProgress(++settled / sources.length);
    return ok;
  };

  const one = (src) =>
    /\.(webm|mp4)$/i.test(src)
      ? clip(src).then((ok) => finish(src, ok))
      : still(src).then((ok) => finish(src, ok));

  // Each worker takes the next source once it has finished its last, so there
  // are never more than AT_ONCE decodes alive at the same moment.
  const worker = async () => {
    while (next < sources.length) await one(sources[next++]);
  };

  return Promise.all(
    Array.from({ length: Math.min(AT_ONCE, sources.length) }, worker)
  );
}

function still(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

// Video needs its own element: an Image() would simply error on a .webm, and
// the eyes have to be ready to play the instant the lights go out.
const CLIP_TIMEOUT = 6000;

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
    film.addEventListener("loadeddata", () => settle(true), { once: true });
    film.addEventListener("error", () => settle(false), { once: true });
    // A clip that never fires either event must not hold the chapter shut.
    window.setTimeout(() => settle(false), CLIP_TIMEOUT);
    film.src = src;
    film.load();
  });
}
