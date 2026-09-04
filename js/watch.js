// A black box for a device with no console.
//
// When a phone kills a tab for running out of memory it reloads the page, and
// everything that might have said why goes with it: no error, no log, just the
// title screen again. This writes where the chapter got to into sessionStorage
// as it goes, so the run that died leaves a note behind for the run that
// follows it — and the title screen can show what it says.
//
// It is deliberately tiny and never throws: a black box that breaks takes the
// evidence with it.

const KEY = "mystry.blackbox";
const MAX = 40;

let trail = [];
let started = Date.now();

function save() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ at: started, trail }));
  } catch {
    /* private browsing, a full quota — nothing here is worth an exception */
  }
}

// One step of the chapter, with how long into the run it happened.
export function mark(step, detail) {
  const at = Math.round((Date.now() - started) / 100) / 10;
  trail.push(detail === undefined ? `${at}s ${step}` : `${at}s ${step} ${detail}`);
  if (trail.length > MAX) trail = trail.slice(-MAX);
  save();
}

// Something went wrong. Recorded in the same trail, in order, so it is obvious
// what was happening at the time.
export function fault(what) {
  mark("FAULT", String(what).slice(0, 160));
}

// What the last run left behind, read the moment this module is imported —
// BEFORE anything can call mark(), because the first mark of this run
// overwrites it. Cleared as it is read, so it only ever describes the run
// immediately before this one.
const previous = (() => {
  let saved = null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) saved = JSON.parse(raw);
    sessionStorage.removeItem(KEY);
  } catch {
    return null;
  }
  if (!saved?.trail?.length) return null;
  // A run that reached the end has nothing to report.
  if (saved.trail.some((line) => line.includes("chapter:done"))) return null;
  return saved.trail;
})();

export function lastRun() {
  return previous;
}

// Catch what the platform reports, so an error that happens where no console is
// open still lands in the trail.
export function watchFaults() {
  window.addEventListener("error", (e) => {
    fault(e.message || e.error || "error");
  });
  window.addEventListener("unhandledrejection", (e) => {
    fault(`promise: ${e.reason?.message ?? e.reason ?? "rejected"}`);
  });
  // The clearest signal of all, where it is supported: the browser telling us
  // it is about to take the page away.
  window.addEventListener("pagehide", () => mark("pagehide"));
  document.addEventListener("visibilitychange", () => mark(`visibility:${document.visibilityState}`));
}

// Everything the device will admit to about what it has to spend.
export function deviceNote() {
  const bits = [
    `${window.innerWidth}x${window.innerHeight}`,
    `dpr${window.devicePixelRatio || 1}`
  ];
  if (navigator.deviceMemory) bits.push(`${navigator.deviceMemory}GB`);
  if (navigator.hardwareConcurrency) bits.push(`${navigator.hardwareConcurrency}core`);
  return bits.join(" ");
}
