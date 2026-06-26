// patterns.js — motifs cachés du mode Histoire.
// Ajouter un type = ajouter une fonction ici + une entrée dans HINTS.
// Chaque fonction reçoit la grille (pleine) et renvoie les cases qui réalisent
// le motif, ou null. La grille est un tableau [rows][cols] de motifId|null.

import { ROWS, COLS } from './theme.js';

export const PATTERNS = {
  rowMono(g) {
    for (let r = 0; r < ROWS; r++) {
      const m = g[r][0]; if (m == null) continue;
      if (g[r].every(c => c === m)) return g[r].map((_, c) => [r, c]);
    }
    return null;
  },
  colMono(g) {
    for (let c = 0; c < COLS; c++) {
      const m = g[0][c]; if (m == null) continue;
      let ok = true;
      for (let r = 0; r < ROWS; r++) if (g[r][c] !== m) { ok = false; break; }
      if (ok) { const a = []; for (let r = 0; r < ROWS; r++) a.push([r, c]); return a; }
    }
    return null;
  },
  block2(g) {
    for (let r = 0; r < ROWS - 1; r++) for (let c = 0; c < COLS - 1; c++) {
      const m = g[r][c];
      if (m != null && g[r][c + 1] === m && g[r + 1][c] === m && g[r + 1][c + 1] === m)
        return [[r, c], [r, c + 1], [r + 1, c], [r + 1, c + 1]];
    }
    return null;
  },
  diag3(g) {
    for (let r = 0; r < ROWS - 2; r++) for (let c = 0; c < COLS - 2; c++) {
      const m = g[r][c];
      if (m != null && g[r + 1][c + 1] === m && g[r + 2][c + 2] === m)
        return [[r, c], [r + 1, c + 1], [r + 2, c + 2]];
    }
    for (let r = 0; r < ROWS - 2; r++) for (let c = 2; c < COLS; c++) {
      const m = g[r][c];
      if (m != null && g[r + 1][c - 1] === m && g[r + 2][c - 2] === m)
        return [[r, c], [r + 1, c - 1], [r + 2, c - 2]];
    }
    return null;
  },
};

export const HINTS = {
  rowMono: ['Cherche un alignement…', '…une rangée entière.', '…d\'une seule et même teinte.'],
  colMono: ['Cherche un alignement…', '…une colonne entière.', '…d\'une seule et même teinte.'],
  block2:  ['Cherche un regroupement…', '…un bloc compact.', '…un carré de 2×2 identique.'],
  diag3:   ['Cherche une oblique…', '…une diagonale.', '…trois tesselles identiques en diagonale.'],
};
