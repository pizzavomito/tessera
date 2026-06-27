// capture.js — capture la grille (+ fond illustré éventuel) en JPG, à partager ou enregistrer.

import { S, $, setStatus } from './state.js';
import { THEME, COLS, ROWS, MOTIF } from './theme.js';
import { cellEl } from './grid.js';

const MAX_DPR = 2;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image introuvable : ' + src));
    img.src = src;
  });
}

// Dessine `img` dans (x,y,w,h) façon CSS `object-fit:cover`.
function drawCover(ctx, img, x, y, w, h) {
  const ir = img.naturalWidth / img.naturalHeight, r = w / h;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (ir > r) { sw = sh * r; sx = (img.naturalWidth - sw) / 2; }
  else { sh = sw / r; sy = (img.naturalHeight - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// Redessine la grille affichée (taille écran actuelle) dans un canvas.
async function renderBoardCanvas() {
  const wrap = $('boardWrap');
  const frame = wrap.querySelector('.board-frame') || wrap.querySelector('#grid');
  if (!frame) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const rect = frame.getBoundingClientRect();
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const bgImgEl = frame.querySelector('.board-bg');
  if (bgImgEl && bgImgEl.complete && bgImgEl.naturalWidth) {
    ctx.drawImage(bgImgEl, 0, 0, rect.width, rect.height);
  } else {
    ctx.fillStyle = getComputedStyle(frame).backgroundColor;
    ctx.fillRect(0, 0, rect.width, rect.height);
  }

  // cache des images de motifs déjà chargées (évite les requêtes redondantes)
  const motifImgCache = new Map();
  const motifImage = (path) => {
    if (!motifImgCache.has(path)) motifImgCache.set(path, loadImage('./' + path).catch(() => null));
    return motifImgCache.get(path);
  };

  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const el = cellEl(r, c);
    const cr = el.getBoundingClientRect();
    const x = cr.left - rect.left, y = cr.top - rect.top, w = cr.width, h = cr.height;
    const m = S.grid[r][c];
    const motif = m != null ? MOTIF(m) : null;
    const img = motif && motif.img ? await motifImage(motif.img) : null;
    if (img) drawCover(ctx, img, x, y, w, h);
    else { ctx.fillStyle = getComputedStyle(el).backgroundColor; ctx.fillRect(x, y, w, h); }
  }
  return canvas;
}

function fileName() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const id = (THEME && THEME.id) || 'grille';
  return `tessera-${id}-${stamp}.jpg`;
}

function downloadBlob(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName();
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// Capture la grille affichée et l'enregistre sur l'appareil : partage natif
// si possible (mobile/iOS → propose "Enregistrer l'image"), sinon téléchargement direct.
export async function saveBoardCapture() {
  const canvas = await renderBoardCanvas();
  if (!canvas) return;
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .92));
  if (!blob) return;

  const file = new File([blob], fileName(), { type: 'image/jpeg' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Tessera' }); return; }
    catch (err) { if (err.name === 'AbortError') return; }
  }
  downloadBlob(blob);
}

export function initCapture() {
  const btn = $('captureBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try { await saveBoardCapture(); }
    catch (err) { setStatus('Capture impossible : ' + err.message); console.error(err); }
    finally { btn.disabled = false; }
  });
}
