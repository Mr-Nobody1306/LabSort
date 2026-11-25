import { html } from "../lib/react.js";

// Inline SVG icon set (no emoji). All inherit currentColor.
function base(props, inner) {
  return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true" ...${props}>${inner}</svg>`;
}

export const icons = {
  flask: (p) =>
    base(p, html`<path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>`),
  undo: (p) =>
    base(p, html`<path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>`),
  plus: (p) => base(p, html`<path d="M12 4v16m8-8H4"/>`),
  restart: (p) =>
    base(p, html`<path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>`),
  soundOn: (p) =>
    base(p, html`<g><path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></g>`),
  soundOff: (p) =>
    base(p, html`<g><path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></g>`),
  chevL: (p) => base(p, html`<path d="M15 19l-7-7 7-7"/>`),
  chevR: (p) => base(p, html`<path d="M9 5l7 7-7 7"/>`),
  check: (p) =>
    base(p, html`<path d="M5 13l4 4L19 7"/>`),
  up: (p) =>
    base(p, html`<path d="M7 11l5-5m0 0l5 5m-5-5v12"/>`),
  home: (p) =>
    base(p, html`<path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z"/>`),
  eye: (p) =>
    base(p, html`<g><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></g>`),
  eyeOff: (p) =>
    base(p, html`<g><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><path d="M1 1l22 22"/></g>`),
  play: (p) =>
    html`<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" ...${p}><path d="M8 5.14v14l11-7-11-7z"/></svg>`,
  trophy: (p) =>
    html`<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" ...${p}><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>`,
};
