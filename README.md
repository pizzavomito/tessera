# Tessera

Jeu de mosaïque à motifs — **PWA** statique, sans build, pilotée par des fichiers **JSON** de contenu.

> POC jouable avec assets en placeholder (cases colorées). Voir `docs/PRD.md` pour la spec complète.

## Structure

```
tessera/
├── index.html              squelette DOM + manifeste + module d'entrée
├── manifest.webmanifest    PWA
├── sw.js                   service worker (offline)
├── css/styles.css
├── js/                     modules ES (un par domaine)
│   ├── main.js             point d'entrée (init + service worker)
│   ├── theme.js            thème/histoire actifs + chargeurs JSON (bindings live)
│   ├── state.js            état global S + helpers
│   ├── patterns.js         registre des motifs cachés + indices
│   ├── tesselle.js         géométrie des tesselles (génération/rotation/placement)
│   ├── grid.js             rendu de la grille + fantôme de pose
│   ├── resources.js        barre de ressources (cubes) + état des actions
│   ├── engine.js           règles : clic case, charges, marteau, conversion, reroll
│   ├── atelier.js          atelier + glisser-déposer + câblage des actions
│   ├── editor.js           éditeur de tesselle (recolorer / créer)
│   ├── story.js            mode Histoire (motif caché, indices, déblocages)
│   └── home.js             accueil, sélection thème/mode, démarrage
├── data/
│   ├── index.json          catalogue des thèmes
│   ├── themes/poc.json      un thème (grille, motifs, formes, règles)
│   └── stories/poc.json     une histoire (chapitres = pattern + déblocage)
├── icons/                  icônes PWA (192, 512)
└── docs/PRD.md             cahier des charges
```

## Lancer en local

Les modules ES et `fetch()` **ne marchent pas en `file://`** : il faut un petit serveur HTTP.

```bash
# au choix
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Ou dans VS Code : extension **Live Server** → « Open with Live Server ».

## Déployer sur GitHub Pages

1. Pousser le contenu de ce dossier à la racine d'un dépôt (ou dans `/docs`).
2. Repo → **Settings → Pages** → Source : la branche voulue, dossier racine (ou `/docs`).
3. Le site sera servi sous `https://<user>.github.io/<repo>/`.

Tous les chemins sont **relatifs** (`./js/...`, `./data/...`, `start_url: "."`), donc le sous-dossier `/<repo>/` fonctionne sans config. Le service worker exige HTTPS — Pages l'est.

> À chaque modif d'assets, **incrémenter `CACHE` dans `sw.js`** (ex. `tessera-v2`) pour forcer la mise à jour chez les visiteurs.

## Ajouter un thème

1. Créer `data/themes/<id>.json` (copier `poc.json`). Champs : `grid`, `motifs`, `shapes`, `rules`.
   - `motifs[]` : `{ id, name, color, img? }` — `color` reste obligatoire (repli si `img` absent ou introuvable). `img` = chemin relatif (ex. `assets/img/motifs/ambre.png`). Pris en charge automatiquement partout via `motifCSS()` (`js/theme.js`) : grille, atelier, éditeur, palette, ressources, accueil — rien à modifier ailleurs.
   - `grid.bg?` : chemin relatif vers une illustration de fond (ex. `assets/img/themes/foret/cadre.jpg`). Si défini, la grille s'incruste dans l'image au lieu d'être un panneau autonome.
   - `grid.bgWindow?` : `{ x, y, w, h }` en **pixels de l'image source** — la zone où la grille doit se positionner (coordonnées lisibles directement dans l'outil de dessin). Sans `bgWindow`, la grille occupe toute l'image.
   - `grid.emptyStyle?` : `"opaque"` (défaut, identique à aujourd'hui) · `"translucent"` · `"transparent"` — apparence des cases vides par-dessus le fond.
   - `grid.lineColor?` : couleur CSS (ex. `"rgba(216,179,94,.55)"`) du contour de chaque case — utile pour rendre la grille visible quand `emptyStyle` est `transparent`/`translucent`. Sans elle, pas de contour (identique à aujourd'hui).
   - `style?` : personnalisation visuelle globale (couleurs + police), appliquée par `js/theme.js` en variables CSS racine. `style.colors.<clé>` (mêmes clés que les variables de `:root`, en camelCase : `ink, surface, surface2, line, lineSoft, txt, muted, eclat, marteau, essence, ok, bad`) écrase la couleur correspondante. `style.font.family` (valeur CSS `font-family`) change la police partout ; `style.font.url?` charge dynamiquement une feuille de police web (ex. Google Fonts) — dépendance réseau assumée, pas de repli hors-ligne. Toute clé absente retombe sur la valeur par défaut.
   - `rules.atelierCompact?` : `true` démarre l'atelier replié (3 tesselles + bouton « Atelier complet » pour révéler les actions), `false`/absent = atelier complet comme aujourd'hui. Réversible par le joueur via le bouton dans les deux cas.
2. (Optionnel) Créer une histoire `data/stories/<id>.json` (chapitres = `{ pattern, unlock }`).
3. Référencer le thème dans `data/index.json` :
   ```json
   { "id": "<id>", "name": "Mon thème", "file": "data/themes/<id>.json", "storyFile": "data/stories/<id>.json" }
   ```
4. Penser à ajouter les nouveaux fichiers (dont les images `img`) à la liste `SHELL` de `sw.js` (et bumper `CACHE`).

## Ajouter un type de motif caché

Dans `js/patterns.js` : ajouter une fonction au registre `PATTERNS` (reçoit la grille pleine, renvoie les cases ou `null`) et une entrée d'indices dans `HINTS`. Rien d'autre à toucher — utilisable depuis n'importe quel `data/stories/*.json` via `"pattern": { "type": "<nom>" }`.

## Vocabulaire

**Motif** = teinte. **Tesselle** = pièce posable. **Éclat** = peinture colorée (case détruite). **Charge** = marteau. **Essence** = créer une tesselle. Détails et économie dans `docs/PRD.md`.
