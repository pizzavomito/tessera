// state.js — état global de la partie + petits helpers partagés.

export const S = {
  mode: null,            // 'detente' | 'histoire'
  grid: [],              // [rows][cols] = motifId | null
  rowDone: [],           // verrous de charge (1× par ligne)
  colDone: [],           // verrous de charge (1× par colonne)
  eclats: [],            // eclats[motifId] = nombre d'éclats de cette couleur
  charges: 0,
  essence: 0,
  atelier: [],           // [slots] de tesselles
  activeSlot: null,      // emplacement actif (cible des actions)
  smash: false,          // mode marteau
  palMotif: 0,           // couleur courante en mode Détente
  storyIdx: 0,
  hintLevel: 0,
  ghostCell: null,       // case survolée pendant le glisser
};

export const $ = id => document.getElementById(id);
export const totalEclats = () => S.eclats.reduce((a, b) => a + b, 0);
export function setStatus(t) { const e = $('status'); if (e) e.textContent = t; }
