// Thin DOM helpers. Nothing here knows about game rules.

const screens = document.querySelectorAll(".screen");

export function showScreen(name) {
  screens.forEach((el) => {
    el.classList.toggle("is-active", el.id === `screen-${name}`);
  });
}

export function $(selector, root = document) {
  return root.querySelector(selector);
}

export function setText(selector, value) {
  const el = $(selector);
  if (el) el.textContent = value;
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function button(label, onClick, className = "btn") {
  const el = document.createElement("button");
  el.className = className;
  el.textContent = label;
  el.addEventListener("click", onClick);
  return el;
}
