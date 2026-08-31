# Audio tools

The soundtrack in `assets/audios/` was produced by these two scripts. Both are
one-shot generators — run them only when you want to change the audio.

## Voice-over — `gen-vo.js`

```
npm i msedge-tts
node tools/gen-vo.js ./vo_raw
```

Writes one raw mp3 per line into the given directory. Casting is the `CAST`
table at the top; the per-line `rate` / `pitch` / `volume` columns carry the
emotion. `text` must stay word for word identical to the caption or bubble in
`js/data/scenes.js`, or the audio and the reading drift apart.

The Edge endpoint accepts plain text only — `mstts:express-as` and nested
`prosody` are both rejected — so delivery is shaped by those prosody values,
by how each line is punctuated, and by the post-processing below.

After generating, post-process into `assets/audios/vo/`: trim the silence,
apply the per-line effect (tremolo on the frightened lines, echo on the ones
called into the dark, pitch-shift plus a long tail on Mr. Giggles), then
`loudnorm=I=-16:TP=-1.5`.

**Licensing:** these are Microsoft neural voices fetched through Edge's
read-aloud endpoint. Fine for prototyping. Before shipping, re-record the same
line list with a licensed provider or real voice talent.

## The counting game's voice-over — `gen-vo-game.js`

```
npm i msedge-tts && node tools/gen-vo-game.js ./vo_game_raw
```

Separate from `gen-vo.js` so running it cannot disturb the story's lines, which
are already cut and timed. Same casting, same constraint: emotion lives in the
rate / pitch / volume columns and in the punctuation, because the endpoint
rejects SSML.

Two things about this list are worth knowing before editing it:

- **Two lines are stems.** Screens 2.2 and 16 end in the number the player
  typed, so the recorded line stops short and `js/game.js` plays a number clip
  after it. If you re-time those lines, re-check the offsets in `dynamicVoice()`
  — they are the stem's own length.
- **Numbers zero to twenty are recorded separately.** Agni says each one as the
  player taps it, which is the point of the game, and the same clips finish the
  two stems. A guess above twenty plays the stem alone; the bubble is showing
  the figure anyway.

Post-process exactly as above, with one addition: **measure loudness on a padded
copy**. Most of these clips are a single word, and `loudnorm` needs about three
seconds of programme before its integrated reading means anything — measure a
one-word clip directly and it comes back `-inf`. Padding to five seconds fixes
it without changing the answer, because R128 gating drops the silence.

## The counting game's sound effects — `gen-sfx-game.js`

```
node tools/gen-sfx-game.js assets/audios/sfx
```

Same ffmpeg synthesis and the same four loudness roles as `gen-sfx.js`, kept in
its own file so a run cannot overwrite the story's effects. Covers the keypad,
counting, the three verdict chimes, the lamp, and a breath of air between beats.

Two deliberate choices in there:

- **The keys are wooden, not electronic.** Ten presses in a row on a bright
  synthetic beep turns the keypad into a calculator.
- **No verdict is a buzzer.** Guessing wrong and then counting to find out is
  the whole point of the game, so the worst outcome still resolves warmly.


## Sound effects — `gen-sfx.js`

```
node tools/gen-sfx.js assets/audios/sfx
```

Pure ffmpeg synthesis — no samples, no network. Two things to know before
editing it:

- `tremolo` rejects rates below 0.1 Hz, and the ambience bed rates are chosen
  to be whole divisions of the bed length (2/18, 3/18 … for the 18s bed) so the
  tremolo and the tone both complete whole cycles at the loop seam.
- Commas inside an ffmpeg expression must be written `\,` because the
  filtergraph parser uses them as separators. The expressions here avoid commas
  entirely instead.

`lantern_pop`, `ui_tap` and `lamp_flicker` are **not** generated here — they are
re-encoded from the shared library in `Bot-show/LBD-2/assets/audios`
(`pop`, `tap`, `electricity`).

## Where the cues live

`js/data/audio.js` maps every clip to a beat, with `at` offsets that match the
animation delays in `js/data/scenes.js` and `css/story.css`. Change a delay in
one and change it in the other.


## Story music — `gen-beds.js`

```
node tools/gen-beds.js assets/audios/sfx
```

The chapter's four music beds. **`bed_main` is a supplied track** (kept on disk
as `bed_main1.mp3`) — this tool does not write it; it writes the other three,
in the same key so the four cross-fade as one score:

| Bed | Where | Key |
|---|---|---|
| `bed_main` | page 1, the walks, the game | A minor, ~133 BPM (measured off the supplied track) |
| `bed_uneasy` | the mist arrives (2.1) | A minor, an F grinding against the E |
| `bed_dark` | lights out, the black page (2.2) | A minor, just the tonic and its fifth, an octave down |
| `bed_hope` | the twinkles return (3.4) | C major, the relative major — the same notes, resting |

If `bed_main` is ever swapped for a different track, re-check its key with a
chroma analysis before regenerating: everything here is written against A
minor, and a bed in an unrelated key will clash at every cross-fade.

Three things to know before editing:

- `tremolo` rejects rates below 0.1 Hz. Rates are given in **cycles across the
  whole loop** and `rate()` throws if that works out under the floor.
- Every bed **loops**, so drones are integer Hz over an integer number of
  seconds. That alone is not enough once the echo and the loudness pass have
  touched the audio, so each piece is rendered `XFADE` seconds long and its
  overhang is dissolved back over its own opening — the end and the start are
  then literally the same audio. Loudness is applied as one **static** gain for
  the same reason; `loudnorm`'s moving gain would leave the ends mismatched.
- Struck notes must start after the crossfade window and die before the end.


## Page one's bed — `make-bed-main.js`

```
node tools/make-bed-main.js assets/audios/sfx
```

Cuts `bed_main.mp3` out of the supplied song (`bed_main1.mp3`, kept whole on
disk). The song has a **sung vocal that enters at 13.1s**, and page one waits
for the reader after its 15.5s of automatic play — so the singing was heard
every time someone paused on the page. This takes the instrumental intro only.

The two numbers the edit rests on were measured off the recording, not chosen:

- the vocal enters at **13.1s** (centre-panned energy in 300–3000 Hz running
  well ahead of the sides, confirmed on a spectrogram where the arrangement
  visibly thickens), and the music itself starts at 2.48s;
- the track runs at **133 BPM** with downbeats at 3.142s, 4.946s, 6.751s,
  8.555s, 10.360s, 12.164s.

The loop is **3.142s → 12.164s: exactly five bars.** A short loop only sounds
like music if it is a whole number of bars — cut anywhere else and the pulse
limps every lap. Six bars would run to 13.97s and catch the vocal, so five is
the most that fits.

**Re-run the analysis if the song is ever re-supplied** — these numbers
describe this recording, not any recording.
