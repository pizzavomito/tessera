// atelier.js — emplacements de tesselles, glisser-déposer, boutons d'action.

import { S, $, setStatus } from './state.js';
import { MOTIF } from './theme.js';
import { oriented, fits, newPiece } from './tesselle.js';
import { cellEl, paintCell, pop, paintGhost, clearGhost } from './grid.js';
import { renderRes, updateActions } from './resources.js';
import { awardCharges, toggleSmash, convert, reroll } from './engine.js';
import { checkGrid } from './story.js';
import { openEditor } from './editor.js';

let drag = null;

export function renderAtelier() {
  const sl = $('slots'); sl.innerHTML = '';
  S.atelier.forEach((p, i) => {
    const b = document.createElement('button');
    b.className = 'slot';
    b.setAttribute('aria-pressed', String(S.activeSlot === i));
    b.appendChild(miniOf(p, 11));
    b.addEventListener('pointerdown', e => startDrag(e, i, b));
    sl.appendChild(b);
  });
  updateActions();
}

function miniOf(p, px) {
  const o = oriented(p, p.rot);
  const maxC = Math.max(...o.cells.map(c => c[1])) + 1;
  const maxR = Math.max(...o.cells.map(c => c[0])) + 1;
  const g = document.createElement('div'); g.className = 'mini';
  g.style.gridTemplateColumns = `repeat(${maxC},${px}px)`;
  const map = {}; o.cells.forEach(([r, c], k) => map[r + '_' + c] = o.motifs[k]);
  for (let r = 0; r < maxR; r++) for (let c = 0; c < maxC; c++) {
    const i = document.createElement('i'); const m = map[r + '_' + c];
    i.style.background = m == null ? 'transparent' : MOTIF(m).color;
    g.appendChild(i);
  }
  return g;
}

/* ---------- glisser-déposer (tactile + souris) ---------- */
function startDrag(e, i, el) {
  if (!S.atelier[i]) return;
  if (S.smash) toggleSmash();
  S.activeSlot = i; updateActions();
  document.querySelectorAll('.slot').forEach((s, k) => s.setAttribute('aria-pressed', String(k === i)));
  drag = { slot: i, piece: S.atelier[i], started: false, sx: e.clientX, sy: e.clientY, pid: e.pointerId, el, px: 24 };
  try { el.setPointerCapture(e.pointerId); } catch (_) {}
  el.addEventListener('pointermove', onDragMove);
  el.addEventListener('pointerup', onDragEnd);
  el.addEventListener('pointercancel', onDragEnd);
}

function onDragMove(e) {
  if (!drag) return;
  const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
  if (!drag.started) {
    if (Math.hypot(dx, dy) < 8) return;
    drag.started = true; drag.el.classList.add('dragging'); buildPreview();
  }
  e.preventDefault();
  movePreview(e.clientX, e.clientY);
  const cell = cellUnder(e.clientX, e.clientY);
  S.ghostCell = cell ? { r: cell.r, c: cell.c } : null;
  paintGhost(drag.piece);
}

function onDragEnd() {
  if (!drag) return;
  const el = drag.el;
  el.removeEventListener('pointermove', onDragMove);
  el.removeEventListener('pointerup', onDragEnd);
  el.removeEventListener('pointercancel', onDragEnd);
  try { el.releasePointerCapture(drag.pid); } catch (_) {}
  el.classList.remove('dragging');
  if (drag.started) {
    if (S.ghostCell) dropTesselle(drag.slot, S.ghostCell.r, S.ghostCell.c);
    else setStatus('Lâchée hors de la grille.');
    removePreview(); S.ghostCell = null; clearGhost();
  } else {
    const p = S.atelier[drag.slot];
    if (p) { p.rot = (p.rot + 1) % 4; renderAtelier(); }   // appui simple = pivoter
  }
  drag = null;
}

function cellUnder(x, y) {
  const t = document.elementFromPoint(x, y);
  if (t && t.classList.contains('cell')) return { r: +t.dataset.r, c: +t.dataset.c };
  return null;
}

function dropTesselle(slot, r, c) {
  const piece = S.atelier[slot];
  const o = oriented(piece, piece.rot);
  const target = o.cells.map(([dr, dc]) => [r + dr, c + dc]);
  if (!fits(target)) { setStatus('La tesselle ne rentre pas ici.'); return; }
  target.forEach(([rr, cc], k) => { S.grid[rr][cc] = o.motifs[k]; paintCell(rr, cc); pop(rr, cc); });
  S.atelier[slot] = newPiece();                 // toujours autant de tesselles
  renderAtelier(); awardCharges(); renderRes(); checkGrid();
}

/* ---------- aperçu flottant ---------- */
function buildPreview() {
  removePreview();
  const px = Math.max(18, Math.round(cellEl(0, 0).getBoundingClientRect().width));
  const o = oriented(drag.piece, drag.piece.rot);
  const maxC = Math.max(...o.cells.map(c => c[1])) + 1;
  const maxR = Math.max(...o.cells.map(c => c[0])) + 1;
  const wrap = document.createElement('div'); wrap.id = 'drag-preview';
  wrap.style.gridTemplateColumns = `repeat(${maxC},${px}px)`;
  wrap.style.gridTemplateRows = `repeat(${maxR},${px}px)`;
  wrap.style.gap = '4px';
  const map = {}; o.cells.forEach(([r, c], k) => map[r + '_' + c] = o.motifs[k]);
  for (let r = 0; r < maxR; r++) for (let c = 0; c < maxC; c++) {
    const i = document.createElement('i');
    if (map[r + '_' + c] == null) { i.style.background = 'transparent'; }
    else { i.style.background = MOTIF(map[r + '_' + c]).color; i.style.width = px + 'px'; i.style.height = px + 'px'; }
    wrap.appendChild(i);
  }
  drag.px = px; document.body.appendChild(wrap);
}
function movePreview(x, y) {
  const w = $('drag-preview'); if (!w) return;
  const h = (drag.px || 24) / 2;
  w.style.transform = `translate(${x - h}px, ${y - h}px)`;
}
function removePreview() { const w = $('drag-preview'); if (w) w.remove(); }

/* ---------- câblage des boutons d'action ---------- */
export function initAtelierActions() {
  $('smashBtn').addEventListener('click', toggleSmash);
  $('convBtn').addEventListener('click', convert);
  $('rerollBtn').addEventListener('click', reroll);
  $('modBtn').addEventListener('click', () => {
    if (S.activeSlot == null || totalEclatsGuard() <= 0) return;
    openEditor('modify', S.atelier[S.activeSlot]);
  });
  $('createBtn').addEventListener('click', () => openEditor('create', null));
}
// petit garde pour éviter d'importer totalEclats deux fois
function totalEclatsGuard() { return S.eclats.reduce((a, b) => a + b, 0); }
