// editor.js — éditeur de tesselle.
// Les éclats sont la peinture : chaque case colorée = 1 éclat de sa couleur.
// modify : forme verrouillée (recoloration). create : forme libre + 1 essence.

import { S, $, setStatus } from './state.js';
import { THEME, MOTIF, NM } from './theme.js';
import { oriented } from './tesselle.js';
import { renderAtelier } from './atelier.js';
import { renderRes } from './resources.js';

const ED = 4;
let editorState = null;

export function openEditor(kind, piece) {
  const locked = kind === 'modify';
  const shapeMask = Array.from({ length: ED }, () => Array(ED).fill(!locked));
  const cells = Array.from({ length: ED }, () => Array(ED).fill(null));
  if (locked && piece) {
    shapeMask.forEach(row => row.fill(false));
    oriented(piece, piece.rot).cells.forEach(([r, c]) => { if (r < ED && c < ED) shapeMask[r][c] = true; });
  }
  editorState = { kind, locked, shapeMask, cells, color: firstAvailColor() };
  $('editTitle').textContent = locked ? 'Recolorer la tesselle' : 'Créer une tesselle';
  $('pkHint').textContent = locked
    ? 'Peins chaque case avec tes éclats (1 case = 1 éclat de cette couleur).'
    : '1 essence ❖ + 1 éclat par case. Touche pour peindre / effacer.';
  renderEditor();
  $('editVeil').classList.remove('hidden');
}

export function initEditor() {
  $('editCancel').addEventListener('click', () => $('editVeil').classList.add('hidden'));
  $('editOk').addEventListener('click', confirmEditor);
}

function firstAvailColor() { for (let m = 0; m < NM; m++) if (S.eclats[m] > 0) return m; return 0; }
function usedInEditor(m) { let n = 0; editorState.cells.forEach(row => row.forEach(v => { if (v === m) n++; })); return n; }
function availOf(m) { return S.eclats[m] - usedInEditor(m); }
function editorCost() {
  const per = Array(NM).fill(0); let total = 0;
  editorState.cells.forEach(row => row.forEach(v => { if (v != null) { per[v]++; total++; } }));
  return { per, total };
}
function affordable(per) { return per.every((n, m) => n <= S.eclats[m]); }
function lockedAllFilled() {
  if (!editorState.locked) return true;
  for (let r = 0; r < ED; r++) for (let c = 0; c < ED; c++)
    if (editorState.shapeMask[r][c] && editorState.cells[r][c] == null) return false;
  return true;
}

function renderEditor() {
  const ed = $('editor'); ed.style.gridTemplateColumns = `repeat(${ED},32px)`; ed.innerHTML = '';
  for (let r = 0; r < ED; r++) for (let c = 0; c < ED; c++) {
    const b = document.createElement('button'); b.className = 'ecell';
    if (!editorState.shapeMask[r][c]) { b.classList.add('void'); }
    else {
      if (editorState.locked) b.classList.add('lock');
      const v = editorState.cells[r][c];
      if (v != null) b.style.background = MOTIF(v).color;
      b.addEventListener('click', () => paintEditorCell(r, c));
    }
    ed.appendChild(b);
  }

  const pk = $('picker'); pk.innerHTML = '';
  THEME.motifs.forEach(m => {
    const b = document.createElement('button'); b.className = 'pk'; b.style.background = m.color;
    b.setAttribute('aria-pressed', String(m.id === editorState.color));
    b.disabled = S.eclats[m.id] === 0;
    b.innerHTML = `<b>${availOf(m.id)}</b>`;
    b.addEventListener('click', () => { if (b.disabled) return; editorState.color = m.id; renderEditor(); });
    pk.appendChild(b);
  });

  const need = editorCost();
  let label, okBtn;
  if (editorState.locked) {
    okBtn = lockedAllFilled() && affordable(need.per);
    label = `Coût : ${need.total} éclat${need.total > 1 ? 's' : ''}` + (lockedAllFilled() ? '' : ' · colore toutes les cases');
  } else {
    okBtn = need.total > 0 && S.essence >= THEME.rules.costs.create.essence && affordable(need.per);
    label = `Coût : 1 essence ❖ + ${need.total} éclat${need.total > 1 ? 's' : ''}`;
  }
  $('editCost').textContent = label;
  $('editOk').disabled = !okBtn;
}

function paintEditorCell(r, c) {
  if (!editorState.shapeMask[r][c]) return;
  const sel = editorState.color, cur = editorState.cells[r][c];
  if (!editorState.locked && cur === sel) { editorState.cells[r][c] = null; renderEditor(); return; }
  const free = S.eclats[sel] - (usedInEditor(sel) - (cur === sel ? 1 : 0));
  if (free <= 0) { setStatus(`Plus d'éclat ${MOTIF(sel).name}.`); return; }
  editorState.cells[r][c] = sel; renderEditor();
}

function confirmEditor() {
  const filled = [];
  for (let r = 0; r < ED; r++) for (let c = 0; c < ED; c++)
    if (editorState.cells[r][c] != null) filled.push([r, c, editorState.cells[r][c]]);
  if (filled.length === 0) { setStatus('La tesselle est vide.'); return; }
  const need = editorCost();
  if (!affordable(need.per)) { setStatus('Pas assez d\'éclats.'); return; }
  if (editorState.locked && !lockedAllFilled()) { setStatus('Colore toutes les cases.'); return; }
  if (!editorState.locked && S.essence < THEME.rules.costs.create.essence) { setStatus('Il faut 1 essence.'); return; }

  need.per.forEach((n, m) => { S.eclats[m] -= n; });
  if (!editorState.locked) S.essence -= THEME.rules.costs.create.essence;

  const minR = Math.min(...filled.map(f => f[0])), minC = Math.min(...filled.map(f => f[1]));
  const piece = {
    cells: filled.map(f => [f[0] - minR, f[1] - minC]),
    motifs: filled.map(f => f[2]),
    rot: 0,
  };
  const slot = (S.activeSlot != null) ? S.activeSlot : 0;
  S.atelier[slot] = piece;

  $('editVeil').classList.add('hidden');
  renderAtelier(); renderRes();
  setStatus(editorState.locked ? 'Tesselle recolorée ✎' : 'Tesselle créée ＋');
}
