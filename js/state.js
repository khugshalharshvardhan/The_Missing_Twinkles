// Single source of truth for everything the game needs to remember.
// Kept deliberately plain — swap in save/load later.

export const state = {
  screen: "title",
  storyNode: null,
  puzzle: null,   // { id, grid, cols, rows, moves }
  visited: []     // node ids, in order
};

export function setScreen(name) {
  state.screen = name;
}

export function visit(nodeId) {
  state.storyNode = nodeId;
  if (!state.visited.includes(nodeId)) state.visited.push(nodeId);
}

export function reset() {
  state.screen = "title";
  state.storyNode = null;
  state.puzzle = null;
  state.visited = [];
}
