// resources.js — rendu de la barre de ressources et activation des actions.

import { S, $, totalEclats } from './state.js';
import { THEME, MOTIF, motifCSS } from './theme.js';

export function renderRes() {
  renderEclatCubes();
  $('valE').textContent = totalEclats();
  cubes('cubesC', S.charges); $('valC').textContent = S.charges;
  cubes('cubesS', S.essence); $('valS').textContent = S.essence;
  updateActions();
}

// Éclats : un cube par éclat, de la couleur du motif.
export function renderEclatCubes() {
  const box = $('cubesE'); box.innerHTML = '';
  const list = [];
  S.eclats.forEach((n, m) => { for (let k = 0; k < n; k++) list.push(m); });
  const cap = THEME.rules.cubesShown;
  if (list.length === 0) {
    for (let i = 0; i < 3; i++) { const d = document.createElement('div'); d.className = 'cube'; box.appendChild(d); }
    return;
  }
  list.slice(0, cap).forEach(m => {
    const d = document.createElement('div');
    d.className = 'cube on';
    d.style.background = motifCSS(m);
    d.style.borderColor = MOTIF(m).color;
    box.appendChild(d);
  });
}

export function cubes(id, n) {
  const box = $(id), max = THEME.rules.cubesShown; box.innerHTML = '';
  const shown = Math.min(n, max);
  for (let i = 0; i < max; i++) {
    const d = document.createElement('div');
    d.className = 'cube' + (i < shown ? ' on' : '');
    box.appendChild(d);
  }
}

export function updateActions() {
  const c = THEME.rules.costs;
  $('smashBtn').disabled  = S.charges < 1;
  $('convBtn').disabled   = totalEclats() < THEME.rules.essenceFromEclats;
  $('rerollBtn').disabled = !(S.activeSlot != null && S.charges >= c.reroll.charges);
  $('modBtn').disabled    = !(S.activeSlot != null && totalEclats() > 0);
  $('createBtn').disabled = !(S.essence >= c.create.essence && totalEclats() > 0);
}
