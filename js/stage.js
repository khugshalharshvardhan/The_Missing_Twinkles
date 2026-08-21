// Keeps the fixed 1920x1080 design frame fitted to whatever the browser
// window happens to be. Scaling one element means every scene can keep its
// literal Figma coordinates.

const stage = document.getElementById("stage");
const root = getComputedStyle(document.documentElement);

const FRAME_W = parseFloat(root.getPropertyValue("--frame-w")) || 1920;
const FRAME_H = parseFloat(root.getPropertyValue("--frame-h")) || 1080;

export function fitStage() {
  const scale = Math.min(
    window.innerWidth / FRAME_W,
    window.innerHeight / FRAME_H
  );
  stage.style.setProperty("--scale", scale);
}

export function watchStage() {
  fitStage();
  window.addEventListener("resize", fitStage);
  window.addEventListener("orientationchange", fitStage);
  // Mobile browsers resize the visual viewport without firing `resize`.
  window.visualViewport?.addEventListener("resize", fitStage);
}
