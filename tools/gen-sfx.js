// Generates the story's sound effects with ffmpeg.
//
// Args are passed as an argv array (never through a shell), so quoting is not
// a hazard. Commas inside an ffmpeg expression still have to be escaped as \,
// because the filtergraph parser uses them as separators, so the expressions
// below avoid commas entirely.
//
// Loop beds use whole-number frequencies: an integer Hz tone completes a whole
// number of cycles in an integer-second loop, so the seam is silent.

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const TMP = path.join(__dirname, "sfx_tmp");
const OUT = process.argv[2];
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const SR = 44100;

function ff(args) {
  try {
    execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    throw new Error(`ffmpeg failed
  args: ${args.join(" ")}
  ${(e.stderr || "").toString().trim()}`);
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

// Final encode into the project, normalised for its role
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

/* ======================= building blocks ======================= */

// Low soft impact: body sine plus a filtered noise slap
const thump = mix("thump", [
  { file: src("th_body", `aevalsrc=sin(2*PI*72*t)*exp(-13*t):d=0.3:s=${SR}`), gain: 1 },
  { file: src("th_slap", `anoisesrc=d=0.3:c=brown:r=${SR}:a=0.8`, "lowpass=f=200,afade=t=out:st=0:d=0.26:curve=exp"), gain: 0.7 }
]);

// Small bright tick
const tick = src("tick", `aevalsrc=sin(2*PI*1900*t)*exp(-70*t):d=0.09:s=${SR}`);

// Bell partials decay at different rates, which is what makes a bell read as one
function bell(name, f, dur = 1.1) {
  return mix(name, [
    { file: src(`${name}_1`, `aevalsrc=sin(2*PI*${f}*t)*exp(-3.2*t):d=${dur}:s=${SR}`), gain: 1 },
    { file: src(`${name}_2`, `aevalsrc=sin(2*PI*${f * 2}*t)*exp(-5.5*t):d=${dur}:s=${SR}`), gain: 0.42 },
    { file: src(`${name}_3`, `aevalsrc=sin(2*PI*${Math.round(f * 3.01)}*t)*exp(-8*t):d=${dur}:s=${SR}`), gain: 0.2 }
  ]);
}

/* ======================= ambience beds ======================= */

// Cosy night on Cupcake Lane: A-minor pad, soft wind, a few crickets.
const cricket = src("cricket_one",
  `anoisesrc=d=0.055:c=white:r=${SR}:a=1`,
  "bandpass=f=4600:width_type=h:width=700,afade=t=in:st=0:d=0.006,afade=t=out:st=0.02:d=0.035");

const crickets = mix("crickets", [
  { file: cricket, at: 300, gain: 0.5 }, { file: cricket, at: 460, gain: 0.42 },
  { file: cricket, at: 620, gain: 0.34 }, { file: cricket, at: 3100, gain: 0.46 },
  { file: cricket, at: 3260, gain: 0.4 }, { file: cricket, at: 6800, gain: 0.5 },
  { file: cricket, at: 6960, gain: 0.42 }, { file: cricket, at: 7120, gain: 0.3 },
  { file: cricket, at: 11400, gain: 0.44 }, { file: cricket, at: 11560, gain: 0.36 },
  { file: cricket, at: 14900, gain: 0.48 }, { file: cricket, at: 15060, gain: 0.4 },
  { file: cricket, at: 15220, gain: 0.3 }
]);

publish("bed_town", mix("bed_town_raw", [
  { file: src("bt_a", `aevalsrc=sin(2*PI*110*t):d=18:s=${SR}`, "tremolo=f=0.1111:d=0.35"), gain: 0.5 },
  { file: src("bt_e", `aevalsrc=sin(2*PI*165*t):d=18:s=${SR}`, "tremolo=f=0.1667:d=0.4"), gain: 0.3 },
  { file: src("bt_a2", `aevalsrc=sin(2*PI*220*t):d=18:s=${SR}`, "tremolo=f=0.2222:d=0.5"), gain: 0.17 },
  { file: src("bt_c", `aevalsrc=sin(2*PI*262*t):d=18:s=${SR}`, "tremolo=f=0.2778:d=0.6"), gain: 0.1 },
  { file: src("bt_wind", `anoisesrc=d=18:c=brown:r=${SR}:a=0.55`, "lowpass=f=420,tremolo=f=0.1111:d=0.5"), gain: 0.5 },
  { file: crickets, gain: 0.5 }
]), "bed", { stereo: true });

// The mist arriving: a minor second grinding under the drone.
publish("bed_uneasy", mix("bed_uneasy_raw", [
  { file: src("bu_a", `aevalsrc=sin(2*PI*55*t):d=16:s=${SR}`), gain: 0.6 },
  { file: src("bu_e", `aevalsrc=sin(2*PI*82*t):d=16:s=${SR}`, "tremolo=f=0.125:d=0.4"), gain: 0.34 },
  { file: src("bu_f", `aevalsrc=sin(2*PI*87*t):d=16:s=${SR}`, "tremolo=f=0.1875:d=0.6"), gain: 0.22 },
  { file: src("bu_air", `anoisesrc=d=16:c=brown:r=${SR}:a=0.7`, "bandpass=f=300:width_type=h:width=500,tremolo=f=0.25:d=0.7"), gain: 0.6 }
]), "bed", { stereo: true });

// Lights out: almost nothing, very low.
publish("bed_dark", mix("bed_dark_raw", [
  { file: src("bd_e", `aevalsrc=sin(2*PI*41*t):d=16:s=${SR}`), gain: 0.75 },
  { file: src("bd_a", `aevalsrc=sin(2*PI*55*t):d=16:s=${SR}`, "tremolo=f=0.125:d=0.5"), gain: 0.4 },
  { file: src("bd_ghost", `aevalsrc=sin(2*PI*233*t):d=16:s=${SR}`, "tremolo=f=0.1875:d=0.85"), gain: 0.06 },
  { file: src("bd_air", `anoisesrc=d=16:c=brown:r=${SR}:a=0.4`, "lowpass=f=200"), gain: 0.45 }
]), "bed", { stereo: true });

// Agni's spark: C major, warmer, with a little shimmer on top.
publish("bed_hope", mix("bed_hope_raw", [
  { file: src("bh_c", `aevalsrc=sin(2*PI*131*t):d=16:s=${SR}`, "tremolo=f=0.125:d=0.3"), gain: 0.5 },
  { file: src("bh_g", `aevalsrc=sin(2*PI*196*t):d=16:s=${SR}`, "tremolo=f=0.1875:d=0.35"), gain: 0.3 },
  { file: src("bh_c2", `aevalsrc=sin(2*PI*262*t):d=16:s=${SR}`, "tremolo=f=0.25:d=0.45"), gain: 0.18 },
  { file: src("bh_e", `aevalsrc=sin(2*PI*330*t):d=16:s=${SR}`, "tremolo=f=0.3125:d=0.6"), gain: 0.11 },
  { file: src("bh_air", `anoisesrc=d=16:c=brown:r=${SR}:a=0.45`, "lowpass=f=500,tremolo=f=0.125:d=0.4"), gain: 0.4 }
]), "bed", { stereo: true });

/* ======================= one-shots ======================= */

// Two pairs of footfalls, Agni then Neel, slightly offset so they overlap.
publish("footsteps", mix("footsteps_raw", [
  { file: thump, at: 0, gain: 0.85 }, { file: thump, at: 210, gain: 0.62 },
  { file: thump, at: 430, gain: 0.9 }, { file: thump, at: 640, gain: 0.58 },
  { file: thump, at: 860, gain: 0.8 }, { file: thump, at: 1070, gain: 0.6 }
], "lowpass=f=900"), "soft");

// Sniff: two quick inward draws. Rising bands faked with staggered fades.
publish("sniff", mix("sniff_raw", [
  { file: src("sn_a", `anoisesrc=d=0.22:c=white:r=${SR}:a=1`, "bandpass=f=900:width_type=h:width=600,afade=t=in:st=0:d=0.13,afade=t=out:st=0.14:d=0.07"), at: 0, gain: 0.5 },
  { file: src("sn_b", `anoisesrc=d=0.22:c=white:r=${SR}:a=1`, "bandpass=f=1800:width_type=h:width=900,afade=t=in:st=0.04:d=0.13,afade=t=out:st=0.17:d=0.05"), at: 0, gain: 0.4 },
  { file: src("sn_c", `anoisesrc=d=0.18:c=white:r=${SR}:a=1`, "bandpass=f=1300:width_type=h:width=800,afade=t=in:st=0:d=0.11,afade=t=out:st=0.12:d=0.05"), at: 300, gain: 0.55 }
]), "soft");

// Bubble appearing: a short upward chirp with a click on the front.
publish("bubble", mix("bubble_raw", [
  { file: src("bb_chirp", `aevalsrc=sin(2*PI*(420*t+2600*t*t))*exp(-16*t):d=0.16:s=${SR}`), gain: 1 },
  { file: tick, gain: 0.25 }
]), "soft");

// Neel's grin: a bend down and back up.
publish("grin_boing", src("boing",
  `aevalsrc=sin(2*PI*(520*t-620*t*t+900*t*t*t))*exp(-7*t):d=0.42:s=${SR}`,
  "lowpass=f=2400"), "soft");

// Mist creeping up: a slow low swell.
publish("mist_rise", src("mist_rise_raw",
  `anoisesrc=d=3.4:c=brown:r=${SR}:a=1`,
  "lowpass=f=520,afade=t=in:st=0:d=2.2:curve=ipar,afade=t=out:st=2.7:d=0.7"), "soft", { stereo: true });

// The mist rushing the street: three bands peaking in sequence, so the whoosh
// sweeps downward in pitch as it passes.
publish("mist_rush", mix("mist_rush_raw", [
  { file: src("mr_hi", `anoisesrc=d=2.6:c=white:r=${SR}:a=1`, "bandpass=f=2400:width_type=h:width=1600,afade=t=in:st=0:d=0.5,afade=t=out:st=0.5:d=1.1"), gain: 0.5 },
  { file: src("mr_mid", `anoisesrc=d=2.6:c=pink:r=${SR}:a=1`, "bandpass=f=900:width_type=h:width=800,afade=t=in:st=0.25:d=0.6,afade=t=out:st=1.1:d=1.2"), gain: 0.8 },
  { file: src("mr_lo", `anoisesrc=d=2.6:c=brown:r=${SR}:a=1`, "lowpass=f=380,afade=t=in:st=0.5:d=0.9,afade=t=out:st=1.6:d=1.0"), gain: 1 }
]), "shot", { stereo: true });

// A lantern giving up: glass tick then a small hollow thunk.
publish("lamp_out", mix("lamp_out_raw", [
  { file: src("lo_tick", `aevalsrc=sin(2*PI*2600*t)*exp(-90*t):d=0.08:s=${SR}`), at: 0, gain: 0.5 },
  { file: src("lo_thunk", `aevalsrc=sin(2*PI*130*t)*exp(-22*t):d=0.3:s=${SR}`), at: 40, gain: 1 }
]), "shot");

// Everything goes out at once.
publish("blackout_hit", mix("blackout_raw", [
  { file: src("bo_drop", `aevalsrc=sin(2*PI*(80*t-16*t*t))*exp(-2.6*t):d=1.8:s=${SR}`), gain: 1 },
  { file: src("bo_air", `anoisesrc=d=1.8:c=brown:r=${SR}:a=0.9`, "lowpass=f=260,afade=t=out:st=0:d=1.6:curve=exp"), gain: 0.55 },
  { file: src("bo_snap", `anoisesrc=d=0.12:c=white:r=${SR}:a=1`, "highpass=f=1200,afade=t=out:st=0:d=0.11:curve=exp"), gain: 0.3 }
]), "hit", { stereo: true });

// Eyes blinking in the dark.
publish("blink", mix("blink_raw", [
  { file: src("bl_a", `aevalsrc=sin(2*PI*(1500*t-1100*t*t))*exp(-34*t):d=0.13:s=${SR}`), gain: 1 },
  { file: tick, gain: 0.2 }
]), "soft");

// Heartbeat under the scared beat. 1 second long so it loops on the beat.
publish("heartbeat", mix("heartbeat_raw", [
  { file: thump, at: 0, gain: 1 },
  { file: thump, at: 260, gain: 0.66 }
], "lowpass=f=260"), "soft");

// Fireflies: a rising arpeggio of little bells.
publish("sparkle", mix("sparkle_raw", [
  { file: bell("sp1", 784, 1.0), at: 0, gain: 0.7 },
  { file: bell("sp2", 988, 1.0), at: 150, gain: 0.62 },
  { file: bell("sp3", 1319, 1.0), at: 310, gain: 0.56 },
  { file: bell("sp4", 1568, 1.0), at: 470, gain: 0.5 },
  { file: bell("sp5", 2093, 1.0), at: 660, gain: 0.4 },
  { file: bell("sp6", 2637, 1.0), at: 850, gain: 0.3 }
]), "soft", { stereo: true });

// A single distant light blinking in a hiding place.
publish("twinkle", bell("twinkle_raw", 1760, 0.8), "soft");

// Agni's spark catching light.
publish("spark_ignite", mix("spark_raw", [
  { file: src("si_air", `anoisesrc=d=1.2:c=white:r=${SR}:a=1`, "bandpass=f=3000:width_type=h:width=2400,afade=t=in:st=0:d=0.18,afade=t=out:st=0.2:d=0.6"), gain: 0.35 },
  { file: bell("si_bell", 1047, 1.2), at: 120, gain: 0.9 },
  { file: bell("si_bell2", 1568, 1.1), at: 220, gain: 0.5 }
]), "shot", { stereo: true });

// "Let us light the town again" — a C major lift.
publish("cheer_swell", mix("cheer_raw", [
  { file: src("cs_c", `aevalsrc=sin(2*PI*262*t):d=2.2:s=${SR}`, "afade=t=in:st=0:d=1.5:curve=ipar,afade=t=out:st=1.6:d=0.6"), gain: 0.55 },
  { file: src("cs_e", `aevalsrc=sin(2*PI*330*t):d=2.2:s=${SR}`, "afade=t=in:st=0.15:d=1.4:curve=ipar,afade=t=out:st=1.6:d=0.6"), gain: 0.42 },
  { file: src("cs_g", `aevalsrc=sin(2*PI*392*t):d=2.2:s=${SR}`, "afade=t=in:st=0.3:d=1.3:curve=ipar,afade=t=out:st=1.6:d=0.6"), gain: 0.34 },
  { file: src("cs_c2", `aevalsrc=sin(2*PI*523*t):d=2.2:s=${SR}`, "afade=t=in:st=0.45:d=1.2:curve=ipar,afade=t=out:st=1.6:d=0.6"), gain: 0.24 },
  { file: bell("cs_bell", 1047, 1.4), at: 1300, gain: 0.5 }
]), "shot", { stereo: true });

/* ======================= the magical lamp, and vanishing ======================= */

// The lamp's stutter: a glassy chime-flutter with breath — this town has no
// electricity, so its lamp must not buzz. Two detuned high partials trembling
// over a warm low flame tone.
publish("magic_gutter", mix("magic_gutter_raw", [
  { file: src("mg_hi", `aevalsrc=sin(2*PI*1244*t)*exp(-5*t):d=0.72:s=${SR}`, "tremolo=f=13:d=0.85"), gain: 0.8 },
  { file: src("mg_hi2", `aevalsrc=sin(2*PI*1866*t)*exp(-7*t):d=0.6:s=${SR}`, "tremolo=f=17:d=0.9"), gain: 0.4 },
  { file: src("mg_flame", `aevalsrc=sin(2*PI*311*t)*exp(-4*t):d=0.72:s=${SR}`, "tremolo=f=11:d=0.7"), gain: 0.45 },
  { file: src("mg_air", `anoisesrc=d=0.55:c=white:r=${SR}:a=0.8`,
    "bandpass=f=3400:width_type=h:width=2200,tremolo=f=13:d=0.8,afade=t=out:st=0.2:d=0.34"), gain: 0.22 }
]), "shot");

// The light drawn away: two falling glissandi an octave apart dissolving into
// a hush, a last high wisp at the end.
publish("magic_out", mix("magic_out_raw", [
  { file: src("mo_fall", `aevalsrc=sin(2*PI*(1100*t-420*t*t))*exp(-2.6*t):d=1.2:s=${SR}`), gain: 1 },
  { file: src("mo_fall2", `aevalsrc=sin(2*PI*(1650*t-630*t*t))*exp(-3.4*t):d=1.15:s=${SR}`), gain: 0.42 },
  { file: src("mo_hush", `anoisesrc=d=1.1:c=pink:r=${SR}:a=0.8`,
    "bandpass=f=1100:width_type=h:width=1200,afade=t=in:st=0:d=0.12,afade=t=out:st=0.25:d=0.8"), gain: 0.3 },
  { file: src("mo_wisp", `aevalsrc=sin(2*PI*2637*t)*exp(-18*t):d=0.3:s=${SR}`), at: 850, gain: 0.16 }
]), "shot");

// A thing disappearing: three glints falling in sequence over a soft puff of
// air — away, not reward. The game's swarms vanish on this.
publish("magic_vanish", mix("magic_vanish_raw", [
  { file: src("mv_g1", `aevalsrc=sin(2*PI*(1568*t-520*t*t))*exp(-5*t):d=0.8:s=${SR}`), at: 0, gain: 0.9 },
  { file: src("mv_g2", `aevalsrc=sin(2*PI*(1318*t-470*t*t))*exp(-5.4*t):d=0.75:s=${SR}`), at: 90, gain: 0.7 },
  { file: src("mv_g3", `aevalsrc=sin(2*PI*(1046*t-400*t*t))*exp(-5.8*t):d=0.72:s=${SR}`), at: 190, gain: 0.55 },
  { file: src("mv_puff", `anoisesrc=d=0.4:c=white:r=${SR}:a=0.9`,
    "bandpass=f=1700:width_type=h:width=1500,afade=t=in:st=0:d=0.03,afade=t=out:st=0.08:d=0.3"), at: 0, gain: 0.3 },
  { file: src("mv_low", `aevalsrc=sin(2*PI*(240*t-90*t*t))*exp(-6*t):d=0.6:s=${SR}`), at: 60, gain: 0.3 }
]), "shot");

console.log("generated:");
for (const f of fs.readdirSync(OUT).sort()) console.log("  " + f);
