import { html } from "../lib/react.js";
import { CAPACITY, displayColor } from "../game/levels.js";
import { pigmentSymbols, SYMBOL_NAMES } from "./symbols.js";

// A borosilicate lab tube. `water` holds palette indices, bottom → top.
// Sealed (full + uniform) tubes get a cork stopper. In colorblind mode every
// liquid layer shows its shape symbol and uses the high-distinction remap,
// so color is never the only signal.
export default function TubeView({
  water,
  palette,
  index,
  selected,
  pouring,
  sloshing,
  onPick,
  disabled,
  colorblind,
}) {
  // Sealed only for FULL uniform tubes (empties don't count here).
  const done =
    water.length === CAPACITY && water.every((v) => v === water[0]);
  const top = water.length - 1;
  const layers = water.map((colorIdx, slot) => {
    const c = displayColor(palette[colorIdx], colorblind);
    const isTop = slot === top;
    const ink = colorblind ? c.ink || "#fff" : null;
    return html`<div
      key=${slot}
      class=${"liquid-layer" + (isTop ? " top-layer" : "") + (isTop && sloshing ? " sloshing" : "") + (colorblind ? " cb" : "")}
      style=${{ background: `linear-gradient(180deg, ${c.top} 0%, ${c.mid} 55%, ${c.bot} 100%)` }}
    >${colorblind && html`<span class="layer-symbol" style=${{ color: ink }}>${pigmentSymbols[palette[colorIdx].id]({ class: "layer-glyph" })}</span>`}</div>`;
  });

  const cls = [
    "tube-wrapper",
    selected ? "selected" : "",
    done ? "completed" : "",
    pouring ? "pouring" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return html`
    <div
      class=${cls}
      data-index=${index}
      role="button"
      aria-label=${"Test tube " + (index + 1) + (colorblind && water.length
        ? ", " + water.map((ci) => palette[ci].name + " " + (SYMBOL_NAMES[palette[ci].id] || "")).join(", ")
        : "")}
      style=${pouring ? { transform: pouring } : null}
      onClick=${() => onPick(index)}
    >
      <div class="cork-stopper"></div>
      <div class="tube-rim"></div>
      <div class="tube-glass">
        <div class="tube-reflection"></div>
        <div class="tube-ticks"><span></span><span></span><span></span><span></span></div>
        <div class="liquid-stack">${layers}</div>
      </div>
    </div>
  `;
}
