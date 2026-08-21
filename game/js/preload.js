// Decode every scene image up front so the story never cuts to a blank frame.
// A missing file resolves rather than rejects — one bad asset shouldn't
// stall the whole chapter.

export function preload(sources, onProgress = () => {}) {
  let settled = 0;

  return Promise.all(
    sources.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();

          const finish = (ok) => {
            if (!ok) console.warn(`Story asset failed to load: ${src}`);
            onProgress(++settled / sources.length);
            resolve(ok);
          };

          img.onload = () => finish(true);
          img.onerror = () => finish(false);
          img.src = src;
        })
    )
  );
}
