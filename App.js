import { React, html } from "./lib/react.js";
import TopBar from "./components/TopBar.js";
import Board from "./components/Board.js";
import ActionBar from "./components/ActionBar.js";
import { WinModal, WelcomeModal } from "./components/Modals.js";
import {
  CAPACITY,
  UNDOS_PER_LEVEL,
  displayColor,
  levelConfig,
  generatePuzzle,
} from "./game/levels.js";
import {
  applyPour,
  isWon,
  isBottleDone,
  completedCount,
} from "./game/engine.js";
import { api } from "./api/storage.js";
import { sfx, setSoundEnabled } from "./api/sound.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function freshDeal(levelNum, seed) {
  const cfg = levelConfig(levelNum);
  const { bottles, palette } = generatePuzzle(cfg.colors, cfg.empties, seed);
  return { level: levelNum, cfg, bottles, palette, seed, initial: bottles.map((b) => [...b]) };
}

const DEFAULT_STATUS = "Select a tube to lift and pour matching pigments.";

function snapToDeal(snap) {
  return {
    level: snap.level,
    cfg: levelConfig(snap.level),
    bottles: snap.bottles.map((b) => [...b]),
    palette: snap.palette,
    seed: Date.now(),
    initial: snap.initial.map((b) => [...b]),
  };
}

