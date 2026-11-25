// ─── api/storage.js ─────────────────────────────────────────────────────
// Tiny persistence layer (localStorage, fail-soft for private mode).
// Progress is a FULL mid-level snapshot (level, tubes, palette, restart
// arrangement, moves, undos, spare vessel, undo history) so a reload
// resumes exactly where the player left off. Old {level}-only saves still
// load — they just start a fresh deal on that level.

const PREFIX = "labsort/v1/";
// Pre-rebrand prefix — migrated once on first read, then removed.
const LEGACY_PREFIX = "chromaflow/v1/";

function read(key, fallback) {
  try {
    let raw = localStorage.getItem(PREFIX + key);
    if (raw == null) {
      raw = localStorage.getItem(LEGACY_PREFIX + key);
      if (raw != null) {
        try {
          localStorage.setItem(PREFIX + key, raw);
          localStorage.removeItem(LEGACY_PREFIX + key);
        } catch {
          /* storage unavailable — play on without saving */
        }
      }
    }
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable — play on without saving */
  }
}

export const api = {
  getProgress() {
    const p = read("progress", null);
    return p && typeof p.level === "number" ? p : { level: 1 };
  },
  setProgress(p) {
    write("progress", p);
  },
  getSettings() {
    return { sound: true, colorblind: false, seenWelcome: false, ...read("settings", {}) };
  },
  setSettings(s) {
    write("settings", { sound: true, colorblind: false, seenWelcome: false, ...read("settings", {}), ...s });
  },
};
