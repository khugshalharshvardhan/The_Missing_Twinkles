// Regenerates the counting game's voice-over. See tools/README.md.
//   npm i msedge-tts && node tools/gen-vo-game.js <outDir>
//
// Separate from gen-vo.js so running it cannot disturb the story's lines, which
// are already cut and timed. Same casting and the same constraint: the Edge
// endpoint rejects SSML tags, so emotion is carried entirely by the rate /
// pitch / volume columns, by how each line is punctuated, and by the
// post-processing described in the README. The model re-synthesises those
// prosody values rather than resampling, which is why they read as delivery
// and not as pitch-shifting.

const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
const fs = require("fs");

const CAST = {
  agni: "en-US-AnaNeural",   // the only Cartoon/Cute voice on the endpoint
  neel: "en-US-BrianNeural"  // warm and casual, pitched up and slowed for a big soft creature
};

// `text` matches the bubble in js/data/screens.js word for word, so the audio
// and the reading stay in sync. Two lines are stems: the bubble ends in a
// number the player chose, and a number clip is played straight after the stem
// (see NUMBERS below), so the sentence finishes with whatever they typed.
const LINES = [
  // ---- 1.1..1.5 — they notice, and the problem is stated ----
  { id: "vo_g_look", who: "agni", screen: "1.1", mood: "delighted discovery",
    text: "Look, twinkles!", rate: 1.06, pitch: "+16%", volume: 100 },

  { id: "vo_g_gone", who: "agni", screen: "1.2", mood: "puzzled, the delight draining out",
    text: "Huh? Where did they go?", rate: 0.94, pitch: "+6%", volume: 92 },

  { id: "vo_g_howmany", who: "agni", screen: "1.3", mood: "working it out, purposeful",
    text: "We need to find how many twinkles were there.", rate: 0.98, pitch: "+8%", volume: 96 },

  { id: "vo_g_catch", who: "neel", screen: "1.4", mood: "eager, already halfway there",
    text: "Then we can catch them!", rate: 1.1, pitch: "+30%", volume: 100 },

  { id: "vo_g_guess", who: "agni", screen: "1.5", mood: "inviting, let-us-you-and-me",
    text: "Look closely and make a guess!", rate: 0.96, pitch: "+12%", volume: 96 },

  // ---- 2, 2.2 — the keypad ----
  { id: "vo_g_howmany_q", who: "agni", screen: "2", mood: "asking the player, open and unhurried",
    text: "How many twinkles were there?", rate: 0.92, pitch: "+10%", volume: 94 },

  // Stem: the bubble reads "Hmm... I think there were {guess}."
  { id: "vo_g_ithink", who: "neel", screen: "2.2", mood: "pondering, thinking aloud",
    text: "Hmm... I think there were", rate: 0.86, pitch: "+24%", volume: 92 },

  // ---- 3, 3.2 — counting ----
  { id: "vo_g_count", who: "agni", screen: "3", mood: "encouraging, steady",
    text: "Let us count to check.", rate: 0.96, pitch: "+8%", volume: 96 },

  { id: "vo_g_tapcount", who: "agni", screen: "3.2", mood: "showing how, kind",
    text: "Tap each twinkle to count.", rate: 0.94, pitch: "+8%", volume: 96 },

  // ---- 4, 16, 4.2 — the answer and how the guess did ----
  { id: "vo_g_total", who: "agni", screen: "4", mood: "announcing it, pleased",
    text: "There are eight twinkles.", rate: 0.98, pitch: "+12%", volume: 98 },

  // Stem: the bubble reads "You guessed {guess}."
  { id: "vo_g_youguessed", who: "agni", screen: "16", mood: "level, no verdict in it yet",
    text: "You guessed", rate: 0.96, pitch: "+8%", volume: 94 },

  // The four verdicts in js/game.js. None of them is a buzzer: a wrong guess
  // here is still the right move, and the delivery has to say so.
  { id: "vo_g_spoton", who: "agni", screen: "4.2", mood: "thrilled",
    text: "Spot on!", rate: 1.08, pitch: "+26%", volume: 100 },

  { id: "vo_g_close", who: "agni", screen: "4.2", mood: "warm, nearly-had-it",
    text: "That was close!", rate: 1.0, pitch: "+16%", volume: 98 },

  { id: "vo_g_goodtry", who: "agni", screen: "4.2", mood: "kind and genuinely pleased, not consoling",
    text: "Good try, now we know!", rate: 0.98, pitch: "+12%", volume: 96 },

  { id: "vo_g_tryagain", who: "agni", screen: "4.2", mood: "gentle, no disappointment in it",
    text: "Let us try again!", rate: 0.96, pitch: "+10%", volume: 94 },

  // ---- 5.1, 5.2 — the lamp, and Neel's cheer when it catches ----
  { id: "vo_g_taplamp", who: "agni", screen: "5.1", mood: "excited, urging them on",
    text: "Tap the lamp!", rate: 1.06, pitch: "+20%", volume: 100 },

  { id: "vo_neel_yay", who: "neel", screen: "5.2", mood: "celebrating, arms up",
    text: "Yaaay!", rate: 1.04, pitch: "+32%", volume: 100 },

  // ---- 6.1, 6.2 — handing the game over ----
  { id: "vo_g_yourturn", who: "agni", screen: "6.1", mood: "warm, handing something over",
    text: "Now, it is your turn.", rate: 0.92, pitch: "+10%", volume: 96 },

  { id: "vo_g_guesscount", who: "agni", screen: "6.2", mood: "bright, rallying",
    text: "Make a guess, and count to check!", rate: 1.04, pitch: "+16%", volume: 100 },

  // ---- Level 1 — the glowberries. Same beats as the tutorial, so the level
  // reuses every line that does not name the element; only the three that say
  // "glowberries" out loud are new. Prosody matches the twinkle versions of
  // the same lines, so the two levels sound like one narrator.
  { id: "vo_l1_howmany", who: "agni", screen: "p2", mood: "asking the player, open and unhurried",
    text: "How many glowberries were there?", rate: 0.92, pitch: "+10%", volume: 94 },

  { id: "vo_l1_tapcount", who: "agni", screen: "p3.2", mood: "showing how, kind",
    text: "Tap each glowberry to count.", rate: 0.94, pitch: "+8%", volume: 96 },

  // TEN, not nine: the glowberries went up to the sheet's ten when the pad
  // learned two digits, so this clip has to be re-recorded along with it. The
  // bubble reads the total from the level, so the words on screen were right
  // the moment BERRY_TOTAL changed — only the audio still says nine.
  { id: "vo_l1_total", who: "agni", screen: "p4", mood: "announcing it, pleased",
    text: "There are seven glowberries.", rate: 0.98, pitch: "+12%", volume: 98 },

  // ---- Level 2 — the starlights, in the valley. Same three lines again, and
  // the same prosody as their twinkle and glowberry versions: across the whole
  // chapter these questions have to sound like one person asking them, not
  // like a new take per place.
  { id: "vo_l2_howmany", who: "agni", screen: "s2", mood: "asking the player, open and unhurried",
    text: "How many starlights were there?", rate: 0.92, pitch: "+10%", volume: 94 },

  { id: "vo_l2_tapcount", who: "agni", screen: "s3.2", mood: "showing how, kind",
    text: "Tap each starlight to count.", rate: 0.94, pitch: "+8%", volume: 96 },

  { id: "vo_l2_total", who: "agni", screen: "s4", mood: "announcing it, pleased",
    text: "There are six starlights.", rate: 0.98, pitch: "+12%", volume: 98 },

  // ---- Level 3 — the magic seeds, in the forest. Third time for these three
  // lines, same prosody again for the same reason.
  { id: "vo_l3_howmany", who: "agni", screen: "m2", mood: "asking the player, open and unhurried",
    text: "How many magic seeds were there?", rate: 0.92, pitch: "+10%", volume: 94 },

  { id: "vo_l3_tapcount", who: "agni", screen: "m3.2", mood: "showing how, kind",
    text: "Tap each magic seed to count.", rate: 0.94, pitch: "+8%", volume: 96 },

  { id: "vo_l3_total", who: "agni", screen: "m4", mood: "announcing it, pleased",
    text: "There are nine magic seeds.", rate: 0.98, pitch: "+12%", volume: 98 },

  // ---- Level 4 — the glow flowers. The last of these three, same prosody.
  { id: "vo_l4_howmany", who: "agni", screen: "f2", mood: "asking the player, open and unhurried",
    text: "How many glow flowers were there?", rate: 0.92, pitch: "+10%", volume: 94 },

  { id: "vo_l4_tapcount", who: "agni", screen: "f3.2", mood: "showing how, kind",
    text: "Tap each glow flower to count.", rate: 0.94, pitch: "+8%", volume: 96 },

  { id: "vo_l4_total", who: "agni", screen: "f4", mood: "announcing it, pleased",
    text: "There are eleven glow flowers.", rate: 0.98, pitch: "+12%", volume: 98 }
];

