// grid.js — construction et rendu DOM de la grille de jeu.

import { S, $ } from './state.js';
import { COLS, ROWS, MOTIF } from './theme.js';
import { oriented, fits } from './tesselle.js';

let gridEl = null;

// Construit la grille. `onCell(r,c)` est appelé au clic sur une case.
export function buildGrid(onCell) {
  gridEl = $('grid');
  gridEl.style.gridTemplateColumns = `repeat(${COLS},1fr)`;
  gridEl.style.gridTemplateRows = `repeat(${ROWS},1fr)`;
  gridEl.style.aspectRatio = `${COLS} / ${ROWS}`;
  gridEl.innerHTML = '';
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const d = document.createElement('div');
    d.className = 'cell';
    d.dataset.r = r; d.dataset.c = c;
    d.addEventListener('click', () => onCell(r, c));
    gridEl.appendChild(d);
  }
  paintGrid();
}

export function cellEl(r, c) { return gridEl.children[r * COLS + c]; }

export function paintCell(r, c) {
  const el = cellEl(r, c), m = S.grid[r][c];
  el.classList.toggle('filled', m != null);
  el.classList.toggle('smash', S.smash);
  if (m != null) {
    el.style.background = MOTIF(m).color;
    el.innerHTML = `<span class="label">${MOTIF(m).name[0]}</span>`;
  } else {
    el.style.background = '';
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
