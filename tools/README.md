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
