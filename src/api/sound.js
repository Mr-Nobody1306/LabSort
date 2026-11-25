// ─── api/sound.js ───────────────────────────────────────────────────────
// Web Audio synth SFX: select clinks, pour arpeggio, invalid buzz,
// tube-complete chime, win fanfare. No assets, no network.

let ctx = null;
let muted = false;

export function setSoundEnabled(on) {
  muted = !on;
}

function ac() {
  if (muted) return null;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function blip(freq, at, dur, type = "sine", gain = 0.12, slideTo = null) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  init() {
    ac();
  },
  select(up = true) {
    if (up) blip(520, 0, 0.1, "sine", 0.14, 880);
    else blip(420, 0, 0.1, "sine", 0.14, 300);
  },
  pour(units = 1) {
    const steps = 4 + units * 2;
    const dur = 0.28 + units * 0.07;
    for (let i = 0; i < steps; i++) {
      const base = 320 + i * 48 + Math.random() * 35;
      blip(base, (i * dur) / steps, 0.065, "sine", 0.09, base * 1.35);
    }
  },
  error() {
    blip(160, 0, 0.18, "triangle", 0.14, 125);
  },
  tubeDone() {
    [587.33, 739.99, 880, 1174.66].forEach((f, i) => blip(f, i * 0.065, 0.35));
  },
  win() {
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) =>
      blip(f, i * 0.09, 0.65, "triangle", 0.15)
    );
  },
  click() {
    blip(520, 0, 0.06, "triangle", 0.1);
  },
};
