import { html } from "../lib/react.js";
import TubeView from "./TubeView.js";

// Balanced two-row arena; each row of vials rests on a wooden rack bar.
export default function Board({ bottles, palette, selected, pour, onPick, disabled, colorblind }) {
  const total = bottles.length;
  const row1Count = total <= 5 ? total : Math.ceil(total / 2);
  const rows = [bottles.slice(0, row1Count), bottles.slice(row1Count)].filter((r) => r.length);
  let n = 0;
  return html`
    <div class="arena">
      ${rows.map((row, ri) => {
        const cells = row.map((water) => {
          const i = n++;
          return html`
            <${TubeView}
              key=${i}
              water=${water}
              palette=${palette}
              index=${i}
              selected=${selected === i}
              pouring=${pour && pour.from === i ? pour.transform : null}
              sloshing=${!!(pour && pour.to === i && pour.slosh)}
              onPick=${disabled ? () => {} : onPick}
              disabled=${disabled}
              colorblind=${colorblind}
            />
          `;
        });
        return html`<div key=${ri} class="shelf-row"><div class="shelf-ledge"></div>${cells}</div>`;
      })}
    </div>
  `;
}
