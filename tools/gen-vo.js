// Regenerates the voice-over. See tools/README.md.
//   npm i msedge-tts && node tools/gen-vo.js <outDir>
// Emotion lives in the rate/pitch/volume columns below plus the wording of
// each line: the Edge endpoint rejects SSML tags, so those prosody values are
// the only markup that reaches the model (it re-synthesises them rather than
// resampling, which is why they read as delivery and not as pitch-shifting).

const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const fs = require('fs');

// ---- casting -------------------------------------------------------------
// Only en-US-AnaNeural is tagged Cartoon/Cute, so Agni takes it. Neel needs to
// read as a big soft creature, so a casual warm male voice pitched up and
// slowed. Narrator uses a "Novel"-category voice for storybook delivery.
const CAST = {
  narrator: 'en-US-MichelleNeural',
  agni:     'en-US-AnaNeural',
  neel:     'en-US-BrianNeural',
  giggles:  'en-US-RogerNeural'
};

// ---- the script ----------------------------------------------------------
// `text` matches the on-screen caption or bubble word for word, so the audio
// and the reading stay in sync. Emotion is carried by rate/pitch/volume, which
// the neural model re-synthesises rather than resamples.
const LINES = [
  { id: 'vo_narr_walk',    who: 'narrator', mood: 'warm storybook',
    text: 'Agni and Neil were taking a walk.',          rate: 0.92, pitch: '+0%',  volume: 92 },

  { id: 'vo_neel_cake',    who: 'neel',     mood: 'dreamy, hungry',
    text: 'Mmm... do I smell cake?',                     rate: 0.84, pitch: '+22%', volume: 94 },

  { id: 'vo_agni_cookie',  who: 'agni',     mood: 'fond exasperation',
    text: 'Oh, come on. You just had a cookie!',         rate: 1.08, pitch: '+8%',  volume: 100 },

  { id: 'vo_narr_grin',    who: 'narrator', mood: 'amused aside',
    text: 'Neil just grins.',                            rate: 0.96, pitch: '+4%',  volume: 88 },

  { id: 'vo_neel_what',    who: 'neel',     mood: 'startled, frightened',
    text: 'What was that?',                              rate: 1.14, pitch: '+34%', volume: 100 },

  { id: 'vo_giggles_1',    who: 'giggles',  mood: 'gleeful menace',
    text: 'Hee-hee-hee-hee!',                            rate: 1.02, pitch: '+34%', volume: 100 },

  { id: 'vo_agni_neil',    who: 'agni',     mood: 'worried, calling into the dark',
    text: 'Neil?',                                       rate: 0.8,  pitch: '+12%', volume: 74 },

  { id: 'vo_neel_here',    who: 'neel',     mood: 'timid, unsure',
    text: 'I am here... I think.',                       rate: 0.78, pitch: '+26%', volume: 72 },

  { id: 'vo_giggles_2',    who: 'giggles',  mood: 'gleeful menace, passing by',
    text: 'Hee-hee-hee-hee!',                            rate: 1.1,  pitch: '+38%', volume: 100 },

  { id: 'vo_agni_giggles', who: 'agni',     mood: 'dawning realisation',
    text: 'I think Mr. Giggles has scared the little twinkles!',
                                                         rate: 1.0,  pitch: '+10%', volume: 98 },

  { id: 'vo_agni_light',   who: 'agni',     mood: 'brave, rallying',
    text: 'Let us find them and light the town again!',  rate: 1.12, pitch: '+16%', volume: 100 }
];

function speak(voice, text, prosody, out) {
  return new Promise(async (resolve, reject) => {
    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(text, prosody);
      const chunks = [];
      audioStream.on('data', c => chunks.push(c));
      audioStream.on('end', () => {
        const buf = Buffer.concat(chunks);
        buf.length ? (fs.writeFileSync(out, buf), resolve(buf.length)) : reject(new Error('empty audio'));
      });
      audioStream.on('error', reject);
    } catch (e) { reject(e); }
  });
}

const OUT = process.argv[2] || "vo_raw";
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const report = [];
  for (const L of LINES) {
    const voice = CAST[L.who];
    let ok = false, bytes = 0, err = '';
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try {
        bytes = await speak(voice, L.text, { rate: L.rate, pitch: L.pitch, volume: L.volume },
                            `${OUT}/${L.id}.mp3`);
        ok = true;
      } catch (e) { err = String(e.message || e); await new Promise(r => setTimeout(r, 1200)); }
    }
    report.push({ ...L, voice, ok, bytes, err });
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${L.id.padEnd(18)} ${L.who.padEnd(9)} ${voice.padEnd(22)} ${String(bytes).padStart(6)}B  ${L.mood}${ok ? '' : '  :: ' + err.slice(0,70)}`);
  }
    console.log(`\n${report.filter(r => r.ok).length}/${report.length} generated`);
})();
