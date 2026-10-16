const PIN = `<svg viewBox="0 0 32 42" width="32" height="42" aria-hidden="true"><path fill="#d64532" d="M16 1.5C8.3 1.5 2.2 7.6 2.2 15.2 2.2 25.4 16 40.5 16 40.5s13.8-15.1 13.8-25.3C29.8 7.6 23.7 1.5 16 1.5z"/><circle cx="16" cy="15" r="5" fill="#fff"/></svg>`;

export function createGuessElement() {
  const element = document.createElement("div");
  element.className = "map-pin";
  element.setAttribute("role", "img");
  element.setAttribute("aria-label", "Your guess. Drag to move it.");
  element.innerHTML = PIN;
  return element;
}
