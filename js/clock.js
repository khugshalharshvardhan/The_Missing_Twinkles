// Timers that stop when the chapter does.
//
// Almost everything that happens on its own is a timeout: a beat advancing, a
// bubble clearing, the twinkles arriving, the hand-over releasing its hold.
// Pausing the artwork without pausing these leaves the picture frozen while the
// story keeps running underneath it — the beat you paused on is not the beat
// you come back to.
//
// So nothing in this project calls setTimeout directly. `after` has the same
// shape and remembers what is still owed, and freeze()/thaw() take a pause
// through it: what was left when the pause began is what is left when it ends.

let paused = false;
let seq = 0;

// id -> { fn, left, since, handle }. `left` is what remains to run; `since` is
// when it last started counting down.
const pending = new Map();

// The same signature as setTimeout, so a call site reads the same.
export function after(fn, ms = 0) {
  const id = ++seq;
  const entry = { fn, left: Math.max(0, ms), since: performance.now(), handle: 0 };
  pending.set(id, entry);
  if (!paused) start(id, entry);
  return id;
}

function start(id, entry) {
  entry.since = performance.now();
  entry.handle = window.setTimeout(() => {
    pending.delete(id);
    entry.fn();
  }, entry.left);
}

export function cancel(id) {
  const entry = pending.get(id);
  if (!entry) return;
  window.clearTimeout(entry.handle);
  pending.delete(id);
}

// Stop the clock. Every timer keeps whatever it had left.
export function freeze() {
  if (paused) return;
  paused = true;
  for (const entry of pending.values()) {
    window.clearTimeout(entry.handle);
    entry.left = Math.max(0, entry.left - (performance.now() - entry.since));
  }
}

// Start it again, each timer picking up where it stopped.
export function thaw() {
  if (!paused) return;
  paused = false;
  for (const [id, entry] of pending) start(id, entry);
}

export function isFrozen() {
  return paused;
}
