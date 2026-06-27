// main.js — point d'entrée de l'application.

import { initHome } from './home.js';
import { initAtelierActions } from './atelier.js';
import { initEditor } from './editor.js';
import { initStory } from './story.js';
import { initEclatZoom } from './resources.js';

initAtelierActions();
initEditor();
initStory();
initEclatZoom();
initHome();

// PWA : service worker (nécessite HTTPS ou localhost ; GitHub Pages est en HTTPS).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.warn('SW non enregistré', err));
  });
}
