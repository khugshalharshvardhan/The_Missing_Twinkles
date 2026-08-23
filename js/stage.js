// Keeps the design frame fitted to whatever the browser window happens to be.
// Scaling one element means every scene can keep its literal Figma
// coordinates.
//
// The two acts were drawn at different sizes — the story at 1920 x 1080, the
// counting game at 1882 x 1059 — so the frame is a pair of variables on #stage
// rather than a constant. Handing over swaps them and re-fits the same
// element, which is what lets both halves live in one document without either
// one giving up its coordinates.

const stage = document.getElementById("stage");
const root = getComputedStyle(document.documentElement);

let frameW = parseFloat(root.getPropertyValue("--frame-w")) || 1920;
let frameH = parseFloat(root.getPropertyValue("--frame-h")) || 1080;

export function fitStage() {
  const scale = Math.min(
    window.innerWidth / frameW,
    window.innerHeight / frameH
  );
  stage.style.setProperty("--scale", scale);
}

// Resize the frame itself. #stage sizes off these variables, so this is all it
// takes to move from one act's coordinate space to the other's.
export function setFrame(w, h) {
  frameW = w;
  frameH = h;
  stage.style.setProperty("--frame-w", w);
  stage.style.setProperty("--frame-h", h);
  fitStage();
}

export function watchStage() {
  fitStage();
  window.addEventListener("resize", fitStage);
  window.addEventListener("orientationchange", fitStage);
  // Mobile browsers resize the visual viewport without firing `resize`.
  window.visualViewport?.addEventListener("resize", fitStage);
}
