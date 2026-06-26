// grid.js — construction et rendu DOM de la grille de jeu.

import { S, $ } from './state.js';
import { THEME, COLS, ROWS, MOTIF, motifCSS } from './theme.js';
import { oriented, fits } from './tesselle.js';

let gridEl = null;

// Fond vide d'une case selon THEME.grid.emptyStyle ('opaque' par défaut).
const EMPTY_BG = {
  opaque: 'var(--line-soft)',
  translucent: 'rgba(37,41,52,.45)',
  transparent: 'transparent',
};
function emptyCellBg() { return EMPTY_BG[THEME.grid.emptyStyle] || EMPTY_BG.opaque; }

// Construit la grille. `onCell(r,c)` est appelé au clic sur une case.
// Si THEME.grid.bg est défini, la grille s'incruste dans l'illustration
// (THEME.grid.bgWindow = zone de jeu en pixels de l'image source).
export function buildGrid(onCell) {
  const wrap = $('boardWrap');
  wrap.innerHTML = '';

  wrap.style.setProperty('--cell-line', THEME.grid.lineColor || 'transparent');

  const bg = THEME.grid.bg;
  if (bg) {
    const frame = document.createElement('div'); frame.className = 'board-frame';
    const img = document.createElement('img'); img.className = 'board-bg'; img.alt = '';
    gridEl = document.createElement('div'); gridEl.id = 'grid'; gridEl.className = 'grid embedded';
    frame.append(img, gridEl);
    wrap.appendChild(frame);
    img.addEventListener('load', () => positionEmbeddedGrid(frame, img, gridEl));
    img.src = './' + bg;
  } else {
    gridEl = document.createElement('div'); gridEl.id = 'grid'; gridEl.className = 'grid';
    gridEl.style.aspectRatio = `${COLS} / ${ROWS}`;
    wrap.appendChild(gridEl);
  }

  gridEl.style.gridTemplateColumns = `repeat(${COLS},1fr)`;
  gridEl.style.gridTemplateRows = `repeat(${ROWS},1fr)`;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const d = document.createElement('div');
    d.className = 'cell';
    d.dataset.r = r; d.dataset.c = c;
    d.addEventListener('click', () => onCell(r, c));
    gridEl.appendChild(d);
  }
  paintGrid();
}

// Cale le cadre sur le ratio réel de l'image, puis positionne la grille
// (en %) sur la fenêtre de jeu définie par THEME.grid.bgWindow.
function positionEmbeddedGrid(frame, img, grid) {
  frame.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
  const w = THEME.grid.bgWindow;
  const pct = (n, total) => (n / total * 100) + '%';
  grid.style.left   = w ? pct(w.x, img.naturalWidth) : '0';
  grid.style.top    = w ? pct(w.y, img.naturalHeight) : '0';
  grid.style.right  = w ? pct(img.naturalWidth  - w.x - w.w, img.naturalWidth)  : '0';
  grid.style.bottom = w ? pct(img.naturalHeight - w.y - w.h, img.naturalHeight) : '0';
}

export function cellEl(r, c) { return gridEl.children[r * COLS + c]; }

export function paintCell(r, c) {
  const el = cellEl(r, c), m = S.grid[r][c];
  el.classList.toggle('filled', m != null);
  el.classList.toggle('smash', S.smash);
  if (m != null) {
    const motif = MOTIF(m);
    el.style.background = motifCSS(m);
    el.innerHTML = motif.img ? '' : `<span class="label">${motif.name[0]}</span>`;
  } else {
    el.style.background = emptyCellBg();
    el.innerHTML = '';
  }
}

export function paintGrid() {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) paintCell(r, c);
}

export function pop(r, c) {
  const el = cellEl(r, c);
  el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
}

export function clearGhost() {
  document.querySelectorAll('.cell.ghost,.cell.ghost-bad')
    .forEach(e => e.classList.remove('ghost', 'ghost-bad'));
}

// Dessine l'aperçu de pose pour `piece` ancré sur S.ghostCell (ou efface si null).
export function paintGhost(piece) {
  clearGhost();
  if (!piece || !S.ghostCell) return;
  const cells = oriented(piece, piece.rot).cells
    .map(([dr, dc]) => [S.ghostCell.r + dr, S.ghostCell.c + dc]);
  const ok = fits(cells);
  cells.forEach(([r, c]) => {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) cellEl(r, c).classList.add(ok ? 'ghost' : 'ghost-bad');
  });
}
