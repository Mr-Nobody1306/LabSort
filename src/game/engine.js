import { CAPACITY } from "./levels.js";

// ─── Rules engine: water-sort with group pours ─────────────────────────────
// A bottle is a plain array, bottom → top. Pouring moves the WHOLE connected
// group of the top color at once (up to the free space in the destination).

export function topGroupSize(bottle) {
  if (bottle.length === 0) return 0;
  const top = bottle[bottle.length - 1];
  let n = 0;
  for (let i = bottle.length - 1; i >= 0 && bottle[i] === top; i--) n++;
  return n;
}

export function isUniform(bottle) {
  return bottle.length > 0 && bottle.every((v) => v === bottle[0]);
}

export function canPour(bottles, from, to) {
  if (from === to) return false;
  const src = bottles[from];
  const dst = bottles[to];
  if (!src || !dst || src.length === 0) return false;
  if (dst.length >= CAPACITY) return false;
  if (dst.length === 0) return true;
  return src[src.length - 1] === dst[dst.length - 1];
}

// How many drops actually flow for a legal pour.
export function pourAmount(bottles, from, to) {
  if (!canPour(bottles, from, to)) return 0;
  return Math.min(topGroupSize(bottles[from]), CAPACITY - bottles[to].length);
}

export function pourReasons(bottles, from, to) {
  if (from === to) return "same bottle";
  const src = bottles[from];
  const dst = bottles[to];
  if (!src || src.length === 0) return "source is empty";
  if (!dst) return "no such bottle";
  if (dst.length >= CAPACITY) return `no room — Bottle ${to + 1} is full`;
  if (dst.length > 0 && src[src.length - 1] !== dst[dst.length - 1]) {
    return "colors must match — water only flows onto the same color";
  }
  return null;
}

// Returns { bottles, color, amount } with NEW arrays, or null if illegal.
export function applyPour(bottles, from, to) {
  const k = pourAmount(bottles, from, to);
  if (k <= 0) return null;
  const next = bottles.map((b) => [...b]);
  const moved = [];
  for (let i = 0; i < k; i++) moved.push(next[from].pop());
  for (const c of moved) next[to].push(c);
  return { bottles: next, color: moved[0], amount: k };
}

export function isBottleDone(bottle) {
  if (bottle.length === 0) return true;
  if (bottle.length !== CAPACITY) return false;
  return bottle.every((v) => v === bottle[0]);
}

export function isWon(bottles) {
  return bottles.every(isBottleDone);
}

export function completedCount(bottles) {
  return bottles.filter((b) => b.length === CAPACITY && b.every((v) => v === b[0])).length;
}

export function anyMovesLeft(bottles) {
  for (let f = 0; f < bottles.length; f++) {
    for (let t = 0; t < bottles.length; t++) {
      if (canPour(bottles, f, t)) return true;
    }
  }
  return false;
}

export function hashState(bottles) {
  return bottles.map((b) => b.join(",")).join("|");
}

export function starsFor(moves, par) {
  if (moves <= par) return 3;
  if (moves <= Math.ceil(par * 1.5)) return 2;
  return 1;
}

// ─── Solver ────────────────────────────────────────────────────────────────
// Depth-first search returning the FULL solution path ([{from,to}]) or null.
// findHintMove takes the first step, with an optional root-level tabu
// (forbidHashes) so consecutive one-step hints can't ping-pong.

export function findSolution(start, maxNodes = 30000) {
  if (isWon(start)) return [];
  if (!anyMovesLeft(start)) return null;
  return search(start.map((b) => [...b]), maxNodes, null);
}

export function findHintMove(bottles, opts = {}) {
  const { maxNodes = 12000, forbidHashes = null } = opts;
  if (isWon(bottles)) return null;
  if (!anyMovesLeft(bottles)) return { stuck: true };

  const start = bottles.map((b) => [...b]);
  let rootTried = orderedMoves(start, null);
  if (forbidHashes && forbidHashes.size) {
    const open = rootTried.filter(([f, t]) => {
      const r = applyPour(start, f, t);
      return !r || !forbidHashes.has(hashState(r.bottles));
    });
    if (open.length) rootTried = open;
  }
  if (!rootTried.length) return greedyHint(bottles, forbidHashes);

  const path = search(start, maxNodes, rootTried);
  if (path && path.length) return path[0];
  return greedyHint(bottles, forbidHashes) ?? null;
}

// Iterative DFS. rootTried overrides the root move list (already ordered).
function search(start, maxNodes, rootTried) {
  const seen = new Set([hashState(start)]);
  let nodes = 0;
  const stack = [{ state: start, path: [], tried: rootTried ?? orderedMoves(start, null) }];

  while (stack.length) {
    const frame = stack[stack.length - 1];
    if (frame.path.length > 80) {
      stack.pop();
      continue;
    }
    if (frame.state.length && isWon(frame.state)) return frame.path;
    if (frame.tried.length === 0) {
      stack.pop();
      continue;
    }
    if (++nodes > maxNodes) return null;
    const [f, t] = frame.tried.pop();
    const res = applyPour(frame.state, f, t);
    if (!res) continue;
    const h = hashState(res.bottles);
    if (seen.has(h)) continue;
    seen.add(h);
    const path = [...frame.path, { from: f, to: t }];
    if (isWon(res.bottles)) return path;
    stack.push({ state: res.bottles, path, tried: orderedMoves(res.bottles, path[path.length - 1]) });
  }
  return null;
}

// Candidate pours, worst-first (we pop from the end, so best is tried first).
function orderedMoves(state, lastMove) {
  const scored = [];
  for (let f = 0; f < state.length; f++) {
    const src = state[f];
    if (src.length === 0 || isBottleDone(src)) continue; // never break a finished bottle
    const group = topGroupSize(src);
    for (let t = 0; t < state.length; t++) {
      if (!canPour(state, f, t)) continue;
      if (lastMove && f === lastMove.to && t === lastMove.from) continue; // no instant undo
      const dst = state[t];
      const k = Math.min(group, CAPACITY - dst.length);
      let score;
      if (dst.length === 0) {
        // Splitting a mixed bottle into space: good. Relocating a whole
        // uniform bottle: pointless.
        score = group === src.length ? -10 : 6;
      } else {
        score = 8 + 2 * k;
        if (dst.length + k === CAPACITY) score += 10; // completes a bottle
        if (k === src.length) score += 2; // empties the source
      }
      scored.push({ score, move: [f, t] });
    }
  }
  scored.sort((a, b) => a.score - b.score);
  return scored.map((s) => s.move);
}

function greedyHint(bottles, forbidHashes) {
  if (!anyMovesLeft(bottles)) return { stuck: true };
  const state = bottles.map((b) => [...b]);
  let moves = orderedMoves(state, null);
  if (forbidHashes && forbidHashes.size) {
    const open = moves.filter(([f, t]) => {
      const r = applyPour(state, f, t);
      return !r || !forbidHashes.has(hashState(r.bottles));
    });
    if (open.length) moves = open;
  }
  if (!moves.length) return null;
  const [from, to] = moves[moves.length - 1];
  return { from, to, greedy: true };
}
