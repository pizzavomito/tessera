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
}
