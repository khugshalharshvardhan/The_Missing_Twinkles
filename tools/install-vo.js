// Puts the recorded Hindi VO where the game looks for it.
//
//   node tools/install-vo.js
//
// The takes arrive named for what they say, in a folder per character:
//
//   assets/audios/vo/agni dilouge/vo dekho jugnu (1).mp3
//   assets/audios/vo/neel/haan mai yahi hu (1).mp3
//
// The game asks for them by cue id — assets/audios/vo/vo_g_look.mp3 — so this
// maps one to the other. The recordings themselves are never touched: they stay
// in their folders exactly as they were delivered, and this only ever writes
// the vo_*.mp3 the engine loads. Any English clip it is about to stand on is
// moved into vo/en/ first, so nothing is lost by re-running it.
//
// Three things happen to every take on the way through:
//
//   trimmed    Leading and trailing silence goes. The engine schedules lines
//              against each other to the millisecond (see VO_TAIL in
//              js/game.js), and half a second of room tone at the top of a clip
//              is half a second of a beat that looks like it has stalled.
//
//   levelled   Every take is measured and given one static gain so it lands at
//              the same loudness as the rest. A moving normaliser would pump
//              the room tone up between words.
//
//   cut        Two takes have a number spoken inside them, and the number is
//              whatever the player typed. Those are cut at the pause before it,
//              so the engine can say the line and then the player's own number
//              after it. The cut points are measured, not guessed — see SPLIT.

const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const VO = path.join(ROOT, "assets/audios/vo");
const AGNI = path.join(VO, "agni dilouge");
const NEEL = path.join(VO, "neel");
// The second delivery: the verdicts, every level's own two lines, and re-takes
// of a handful from the first. Where a line appears in both, the newer one is
// the one mapped below.
const AGNI2 = path.join(VO, "agni_dilouge_new");
const NEEL2 = path.join(VO, "neel_dilouge_new");
const KEEP = path.join(VO, "en");        // where the English takes go to rest

// What every line should end up at. The clips already in the game sit between
// -16 and -19.5 LUFS and the buses in js/audio.js were balanced against them,
// so this is the middle of what the mix already expects.
const TARGET_LUFS = -17;
const TRUE_PEAK = -1.5;

// Where a take is cut, in seconds, measured off its own silence. `from` alone
// drops the head, `to` alone drops the tail.
const SPLIT = {
  // "तुम्हारा अंदाज़ा था — 10". The pause runs 1.43 to 2.13; the line is kept and
  // the number dropped, because the number is the player's to choose.
  guessStem: { to: 1.56 },
  // "हम्म… मुझे लगता है — 7 — जुगनू थे". The player's own number goes in the
  // middle of this one, so it is cut into the words before and the words after.
  // The pause before the number is plain at 2.28; the one after it is only a
  // 114ms dip at 3.04, which shows at -30dB and not at -45. Cut in the middle
  // of it and the trimmer finds the real edges of each half.
  ithinkStem: { to: 2.43 },
  ithinkTail: { from: 3.09 },
  // "अब — अपना अंदाज़ा लिखो।" The "अब" is dropped from the line on screen, so it
  // goes from the take too; there is a clean 106ms gap after it at 0.39.
  nudge: { from: 0.45 },
  // "लेकिन वहाँ कुल — 8 जुगनू थे", for a guess that was wrong.
  total: {},
  // The same take from "कुल", for a guess that was right: there is no "but"
  // about it, and the words "लेकिन वहाँ" are one block that cannot be split.
  totalPlain: { from: 1.1 }
};

