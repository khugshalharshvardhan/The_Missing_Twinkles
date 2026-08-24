// Generates the counting game's sound effects with ffmpeg. See tools/README.md.
//
//   node tools/gen-sfx-game.js assets/audios/sfx
//
// Separate from gen-sfx.js so running it cannot disturb the story's effects,
// which are already tuned and in use. The helpers below are the same ones, and
// the same two rules apply:
//
//   * args go through an argv array, never a shell, so quoting is not a hazard.
//     Commas inside an ffmpeg expression still have to be avoided entirely,
//     because the filtergraph parser uses them as separators.
//   * anything that loops uses whole-number frequencies, so an integer Hz tone
//     completes a whole number of cycles and the seam is silent. Nothing here
//     loops, but the convention is kept.
//
// Everything is synthesised — no samples, no network.

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const TMP = path.join(__dirname, "sfx_tmp");
const OUT = process.argv[2];
if (!OUT) throw new Error("usage: node tools/gen-sfx-game.js <outDir>");
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const SR = 44100;

function ff(args) {
  try {
    execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    throw new Error(`ffmpeg failed\n  args: ${args.join(" ")}\n  ${(e.stderr || "").toString().trim()}`);
  }
}

// A raw generator source -> wav in TMP
function src(name, lavfi, filters) {
  const out = path.join(TMP, `${name}.wav`);
  const args = ["-f", "lavfi", "-i", lavfi];
  if (filters) args.push("-af", filters);
  args.push("-ar", String(SR), out);
  ff(args);
  return out;
}

// Mix several wavs, each with an offset in ms and a gain
function mix(name, parts, filters) {
  const out = path.join(TMP, `${name}.wav`);
  const args = [];
  parts.forEach((p) => args.push("-i", p.file));

  const chains = parts.map((p, i) => {
    const bits = [];
    if (p.gain != null) bits.push(`volume=${p.gain}`);
    if (p.at) bits.push(`adelay=${p.at}:all=1`);
    bits.push("aformat=channel_layouts=mono:sample_rates=" + SR);
    return `[${i}:a]${bits.join(",")}[a${i}]`;
  });
  const ins = parts.map((_, i) => `[a${i}]`).join("");
  let graph = `${chains.join(";")};${ins}amix=inputs=${parts.length}:normalize=0:dropout_transition=0[m]`;
  if (filters) graph += `;[m]${filters}[o]`;

  args.push("-filter_complex", graph, "-map", filters ? "[o]" : "[m]", "-ar", String(SR), out);
  ff(args);
  return out;
}

// A struck bell: a sine with a fast attack and an exponential tail.
function bell(name, hz, dur, decay = 6) {
  return src(name, `aevalsrc=sin(2*PI*${hz}*t)*exp(-${decay}*t):d=${dur}:s=${SR}`,
    "afade=t=in:st=0:d=0.004");
}

// Final encode into the project, normalised for its role. Same four targets the
// story's effects use, so the two sets sit at the same level on the sfx bus.
const TARGET = { bed: -26, soft: -21, shot: -17, hit: -14 };

function publish(name, file, role, { stereo = false, fadeIn = 0, fadeOut = 0 } = {}) {
  const chain = [];
  if (fadeIn) chain.push(`afade=t=in:st=0:d=${fadeIn}`);
  if (fadeOut) {
    const dur = Number(
      execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
        "-of", "csv=p=0", file]).toString().trim()
    );
    chain.push(`afade=t=out:st=${Math.max(0, dur - fadeOut).toFixed(3)}:d=${fadeOut}`);
  }
  chain.push(`loudnorm=I=${TARGET[role]}:TP=-2:LRA=11`);

  ff(["-i", file, "-af", chain.join(","), "-ac", stereo ? "2" : "1",
      "-ar", String(SR), "-b:a", stereo ? "112k" : "80k",
      path.join(OUT, `${name}.mp3`)]);
}

/* ---------- the keypad ---------- */

// A digit key. Wooden rather than electronic: a short low body under a clipped
// click, so ten presses in a row do not turn into a beeping calculator.
publish("key_press", mix("kp_raw", [
  { file: src("kp_click", `anoisesrc=d=0.12:c=white:r=${SR}:a=0.9`,
      "bandpass=f=1900:width_type=h:width=1600,afade=t=out:st=0:d=0.05:curve=exp"), gain: 0.5 },
  { file: src("kp_body", `aevalsrc=sin(2*PI*220*t)*exp(-42*t):d=0.16:s=${SR}`), gain: 0.85 },
  { file: bell("kp_ring", 880, 0.18, 26), gain: 0.28 }
]), "soft");

// Clearing the entry: the same body pitched down, going nowhere.
publish("key_clear", mix("kc_raw", [
  { file: src("kc_body", `aevalsrc=sin(2*PI*196*t)*exp(-26*t):d=0.3:s=${SR}`), gain: 0.8 },
  { file: src("kc_down", `aevalsrc=sin(2*PI*147*t)*exp(-16*t):d=0.36:s=${SR}`), at: 70, gain: 0.6 }
]), "soft");

// Committing the guess: a rising fourth, so it reads as "sent" rather than
// "correct" — the answer is not judged until after the count.
publish("key_confirm", mix("ko_raw", [
  { file: bell("ko_a", 523, 0.5), gain: 0.85 },
  { file: bell("ko_b", 698, 0.7), at: 90, gain: 0.7 },
  { file: src("ko_air", `anoisesrc=d=0.5:c=white:r=${SR}:a=1`,
      "highpass=f=4000,afade=t=out:st=0:d=0.3:curve=exp"), gain: 0.12 }
]), "shot");

