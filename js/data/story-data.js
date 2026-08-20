// Story content. Each node is one beat of text plus where it can go.
// type: "text" -> choices move to another node
//       "game" -> hands off to a puzzle, then goes to `next`

export const START_NODE = "intro";

export const storyNodes = {
  intro: {
    type: "text",
    chapter: "Chapter 1",
    location: "Hollow Street",
    text: `The power went out on the whole street at 9:14 pm.
Every house came back within the hour. Number 12 never did.`,
    choices: [
      { label: "Walk up to the door.", next: "door" },
      { label: "Check the street first.", next: "street" }
    ]
  },

  street: {
    type: "text",
    chapter: "Chapter 1",
    location: "Hollow Street",
    text: `No cars. No dogs. Every window on the row glows a soft, ordinary yellow —
except one, which is a hole cut out of the evening.`,
    choices: [{ label: "Walk up to the door.", next: "door" }]
  },

  door: {
    type: "text",
    chapter: "Chapter 1",
    location: "Number 12 — Porch",
    text: `The door is unlocked. Inside, the hallway smells of dust and cold copper.
A fuse box hangs open on the wall, its switches arranged like a small dark window.`,
    choices: [{ label: "Reach for the switches.", next: "puzzle-1" }]
  },

  "puzzle-1": {
    type: "game",
    chapter: "Chapter 1",
    location: "Number 12 — Hallway",
    puzzle: "fuse-box",
    next: "after-puzzle-1"
  },

  "after-puzzle-1": {
    type: "text",
    chapter: "Chapter 1",
    location: "Number 12 — Hallway",
    text: `The lights come up all at once.
The hallway is empty, and it has been empty for a long time.

Someone has written a single word in the dust on the mirror.`,
    choices: [{ label: "Read it.", next: "end" }]
  },

  end: {
    type: "text",
    chapter: "Chapter 1",
    location: "Number 12 — Hallway",
    text: `AGAIN.`,
    choices: [{ label: "Back to the beginning.", next: "__title" }]
  }
};
