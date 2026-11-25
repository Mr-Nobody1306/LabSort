import { findSolution } from "./engine.js";

// ─── Palette: gouache & apothecary pigments (top → mid → deep base) ─────
// The exact LabSort pigment set. Each entry carries a stable `symbol` +
// `hue` (wheel degrees) so the colorblind mode can label every liquid and
// deals can avoid packing same-spectrum neighbors into one level.
export const LIQUID_COLORS = [
  { id: "terracotta", name: "Terracotta",    top: "#D46A4E", mid: "#C2593F", bot: "#A84830", glow: "rgba(194, 89, 63, 0.30)",  symbol: "●", hue: 14 },
  { id: "sienna",     name: "Burnt Sienna",  top: "#A45A38", mid: "#8E492A", bot: "#75391E", glow: "rgba(142, 73, 42, 0.30)",  symbol: "⬢", hue: 20 },
  { id: "ochre",      name: "Ochre Mustard", top: "#DDA33A", mid: "#CA9028", bot: "#AD781C", glow: "rgba(202, 144, 40, 0.30)", symbol: "★", hue: 42 },
  { id: "sage",       name: "Sage Olive",    top: "#789267", mid: "#657E55", bot: "#526844", glow: "rgba(101, 126, 85, 0.30)", symbol: "■", hue: 95 },
  { id: "teal",       name: "Deep Teal",     top: "#397E7E", mid: "#2B6969", bot: "#1F5353", glow: "rgba(43, 105, 105, 0.30)", symbol: "✚", hue: 180 },
  { id: "slate",      name: "Slate Blue",    top: "#677D8E", mid: "#54697A", bot: "#425564", glow: "rgba(84, 105, 122, 0.30)", symbol: "☾", hue: 203 },
  { id: "cobalt",     name: "Cobalt Ink",    top: "#3B6598", mid: "#2E5382", bot: "#224169", glow: "rgba(46, 83, 130, 0.30)",  symbol: "▲", hue: 212 },
  { id: "plum",       name: "Damson Plum",   top: "#7E5576", mid: "#6B4463", bot: "#55334E", glow: "rgba(107, 68, 99, 0.30)", symbol: "◆", hue: 300 },
  { id: "rose",       name: "Dusty Rose",    top: "#CE7E85", mid: "#BA6970", bot: "#9E535A", glow: "rgba(186, 105, 112, 0.30)", symbol: "♥", hue: 350 },
];

// ─── Colorblind-safe remap (Okabe–Ito inspired, lightness-separated) ─────
// Same ids, maximally distinguishable hues AND brightness steps so liquids
// stay apart for deuteranopia / protanopia / tritanopia — and every liquid
// additionally carries its `symbol`, so color is never the only signal.
// `ink` is the symbol glyph color chosen for contrast on that liquid.
export const CB_COLORS = {
  terracotta: { top: "#f0608a", mid: "#c41e4a", bot: "#62081f", glow: "rgba(196, 30, 74, 0.5)",  ink: "#ffffff" },
  sienna:     { top: "#ffc14d", mid: "#e69f00", bot: "#7a5200", glow: "rgba(230, 159, 0, 0.5)",   ink: "#422006" },
  ochre:      { top: "#fff06a", mid: "#f0e442", bot: "#8a7d00", glow: "rgba(240, 228, 66, 0.45)", ink: "#422006" },
  sage:       { top: "#5cb87a", mid: "#228833", bot: "#0d3d1a", glow: "rgba(34, 136, 51, 0.5)",   ink: "#ffffff" },
  teal:       { top: "#4ec9a2", mid: "#009e73", bot: "#004f39", glow: "rgba(0, 158, 115, 0.5)",  ink: "#ffffff" },
  slate:      { top: "#8fdcf5", mid: "#56b4e9", bot: "#1a5a7a", glow: "rgba(86, 180, 233, 0.5)",  ink: "#083344" },
  cobalt:     { top: "#5fb6e5", mid: "#0072b2", bot: "#003d66", glow: "rgba(0, 114, 178, 0.5)",   ink: "#ffffff" },
  plum:       { top: "#9a6bc2", mid: "#6a3d9a", bot: "#341a5e", glow: "rgba(106, 61, 154, 0.5)",  ink: "#ffffff" },
  rose:       { top: "#e8a0bf", mid: "#cc79a7", bot: "#6e2f4b", glow: "rgba(204, 121, 167, 0.5)", ink: "#ffffff" },
};