// Counting out loud is the point of the game, so Agni says each number as the
// player taps it, and the same clips finish the two stems above. Zero to twenty
// covers every count in the game and every guess a child is likely to type; a
// larger guess plays the stem alone.
//
// Even and unhurried on purpose: js/game.js raises the playback rate a step per
// tap, which is what gives the run its rising shape. Baking a rise into the
// clips as well would compound it.
const NUMBERS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen", "twenty"
].map((word, n) => ({
  id: `vo_n_${n}`, who: "agni", screen: "count", mood: "clear and bright",
  text: word, rate: 1.0, pitch: "+14%", volume: 98
}));

// Neel needs his own nought to nineteen. He is the one who says "Hmm... I think
// there were —" and the number that finishes his sentence has to be his voice,
// not hers. Same prosody as vo_g_ithink, so the stem and the number are one
// breath rather than two takes.
//
// Ten to nineteen are new: the pad used to take a single tap, so ten was the
// first number he could not be asked to read. It caps at nineteen because that
// is where the pad caps (keypad.maxValue in js/data/screens.js).
const NEEL_NUMBERS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen"
].map((word, n) => ({
  id: `vo_nn_${n}`, who: "neel", screen: "2.2", mood: "still thinking it over",
  text: word, rate: 0.86, pitch: "+24%", volume: 92
}));

