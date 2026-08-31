// Generates the story's three remaining music beds with ffmpeg.
//
//   node tools/gen-beds.js assets/audios/sfx
//
// The main theme (bed_main) is a supplied track. Measured, it is in A MINOR at
// about 133 BPM, so everything written here is in A minor or its relative C
// major and pulses at rates derived from that tempo — four cues that cross-fade
// into each other as one score rather than four separate pieces.
//
// Same two rules as tools/gen-sfx.js, and one more that matters here:
//
//   * args go through an argv array, never a shell.
//   * NO COMMAS inside an ffmpeg expression — the filtergraph parser uses them
//     as separators. Everything below is built from + - * / and function calls.
//   * every bed LOOPS, so each drone is an integer number of Hz over an integer
//     number of seconds (a whole number of cycles, silent seam) and every
//     tremolo rate is a whole number of cycles across the loop too. Struck
//     notes are placed so their tails die well before the end.
//
// Everything is synthesised — no samples, no network.

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const TMP = path.join(__dirname, "beds_tmp");
const OUT = process.argv[2];
if (!OUT) throw new Error("usage: node tools/gen-beds.js <outDir>");
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const SR = 44100;
// The level every bed is written at. Measured, not chosen: the music bus in
// js/audio.js (BUS_GAIN.music) was tuned against a mastered -17 LUFS track, so
// a bed written quieter than that simply disappears under the dialogue. The
// quiet moments are made with each cue's own `music.to` in js/data/audio.js,
// not by writing a quieter file.
const BED_LUFS = -17;

function ff(args) {
  try {
    execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    throw new Error(`ffmpeg failed\n  ${args.join(" ")}\n  ${(e.stderr || "").toString().trim()}`);
  }
}

function src(name, lavfi, filters) {
  const out = path.join(TMP, `${name}.wav`);
  const args = ["-f", "lavfi", "-i", lavfi];
  if (filters) args.push("-af", filters);
  ff([...args, out]);
  return out;
}

// Mix parts, each optionally delayed by `at` ms and scaled by `gain`.
function mix(name, parts, post) {
  const out = path.join(TMP, `${name}.wav`);
  const args = [];
  const graph = [];
  parts.forEach((p, i) => {
    args.push("-i", p.file);
    const at = p.at ? `adelay=${p.at}|${p.at},` : "";
    graph.push(`[${i}]${at}volume=${p.gain ?? 1}[m${i}]`);
  });
  graph.push(
    `${parts.map((_, i) => `[m${i}]`).join("")}amix=inputs=${parts.length}:normalize=0` +
    (post ? `,${post}` : "") + "[out]"
  );
  ff([...args, "-filter_complex", graph.join(";"), "-map", "[out]", out]);
  return out;
}

// How much of the end is folded back over the beginning to hide the seam.
const XFADE = 2;

function publish(name, dur, file) {
  const spaced = path.join(TMP, `${name}_sp.wav`);
  const looped = path.join(TMP, `${name}_lp.wav`);

  // Room first, on the over-length render.
  ff(["-i", file, "-t", String(dur + XFADE),
    "-af", "aecho=0.86:0.62:57|113:0.17|0.10,lowpass=f=9000", spaced]);

  // The loop crossfade. Whole-cycle drones alone are not enough once anything
  // with a tail (echo) or a ramp (loudness) has touched the audio — the end of
  // the file no longer matches its start, and it ticks once per lap. So the
  // piece is written XFADE seconds long than it needs to be and its overhang
  // is dissolved back over its own opening: the last thing you hear IS the
  // first thing you hear, so the wrap cannot be heard at all.
  ff(["-i", spaced, "-filter_complex",
    `[0]asplit=3[a][b][c];` +
    `[a]atrim=0:${XFADE},asetpts=PTS-STARTPTS[head];` +
    `[b]atrim=${XFADE}:${dur},asetpts=PTS-STARTPTS[mid];` +
    `[c]atrim=${dur}:${dur + XFADE},asetpts=PTS-STARTPTS[tail];` +
    `[tail][head]acrossfade=d=${XFADE}:c1=tri:c2=tri[xf];` +
    `[xf][mid]concat=n=2:v=0:a=1[out]`,
    "-map", "[out]", looped]);

  // Loudness as ONE static gain rather than loudnorm's moving one, for the
  // same reason: a gain that drifts across the file leaves the ends mismatched.
  const probe = require("child_process").spawnSync("ffmpeg",
    ["-i", looped, "-af", `loudnorm=I=${BED_LUFS}:TP=-2:print_format=json`, "-f", "null", "-"],
    { encoding: "utf8" });
  const m = (probe.stderr || "").match(/\{[\s\S]*?\}/);
  if (!m) throw new Error(`could not measure ${name}`);
  const st = JSON.parse(m[0]);
  const gain = Math.min(BED_LUFS - parseFloat(st.input_i), -2 - parseFloat(st.input_tp));

  ff(["-i", looped, "-af", `volume=${gain.toFixed(2)}dB`,
    "-ac", "2", "-ar", String(SR), "-b:a", "112k",
    path.join(OUT, `${name}.mp3`)]);

  const d = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
    "-of", "csv=p=0", path.join(OUT, `${name}.mp3`)]).toString().trim();
  console.log(`  ${name}.mp3  ${Number(d).toFixed(1)}s  (${gain.toFixed(1)}dB)`);
}

/* ---------------- voices ---------------- */

