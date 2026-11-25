import { html } from "../lib/react.js";
import { icons } from "./icons.js";
import { pigmentSymbols } from "./symbols.js";
import { displayColor } from "../game/levels.js";

export function WinModal({ open, level, moves, onNext }) {
  if (!open) return null;
  return html`
    <div class="modal-overlay">
      <div class="modal-card win-card">
        <div class="win-eyebrow">LabSort · Sorted</div>
        <h2 class="win-title">Level ${level}</h2>
        <p class="win-sub">Completed in <b>${moves}</b> move${moves === 1 ? "" : "s"}.</p>
        <div class="win-divider">
          <button class="modal-next" onClick=${onNext}>Continue to Next Level</button>
        </div>
      </div>
    </div>
  `;
}

// Full-screen editorial welcome: apothecary header, showcase vessels,
// title, 3-step legend, colorblind opt-in, starting-level picker.
export function WelcomeModal({ open, welcomeLevel, resume, legendPalette, colorblind, onPickLevel, onToggleColorblind, onStart }) {
  if (!open) return null;
  const legend = (legendPalette || []).map((entry) => {
    const c = displayColor(entry, colorblind);
    return html`<div key=${entry.id} class="legend-chip"
      style=${{ background: `linear-gradient(180deg, ${c.top} 0%, ${c.mid} 60%, ${c.bot} 100%)`, color: c.ink || "#fff" }}>
      <span class="legend-symbol">${colorblind ? pigmentSymbols[entry.id]({ class: "legend-glyph" }) : ""}</span>
      <span class="legend-name">${entry.name}</span>
    </div>`;
  });
  return html`
    <section class="welcome-overlay" aria-label="Welcome to LabSort">
      <div class="welcome-top"><span>Apothecary Bench</span><span>No. 01 — Gouache</span></div>

      <div class="welcome-center">
        <div class="showcase" aria-hidden="true">
          <div class="show-row">
            <div class="show-tube">
              <div class="show-cork"></div><div class="show-rim"></div>
              <div class="show-glass"><div class="show-liquid">
                <div style=${{ background: "linear-gradient(180deg, #D46A4E, #C2593F)" }}></div>
                <div style=${{ background: "linear-gradient(180deg, #D46A4E, #C2593F)" }}></div>
                <div style=${{ background: "linear-gradient(180deg, #D46A4E, #C2593F)" }}></div>
                <div style=${{ background: "linear-gradient(180deg, #D46A4E, #A84830)" }}></div>
              </div></div>
            </div>
            <div class="show-tube lift">
              <div class="show-rim"></div>
              <div class="show-glass"><div class="show-liquid">
                <div style=${{ background: "linear-gradient(180deg, #DDA33A, #AD781C)" }}></div>
                <div style=${{ background: "linear-gradient(180deg, #789267, #526844)" }}></div>
                <div style=${{ background: "linear-gradient(180deg, #3B6598, #224169)" }}></div>
              </div></div>
            </div>
            <div class="show-tube">
              <div class="show-cork"></div><div class="show-rim"></div>
              <div class="show-glass"><div class="show-liquid">
                <div style=${{ background: "linear-gradient(180deg, #3B6598, #2E5382)" }}></div>
                <div style=${{ background: "linear-gradient(180deg, #3B6598, #2E5382)" }}></div>
                <div style=${{ background: "linear-gradient(180deg, #3B6598, #2E5382)" }}></div>
                <div style=${{ background: "linear-gradient(180deg, #3B6598, #224169)" }}></div>
              </div></div>
            </div>
          </div>
          <div class="show-stand"></div>
        </div>

        <h1 class="welcome-title">LabSort</h1>
        <p class="welcome-obj">Decant and sort pure pigments into their own borosilicate vessels.</p>

        <div class="welcome-steps3">
          <div class="step3">
            <div class="step3-icon">${icons.up({ class: "step3-svg" })}</div>
            <span>Select a vessel</span>
          </div>
          <div class="step3 mid">
            <div class="step3-icon">${icons.flask({ class: "step3-svg" })}</div>
            <span>Pour onto matching pigment</span>
          </div>
          <div class="step3">
            <div class="step3-icon">${icons.check({ class: "step3-svg" })}</div>
            <span>Seal all pure vessels</span>
          </div>
        </div>

        ${colorblind && html`<div class="legend-grid">${legend}</div>`}
        <button class=${"cb-switch" + (colorblind ? " on" : "")} onClick=${onToggleColorblind}
          aria-pressed=${colorblind} title="Toggle colorblind mode">
          <span class="cb-knob">${colorblind ? icons.eye({ class: "cb-icon" }) : icons.eyeOff({ class: "cb-icon" })}</span>
          <span class="cb-text">${colorblind ? "Colorblind mode: ON — symbols + distinct pigments" : "Colorblind mode: OFF — tap for symbols + distinct pigments"}</span>
        </button>

        <div class="welcome-pick">
          <div class="pick-row">
            <span class="pick-label">Starting Level</span>
            <div class="pick-nav">
              <button class="lvl-btn" onClick=${() => onPickLevel(welcomeLevel - 1)} disabled=${welcomeLevel <= 1} aria-label="Decrease starting level">
                ${icons.chevL({ class: "lvl-svg" })}
              </button>
              <span class="pick-level tabular-nums">Level ${welcomeLevel}</span>
              <button class="lvl-btn" onClick=${() => onPickLevel(welcomeLevel + 1)} aria-label="Increase starting level">
                ${icons.chevR({ class: "lvl-svg" })}
              </button>
            </div>
          </div>
          <button class="modal-next welcome-start" onClick=${onStart}>
            ${resume ? `Resume Level ${welcomeLevel}` : `Start Level ${welcomeLevel}`}
          </button>
        </div>
      </div>

      <div class="welcome-foot">Quiet studio puzzle · Tap any vessel to begin</div>
    </section>
  `;
}