function speak(voice, text, prosody, out) {
  return new Promise(async (resolve, reject) => {
    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(text, prosody);
      const chunks = [];
      audioStream.on("data", (c) => chunks.push(c));
      audioStream.on("end", () => {
        const buf = Buffer.concat(chunks);
        buf.length ? (fs.writeFileSync(out, buf), resolve(buf.length)) : reject(new Error("empty audio"));
      });
      audioStream.on("error", reject);
    } catch (e) {
      reject(e);
    }
  });
}

const OUT = process.argv[2] || "vo_game_raw";
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const all = [...LINES, ...NUMBERS, ...NEEL_NUMBERS];
  let ok = 0;
  for (const L of all) {
    const voice = CAST[L.who];
    let done = false, bytes = 0, err = "";
    for (let attempt = 1; attempt <= 3 && !done; attempt++) {
      try {
        bytes = await speak(voice, L.text, { rate: L.rate, pitch: L.pitch, volume: L.volume },
          `${OUT}/${L.id}.mp3`);
        done = true;
      } catch (e) {
        err = String(e.message || e);
        await new Promise((r) => setTimeout(r, 1200));
      }
    }
    if (done) ok++;
    console.log(`${done ? "OK  " : "FAIL"} ${L.id.padEnd(18)} ${L.screen.padEnd(6)} ${L.who.padEnd(5)}` +
      ` ${String(bytes).padStart(6)}B  ${L.mood}${done ? "" : "  :: " + err.slice(0, 70)}`);
  }
  console.log(`\n${ok}/${all.length} generated`);
})();