// A held tone. Integer Hz over an integer duration, so the loop seam is silent.
// `wob` is the tremolo rate in cycles across the WHOLE loop, so it seams too.
// ffmpeg's tremolo will not go below 0.1 Hz, which over a loop this long means
// at least three cycles — worth failing loudly on rather than silently losing
// the movement in a drone.
function rate(wob, dur) {
  const f = wob / dur;
  if (f < 0.1) throw new Error(`tremolo ${f.toFixed(4)}Hz (${wob} cycles over ${dur}s) is below ffmpeg's 0.1Hz floor`);
  return f.toFixed(6);
}

function drone(name, hz, dur, wob, depth) {
  return src(name, `aevalsrc=sin(2*PI*${hz}*t):d=${dur + XFADE}:s=${SR}`,
    wob ? `tremolo=f=${rate(wob, dur)}:d=${depth}` : undefined);
}

// Air under the music: filtered noise, breathing slowly.
function air(name, dur, filt, wob, depth) {
  return src(name, `anoisesrc=d=${dur + XFADE}:c=brown:r=${SR}:a=0.8`,
    `${filt},tremolo=f=${rate(wob, dur)}:d=${depth}`);
}

// One struck note — a music box: a fundamental under three fast-decaying
// partials, the top ones slightly sharp of the harmonic series the way a
// struck metal tine is. That inharmonicity is most of what says "music box"
// rather than "sine".
function tine(name, hz, decay = 2.2) {
  const d = Math.max(1.6, 5 / decay);
  return src(name,
    `aevalsrc=(sin(2*PI*${hz}*t)*exp(-${decay}*t)` +
    `+0.45*sin(2*PI*${(hz * 2.01).toFixed(3)}*t)*exp(-${(decay * 2.1).toFixed(2)}*t)` +
    `+0.22*sin(2*PI*${(hz * 3.02).toFixed(3)}*t)*exp(-${(decay * 3.2).toFixed(2)}*t)` +
    `+0.09*sin(2*PI*${(hz * 4.05).toFixed(3)}*t)*exp(-${(decay * 5).toFixed(2)}*t))*0.9` +
    `:d=${d.toFixed(2)}:s=${SR}`);
}

/* ================= bed_uneasy — the mist arrives =================
   A minor, and it will not settle: over the A-E fifth sits an F, one semitone
   above the E, so the two beat against each other for the whole cue. The music
   box picks its way down to the leading tone and stops there, unresolved. */
{
  const D = 28;
  const box = [
    { hz: 440, at: 2400 },   // A4
    { hz: 523, at: 5400 },   // C5
    { hz: 494, at: 9900 },   // B4
    { hz: 415, at: 14400 },  // G#4 — the leading tone, left hanging
    { hz: 440, at: 19800 },  // A4
    { hz: 349, at: 24300 }   // F4, quiet and unresolved
  ];
  publish("bed_uneasy", D, mix("uneasy", [
    { file: drone("un_a2", 110, D, 7, 0.30), gain: 0.55 },
    { file: drone("un_e3", 165, D, 5, 0.35), gain: 0.30 },
    { file: drone("un_f3", 175, D, 6, 0.50), gain: 0.17 },
    { file: air("un_air", D, "bandpass=f=320:width_type=h:width=420", 3, 0.6), gain: 0.5 },
    ...box.map((n, i) => ({
      file: tine(`un_t${i}`, n.hz, 2.0), at: n.at, gain: i === 5 ? 0.20 : 0.30
    }))
  ]));
}

/* ================= bed_dark — the lights are out =================
   Almost nothing: the tonic and its fifth, an octave below anything else in
   the chapter, and two far-off shimmers so the dark is not quite empty. */
{
  const D = 24;
  publish("bed_dark", D, mix("dark", [
    { file: drone("dk_a1", 55, D), gain: 0.75 },
    { file: drone("dk_e2", 82, D, 3, 0.5), gain: 0.34 },
    { file: air("dk_air", D, "lowpass=f=180", 4, 0.4), gain: 0.45 },
    { file: tine("dk_far1", 880, 1.1), at: 11000, gain: 0.07 },
    { file: tine("dk_far2", 659, 1.1), at: 19000, gain: 0.055 }
  ]));
}

/* ================= bed_hope — the twinkles come back =================
   C major, the relative major of everything above: the same notes, finally
   resting somewhere warm. The music box climbs instead of falling. */
{
  const D = 28;
  const box = [
    // C - E - G - C, rising
    { hz: 523, at: 2400 }, { hz: 659, at: 3300 }, { hz: 784, at: 4200 }, { hz: 1047, at: 5100 },
    // G - C - E - G, higher
    { hz: 392, at: 11000 }, { hz: 523, at: 11900 }, { hz: 659, at: 12800 }, { hz: 784, at: 13700 },
    // and a last open resolve
    { hz: 523, at: 20500 }, { hz: 784, at: 21400 }, { hz: 1047, at: 22300 }
  ];
  publish("bed_hope", D, mix("hope", [
    { file: drone("hp_c3", 131, D, 3, 0.25), gain: 0.50 },
    { file: drone("hp_g3", 196, D, 4, 0.30), gain: 0.31 },
    { file: drone("hp_c4", 262, D, 5, 0.35), gain: 0.19 },
    { file: drone("hp_e4", 330, D, 6, 0.40), gain: 0.13 },
    { file: air("hp_air", D, "lowpass=f=560", 3, 0.4), gain: 0.40 },
    ...box.map((n, i) => ({ file: tine(`hp_t${i}`, n.hz, 1.9), at: n.at, gain: 0.26 }))
  ]));
}

console.log("\nbeds written to " + OUT);
