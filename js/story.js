import { storyNodes, START_NODE } from "./data/story-data.js";
import { visit, setScreen } from "./state.js";
import { showScreen, setText, clear, button, $ } from "./ui.js";

let onPuzzle = () => {};
let onTitle = () => {};

// Wire up the two things story cannot do by itself.
export function initStory(handlers) {
  onPuzzle = handlers.onPuzzle;
  onTitle = handlers.onTitle;
}

export function startStory() {
  goToNode(START_NODE);
}

export function goToNode(nodeId) {
  if (nodeId === "__title") return onTitle();

  const node = storyNodes[nodeId];
  if (!node) {
    console.warn(`Unknown story node: ${nodeId}`);
    return onTitle();
  }

  visit(nodeId);

  if (node.type === "game") {
    return onPuzzle(node.puzzle, node.next, node);
  }

  renderNode(node);
}

function renderNode(node) {
  setText("#story-chapter", node.chapter ?? "");
  setText("#story-location", node.location ?? "");
  setText("#story-text", node.text ?? "");

  const choices = $("#story-choices");
  clear(choices);

  (node.choices ?? []).forEach((choice) => {
    choices.append(button(choice.label, () => goToNode(choice.next)));
  });

  setScreen("story");
  showScreen("story");
}
