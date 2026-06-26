// tesselle.js — géométrie des tesselles (polyominos).
// Une tesselle : { cells:[[r,c],...], motifs:[motifId,...], rot }.

import { THEME, ROWS, COLS, rnd, rndMotif } from './theme.js';
import { S } from './state.js';

// Pioche un modèle dans THEME.shapes et lui attribue un motif aléatoire par case.
export function newPiece() {
  const base = THEME.shapes[rnd(THEME.shapes.length)];
  return {
    cells: base.cells.map(c => c.slice()),
    motifs: base.cells.map(() => rndMotif()),
    rot: 0,
  };
}

// Renvoie la tesselle après `rot` rotations de 90°, renormalisée en haut-gauche.
export function oriented(piece, rot) {
  let cells = piece.cells.map(c => c.slice());
  for (let i = 0; i < ((rot % 4) + 4) % 4; i++) cells = cells.map(([r, c]) => [c, -r]);
  const minR = Math.min(...cells.map(c => c[0]));
  const minC = Math.min(...cells.map(c => c[1]));
  cells = cells.map(([r, c]) => [r - minR, c - minC]);
  return { cells, motifs: piece.motifs.slice() };
}

// Les cases (absolues) rentrent-elles dans la grille et sur des cases vides ?
export function fits(cells) {
  return cells.every(([r, c]) => r >= 0 && r < ROWS && c >= 0 && c < COLS && S.grid[r][c] == null);
}
