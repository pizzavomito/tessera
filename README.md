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
   - `motifs[]` : `{ id, name, color }` — placeholder. Pour de vraies images, ajouter `img` et l'utiliser dans `grid.js` (`paintCell`).
2. (Optionnel) Créer une histoire `data/stories/<id>.json` (chapitres = `{ pattern, unlock }`).
3. Référencer le thème dans `data/index.json` :
   ```json
   { "id": "<id>", "name": "Mon thème", "file": "data/themes/<id>.json", "storyFile": "data/stories/<id>.json" }
   ```
4. Penser à ajouter les nouveaux fichiers à la liste `SHELL` de `sw.js` (et bumper `CACHE`).

## Ajouter un type de motif caché

Dans `js/patterns.js` : ajouter une fonction au registre `PATTERNS` (reçoit la grille pleine, renvoie les cases ou `null`) et une entrée d'indices dans `HINTS`. Rien d'autre à toucher — utilisable depuis n'importe quel `data/stories/*.json` via `"pattern": { "type": "<nom>" }`.

## Vocabulaire

**Motif** = teinte. **Tesselle** = pièce posable. **Éclat** = peinture colorée (case détruite). **Charge** = marteau. **Essence** = créer une tesselle. Détails et économie dans `docs/PRD.md`.
