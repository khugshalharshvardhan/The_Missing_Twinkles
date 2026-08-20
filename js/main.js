// Entry point: wires the modules together and owns the top-level actions.

import { state, reset, setScreen } from "./state.js";
import { showScreen } from "./ui.js";
import { initStory, startStory, goToNode } from "./story.js";
import { initGame, loadPuzzle, resetPuzzle } from "./game.js";

initStory({
  // A story node of type "game" hands control to the puzzle.
  onPuzzle: (puzzleId, nextNode) => loadPuzzle(puzzleId, nextNode),
  onTitle: () => go("title")
});

initGame({
  // Puzzle solved -> continue the story where it left off.
  onSolved: (nextNode) => goToNode(nextNode),
  // "Leave" bails back to the title for now.
  onLeave: () => go("title")
});

function go(screen) {
  setScreen(screen);
  showScreen(screen);
}

const actions = {
  start: () => {
    reset();
    startStory();
  },
  continue: () => {
    if (state.storyNode) goToNode(state.storyNode);
  },
  about: () => go("about"),
  title: () => go("title"),
  reset: () => resetPuzzle(),
  back: () => go("title")
};

// One listener for every [data-action] button on the page.
document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-action]");
  if (!trigger) return;

  const run = actions[trigger.dataset.action];
  if (run) run();
});

go("title");
