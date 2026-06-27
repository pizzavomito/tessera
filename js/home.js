// home.js — écran d'accueil, sélection du thème/mode, démarrage.

import { S, $, setStatus } from './state.js';
import { THEME, STORY, COLS, ROWS, NM, MOTIFS, loadCatalog, loadTheme, motifCSS } from './theme.js';
import { buildGrid } from './grid.js';
import { renderAtelier } from './atelier.js';
import { renderRes } from './resources.js';
import { newPiece } from './tesselle.js';
import { onCell } from './engine.js';

let catalog = null;
let currentEntry = null;

export async function initHome() {
  // boutons de mode
  document.querySelectorAll('.mode-btn').forEach(b =>
    b.addEventListener('click', () => startGame(b.dataset.mode)));
  $('backBtn').addEventListener('click', () => {
    $('game').classList.add('hidden'); $('home').classList.remove('hidden');
  });

  try {
    catalog = await loadCatalog();
    buildThemeCards(catalog.themes);
    if (catalog.themes[0]) await selectTheme(catalog.themes[0]);
  } catch (err) {
    setStatus('Erreur de chargement du contenu : ' + err.message);
    console.error(err);
  }
}

function buildThemeCards(themes) {
  const tc = $('themes'); tc.innerHTML = '';
  themes.forEach(entry => {
    const card = document.createElement('button');
    card.className = 'theme-card';
    card.dataset.id = entry.id;
    card.innerHTML = `<div>${entry.name}</div><div class="swatches" data-sw></div>`;
    card.addEventListener('click', () => selectTheme(entry));
    tc.appendChild(card);
  });
}

async function selectTheme(entry) {
  currentEntry = entry;
  await loadTheme(entry);
  document.querySelectorAll('.theme-card').forEach(c =>
    c.setAttribute('aria-pressed', String(c.dataset.id === entry.id)));
  // pastilles de couleurs du thème chargé
  const card = document.querySelector(`.theme-card[data-id="${entry.id}"] [data-sw]`);
  if (card) card.innerHTML = MOTIFS.map(m => `<i style="background:${motifCSS(m.id)}"></i>`).join('');
}

export function startGame(mode) {
  if (!THEME) { setStatus('Aucun thème chargé.'); return; }
  S.mode = mode;
  S.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  S.rowDone = Array(ROWS).fill(false);
  S.colDone = Array(COLS).fill(false);
  S.eclats = Array(NM).fill(0);
  S.charges = 0; S.essence = 0;
  S.activeSlot = null; S.smash = false; S.ghostCell = null;
  S.storyIdx = 0; S.hintLevel = 0;
  if (mode === 'histoire') {
    S.atelier = Array.from({ length: THEME.rules.slots }, () => newPiece());
    S.atelierExpanded = THEME.rules.atelierCompact !== true;
  }

  $('home').classList.add('hidden'); $('game').classList.remove('hidden');
  $('gameTitle').textContent = (STORY && STORY.name) || THEME.name || 'TESSERA';
  $('modeTag').textContent = mode === 'detente' ? 'Détente' : 'Histoire';
  $('hud').classList.toggle('hidden', mode !== 'histoire');
  $('actions').classList.toggle('hidden', mode !== 'histoire');
  $('paletteWrap').classList.toggle('hidden', mode !== 'detente');

  buildGrid(onCell);
  if (mode === 'detente') { buildPalette(); setStatus('Choisis une couleur, puis touche une case.'); }
  else { renderAtelier(); renderRes(); setStatus('Glisse une tesselle sur la grille.'); }
}

function buildPalette() {
  const p = $('palette'); p.innerHTML = '';
  MOTIFS.forEach(m => {
    const b = document.createElement('button'); b.className = 'pal'; b.style.background = motifCSS(m.id);
    b.setAttribute('aria-pressed', String(m.id === S.palMotif));
    b.addEventListener('click', () => {
      S.palMotif = m.id;
      p.querySelectorAll('.pal').forEach((x, i) => x.setAttribute('aria-pressed', String(i === m.id)));
    });
    p.appendChild(b);
  });
}
