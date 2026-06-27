// engine.js — règles cœur : interaction grille, charges, marteau, économie.

import { S, setStatus, totalEclats } from './state.js';
import { ROWS, COLS, MOTIF, THEME } from './theme.js';
import { paintGrid, paintCell, pop } from './grid.js';
import { newPiece } from './tesselle.js';
import { renderRes } from './resources.js';
import { renderAtelier } from './atelier.js';

// Clic sur une case (modes Détente et marteau).
export function onCell(r, c) {
  if (S.mode === 'detente') { S.grid[r][c] = S.palMotif; paintCell(r, c); pop(r, c); return; }
  if (S.smash) { smashAt(r, c); return; }
}

// Charges : +1 par ligne/colonne complétée, une seule fois chacune.
export function awardCharges() {
  let got = 0;
  for (let r = 0; r < ROWS; r++)
    if (!S.rowDone[r] && S.grid[r].every(c => c != null)) { S.rowDone[r] = true; got++; }
  for (let c = 0; c < COLS; c++) {
    if (S.colDone[c]) continue;
    let full = true;
    for (let r = 0; r < ROWS; r++) if (S.grid[r][c] == null) { full = false; break; }
    if (full) { S.colDone[c] = true; got++; }
  }
  if (got > 0) { S.charges += got; setStatus(`+${got} charge${got > 1 ? 's' : ''} de marteau 🔨`); }
}

export function toggleSmash() {
  if (S.charges < 1 && !S.smash) { setStatus('Pas de charge de marteau.'); return; }
  S.smash = !S.smash;
  document.getElementById('resSmash').classList.toggle('smashon', S.smash);
  paintGrid();
  setStatus(S.smash ? 'Touche une case à détruire 🔨' : '');
}

// Marteau : détruit une case → +1 éclat de sa couleur, −1 charge.
export function smashAt(r, c) {
  const m = S.grid[r][c];
  if (m == null) return;
  if (S.charges < 1) { setStatus('Pas de charge.'); return; }
  S.charges--; S.eclats[m]++; S.grid[r][c] = null;
  paintCell(r, c); pop(r, c);
  S.smash = false;
  document.getElementById('resSmash').classList.remove('smashon');
  paintGrid(); renderRes();
  setStatus(`Case brisée · +1 éclat ${MOTIF(m).name} ✦`);
}

// Dépense 2 éclats (pris dans les plus grosses piles) pour préserver les couleurs rares.
export function spendTwoEclats() {
  for (let i = 0; i < 2; i++) {
    let best = -1;
    S.eclats.forEach((n, m) => { if (n > 0 && (best < 0 || n > S.eclats[best])) best = m; });
    if (best >= 0) S.eclats[best]--;
  }
}

export function convert() {
  if (totalEclats() < THEME.rules.essenceFromEclats) return;
  spendTwoEclats(); S.essence++;
  renderRes(); setStatus('+1 essence ❖');
}

export function reroll() {
  const cost = THEME.rules.costs.reroll;
  if (S.activeSlot == null || S.charges < cost.charges) return;
  S.charges -= cost.charges;
  S.atelier[S.activeSlot] = newPiece();
  renderAtelier(); renderRes(); setStatus('Tesselle refaite ↻');
}
