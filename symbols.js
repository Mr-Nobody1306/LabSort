import { html } from "../lib/react.js";

// Designed pigment marks for colorblind mode — one distinct filled glyph per
// pigment, drawn as crisp SVG silhouettes so they stay legible at the small
// sizes used inside liquid layers. All inherit currentColor (the `ink`
// contrast color of the liquid they sit on).
function sym(props, inner) {
  return html`<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"
    stroke-width="1.5" stroke-linejoin="round"
    aria-hidden="true" ...${props}>${inner}</svg>`;
}

export const pigmentSymbols = {
  terracotta: (p) => sym(p, html`<circle cx="12" cy="12" r="6.5"/>`),
  sienna: (p) =>
    sym(p, html`<path d="M12 4 19 8v8l-7 4-7-4V8Z"/>`),
  ochre: (p) =>
    sym(p, html`<path d="M12 3.2l2.6 5.4 5.9.7-4.4 4.1 1.1 5.8-5.2-2.8-5.2 2.8 1.1-5.8-4.4-4.1 5.9-.7Z"/>`),
  sage: (p) => sym(p, html`<rect x="5.5" y="5.5" width="13" height="13" rx="2.5"/>`),
  teal: (p) =>
    sym(p, html`<path d="M9.2 4h5.6v5.2H20v5.6h-5.2V20H9.2v-5.2H4V9.2h5.2Z"/>`),
  slate: (p) =>
    sym(p, html`<path d="M20.3 14.2A8.3 8.3 0 1 1 9.8 3.7a6.9 6.9 0 0 0 10.5 10.5Z"/>`),
  cobalt: (p) => sym(p, html`<path d="M12 4.5 20 19H4Z"/>`),
  plum: (p) => sym(p, html`<path d="M12 4 20 12l-8 8-8-8Z"/>`),
  rose: (p) =>
    sym(p, html`<path d="M12 20.2S4 14.9 4 9.5C4 6.9 6 5.2 8.2 5.2c1.5 0 3 .8 3.8 2.1.8-1.3 2.3-2.1 3.8-2.1 2.2 0 4.2 1.7 4.2 4.3 0 5.4-8 10.7-8 10.7Z"/>`),
};

// Spoken shape names for tube aria-labels ("Cobalt Ink triangle").
export const SYMBOL_NAMES = {
  terracotta: "circle",
  sienna: "hexagon",
  ochre: "star",
  sage: "square",
  teal: "plus",
  slate: "moon",
  cobalt: "triangle",
  plum: "diamond",
  rose: "heart",
};
