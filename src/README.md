# LabSort — Liquid Sorting Puzzle

React (18 + htm, no build step) liquid-sorting puzzle in a calm
apothecary-lab theme: U-shaped glass vials on wooden racks, cork stoppers
for sealed vials, serif level header, circular action bar. Pour matching
pigments until every vial holds a single one.

## File map

```
index.html              mount point + fonts + src/main.js entry
main.pjs                $meta only (title/description/tags)
src/
  main.js               React entry — mounts <App/>
  App.js                game state + pour animation + win flow + status whisper + snapshot save/restore + welcome level picker
  styles.css            LabSort lab theme: paper grain, vials, shelves, cork, dock, modals, full-screen welcome
  lib/react.js          React + htm binding helper (`html` templates)
  game/
    levels.js           pigments (LabSort gouache set + cb symbols/hues), CB_COLORS, ladder, generatePuzzle (shuffle + solver proof)
    engine.js           group-pour rules + DFS solver + win detection
  api/
    storage.js          localStorage: FULL mid-level snapshot (tubes, palette, moves, undos, spare, history) + settings
    sound.js            WebAudio synth SFX (select, pour arpeggio, chimes, fanfare)
  components/
    icons.js            inline SVG icon set (no emoji): flask, undo, plus, restart, sound, chevrons, check, eye, home, up
    symbols.js          designed colorblind pigment marks (one SVG glyph per pigment) + spoken shape names
    TopBar.js           editorial header: home-brand / level nav / pigments left, moves + sealed right
    ActionBar.js        tactile dock: undo / restart / +vessel / sound / colorblind
    Board.js            two-row arena, each row on a wooden shelf-ledge
    TubeView.js         glass vial: rim, reflection, tick marks, liquid layers (+cb symbols), cork stopper
    Modals.js           WinModal (eyebrow, serif title, moves, continue) + WelcomeModal (apothecary header, showcase vessels, 3 steps, legend, cb switch, level picker)
```

## Rules

- Tap a tube to lift it, tap another to pour. Liquid only flows onto the
  **same pigment** (or into an empty tube). Tubes hold max **4** units.
- The whole connected group pours **together**, up to the space available.
- Seal every pigment into its own tube to win — sealed tubes get a cork.
  Every deal is guaranteed winnable (proven by the built-in solver at deal
  time). Deals also pick hue-spaced pigment sets, so a level never packs
  same-spectrum neighbors together.
- 5 undos and 1 spare vessel per level. Ladder: L1:3, L2:4, L3-4:5, L5-7:6,
  L8-11:7, L12-15:8, L16+:9 pigments (matches the LabSort reference).
- Progress is saved automatically as a full mid-level snapshot — reload
  (or close and reopen) to resume the exact tube arrangement, move count,
  undos and spare vessel. The header brand doubles as a home button back
  to the welcome screen.

## Accessibility

- A full-screen welcome opens on every launch (apothecary header, showcase
  vessels, 3-step legend) with a starting-level picker (Start/Resume),
  colorblind-mode switch, and per-level pigment legend when CB is on.
- Colorblind mode (eye button in the dock, persisted in settings): every
  liquid gets a designed shape mark (circle, hexagon, star, square, plus,
  moon, triangle, diamond, heart — custom SVG in `components/symbols.js`),
  shown on each tube layer and in a welcome-screen legend, plus a
  high-distinction Okabe-Ito-inspired remap with separated lightness steps
  — color is never the only signal.
  Tube aria-labels also announce pigment names + shape names.

## Conventions

- ESM imports; `src/` files reference each other relatively; CDN deps are
  full `esm.sh` URLs (no import map). Google Fonts via `<link>`.
- `htm` templates instead of a JSX compiler (zero build).
- `game/` stays pure and UI-free; side effects only in `api/` and `App.js`.
