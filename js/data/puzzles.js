// Puzzle definitions. `grid` is row-major: 1 = lit, 0 = dark.
export const puzzles = {
  "fuse-box": {
    title: "The Fuse Box",
    hint: "Tap a light. Its neighbours listen too.",
    cols: 5,
    rows: 5,
    grid: [
      0, 1, 0, 1, 0,
      1, 0, 0, 0, 1,
      0, 0, 1, 0, 0,
      1, 0, 0, 0, 1,
      0, 1, 0, 1, 0
    ]
  }
};