// take -> id. Everything the game plays, in the order it is played.
const LINES = [
  /* ---- the story ---- */
  { id: "vo_narr_walk",    file: path.join(VO, "narrator.mp3") },
  { id: "vo_neel_cake",    file: path.join(NEEL, "hmmmm cake (1).mp3") },
  { id: "vo_agni_cookie",  file: path.join(AGNI, "neel abhi to tumne kuch khaya tha (1).mp3") },
  { id: "vo_neel_what",    file: path.join(NEEL, "are ye kya hora hai (1).mp3") },
  { id: "vo_agni_neil",    file: path.join(AGNI, "Neel.mp3") },
  { id: "vo_neel_here",    file: path.join(NEEL, "haan mai yahi hu (1).mp3") },
  { id: "vo_agni_giggles", file: path.join(AGNI2, "lagta hai mister giggles ne sabi jugnu ko dara diya hai agni (1).mp3") },
  { id: "vo_agni_light",   file: path.join(AGNI, "chalo unhe dhundkar shear ko fir se roshan kre (1).mp3") },

  /* ---- the tutorial ---- */
  { id: "vo_g_look",       file: path.join(AGNI, "vo dekho jugnu (1).mp3") },
  { id: "vo_g_gone",       file: path.join(AGNI, "are kaha gaye (1).mp3") },
  { id: "vo_g_howmany",    file: path.join(AGNI, "hame pata lagana hoga kitne jugnu the (1).mp3") },
  // Screen 1.4 is Neel's beat, and the second delivery has it in his voice.
  { id: "vo_g_catch",      file: path.join(NEEL2, "to is baar dhyan se dekho neel (1).mp3") },
  // The tutorial's own look-and-guess line. The levels say something different
  // now ("ध्यान से देखो और अंदाज़ा लगाओ।"), so the two no longer share a clip.
  { id: "vo_g_guess_tut",  file: path.join(AGNI, "or andaza lagao ki kitne jugnu hai (1).mp3") },
  { id: "vo_g_howmany_q",  file: path.join(AGNI, "to kitne jugnu the (1).mp3") },
  { id: "vo_g_ithink",     file: path.join(NEEL2, "hmmm mujhe lgta hai 7 jugnu the neel (1).mp3"),
    cut: SPLIT.ithinkStem },
  // "जुगनू थे।" — what he says after the number, so his sentence finishes
  // instead of trailing off on whatever the player typed.
  { id: "vo_g_ithink_tail", file: path.join(NEEL2, "hmmm mujhe lgta hai 7 jugnu the neel (1).mp3"),
    cut: SPLIT.ithinkTail, like: "vo_g_ithink" },
  { id: "vo_g_count",      file: path.join(AGNI, "chalo gin kar dekte hai tumhara andaza kitna sahi tha (1).mp3") },
  { id: "vo_g_tapcount",   file: path.join(AGNI, "gin ne ke liye har jugnu pe tap kro (1).mp3") },
  { id: "vo_g_youguessed", file: path.join(AGNI, "tumhara andaza tha 10 (1).mp3"), cut: SPLIT.guessStem },
  { id: "vo_g_total",      file: path.join(NEEL, "lekin vaha kul 8 jugnu the (1).mp3"), cut: SPLIT.total },
  // The tutorial is the one round with no plain take of its own, so its is cut
  // from the take with the "लेकिन" on it. Every level below has both recorded.
  { id: "vo_g_total_plain", file: path.join(NEEL, "lekin vaha kul 8 jugnu the (1).mp3"), cut: SPLIT.totalPlain },

  /* ---- how the guess did. All four, in Agni's voice ---- */
  { id: "vo_g_spoton",     file: path.join(AGNI2, "bilkul sahi andaza agni (1).mp3") },
  { id: "vo_g_close",      file: path.join(AGNI2, "tumhara andaza kafi paas tha agni (1).mp3") },
  { id: "vo_g_goodtry",    file: path.join(AGNI2, "achi koshish ab hame pata chal gaya agni (1).mp3") },
  { id: "vo_g_tryagain",   file: path.join(AGNI2, "chalo fir se koshish kre agni (1).mp3") },
  { id: "vo_g_taplamp",    file: path.join(AGNI, "ab lamp par tap kro (1).mp3") },
  // The lamp catches and they both cheer. Two takes, one each, so the beat is
  // the pair of them rather than one of them twice.
  { id: "vo_neel_yay",     file: path.join(NEEL2, "yayyyy neel (1).mp3") },
  { id: "vo_agni_yay",     file: path.join(AGNI2, "yayyyy agni (1).mp3") },
  { id: "vo_g_yourturn",   file: path.join(AGNI, "ab tumhari bari hai (1).mp3") },

  /* ---- the levels ---- */
  { id: "vo_g_guess",      file: path.join(AGNI, "dhyan se dekho or andaza lagao (1).mp3") },
  // The nudge that comes up when nobody has touched the keypad for eight
  // seconds. It had no voice at all until this was recorded.
  { id: "vo_g_nudge",      file: path.join(AGNI, "ab apna andaza likho (1).mp3"),
    cut: SPLIT.nudge },
  // Tapping something that has already been counted.
  { id: "vo_g_counted",    file: path.join(AGNI, "ise ham phele hi gin chuke hai (1).mp3") },

  // Each level names what is being counted, so each has its own pair: the
  // instruction, and the answer said both with and without the "लेकिन".
  { id: "vo_l1_tapcount",  file: path.join(AGNI2, "gin ne ke liye har ber par tap kro agni (1).mp3") },
  { id: "vo_l2_tapcount",  file: path.join(AGNI2, "gin ne ke liye har tare pe tap kro agni (1).mp3") },
  { id: "vo_l3_tapcount",  file: path.join(AGNI2, "gin ne ke liye har bij par tap kro agni(1).mp3") },
  { id: "vo_l4_tapcount",  file: path.join(AGNI2, "gin ne ke liye har fool par tap kro agni (1).mp3") },

  { id: "vo_l1_total",       file: path.join(NEEL2, "lekin vaha kul 7 ber the neel (1).mp3") },
  { id: "vo_l1_total_plain", file: path.join(NEEL2, "vaha kul 7 ber the neel (1).mp3") },
  { id: "vo_l2_total",       file: path.join(NEEL2, "lekin vaha kul 6 tare the neel (1).mp3") },
  { id: "vo_l2_total_plain", file: path.join(NEEL2, "vaha kul 6 tare the neel (1).mp3") },
  { id: "vo_l3_total",       file: path.join(NEEL2, "lekin vaha kul 9 jadui bij th neel (1).mp3") },
  { id: "vo_l3_total_plain", file: path.join(NEEL2, "vaha kul 9 jadui bij the neel (1).mp3") },
  { id: "vo_l4_total",       file: path.join(NEEL2, "lekin vaha kul 11 fool the neel (1).mp3") },
  { id: "vo_l4_total_plain", file: path.join(NEEL2, "vaha kul 11 fool the neel (1).mp3") },

  /* ---- the ending ---- */
  { id: "vo_ep_wedidit",   file: path.join(AGNI, "hamne kr dikhaya neel (1).mp3") },
  { id: "vo_ep_shining",   file: path.join(AGNI, "sahar fir se chamak raha hai (1).mp3") },
  { id: "vo_ep_neel",      file: path.join(AGNI, "Neel.mp3") },
  { id: "vo_ep_cake",      file: path.join(NEEL, "cakaeee (1).mp3") },

  /* ---- the numbers ---- */
  // Agni counts the twinkles and reads the guess back; Neel says the number
  // that finishes his own sentence. Both go to twenty, which is what the pad
  // can hold.
  ...Array.from({ length: 21 }, (_, n) => (
    { id: `vo_n_${n}`, file: path.join(AGNI, `agni ${n}.mp3`), word: true }
  )),
  ...Array.from({ length: 21 }, (_, n) => (
    { id: `vo_nn_${n}`, file: neelNumber(n), word: true }
  ))
];

