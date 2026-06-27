// theme.js — contenu actif (thème + histoire) chargé depuis des JSON.
// Les exports `let` sont des "live bindings" : quand on appelle setActive(),
// tous les modules qui importent COLS/ROWS/MOTIFS/THEME voient la nouvelle valeur.

export let THEME = null;   // objet thème courant
export let STORY = null;   // objet histoire courant ({ chapters:[...] })
export let COLS = 0;
export let ROWS = 0;
export let NM = 0;         // nombre de motifs
export let MOTIFS = [];

export const rnd = n => Math.floor(Math.random() * n);
export const rndMotif = () => rnd(NM);
export const MOTIF = id => MOTIFS[id];

// Valeur CSS `background` d'un motif : image en couverture si `img` est fourni
// (avec la couleur en repli si le fichier est introuvable), sinon couleur unie.
export function motifCSS(id) {
  const m = MOTIF(id);
  return m.img ? `url("./${m.img}") center / cover no-repeat, ${m.color}` : m.color;
}

// Récupère le catalogue de thèmes (relatif au document → OK sous /repo/ sur Pages).
export async function loadCatalog() {
  const res = await fetch('./data/index.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('Catalogue introuvable (data/index.json)');
  return res.json(); // { themes: [{ id, name, file, storyFile }] }
}

// Charge un thème (et son histoire) à partir d'une entrée de catalogue.
export async function loadTheme(entry) {
  const theme = await (await fetch('./' + entry.file, { cache: 'no-cache' })).json();
  let story = null;
  const storyFile = entry.storyFile || theme.storyFile;
  if (storyFile) story = await (await fetch('./' + storyFile, { cache: 'no-cache' })).json();
  setActive(theme, story);
  return { theme, story };
}

// Installe le thème/histoire comme contenu actif.
export function setActive(theme, story) {
  THEME = theme;
  STORY = story;
  COLS = theme.grid.cols;
  ROWS = theme.grid.rows;
  MOTIFS = theme.motifs;
  NM = theme.motifs.length;
  applyStyle(theme.style);
}

// THEME.style.colors.<clé> → variable CSS (cf. :root dans styles.css).
const COLOR_VARS = {
  ink: '--ink', surface: '--surface', surface2: '--surface-2',
  line: '--line', lineSoft: '--line-soft',
  txt: '--txt', muted: '--muted',
  eclat: '--eclat', marteau: '--marteau', essence: '--essence',
  ok: '--ok', bad: '--bad',
};

let fontLinkEl = null;

// Applique THEME.style (optionnel) en variables CSS racine ; tout ce qui est
// absent retombe sur les valeurs par défaut de :root (styles.css).
function applyStyle(style) {
  const root = document.documentElement.style;
  const colors = (style && style.colors) || {};
  for (const key in COLOR_VARS) {
    const v = colors[key];
    if (v) root.setProperty(COLOR_VARS[key], v);
    else root.removeProperty(COLOR_VARS[key]);
  }
  const font = (style && style.font) || {};
  if (font.family) root.setProperty('--font', font.family);
  else root.removeProperty('--font');
  loadFontUrl(font.url || null);
  document.body.classList.toggle('bare-frames', !!style && style.frames === false);
}

// Injecte (ou retire) une feuille de police web pointée par THEME.style.font.url.
function loadFontUrl(url) {
  if (!url) {
    if (fontLinkEl) { fontLinkEl.remove(); fontLinkEl = null; }
    return;
  }
  if (fontLinkEl && fontLinkEl.href === url) return;
  if (fontLinkEl) fontLinkEl.remove();
  fontLinkEl = document.createElement('link');
  fontLinkEl.rel = 'stylesheet';
  fontLinkEl.href = url;
  document.head.appendChild(fontLinkEl);
}