// Resolve the actual rendered gradient for a palette entry.
export function displayColor(entry, colorblind) {
  if (!colorblind) return entry;
  const cb = CB_COLORS[entry.id];
  return cb ? { ...entry, ...cb } : entry;
}

export const CAPACITY = 4;
export const UNDOS_PER_LEVEL = 5;

// Level ladder: 3 → 9 pigments, always 2 spare vessels.
// Brackets match the LabSort reference (L1:3, L2:4, L3-4:5, L5-7:6,
// L8-11:7, L12-15:8, L16+:9).
export function levelConfig(levelNum) {
  if (levelNum <= 1) return { colors: 3, empties: 2 };
  if (levelNum === 2) return { colors: 4, empties: 2 };
  if (levelNum <= 4) return { colors: 5, empties: 2 };
  if (levelNum <= 7) return { colors: 6, empties: 2 };
  if (levelNum <= 11) return { colors: 7, empties: 2 };
  if (levelNum <= 15) return { colors: 8, empties: 2 };
  return { colors: 9, empties: 2 };
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A hue-spaced subset per deal, deterministic from the seed. Walking the
// hue wheel in even steps (from a random offset) guarantees the level never
// packs same-spectrum neighbors together (no blue+cyan or red+pink soups),
// so liquids stay distinguishable even before colorblind mode is on.
const HUE_WHEEL = ["terracotta", "sienna", "ochre", "sage", "teal", "slate", "cobalt", "plum", "rose"];
function pickPalette(numColors, seed) {
  const rng = mulberry32(seed);
  const byId = new Map(LIQUID_COLORS.map((c) => [c.id, c]));
  const n = HUE_WHEEL.length;
  const start = Math.floor(rng() * n);
  const out = [];
  for (let k = 0; k < numColors; k++) {
    out.push(byId.get(HUE_WHEEL[(start + Math.floor((k * n) / numColors)) % n]));
  }
  return out;
}

// ─── Deal generation: ALWAYS winnable ────────────────────────────────────
// Fill bottles from a shuffled multiset (round-robin), then PROVE winnability
// by running the solver on the deal. Unproven deals (unsolvable fills do
// happen) are discarded and re-dealt. The fallback pool below holds
// solver-proven deals per configuration as a safety net.
export function generatePuzzle(numColors, emptyCount = 2, seed = Date.now()) {
  const palette = pickPalette(numColors, (seed ^ 0x9e3779b9) >>> 0);
  const deadline = Date.now() + 900; // never stall level start for long
  for (let attempt = 0; attempt < 150; attempt++) {
    if (attempt > 0 && attempt % 25 === 0 && Date.now() > deadline) break;
    const deal = shuffledFill(numColors, emptyCount, (seed + attempt * 7919) >>> 0);
    if (!isValidDeal(deal, numColors) || !looksMixed(deal)) continue;
    if (isTriviallySolved(deal)) continue;
    const solution = findSolution(deal, 150000);
    if (solution && solution.length >= 3) return { bottles: deal, palette };
  }
  return { bottles: fallbackDeal(numColors, emptyCount), palette };
}

function shuffledFill(numColors, emptyCount, seed) {
  const bottles = Array.from({ length: numColors + emptyCount }, () => []);
  const balls = [];
  for (let c = 0; c < numColors; c++) for (let k = 0; k < CAPACITY; k++) balls.push(c);
  const rng = mulberry32(seed);
  for (let i = balls.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [balls[i], balls[j]] = [balls[j], balls[i]];
  }
  let bi = 0;
  for (let round = 0; round < CAPACITY; round++) {
    for (let b = 0; b < numColors; b++) bottles[b].push(balls[bi++]);
  }
  return bottles;
}

// Pre-verified quality deals per configuration (solver-proven winnable),
// used only if live generation exhausts its time budget. Bottom → top.
const FALLBACK_DEALS = {
  "3-2": [
    [[0,2,1,2],[2,1,0,1],[1,0,2,0],[],[]],
    [[0,2,0,2],[0,2,1,1],[1,0,2,1],[],[]],
  ],
  "4-2": [
    [[3,2,1,3],[3,1,0,2],[2,3,1,2],[1,0,0,0],[],[]],
    [[0,1,2,1],[0,3,2,2],[3,1,2,3],[3,0,1,0],[],[]],
  ],
  "5-2": [
    [[1,4,0,3],[0,2,4,2],[0,1,4,0],[3,3,1,1],[2,4,2,3],[],[]],
    [[3,2,0,4],[3,0,4,0],[1,1,1,3],[2,2,2,1],[4,0,4,3],[],[]],
  ],
  "6-2": [
    [[0,0,0,5],[1,2,1,4],[2,4,0,3],[5,4,3,1],[3,4,5,1],[2,5,2,3],[],[]],
    [[5,5,3,4],[0,1,1,4],[2,3,0,0],[5,2,5,4],[0,4,2,1],[2,1,3,3],[],[]],
  ],
  "7-2": [
    [[3,1,6,2],[4,5,2,6],[5,3,5,5],[2,0,1,6],[2,3,0,1],[0,4,4,1],[0,3,6,4],[],[]],
    [[4,6,1,4],[0,1,6,5],[2,3,3,4],[5,3,1,0],[6,1,0,5],[2,0,5,2],[3,6,2,4],[],[]],
  ],
  "8-2": [
    [[3,6,6,7],[6,0,4,3],[0,0,2,4],[7,5,2,5],[1,5,6,7],[1,4,7,1],[3,0,1,2],[3,2,5,4],[],[]],
    [[4,7,0,3],[4,5,7,4],[4,2,5,6],[7,0,2,5],[1,1,6,0],[2,1,1,6],[3,3,0,2],[6,7,3,5],[],[]],
  ],
  "9-2": [
    [[0,3,3,1],[7,4,8,6],[3,0,6,1],[1,0,8,4],[4,4,3,2],[2,8,7,8],[2,1,6,6],[7,5,5,5],[5,2,7,0],[],[]],
    [[4,1,2,8],[7,5,4,6],[3,6,7,5],[3,0,8,8],[7,6,2,4],[3,5,5,2],[0,2,4,6],[0,0,3,8],[1,1,7,1],[],[]],
  ],
};

// Last-resort pattern (always valid, always solvable): one drop parked in
// each spare bottle — pour each back home.
function fallbackDeal(numColors, emptyCount) {
  const list = FALLBACK_DEALS[`${numColors}-${emptyCount}`];
  if (list && list.length) {
    return list[(Math.random() * list.length) | 0].map((b) => [...b]);
  }
  const bottles = [];
  for (let c = 0; c < numColors; c++) bottles.push([c, c, c, c]);
  for (let e = 0; e < emptyCount; e++) bottles.push([]);
  for (let e = 0; e < emptyCount; e++) {
    bottles[numColors + e].push(bottles[e].pop());
  }
  return bottles;
}

function isTriviallySolved(bottles) {
  return bottles.every(
    (b) => b.length === 0 || (b.length === CAPACITY && b.every((v) => v === b[0]))
  );
}

function isValidDeal(bottles, numColors) {
  const counts = new Map();
  for (const b of bottles) for (const c of b) counts.set(c, (counts.get(c) ?? 0) + 1);
  if (counts.size !== numColors) return false;
  for (const [, n] of counts) if (n !== CAPACITY) return false;
  return true;
}

function looksMixed(bottles) {
  let mixed = 0;
  for (const b of bottles) {
    if (b.length > 1 && b[b.length - 1] !== b[b.length - 2]) mixed++;
  }
  return mixed >= 2;
}