// Neel's numbers were delivered under three different spellings.
function neelNumber(n) {
  for (const name of [`${n} NEEL.mp3`, `NEEL ${n}.mp3`, `neel ${n}.mp3`]) {
    const full = path.join(NEEL, name);
    if (fs.existsSync(full)) return full;
  }
  return path.join(NEEL, `${n} NEEL.mp3`);
}

// One atrim with both ends on it. Two chained atrims would measure the second
// cut against the original timestamps, which is a stream of nothing.
function atrim(cut) {
  const parts = [
    cut.from ? `start=${cut.from}` : null,
    cut.to ? `end=${cut.to}` : null
  ].filter(Boolean);
  return parts.length ? `atrim=${parts.join(":")},` : "";
}

function ffmpeg(args) {
  return execFileSync("ffmpeg", ["-hide_banner", "-y", ...args],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 26 });
}

// What a file measures, so it can be given one gain rather than a moving one.
// loudnorm reports on STDERR, with everything else ffmpeg says — reading stdout
// gets an empty string and every clip silently comes out at its own level.
function measure(file) {
  const run = spawnSync("ffmpeg",
    ["-hide_banner", "-i", file, "-af", "loudnorm=print_format=json", "-f", "null", "-"],
    { encoding: "utf8", maxBuffer: 1 << 26 });
  const out = `${run.stdout ?? ""}${run.stderr ?? ""}`;
  const grab = (key) => {
    const m = out.match(new RegExp(`"${key}"\\s*:\\s*"?(-?[\\d.]+|-inf)`));
    return m ? Number(m[1]) : NaN;
  };
  return { i: grab("input_i"), tp: grab("input_tp") };
}