export default function App() {
  const boot = React.useMemo(() => {
    const p = api.getProgress();
    if (p && Array.isArray(p.bottles) && Array.isArray(p.palette) && Array.isArray(p.initial)) return { snap: p };
    return { level: Math.max(1, (p && p.level) || 1) };
  }, []);
  const savedSettings = React.useMemo(() => api.getSettings(), []);
  const bootDeal = React.useMemo(
    () => (boot.snap ? snapToDeal(boot.snap) : freshDeal(boot.level, Date.now())),
    []
  );
  const [deal, setDeal] = React.useState(bootDeal);
  const [bottles, setBottles] = React.useState(() => bootDeal.bottles.map((b) => [...b]));
  const [palette, setPalette] = React.useState(bootDeal.palette);
  const [history, setHistory] = React.useState(() =>
    boot.snap && Array.isArray(boot.snap.history) ? boot.snap.history.map((b) => [...b]) : []
  );
  const [selected, setSelected] = React.useState(null);
  const [moves, setMoves] = React.useState(() => (boot.snap && boot.snap.moves) || 0);
  const [undosLeft, setUndosLeft] = React.useState(() =>
    boot.snap && boot.snap.undosLeft != null ? boot.snap.undosLeft : UNDOS_PER_LEVEL
  );
  const [extraUsed, setExtraUsed] = React.useState(() => !!(boot.snap && boot.snap.extraUsed));
  const [welcomeLevel, setWelcomeLevel] = React.useState(boot.snap ? boot.snap.level : boot.level);
  const [preview, setPreview] = React.useState(() =>
    freshDeal(boot.snap ? boot.snap.level : boot.level, Date.now())
  );
  const [busy, setBusy] = React.useState(false);
  const [pour, setPour] = React.useState(null); // { from, to, transform, slosh }
  const [stream, setStream] = React.useState(null); // { d, stroke }
  const [toast, setToast] = React.useState(null);
  const [won, setWon] = React.useState(false);
  const [sound, setSound] = React.useState(savedSettings.sound !== false);
  const [colorblind, setColorblind] = React.useState(savedSettings.colorblind === true);
  const [showWelcome, setShowWelcome] = React.useState(true);
  const toastTimer = React.useRef(null);

  const level = deal.level;
  const colorCount = deal.cfg.colors;

  React.useEffect(() => {
    setSoundEnabled(sound);
    api.setSettings({ sound, colorblind });
  }, [sound, colorblind]);

  function toggleColorblind() {
    const next = !colorblind;
    setColorblind(next);
    sfx.select(next);
    say(next ? "Colorblind mode ON — match the symbols" : "Colorblind mode OFF");
  }

  function startFromWelcome() {
    api.setSettings({ seenWelcome: true });
    const prog = api.getProgress();
    if (prog && prog.bottles && prog.level === welcomeLevel && !isWon(prog.bottles)) {
      applyDeal(snapToDeal(prog), prog);
      say(`Resumed Level ${welcomeLevel}.`);
    } else {
      applyDeal(preview);
    }
    setShowWelcome(false);
    sfx.select(true);
  }

  function pickWelcomeLevel(n) {
    if (n < 1 || n === welcomeLevel) return;
    sfx.select(n > welcomeLevel);
    setWelcomeLevel(n);
    setPreview(freshDeal(n, Date.now()));
  }

  function goHome() {
    if (busy) return;
    sfx.select(false);
    setSelected(null);
    setWelcomeLevel(level);
    setPreview(freshDeal(level, Date.now()));
    setShowWelcome(true);
  }

  function say(msg, ms = 1800) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), ms);
  }

  // Persist the full mid-level snapshot after every render that changed
  // game state, so a reload resumes exactly (tubes, moves, undos, spare).
  React.useEffect(() => {
    api.setProgress({
      level, bottles, palette, initial: deal.initial,
      moves, undosLeft, extraUsed, history,
    });
  });

  function applyDeal(d, st = {}) {
    setDeal(d);
    setBottles(d.bottles.map((b) => [...b]));
    setPalette(d.palette);
    setHistory((st.history || []).map((b) => [...b]));
    setSelected(null);
    setMoves(st.moves || 0);
    setUndosLeft(st.undosLeft != null ? st.undosLeft : UNDOS_PER_LEVEL);
    setExtraUsed(!!st.extraUsed);
    setBusy(false);
    setPour(null);
    setStream(null);
    setWon(false);
  }

  function loadLevel(levelNum, seed = Date.now()) {
    applyDeal(freshDeal(levelNum, seed));
  }

  function restartLevel() {
    if (busy) return;
    sfx.select(false);
    setBottles(deal.initial.map((b) => [...b]));
    setHistory([]);
    setSelected(null);
    setMoves(0);
    setUndosLeft(UNDOS_PER_LEVEL);
    setExtraUsed(false);
    say("Tubes reset to initial arrangement.");
  }

  function undoMove() {
    if (busy || won) return;
    if (history.length === 0) {
      say("No previous moves to undo");
      sfx.error();
      return;
    }
    if (undosLeft <= 0) {
      say("No undos remaining for this study.");
      sfx.error();
      return;
    }
    setBottles(history[history.length - 1]);
    setHistory(history.slice(0, -1));
    setSelected(null);
    setUndosLeft((n) => n - 1);
    sfx.select(false);
    say("Reverted last pour.");
  }

  function addExtraTube() {
    if (busy || won) return;
    if (extraUsed) {
      say("Spare vessel already placed on shelf.");
      sfx.error();
      return;
    }
    setHistory([...history, bottles]);
    setBottles([...bottles, []]);
    setExtraUsed(true);
    setSelected(null);
    sfx.tubeDone();
    say("Added one empty spare vessel.");
  }

  function shake(idx) {
    sfx.error();
    const el = document.querySelector(`.tube-wrapper[data-index="${idx}"]`);
    if (el) {
      el.classList.remove("shake");
      void el.offsetWidth;
      el.classList.add("shake");
    }
  }

  function pick(i) {
    if (busy || won) return;
    sfx.init();
    const clicked = bottles[i];

    if (selected == null) {
      if (clicked.length === 0) {
        shake(i);
        say("That tube is empty.");
        return;
      }
      if (isBottleDone(clicked)) {
        shake(i);
        say("That tube is already sealed.");
        return;
      }
      setSelected(i);
      sfx.select(true);
      say(`Selected ${palette[clicked[clicked.length - 1]].name}. Choose a destination.`);
      return;
    }
    if (selected === i) {
      setSelected(null);
      sfx.select(false);
      say("Tube returned to rack.");
      return;
    }
    const res = applyPour(bottles, selected, i);
    if (!res) {
      shake(i);
      const dst = bottles[i];
      if (dst.length >= CAPACITY) say("Destination tube is already full.");
      else say("Only matching top pigments can be combined.");
      setSelected(null);
      return;
    }
    void executeAnimatedPour(selected, i, res.amount);
  }

  async function executeAnimatedPour(srcIdx, dstIdx, count) {
    setBusy(true);
    setHistory([...history, bottles]);

    const srcEl = document.querySelector(`.tube-wrapper[data-index="${srcIdx}"]`);
    const dstEl = document.querySelector(`.tube-wrapper[data-index="${dstIdx}"]`);
    const srcTube = bottles[srcIdx];
    const pourColor = displayColor(palette[srcTube[srcTube.length - 1]], colorblind);

    const srcRect = srcEl.getBoundingClientRect();
    const dstRect = dstEl.getBoundingClientRect();
    const pourFromLeft = srcRect.left < dstRect.left;
    const tiltAngle = pourFromLeft ? 56 : -56;

    const targetMouthX = dstRect.left + dstRect.width / 2;
    const targetMouthY = dstRect.top - 10;
    const srcCenterX = srcRect.left + srcRect.width / 2;
    const srcCenterY = srcRect.top + srcRect.height / 2;
    const spoutOffsetX = (pourFromLeft ? -1 : 1) * srcRect.width;
    const moveX = targetMouthX + spoutOffsetX - srcCenterX;
    const moveY = targetMouthY - 20 - srcCenterY;

    setSelected(null);
    setPour({ from: srcIdx, to: dstIdx, transform: `translate(${moveX}px, ${moveY}px) rotate(${tiltAngle}deg)`, slosh: false });
    sfx.pour(count);
    await sleep(250);

    // Stream from the tilted spout into the target mouth.
    const upd = srcEl.getBoundingClientRect();
    const spoutX = pourFromLeft ? upd.right - 11 : upd.left + 11;
    const spoutY = upd.top + 16;
    const ratio = (bottles[dstIdx].length + count * 0.5) / CAPACITY;
    const streamEndY = dstRect.bottom - 12 - dstRect.height * 0.8 * ratio;
    const ctrlX = (spoutX + targetMouthX) / 2;
    setStream({
      d: `M ${spoutX} ${spoutY} Q ${ctrlX} ${spoutY - 6} ${targetMouthX} ${streamEndY}`,
      stroke: pourColor.mid,
    });
    setPour((p) => (p ? { ...p, slosh: true } : p));

    const next = bottles.map((b) => [...b]);
    for (let k = 0; k < count; k++) next[dstIdx].push(next[srcIdx].pop());
    setBottles(next);
    setMoves((m) => m + 1);
    await sleep(320);

    setStream(null);
    setPour((p) => (p ? { ...p, transform: "" } : p));
    await sleep(270);
    setPour(null);

    if (isBottleDone(next[dstIdx])) {
      sfx.tubeDone();
      spawnSparkles(dstRect, pourColor.top);
      say(`${palette[next[dstIdx][0]].name} tube sealed.`);
    } else if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
      setToast(null);
    }
    setBusy(false);

    if (isWon(next)) {
      setTimeout(() => {
        sfx.win();
        setWon(true);
      }, 360);
    }
  }

  function spawnSparkles(rect, colorHex) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colors = [colorHex, "#e9c46a", "#ffffff", "#90be6d"];
    for (let i = 0; i < 22; i++) {
      const p = document.createElement("div");
      p.className = "sparkle-particle";
      const angle = (Math.PI * 2 * i) / 22 + Math.random() * 0.3;
      const dist = 45 + Math.random() * 65;
      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;
      p.style.backgroundColor = colors[i % colors.length];
      p.style.boxShadow = `0 0 8px ${colors[i % colors.length]}`;
      p.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      p.style.setProperty("--dy", `${Math.sin(angle) * dist - 20}px`);
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 800);
    }
  }

  const doneCount = completedCount(bottles);
  const liveProgress = api.getProgress() || {};
  const resumable = !!liveProgress.bottles && liveProgress.level === welcomeLevel;
  const legendPalette = resumable ? liveProgress.palette : preview.palette;

  return html`
    <div class="app">
      <div class="ambient-orb orb-a"></div>
      <div class="ambient-orb orb-b"></div>
      <div class="ambient-orb orb-c"></div>

      <${TopBar}
        level=${level}
        moves=${moves}
        sealed=${doneCount}
        totalColors=${colorCount}
        onPrev=${() => level > 1 && loadLevel(level - 1)}
        onNext=${() => loadLevel(level + 1)}
        onHome=${goHome}
      />

      <div class="toast-banner show">
        <div class="toast-text">${toast || DEFAULT_STATUS}</div>
      </div>

      <main class="arena-wrap">
        <${Board}
          bottles=${bottles}
          palette=${palette}
          selected=${selected}
          pour=${pour}
          onPick=${pick}
          disabled=${busy || won || showWelcome}
          colorblind=${colorblind}
        />
      </main>

      <${ActionBar}
        undosLeft=${undosLeft}
        canUndo=${history.length > 0 && undosLeft > 0 && !busy && !won}
        extraLeft=${extraUsed ? 0 : 1}
        canExtra=${!extraUsed && !busy && !won}
        sound=${sound}
        colorblind=${colorblind}
        onUndo=${undoMove}
        onExtra=${addExtraTube}
        onRestart=${restartLevel}
        onToggleSound=${() => {
          const next = !sound;
          setSound(next);
          if (next) sfx.select(true);
        }}
        onToggleColorblind=${toggleColorblind}
      />

      <svg id="fx-layer" width="100%" height="100%">
        <defs>
          <filter id="liquid-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        ${stream && html`<path d=${stream.d} fill="none" stroke=${stream.stroke}
          stroke-width="5.5" stroke-linecap="round" filter="url(#liquid-glow)" opacity="0.94" />`}
      </svg>

      <${WinModal}
        open=${won}
        level=${level}
        moves=${moves}
        onNext=${() => loadLevel(level + 1)}
      />

      <${WelcomeModal}
        open=${showWelcome}
        welcomeLevel=${welcomeLevel}
        resume=${resumable}
        legendPalette=${legendPalette}
        colorblind=${colorblind}
        onPickLevel=${pickWelcomeLevel}
        onToggleColorblind=${toggleColorblind}
        onStart=${startFromWelcome}
      />
    </div>
  `;
}
