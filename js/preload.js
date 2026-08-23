// Fetch and decode every scene asset up front so the story never cuts to a
// blank frame. A missing file resolves rather than rejects — one bad asset
// shouldn't stall the whole chapter.

export function preload(sources, onProgress = () => {}) {
  let settled = 0;

  const finish = (src, ok) => {
    if (!ok) console.warn(`Story asset failed to load: ${src}`);
    onProgress(++settled / sources.length);
    return ok;
  };

  return Promise.all(
    sources.map((src) =>
      /\.(webm|mp4)$/i.test(src)
        ? clip(src).then((ok) => finish(src, ok))
        : still(src).then((ok) => finish(src, ok))
    )
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
