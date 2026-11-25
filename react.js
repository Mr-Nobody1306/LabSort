import React from "https://esm.sh/react@18.3.1";
import htm from "https://esm.sh/htm@3.1.1";

// htm gives us JSX-like templates without a build step:
//   html`<div class="x" onClick=${fn}>${items}</div>`
// Components interpolate as html`<${MyComp} prop=${v} />`.
export const html = htm.bind(React.createElement);
export { React };
export default React;
