import { React, html } from "./lib/react.js";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client?deps=react@18.3.1";
import App from "./App.js";

const el = document.getElementById("root");
const splash = document.getElementById("boot-splash");

try {
  createRoot(el).render(html`<${App} />`);
  if (splash) setTimeout(() => splash.remove(), 600);
} catch (err) {
  console.error(err);
  if (el) {
    el.innerHTML = `<div style="max-width:560px;margin:4rem auto;padding:1.5rem;
      background:#2a1030;color:#ffe9f4;border-radius:12px;font-family:sans-serif">
      <h2>Couldn't boot Chroma Stacks 😢</h2>
      <p>This game loads React from esm.sh — check your connection and reload.</p>
      <pre style="white-space:pre-wrap;font-size:12px">${String(err).replace(/</g, "&lt;")}</pre>
    </div>`;
  }
}
