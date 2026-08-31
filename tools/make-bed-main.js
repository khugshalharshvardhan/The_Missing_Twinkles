// Cuts the story's page-one bed out of the supplied song.
//
//   node tools/make-bed-main.js assets/audios/sfx
//
// The supplied track (bed_main1.mp3) is a SONG — it has a sung vocal in it.
// Page one auto-plays for about 15.5 seconds and then waits for the reader to
// turn it, so the music has to hold indefinitely; the singing arrives at 13.1s
// and was being heard every time the reader paused. The game has the same
// problem worse, which is why it plays bed_game instead.
//
// So page one loops the instrumental INTRO only. Two measurements decide the
// edit, both taken off the track itself:
//
//   * the music starts at 2.48s and the vocal enters at 13.1s (found by
//     comparing centre-panned energy in the 300-3000Hz band against the sides,
//     then confirmed on a spectrogram — the arrangement visibly thickens).
//   * the track runs at 133 BPM, and its downbeats fall at 3.142s, 4.946s,
//     6.751s, 8.555s, 10.360s, 12.164s.
//
// The loop is cut on downbeats — 3.142s to 12.164s, exactly FIVE BARS. A short
// loop only sounds like music if it is a whole number of bars; cut anywhere
// else and the pulse limps every time it comes round. Six bars would reach
// 13.97s and catch the vocal, so five is the most that fits.
//
// If the song is ever re-supplied, re-run the analysis before trusting these
// numbers — they describe this recording, not any recording.

const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const OUT = process.argv[2];
if (!OUT) throw new Error("usage: node tools/make-bed-main.js <outDir>");

const SRC = path.join(OUT, "bed_main1.mp3");
if (!fs.existsSync(SRC)) throw new Error(`missing the supplied track: ${SRC}`);

const TMP = path.join(__dirname, "beds_tmp");
fs.mkdirSync(TMP, { recursive: true });

const START = 3.142;      // a downbeat, after the music has come in
const BARS = 5;
const BAR = (60 / 133) * 4;
const D = BARS * BAR;     // 9.0225s
const XFADE = 0.12;       // just enough to kill the splice click
const LUFS = -17;         // what the music bus in js/audio.js expects

const ff = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args],
  { stdio: ["ignore", "pipe", "pipe"] });

const cut = path.join(TMP, "main_cut.wav");
const looped = path.join(TMP, "main_loop.wav");

// The intro, plus the crossfade's worth of overhang — still short of the vocal.
ff(["-ss", String(START), "-t", String(D + XFADE), "-i", SRC, cut]);

// Fold the overhang back over the opening so the wrap cannot be heard.
ff(["-i", cut, "-filter_complex",
  `[0]asplit=3[a][b][c];` +
  `[a]atrim=0:${XFADE},asetpts=PTS-STARTPTS[head];` +
  `[b]atrim=${XFADE}:${D},asetpts=PTS-STARTPTS[mid];` +
  `[c]atrim=${D}:${D + XFADE},asetpts=PTS-STARTPTS[tail];` +
  `[tail][head]acrossfade=d=${XFADE}:c1=tri:c2=tri[xf];` +
  `[xf][mid]concat=n=2:v=0:a=1[out]`,
  "-map", "[out]", looped]);

// One static gain, not loudnorm's moving one: a gain that drifts across the
// file would leave the ends mismatched and undo the crossfade.
const probe = spawnSync("ffmpeg", ["-i", looped, "-af",
  `loudnorm=I=${LUFS}:TP=-2:print_format=json`, "-f", "null", "-"], { encoding: "utf8" });
const m = (probe.stderr || "").match(/\{[\s\S]*?\}/);
if (!m) throw new Error("could not measure the cut");
const st = JSON.parse(m[0]);
const gain = Math.min(LUFS - parseFloat(st.input_i), -2 - parseFloat(st.input_tp));

ff(["-i", looped, "-af", `volume=${gain.toFixed(2)}dB`,
  "-ac", "2", "-ar", "44100", "-b:a", "112k", path.join(OUT, "bed_main.mp3")]);

const dur = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
  "-of", "csv=p=0", path.join(OUT, "bed_main.mp3")]).toString().trim();
console.log(`bed_main.mp3  ${Number(dur).toFixed(2)}s  (${BARS} bars, ${gain.toFixed(1)}dB) — instrumental only`);
