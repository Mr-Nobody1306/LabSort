import { html } from "../lib/react.js";
import { icons } from "./icons.js";

// Quiet editorial header: home-brand / level nav / pigment count left, moves right.
export default function TopBar({ level, moves, sealed, totalColors, onPrev, onNext, onHome }) {
  return html`
    <header class="hud">
      <div class="lab-hud-row">
        <div class="lab-left">
          <button class="lab-home" onClick=${onHome} title="Return to Welcome Screen" aria-label="Return to welcome screen">
            ${icons.home({ class: "home-icon" })}
            <span class="lab-brand">LabSort</span>
          </button>
          <span class="lab-sep">/</span>
          <div class="lab-level">
            <button class="nav-btn" onClick=${onPrev} disabled=${level <= 1} title="Previous Level" aria-label="Previous level">
              ${icons.chevL({ class: "nav-icon" })}
            </button>
            <h1 class="lab-level-title">Level ${level}</h1>
            <button class="nav-btn" onClick=${onNext} title="Next Level" aria-label="Next level">
              ${icons.chevR({ class: "nav-icon" })}
            </button>
          </div>
          <span class="lab-pigments">· ${totalColors} Pigment${totalColors === 1 ? "" : "s"}</span>
        </div>
        <div class="lab-moves">
          <div class="lab-moves-label">Moves</div>
          <div class="lab-moves-num tabular-nums">${moves}</div>
          <div class="lab-sealed">${sealed} / ${totalColors} sealed</div>
        </div>
      </div>
    </header>
  `;
}
