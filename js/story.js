// story.js — mode Histoire : motif caché, indices progressifs, déblocages.

import { S, $, setStatus } from './state.js';
import { STORY, ROWS, COLS } from './theme.js';
import { PATTERNS, HINTS } from './patterns.js';
import { cellEl, paintGrid } from './grid.js';
import { renderAtelier } from './atelier.js';
import { renderRes } from './resources.js';
import { newPiece } from './tesselle.js';

function chapters() { return (STORY && STORY.chapters) || []; }
function gridFull() { return S.grid.every(row => row.every(c => c != null)); }

export function checkGrid() {
  if (S.mode !== 'histoire' || !gridFull()) return;
  const entry = chapters()[S.storyIdx];
  if (!entry) { setStatus('Fin du récit — plus de chapitre.'); return; }
  const hit = PATTERNS[entry.pattern.type](S.grid);
  if (hit) {
    revealStory(entry, hit);
  } else {
    const max = HINTS[entry.pattern.type].length;
    S.hintLevel = Math.min(S.hintLevel + 1, max);
    setStatus('Grille pleine, motif absent. Indice : ' + (HINTS[entry.pattern.type][S.hintLevel - 1] || ''));
  }
}

function revealStory(entry, cells) {
  cells.forEach(([r, c]) => cellEl(r, c).classList.add('hintglow'));
  setTimeout(() => {
    $('storyTitle').textContent = entry.unlock.title;
    $('storyText').textContent = entry.unlock.text;
    // futur : entry.unlock.img -> remplacer le placeholder #storyArt
    $('storyVeil').classList.remove('hidden');
  }, 520);
}

export function initStory() {
  $('storyNext').addEventListener('click', () => {
    $('storyVeil').classList.add('hidden');
    S.storyIdx++; S.hintLevel = 0;                       // ressources conservées
    S.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    S.rowDone = Array(ROWS).fill(false);
    S.colDone = Array(COLS).fill(false);
    S.atelier = S.atelier.map(() => newPiece());
    S.activeSlot = null;
    paintGrid(); renderAtelier(); renderRes();
    setStatus(chapters()[S.storyIdx] ? 'Nouveau chapitre — nouveau motif caché.' : 'Fin du récit — bravo !');
  });
}
