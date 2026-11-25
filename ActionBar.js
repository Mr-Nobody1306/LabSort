import { html } from "../lib/react.js";
import { icons } from "./icons.js";

// Circular lab action bar under the rack: undo / restart / +vial / sound / eye.
export default function ActionBar({
  undosLeft,
  canUndo,
  extraLeft,
  canExtra,
  sound,
  colorblind,
  onUndo,
  onExtra,
  onRestart,
  onToggleSound,
  onToggleColorblind,
}) {
  return html`
    <div class="action-bar">
      <button class="lab-btn" onClick=${onUndo} disabled=${!canUndo} title="Undo Last Move" aria-label="Undo last move">
        ${icons.undo({ class: "btn-icon" })}
        <span class="lab-badge">${undosLeft}</span>
      </button>
      <button class="lab-btn" onClick=${onRestart} title="Restart Level" aria-label="Restart level">
        ${icons.restart({ class: "btn-icon" })}
      </button>
      <button class="lab-btn" onClick=${onExtra} disabled=${!canExtra} title="Add 1 Emergency Empty Vial" aria-label="Add empty vial">
        ${icons.plus({ class: "btn-icon" })}
        <span class="lab-badge green">${extraLeft}</span>
      </button>
      <button class="lab-btn" onClick=${onToggleSound} title="Toggle Sound Effects" aria-label="Toggle sound">
        ${sound ? icons.soundOn({ class: "btn-icon" }) : icons.soundOff({ class: "btn-icon dim" })}
      </button>
      <button class=${"lab-btn" + (colorblind ? " active" : "")} onClick=${onToggleColorblind}
        title="Colorblind mode: symbols + distinct pigments" aria-label="Toggle colorblind mode" aria-pressed=${colorblind}>
        ${colorblind ? icons.eye({ class: "btn-icon" }) : icons.eyeOff({ class: "btn-icon dim" })}
      </button>
    </div>
  `;
}
