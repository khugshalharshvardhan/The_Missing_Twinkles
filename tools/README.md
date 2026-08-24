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
