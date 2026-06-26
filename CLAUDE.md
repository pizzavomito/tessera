# Tessera — mémoire projet (Claude Code)

Jeu de mosaïque à motifs : **PWA statique, sans build**, pilotée par des fichiers JSON de contenu.
Poursuis le travail dans l'esprit des sessions précédentes. Le détail complet est dans `docs/PRD.md` — lis-le pour toute question d'architecture, d'économie ou de roadmap (ne le réimporte pas en entier inutilement).

@README.md

## Contexte en un coup d'œil
- POC jouable, assets en **placeholder** (cases colorées au lieu d'images). Version courante : v4 (éclats colorés).
- Hébergement visé : **GitHub Pages** (site projet sous `/<repo>/`), **PWA** installable.
- Stack : HTML + CSS + **modules ES natifs**. Aucune dépendance, aucun bundler.

## Architecture (à préserver)
- Le contenu vit dans des JSON : `data/themes/*.json`, `data/stories/*.json`, catalogue `data/index.json`.
- `js/theme.js` charge le contenu et expose des *live bindings* (`THEME`, `COLS`, `ROWS`, `MOTIFS`…). Le moteur ne dépend que de `THEME` + l'état `S` (`js/state.js`).
- Objectif directeur : **`jeu = f(THEME, mode, progression)`**. Le futur éditeur de thème ne sera qu'un producteur de `THEME` (export/import JSON).
- Motifs cachés (mode Histoire) = **registre extensible** dans `js/patterns.js` : ajouter un type = 1 fonction + 1 entrée `HINTS`, rien d'autre.
- Carte des modules et schéma `THEME` : `docs/PRD.md` §12–13.

## Règles impératives
- TOUJOURS des chemins **relatifs** (`./js/…`, `./data/…`, `start_url:"."`) — sinon le site casse sous `/<repo>/` sur Pages.
- NE JAMAIS utiliser `localStorage`/`sessionStorage` tant qu'une vraie persistance n'est pas décidée (cf. PRD §15.3).
- Après toute modif d'assets : **incrémenter `CACHE` dans `sw.js`** (`tessera-v2`…) et tenir à jour la liste `SHELL`.
- Toute nouvelle règle de gameplay s'exprime en **donnée** (`THEME.rules`) ou en entrée de registre, pas en code éparpillé.
- Vocabulaire à respecter dans l'UI : **motif** = teinte · **tesselle** = pièce posée · **éclat** = peinture colorée · **charge** = marteau · **essence** = créer une tesselle.

## Méthode de travail
- Pour un changement non trivial : proposer un **court plan** et **confirmer les choix de game-design ambigus AVANT de coder**.
- Valider sans navigateur : `node --check` sur les modules (Node 22+ détecte les modules ES) + tests de logique isolés sur les fonctions pures (patterns, géométrie).
- Les modules ES + `fetch` exigent un **serveur local** (`python3 -m http.server`), pas `file://`.
- Réponses **concises, en français**. Livrer par petits jalons testables.

## Commandes
- Servir en local : `python3 -m http.server 8000` → http://localhost:8000
- Vérifier un module : `node --check js/<fichier>.js`

## Décisions en cours (réversibles — détail PRD §14)
- Matching supprimé · charge 1× par ligne/colonne · indice progressif en Histoire.
- **Modifier** = recolorer (forme figée) · **Créer** = forme libre + 1 essence.
- Reroll = 1 charge · conversion = 2 éclats → 1 essence.

## Prochaines étapes probables
- Brancher les **vraies images** : mécanisme `motif.img` en place (`motifCSS()` dans `js/theme.js`, repli couleur), reste à fournir les fichiers réels (`data/themes/*.json` → `assets/img/...`) et à les ajouter au `SHELL` de `sw.js`. Restent aussi : fond de grille (`THEME.grid.bg`), illustrations de chapitre (`story[i].unlock.img`).
- **Éditeur de thème** in-app (produit/exporte un `THEME` JSON conforme au schéma PRD §12).
- **Persistance** de la progression.