// How long a sound has to last to count as a word, and how much air to leave
// either side of the speech once the rest is gone.
const SPEECH_MIN = 0.09;
const EDGE = 0.06;

// A pause this long inside a take is a break between two reads of it, not a
// breath inside one. Only used on the numbers, where the whole take is a single
// word — a sentence pauses this long all the time and must be left alone.
const RETAKE_GAP = 0.4;

function seconds(file) {
  const run = spawnSync("ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { encoding: "utf8" });
  return Number(String(run.stdout).trim()) || 0;
}

// Where the speech in a file actually starts and ends.
//
// silenceremove cannot be trusted with these takes: several of them end with a
// thirty-millisecond click a second after the last word, and it stops at the
// click rather than at the word — the clip keeps a second of room tone that the
// engine then schedules the next beat behind. So the silence is measured
// instead, turned into the stretches of sound between, and anything too short
// to be a word is ignored.
function bounds(file, oneWord = false) {
  const run = spawnSync("ffmpeg",
    ["-hide_banner", "-i", file, "-af", "silencedetect=noise=-45dB:d=0.05", "-f", "null", "-"],
    { encoding: "utf8", maxBuffer: 1 << 26 });
  const said = `${run.stdout ?? ""}${run.stderr ?? ""}`;
  const total = seconds(file);

  const marks = [...said.matchAll(/silence_(start|end):\s*(-?[\d.]+)/g)]
    .map((m) => ({ kind: m[1], at: Number(m[2]) }));

  const sound = [];
  let from = 0;
  for (const m of marks) {
    if (m.kind === "start") { if (m.at > from) sound.push({ from, to: m.at }); }
    else from = m.at;
  }
  if (from < total) sound.push({ from, to: total });

  const words = sound.filter((s) => s.to - s.from >= SPEECH_MIN);
  if (!words.length) return { start: 0, end: total };

  // A single word said twice — several of the numbers were read, paused over
  // and read again. Keep the fuller of the two reads rather than both with the
  // pause in between, which would have the game counting "सात … सात".
  let keep = words;
  if (oneWord) {
    const takes = [[words[0]]];
    for (const w of words.slice(1)) {
      const last = takes[takes.length - 1];
      if (w.from - last[last.length - 1].to >= RETAKE_GAP) takes.push([w]);
      else last.push(w);
    }
    const said = (take) => take.reduce((n, w) => n + (w.to - w.from), 0);
    keep = takes.reduce((best, take) => (said(take) > said(best) ? take : best), takes[0]);
  }

  return {
    start: Math.max(0, keep[0].from - EDGE),
    end: Math.min(total, keep[keep.length - 1].to + EDGE)
  };
}

// One take, cut where it was asked to be cut and with the silence taken off
// both ends, written as a wav ready to be joined or levelled.
function prepare(src, cut, out, oneWord = false) {
  const raw = `${out}.raw.wav`;
  ffmpeg(["-i", src, "-af", `${atrim(cut)}asetpts=N/SR/TB`, "-ac", "1", "-ar", "44100", raw]);
  const edge = bounds(raw, oneWord);
  ffmpeg(["-i", raw, "-af", `atrim=start=${edge.start.toFixed(3)}:end=${edge.end.toFixed(3)},asetpts=N/SR/TB`,
    "-ac", "1", "-ar", "44100", out]);
  fs.rmSync(raw, { force: true });
  return edge;
}

const tmp = path.join(ROOT, "tools", "vo_tmp");
fs.mkdirSync(tmp, { recursive: true });
fs.mkdirSync(KEEP, { recursive: true });

let done = 0;
const missing = [];
// What each clip was given, so a fragment cut out of one can be given the same.
const gains = new Map();

for (const line of LINES) {
  if (!fs.existsSync(line.file)) { missing.push(`${line.id}  <-  ${path.basename(line.file)}`); continue; }

  // The English take this is about to stand on is put aside rather than
  // overwritten, so a re-run has something to fall back to and nothing the
  // game was built with is thrown away.
  const live = path.join(VO, `${line.id}.mp3`);
  const kept = path.join(KEEP, `${line.id}.mp3`);
  if (fs.existsSync(live) && !fs.existsSync(kept)) fs.copyFileSync(live, kept);

  const stage = path.join(tmp, `${line.id}.wav`);
  const cut = line.cut ?? {};
  const was = seconds(line.file);

  if (line.lead) {
    // A line with something said before it — Neel's "हम्म…" ahead of "मुझे लगता
    // है". Both are trimmed on their own first, so the pause between them is
    // exactly the one asked for rather than whatever room tone they came with.
    const a = path.join(tmp, `${line.id}.a.wav`);
    const b = path.join(tmp, `${line.id}.b.wav`);
    prepare(line.lead, {}, a);
    prepare(line.file, cut, b);
    ffmpeg(["-i", a, "-i", b, "-filter_complex",
      `[0:a]apad=pad_dur=${line.gap ?? 0.15}[ap];[ap][1:a]concat=n=2:v=0:a=1[out]`,
      "-map", "[out]", "-ac", "1", "-ar", "44100", stage]);
    fs.rmSync(a, { force: true });
    fs.rmSync(b, { force: true });
  } else {
    prepare(line.file, cut, stage, Boolean(line.word));
  }

  // One gain for the whole clip: enough to reach the target, or enough to keep
  // the peak under the ceiling — whichever is the smaller move.
  //
  // A fragment cut out of another line takes THAT line's gain instead of its
  // own. The end of a sentence is quieter than the whole of one, and levelling
  // it on its own merits would hand the last two words of a thought more voice
  // than the words before them.
  let gain = gains.get(line.like);
  if (gain === undefined) {
    const { i, tp } = measure(stage);
    gain = Number.isFinite(i) && Number.isFinite(tp)
      ? Math.min(TARGET_LUFS - i, TRUE_PEAK - tp)
      : 0;
  }
  gains.set(line.id, gain);

  ffmpeg(["-i", stage, "-af", `volume=${gain.toFixed(2)}dB`,
    "-codec:a", "libmp3lame", "-q:a", "3", path.join(VO, `${line.id}.mp3`)]);

  const now = seconds(path.join(VO, `${line.id}.mp3`));
  console.log(`  ${line.id.padEnd(18)} ${was.toFixed(2)}s -> ${now.toFixed(2)}s   ` +
    `${gain >= 0 ? "+" : ""}${gain.toFixed(1)} dB   ${path.basename(line.file)}`);
  done++;
}

fs.rmSync(tmp, { recursive: true, force: true });

console.log(`\n${done} lines installed`);
if (missing.length) {
  console.log(`\n${missing.length} takes not found:`);
  missing.forEach((m) => console.log(`  ${m}`));
}
