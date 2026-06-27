// resources.js — rendu de la barre de ressources et activation des actions.

import { S, $, totalEclats } from './state.js';
import { THEME, MOTIF, motifCSS } from './theme.js';

export function renderRes() {
  renderEclatCubes();
  renderEclatZoom();
  $('valC').textContent = S.charges;
  $('valS').textContent = S.essence;
  updateActions();
}

// Éclats : un cube par éclat (couleur du motif), complété de cases vides
// jusqu'à cubesShown pour que la jauge remplisse l'espace disponible.
export function renderEclatCubes() {
  const box = $('cubesE'); box.innerHTML = '';
  const list = [];
  S.eclats.forEach((n, m) => { for (let k = 0; k < n; k++) list.push(m); });
  const cap = THEME.rules.cubesShown;
  for (let i = 0; i < cap; i++) {
    const d = document.createElement('div');
    if (i < list.length) {
      const m = list[i];
      d.className = 'cube on';
      d.style.background = motifCSS(m);
      d.style.borderColor = MOTIF(m).color;
    } else {
      d.className = 'cube';
    }
    box.appendChild(d);
  }
}

// Loupe : une tuile agrandie par motif détenu, avec sa quantité.
function renderEclatZoom() {
  const box = $('cubesZoom'); box.innerHTML = '';
  S.eclats.forEach((n, m) => {
    if (n <= 0) return;
    const d = document.createElement('div'); d.className = 'zoom-tile';
    d.style.background = motifCSS(m);
    const b = document.createElement('b'); b.textContent = n;
    d.appendChild(b);
    box.appendChild(d);
  });
}

// Loupe : ouverte au survol (souris) et à l'appui (tactile — :active seul
// n'est pas fiable sur mobile pour un élément sans handler, donc Pointer Events).
export function initEclatZoom() {
  const el = document.querySelector('.res.ec');
  const open = () => el.classList.add('zoom-open');
  const close = () => el.classList.remove('zoom-open');
  el.addEventListener('pointerdown', open);
  el.addEventListener('pointerup', close);
  el.addEventListener('pointercancel', close);
  el.addEventListener('pointerleave', close);
}

export function updateActions() {
  const c = THEME.rules.costs;
  $('resSmash').disabled  = S.charges < 1;
  $('convBtn').disabled   = totalEclats() < THEME.rules.essenceFromEclats;
  $('rerollBtn').disabled = !(S.activeSlot != null && S.charges >= c.reroll.charges);
  $('modBtn').disabled    = !(S.activeSlot != null && totalEclats() > 0);
  $('createBtn').disabled = !(S.essence >= c.create.essence && totalEclats() > 0);
}
