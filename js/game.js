import { puzzles } from "./data/puzzles.js";
import { state, setScreen } from "./state.js";
import { showScreen, setText, clear, $ } from "./ui.js";

let onSolved = () => {};
let onLeave = () => {};

export function initGame(handlers) {
  onSolved = handlers.onSolved;
  onLeave = handlers.onLeave;
}

export function loadPuzzle(id, nextNode) {
  const def = puzzles[id];
  if (!def) {
    console.warn(`Unknown puzzle: ${id}`);
    return onLeave();
  }

  state.puzzle = {
    id,
    nextNode,
    cols: def.cols,
    rows: def.rows,
    grid: [...def.grid],
    moves: 0
  };

  setText("#game-title", def.title);
  setText("#game-hint", def.hint ?? "");

  buildBoard();
  render();

  setScreen("game");
  showScreen("game");
}

export function resetPuzzle() {
  if (state.puzzle) loadPuzzle(state.puzzle.id, state.puzzle.nextNode);
}

export function leavePuzzle() {
  onLeave();
}

function buildBoard() {
  const board = $("#board");
  const { cols, rows } = state.puzzle;

  board.style.setProperty("--cols", cols);
  clear(board);

  for (let i = 0; i < cols * rows; i++) {
    const cell = document.createElement("button");
    cell.className = "cell";
    cell.dataset.index = i;
    cell.setAttribute("aria-label", `Light ${i + 1}`);
    cell.addEventListener("click", () => toggleAt(i));
    board.append(cell);
  }
}

// Classic lights-out rule: a tap flips the cell and its four neighbours.
function toggleAt(index) {
  const { cols, rows, grid } = state.puzzle;
  const row = Math.floor(index / cols);
  const col = index % cols;

  const targets = [
    [row, col],
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1]
  ];

  targets.forEach(([r, c]) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    const i = r * cols + c;
    grid[i] = grid[i] ? 0 : 1;
  });

  state.puzzle.moves++;
  render();

  if (isSolved()) onSolved(state.puzzle.nextNode);
}

function isSolved() {
  return state.puzzle.grid.every((v) => v === 1);
}

function render() {
  const { grid, moves } = state.puzzle;
  const cells = document.querySelectorAll("#board .cell");

  cells.forEach((cell, i) => {
    cell.classList.toggle("is-on", grid[i] === 1);
  });

  setText("#stat-moves", moves);
  setText("#stat-lit", grid.filter(Boolean).length);
}
