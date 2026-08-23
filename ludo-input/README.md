# Walk-cycle frames — what to give Ludo, and what to send back

Two files in this folder are the uploads. They are exactly what appears on
screen today, at higher resolution, with transparency intact:

| upload this | for |
| --- | --- |
| `agni_walk_reference.png` (1025×1200) | Agni, the orange dragon |
| `neel_walk_reference.png` (976×1200) | Neel, the blue monster |

Agni's is cropped to match her on-screen framing — the stored art is a wider
source that the app crops, so uploading the raw file would generate frames that
do not line up.

Run the generator **twice**, once per character.

## Settings

| panel | set to | why |
| --- | --- | --- |
| **Step 1 — First Frame** | Choose Image → the PNG above | |
| **Step 2 — type** | **Sprite** (the leftmost) | it is a character, not VFX or UI |
| **Step 3 — Model** | Blitz | fine for a two-step cycle; try a higher tier only if the feet look mushy |
| **Step 3 — Max duration** | **1.2** | a walk cycle is two steps. Longer durations invite drift and cost more credits |
| **Step 3 — Animation Margin** | Auto | |
| **Sprite Sheet Options** | expand it — see below | |

Under **Sprite Sheet Options**, aim for:

- a **horizontal strip** (one row), not a grid
- **8 frames** if you can choose; 6 also works, 12 is more than needed
- **transparent PNG** output

If the options are named differently, send me a screenshot of that panel and
I will tell you what to pick.

## Motion description

Copy one of these into Step 2 verbatim. The two clauses that matter most are
*walks in place* and *loops seamlessly* — without them the generator tends to
walk the character out of frame, which cannot be used as a cycle.

**Agni:**

```
Side view walk cycle. The little orange dragon walks in place, legs stepping,
arms swinging, wings held back, tail swaying, gentle up-and-down bob. She stays
centred at the same size and does not move out of frame. Loops seamlessly.
Transparent background. Keep the exact same character design, colours, outline
style and facing direction as the reference image.
```

**Neel:**

```
Side view walk cycle. The little blue furry monster walks in place, legs
stepping, arms swinging, fur settling, gentle up-and-down bob. He stays centred
at the same size and does not move out of frame. Loops seamlessly. Transparent
background. Keep the exact same character design, colours, outline style and
facing direction as the reference image.
```

## What to send back

One sprite sheet per character, and tell me the frame count. What the code
needs from the sheet:

- **one horizontal row**, every cell the same width
- **transparent** background
- the character **does not drift** inside its cell — same position, frame to frame
- **feet on a consistent baseline**, so they do not bounce against the ground
- the **last frame flows into the first**, so it loops

A video or GIF is fine too — I can cut the frames out of it. A sheet is less
work and a bit sharper.

## Done — what came back, and what was changed

Both sheets arrived as **3x3 grids, 9 frames** (`assets/spritesheet/*_walking.png`),
not the horizontal strips this brief asked for. That was fine; they were re-cut.

| | Agni | Neel |
| --- | --- | --- |
| sheet | 1398x1716, cell 466x572 | 1356x1806, cell 452x602 |
| baseline drift | 14px | 25px |
| height variation | 13px | 37px |

Two corrections were needed before they could be used:

1. **Cells cropped to the union of all nine bounding boxes**, so they are uniform
   and tight rather than mostly empty margin.
2. **Every frame shifted vertically until its lowest opaque row lines up.** The
   baseline drift above would have read as bouncing against the ground. Aligning
   it keeps the height variation, and height variation over a fixed baseline is
   exactly the head bob a walk wants — 13px and 30px of it.

Frame-to-frame differences were checked for duplicates and for a loop pop: no
duplicates, and both 8-to-0 seams are *below* the average step, so the cycles
close cleanly. All nine frames of each are in use.

The results are `assets/spritesheet/agni_walk_strip.webp` (4140x552, 391KB) and
`neel_walk_strip.webp` (4005x604, 223KB) — nine cells in a row, lossless alpha.

If you generate more of these, the two things worth asking the generator for are
a **consistent baseline** and **no drift inside the cell**. Everything else here
was easy to correct; those two were the work.
