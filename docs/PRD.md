# Tessera — PRD (Proof of Concept)

> **Statut :** POC jouable, assets en placeholder (cases colorées au lieu d'images).
> **Version décrite :** v4 (économie d'éclats colorés).
> **Format :** application web autonome, un seul fichier `index.html` (HTML + CSS + JS inline, aucune dépendance, aucun build).
> **Cible :** mobile en priorité (jouable au doigt), desktop compatible.
> **Objectif du document :** permettre de reprendre le développement (VS Code + extension Claude) sans perdre de contexte.

---

## 1. Vision & pitch

**Tessera** est un jeu de mosaïque où l'on pose des **tesselles** (pièces polyominos) sur une grille. En complétant lignes et colonnes on gagne des **charges de marteau** ; le marteau détruit des cases pour récupérer des **éclats** (de la couleur détruite) qui servent de « peinture » dans un atelier où l'on **reroll / recolore / crée** ses tesselles. En mode Histoire, chaque grille cache un **motif** qui, une fois réalisé, débloque une image et un texte faisant avancer un récit.

Deux ambitions structurantes pour le code :
1. **Tout est piloté par les données** (objet `THEME`) → le contenu est séparé du moteur.
2. **Un futur « éditeur d'atelier »** permettra de créer de nouveaux thèmes (motifs, grille, règles, histoire). Les règles vont continuer d'évoluer : **le code doit rester modulaire et data-driven.**

---

## 2. Principe d'architecture (à préserver absolument)

- Un **objet `THEME` unique** décrit tout le contenu : dimensions de grille, motifs (teintes/tesselles élémentaires), modèles de tesselles, règles/coûts, et la trame d'histoire.
- Le **moteur** (logique de jeu) ne dépend **que** de `THEME` + état courant (`S`). Il ne contient aucune valeur de contenu en dur.
- L'**éditeur d'atelier** à venir ne sera qu'un **producteur/éditeur de `THEME`** (idéalement export/import JSON). C'est la cible : `jeu = f(THEME, mode, progression)`.
- Le **système de patterns** (mode Histoire) est un **registre extensible** : ajouter un type de motif caché = ajouter une fonction au registre + ses indices. Aucune autre partie du code ne doit être touchée.

> Règle d'or pour la suite : **toute nouvelle règle de gameplay doit pouvoir s'exprimer comme une donnée de `THEME.rules` ou une entrée de registre**, pas comme du code éparpillé.

---

## 3. Glossaire / terminologie

| Terme | Sens | Représentation code |
|---|---|---|
| **Motif** | une teinte / tesselle élémentaire (placeholder = couleur ; futur = image) | `THEME.motifs[]` (id, name, color, futur `img`) |
| **Tesselle** | une pièce posable (polyomino) composée de cases portant chacune un motif | objet `{cells:[[r,c]], motifs:[id], rot}` |
| **Grille** | plateau de jeu (5 colonnes × 7 lignes) | `S.grid[r][c] = motifId | null` |
| **Charge de marteau** | ressource gagnée en complétant une ligne/colonne (1× chacune) | `S.charges` (🔨) |
| **Éclat** | « peinture » colorée obtenue en détruisant une case (couleur = celle de la case) | `S.eclats[motifId]` (✦) |
| **Essence** | ressource qui permet de **créer** une nouvelle tesselle | `S.essence` (❖) |
| **Atelier** | zone des 3 tesselles + actions (reroll/convertir/modifier/créer) | — |
| **Motif caché** | pattern à réaliser dans la grille en mode Histoire | `THEME.story[i].pattern` |

> Note : le champ technique `THEME.shapes` désigne les **modèles** de tesselles de base (gabarits piochés). À renommer en `THEME.tesselles` si on veut aligner le vocabulaire pour l'éditeur (décision ouverte).

---

## 4. Page d'accueil & sélection

- Titre **TESSERA**.
- **Choix du thème** (pour l'instant un seul thème placeholder, affiché avec ses pastilles de couleurs).
- **Choix du mode** : **Détente** ou **Histoire**.
- La sélection lance le jeu dans le mode choisi. Un bouton « ‹ Accueil » permet de revenir.

---

## 5. Modes de jeu

### 5.1 Détente (bac à sable)
- Aucune règle, aucune ressource, aucune condition de victoire.
- On pose des cases **1×1** librement : on choisit une couleur dans une palette, on touche une case pour la peindre.
- Atelier et barre de ressources masqués ; palette de couleurs affichée.

### 5.2 Histoire (jeu principal)
- Plateau réglé, atelier actif, économie complète.
- Chaque grille cache un **motif** inconnu du joueur, **différent à chaque grille**.
- Le motif est validé **quand la grille est pleine ET que le motif est présent**.
- Si la grille est pleine **sans** le motif → **pas d'échec** : on révèle un **indice progressif** et on peut réarranger (casser des cases au marteau pour replacer).
- Validation → **déblocage** : titre + texte + emplacement d'illustration (placeholder), puis chapitre suivant.

---

## 6. La grille

- Dimensions : **5 colonnes × 7 lignes** (lues depuis `THEME.grid`).
- La grille est l'**élément élastique** de la mise en page : calée sur le ratio `cols/rows`, dimensionnée par la hauteur disponible → **tout tient à l'écran sans scroll**.
- Une case vide est neutre ; une case remplie affiche la couleur du motif + son initiale.

---

## 7. Les tesselles & l'atelier

- **3 emplacements en permanence.** Dès qu'une tesselle est posée, son emplacement se **recharge aussitôt** avec une nouvelle tesselle aléatoire.
- Une tesselle générée = un **modèle** pioché dans `THEME.shapes`, avec un **motif aléatoire par case**.

### Interaction (Pointer Events — identique au doigt et à la souris)
- **Glisser** une tesselle hors de son emplacement → un **aperçu flottant** suit le pointeur + un **fantôme** sur la grille (doré = ça rentre, rouge = non). Lâcher pose la tesselle si elle rentre.
- **Appui simple** (sans glisser, seuil de 8 px) sur une tesselle → elle **pivote** (rotation 90°) et devient l'emplacement **actif** (cible des actions reroll/modifier).
- `touch-action:none` sur la grille et les emplacements pour ne pas faire défiler la page pendant le glissement.

---

## 8. Économie (cœur du jeu)

### 8.1 Charges de marteau (🔨)
- Gagnées en complétant une **ligne ou une colonne**, **une seule fois** par ligne/colonne (verrou `rowDone[]` / `colDone[]`, jamais réarmé même si on casse puis recomplète).

### 8.2 Marteau → destruction → éclat coloré (✦)
- Activer le marteau (coûte une charge à l'usage), toucher une case **remplie** → la case se vide, **−1 charge**, **+1 éclat de la couleur détruite**.
- La barre de ressources affiche les éclats sous forme de **cubes colorés** (la « fiole » de l'ancien concept est devenue cette barre de cubes).

### 8.3 Éclats colorés = peinture
- Chaque éclat a une **couleur** (= un motif). Dans l'éditeur, **peindre une case consomme 1 éclat de cette couleur**. On ne peut donc peindre une couleur que tant qu'on en a des éclats.

### 8.4 Essence (❖)
- Obtenue par **conversion : 2 éclats → 1 essence** (les éclats sont pris dans les plus grosses piles pour préserver les couleurs rares).
- Rôle : **permet de créer une nouvelle tesselle** (gate de l'action « Créer »).

### 8.5 Tableau des coûts (dans `THEME.rules`)

| Action | Coût | Effet |
|---|---|---|
| **Marteau** 🔨 | 1 charge | détruit une case → +1 éclat de sa couleur |
| **Convertir** ❖ | 2 éclats | +1 essence |
| **Reroll** ↻ | 1 charge | remplace la tesselle active par une aléatoire |
| **Modifier** ✎ | éclats peints (1/case) | recolore la tesselle active (**forme figée**) |
| **Créer** ＋ | 1 essence + éclats peints | dessine **forme + couleurs** d'une nouvelle tesselle |

---

## 9. L'éditeur de tesselle (Modifier vs Créer)

Éditeur sur une trame **4×4**. Les éclats sont la peinture : chaque case colorée = 1 éclat de sa couleur. Une palette affiche le **stock restant par couleur** (badge), grise les couleurs épuisées. Le bouton *Valider* ne s'active que si l'action est **payable** et complète.

- **Modifier (recolorer)** : la **forme est verrouillée** (celle de la tesselle active). On (re)colore chacune de ses cases. Coût = somme des éclats peints. Pas d'essence. Validation exige que **toutes** les cases soient colorées.
- **Créer** : trame **libre**. On touche une case pour la peindre avec la couleur sélectionnée, re-touche pour effacer. Coût = **1 essence + éclats peints**. Au moins une case requise.

À la validation : consommation des ressources, construction de la tesselle normalisée, remplacement de l'emplacement actif (ou emplacement 0 par défaut).

---

## 10. Mode Histoire : patterns cachés & indices

### 10.1 Registre de patterns (extensible)
Chaque type renvoie la liste des cases qui le réalisent, ou `null`. Évalué **grille pleine**. Types implémentés :

| Type | Condition |
|---|---|
| `rowMono` | une ligne entière d'un même motif |
| `colMono` | une colonne entière d'un même motif |
| `block2` | un bloc 2×2 d'un même motif |
| `diag3` | 3 cases d'un même motif en diagonale (montante ou descendante) |

**Ajouter un pattern = ajouter une fonction au registre `PATTERNS` + une entrée `HINTS`.** Rien d'autre à toucher.

### 10.2 Indices progressifs
Chaque pattern a une liste d'indices (`HINTS[type]`). Si la grille est pleine sans le motif, on révèle l'indice suivant (de plus en plus précis). Pas d'échec, on peut réarranger.

### 10.3 Déblocage
`THEME.story[i].unlock = { title, text }` (+ futur `img`). Affiché dans un voile, puis passage au chapitre suivant : grille et verrous de lignes/colonnes réinitialisés, **ressources conservées** (progression gardée).

---

## 11. Contraintes UI/UX

- **Zéro scroll** : `.app` en `height:100dvh; overflow:hidden`. La grille absorbe l'espace restant ; le reste est compact.
- **Mobile** : zoom double-tap désactivé (`maximum-scale=1`), interactions en Pointer Events.
- **Tokens de couleur** (CSS variables) : fond ardoise `--ink:#14161c`, surfaces `--surface`, éclat ambre `--eclat:#e0b35e`, marteau acier `--marteau:#7fa8c9`, essence iris `--essence:#a98fd6`. Personnalisables par thème via `THEME.style` (§12) — absent = ces valeurs par défaut.
- **Aucun stockage navigateur** (`localStorage`/`sessionStorage`) — non supporté dans l'aperçu d'artefact. Pour la persistance, prévoir une autre approche en dehors de cet aperçu (voir Roadmap).

---

## 12. Spécification de l'objet `THEME`

```js
const THEME = {
  id: "poc",
  name: "Placeholder",

  grid: {
    cols: 5, rows: 7,
    // optionnel : illustration de fond dans laquelle la grille s'incruste.
    // bg: "assets/img/themes/<id>/cadre.jpg",
    // bgWindow: { x: 96, y: 210, w: 460, h: 640 },  // zone de jeu, en pixels de l'image
    // emptyStyle: "transparent",                    // "opaque" (défaut) | "translucent" | "transparent"
    // lineColor: "rgba(216,179,94,.55)",             // contour des cases (sinon aucun, comme avant)
  },

  // motifs = teintes (placeholder). Futur : ajouter img:"data:..." (ou url) par motif.
  motifs: [
    { id: 0, name: "Ambre",  color: "#e0a458" },
    { id: 1, name: "Jade",   color: "#5fa97f" },
    { id: 2, name: "Azur",   color: "#5b8fc9" },
    { id: 3, name: "Grenat", color: "#c8607a" },
    { id: 4, name: "Iris",   color: "#9b7fd0" },
    { id: 5, name: "Lin",    color: "#cfc9b4" },
  ],

  // modèles de tesselles (gabarits), offsets [ligne, colonne]
  shapes: [
    { id: "mono",   cells: [[0,0]] },
    { id: "domino", cells: [[0,0],[0,1]] },
    { id: "triI",   cells: [[0,0],[0,1],[0,2]] },
    { id: "triL",   cells: [[0,0],[1,0],[1,1]] },
    { id: "square", cells: [[0,0],[0,1],[1,0],[1,1]] },
    { id: "tT",     cells: [[0,0],[0,1],[0,2],[1,1]] },
    { id: "tL",     cells: [[0,0],[1,0],[2,0],[2,1]] },
    { id: "tS",     cells: [[0,1],[0,2],[1,0],[1,1]] },
  ],

  rules: {
    costs: {
      reroll: { charges: 1 },   // modifier : coût = éclats peints (implicite)
      create: { essence: 1 },   // + éclats peints
    },
    essenceFromEclats: 2,       // 2 éclats -> 1 essence
    slots: 3,                   // emplacements d'atelier
    cubesShown: 8,              // taille d'affichage de la barre de cubes
    atelierCompact: false,      // optionnel : atelier replié au démarrage (3 tesselles + bouton). Défaut false = complet (comportement historique). Le joueur peut toujours basculer via le bouton.
  },

  // optionnel : personnalisation visuelle globale. Toute clé absente retombe
  // sur la valeur par défaut de :root (styles.css) — rien à fournir si le
  // thème se contente du style par défaut.
  style: {
    colors: {
      // mêmes clés que les variables CSS de :root, en camelCase :
      // ink, surface, surface2(--surface-2), line, lineSoft(--line-soft),
      // txt, muted, eclat, marteau, essence, ok, bad.
      eclat: "#e0a458",
    },
    font: {
      family: "'Poppins', sans-serif",          // valeur CSS font-family
      url: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;750&display=swap",
      // url optionnelle : feuille de police chargée dynamiquement (<link> injecté
      // par theme.js). Dépendance réseau assumée — pas de repli offline ; sans
      // `url`, `family` doit désigner une police déjà disponible (système ou
      // empaquetée dans le repo).
    },
  },

  // une entrée = une grille d'histoire : pattern caché + déblocage
  story: [
    { pattern: { type: "rowMono" }, unlock: { title: "...", text: "..." /*, img */ } },
    { pattern: { type: "block2"  }, unlock: { title: "...", text: "..." } },
    { pattern: { type: "colMono" }, unlock: { title: "...", text: "..." } },
    { pattern: { type: "diag3"   }, unlock: { title: "...", text: "..." } },
  ],
};
```

**Forme d'une tesselle en jeu** (générée ou éditée) :
```js
{ cells: [[r,c], ...], motifs: [motifId, ...], rot: 0 } // cells et motifs indexés en parallèle
```

---

## 13. État applicatif & carte des fonctions (fichier `index.html`)

### 13.1 État global `S`
```js
S = {
  mode,                    // 'detente' | 'histoire'
  grid,                    // [rows][cols] de motifId|null
  rowDone, colDone,        // verrous de charge (1× par ligne/colonne)
  eclats,                  // tableau par motif : eclats[motifId] = nombre
  charges, essence,        // entiers
  atelier,                 // [3] de tesselles
  atelierExpanded,         // atelier complet (actions visibles) vs compact (3 tesselles + bouton) — init via THEME.rules.atelierCompact, bascule libre ensuite
  activeSlot,              // index de l'emplacement actif (cible des actions)
  smash,                   // mode marteau actif
  palMotif,                // couleur courante en mode Détente
  storyIdx, hintLevel,     // progression Histoire
  ghostCell,               // case survolée pendant le glisser
}
// editorState : état temporaire de l'éditeur de tesselle
// drag : état temporaire du glisser-déposer
```

### 13.2 Fonctions clés par domaine
- **Contenu / helpers** : `MOTIF(id)`, `rndMotif()`, `totalEclats()`.
- **Patterns** : `PATTERNS` (registre), `HINTS`.
- **Accueil / démarrage** : `buildHome()`, `startGame(mode)`.
- **Grille** : `buildGrid()`, `cellEl()`, `paintCell()`, `paintGrid()`, `paintGhost()`, `clearGhost()`.
- **Tesselles** : `newPiece()`, `oriented(piece, rot)`, `fits(cells)`.
- **Glisser-déposer** : `startDrag()`, `onDragMove()`, `onDragEnd()`, `cellUnder()`, `dropTesselle()`, `buildPreview()`, `movePreview()`, `removePreview()`.
- **Atelier / actions** : `renderAtelier()`, `miniOf()`, `applyAtelierMode()` (bascule compact/complet), `updateActions()`, `spendTwoEclats()`, handlers reroll/convert/modify/create.
- **Marteau** : `toggleSmash()`, `smashAt()`, `awardCharges()`.
- **Éditeur** : `openEditor(kind, piece)`, `renderEditor()`, `paintEditorCell()`, `editorCost()`, `affordable()`, `availOf()`, `usedInEditor()`, `lockedAllFilled()`, `firstAvailColor()`.
- **Ressources** : `renderRes()`, `renderEclatCubes()`, `cubes()`.
- **Détente** : `buildPalette()`.
- **Histoire** : `gridFull()`, `checkGrid()`, `revealStory()`, handler `storyNext`.

---

## 14. Décisions prises (à valider / réversibles)

Ces choix comblent des zones non spécifiées ; tous ajustables (la plupart via `THEME.rules`) :

1. **Marteau supprimé l'ancien matching** : les doublons adjacents ne disparaissent plus ; les éclats viennent uniquement de la destruction au marteau.
2. **Charge = 1× par ligne/colonne** (verrou définitif), pas à chaque complétion.
3. **Histoire, motif absent** : indice révélé progressivement, pas d'échec.
4. **Modifier = recoloration seule** (forme figée) vs **Créer = forme libre** (+ essence). C'est ce qui distingue les deux actions.
5. **Reroll = 1 charge** (auparavant 1 éclat + 1 charge ; les éclats sont devenus de la peinture colorée).
6. **Conversion = 2 éclats → 1 essence**, pris dans les plus grosses piles.
7. **Aperçu de glisser** aligné par le coin supérieur-gauche de la tesselle sous le doigt (centrage possible).
8. **Rotation par appui** (un bouton ↻ dédié reste une option).

---

## 15. Roadmap / prochaines étapes

### 15.1 Brancher les vrais assets (points d'entrée déjà prévus)
- `THEME.motifs[].img` (chemin relatif) → **fait** : `motifCSS(id)` (`js/theme.js`) renvoie l'image en couverture avec la couleur en repli (fichier absent/introuvable), utilisé partout où un motif est dessiné (grille, atelier, éditeur, palette, ressources, accueil). Reste à fournir les vrais fichiers et les lister dans `SHELL` (`sw.js`).
- `THEME.grid.bg` + `THEME.grid.bgWindow` → **fait** : `buildGrid()` (`js/grid.js`) charge l'illustration dans `.board-frame`, cale le cadre sur son ratio réel, puis positionne `.grid` (classe `embedded`, chrome propre neutralisé) en `%` sur la fenêtre de jeu `bgWindow = {x,y,w,h}` (pixels de l'image source). Sans `bg`, rendu inchangé. `THEME.grid.emptyStyle` (`opaque` défaut · `translucent` · `transparent`) règle l'apparence des cases vides par-dessus le fond. `THEME.grid.lineColor` (couleur CSS, optionnelle) dessine un contour de case — nécessaire pour garder la structure de la grille visible quand `emptyStyle` rend les cases transparentes. Reste à fournir une vraie illustration de thème.
- `THEME.story[i].unlock.img` → illustration de chapitre (remplacer le placeholder `.art`).

### 15.2 Éditeur d'atelier (theme editor)
- Interface produisant/éditant un objet `THEME` complet (motifs + images, dimensions de grille, modèles de tesselles, règles, trame d'histoire).
- **Export / import JSON** d'un thème.
- Définir les **patterns** d'histoire de façon éditable (sélecteur de type + paramètres).

### 15.3 Persistance
- Sauvegarder la progression (chapitre courant, ressources, thème). `localStorage` à éviter dans l'aperçu d'artefact ; OK une fois le jeu hébergé/empaqueté hors de cet aperçu.

### 15.4 Équilibrage
- Régler les coûts (`THEME.rules.costs`), la taille de grille, le nombre de chapitres, le rythme d'obtention des charges/éclats/essence.

### 15.5 Idées ouvertes (game design)
- Repère visuel sur la grille indiquant la couleur qui « rapporte » (ou manquante) pour le motif caché — ou garder le motif totalement aveugle.
- Pattern caché paramétré (ex. `rowMono` d'un motif **précis**) plutôt que générique.
- Plus de types de patterns (symétrie, quinconce, rosace, encadrement…).

---

## 16. Notes techniques

- **Un seul fichier** `index.html`, sans build ni dépendance. Idéal pour itérer dans VS Code.
- **Pointer Events** unifient tactile et souris ; seuil de glissement 8 px pour distinguer appui (rotation) et glisser (pose).
- **Validation** pendant le développement : extraire le `<script>` et `node --check`, plus des tests de logique isolés sur les fonctions pures (`PATTERNS`, `oriented`, économie d'éclats) — recommandé de garder cette habitude.
- **Pas de stockage navigateur** dans l'aperçu d'artefact (voir §11 et §15.3).

---

*Fin du PRD — Tessera POC v4.*