/* ---------- counting ---------- */

// One pip per twinkle counted. Deliberately shorter and cleaner than the
// story's `twinkle`: eight of these land in a few seconds and a long tail turns
// the run into a smear. js/game.js raises the playback rate a step each time,
// so the count is audible as well as visible.
publish("count_pip", mix("cp_raw", [
  { file: bell("cp_hi", 1568, 0.34, 11), gain: 0.9 },
  { file: bell("cp_oct", 3136, 0.2, 16), gain: 0.22 }
]), "soft");

// The moment the last one lands and the total is known.
publish("count_done", mix("cd_raw", [
  { file: bell("cd_1", 784, 0.7), gain: 0.7 },
  { file: bell("cd_2", 988, 0.7), at: 110, gain: 0.62 },
  { file: bell("cd_3", 1175, 0.9), at: 220, gain: 0.55 },
  { file: bell("cd_4", 1568, 1.1), at: 330, gain: 0.42 }
]), "shot", { stereo: true });

// The tap that lights a twinkle. A shimmer rather than a note: a fast rising run
// of high bells under a breath of air, so eight of them in a row read as one
// piece of magic instead of eight separate chimes.
publish("magic_tap", mix("mt_raw", [
  { file: bell("mt_1", 1568, 0.5, 9), gain: 0.5 },
  { file: bell("mt_2", 2093, 0.45, 10), at: 45, gain: 0.42 },
  { file: bell("mt_3", 2637, 0.4, 12), at: 90, gain: 0.34 },
  { file: bell("mt_4", 3136, 0.35, 14), at: 135, gain: 0.26 },
  { file: bell("mt_5", 4186, 0.3, 18), at: 180, gain: 0.16 },
  { file: src("mt_air", `anoisesrc=d=0.7:c=white:r=${SR}:a=1`,
      "highpass=f=6000,afade=t=in:st=0:d=0.06,afade=t=out:st=0.12:d=0.5:curve=exp"), gain: 0.14 }
]), "soft", { stereo: true });

/* ---------- how the guess did ---------- */

// Spot on: a full major arpeggio with the octave on top.
publish("correct_chime", mix("cc_raw", [
  { file: bell("cc_c", 523, 0.8), gain: 0.85 },
  { file: bell("cc_e", 659, 0.8), at: 90, gain: 0.75 },
  { file: bell("cc_g", 784, 0.9), at: 180, gain: 0.68 },
  { file: bell("cc_c2", 1047, 1.4, 4), at: 280, gain: 0.6 },
  { file: src("cc_air", `anoisesrc=d=1.4:c=white:r=${SR}:a=1`,
      "highpass=f=5000,afade=t=in:st=0:d=0.05,afade=t=out:st=0.2:d=0.9"), gain: 0.1 }
]), "shot", { stereo: true });

// Close: warm, and unresolved on purpose — a major sixth rather than an
// arrival, so it encourages without pretending the guess was right.
publish("near_chime", mix("nc_raw", [
  { file: bell("nc_a", 440, 0.9), gain: 0.8 },
  { file: bell("nc_f", 698, 1.1, 5), at: 130, gain: 0.6 }
]), "shot", { stereo: true });

// Good try: one kind note, low and soft. Nothing that reads as a buzzer — a
// wrong guess here is still the right move.
publish("try_chime", mix("tc_raw", [
  { file: bell("tc_1", 392, 1.0, 5), gain: 0.8 },
  { file: bell("tc_2", 587, 1.2, 4), at: 160, gain: 0.45 }
]), "shot", { stereo: true });

/* ---------- the lamp ---------- */

// Striking the lamp: flint, then the gas catching, then the glass ringing.
publish("lamp_strike", mix("ls_raw", [
  { file: src("ls_flint", `anoisesrc=d=0.2:c=white:r=${SR}:a=1`,
      "bandpass=f=5200:width_type=h:width=3600,afade=t=out:st=0:d=0.1:curve=exp"), gain: 0.45 },
  { file: src("ls_whoomph", `anoisesrc=d=1.1:c=brown:r=${SR}:a=1`,
      "lowpass=f=900,afade=t=in:st=0.04:d=0.1,afade=t=out:st=0.22:d=0.75:curve=exp"), at: 60, gain: 0.7 },
  { file: bell("ls_glass", 1319, 1.3, 4), at: 150, gain: 0.55 },
  { file: bell("ls_glass2", 1976, 1.0, 6), at: 210, gain: 0.25 }
]), "shot", { stereo: true });

// A twinkle going into the lamp.
publish("catch_pop", mix("cap_raw", [
  { file: src("cap_pop", `aevalsrc=sin(2*PI*640*t)*exp(-30*t):d=0.22:s=${SR}`), gain: 0.8 },
  { file: bell("cap_ring", 2093, 0.4, 12), at: 40, gain: 0.35 }
]), "soft");

/* ---------- between screens ---------- */

// A breath of air under a beat change. Very quiet: it is punctuation, and it
// plays sixteen times over the game.
publish("page_air", src("pa_raw", `anoisesrc=d=0.9:c=white:r=${SR}:a=1`,
  "bandpass=f=1200:width_type=h:width=1800,afade=t=in:st=0:d=0.25:curve=ipar," +
  "afade=t=out:st=0.3:d=0.55:curve=exp"), "bed", { stereo: true });

console.log("generated:");
for (const f of fs.readdirSync(OUT).sort()) {
  const p = path.join(OUT, f);
  console.log(`  ${f.padEnd(20)} ${(fs.statSync(p).size / 1024).toFixed(0)}KB`);
}
