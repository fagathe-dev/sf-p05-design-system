---
name: sf-p05-design-system
description: Générer, structurer et refactoriser, en expert développeur front-end TypeScript/SCSS, les composants, tokens et interactions d'un design system modulaire inspiré de Google Material Design 3 Expressive (M3 Expressive), puis documenter chaque composant dans les pages Twig de /ui/docs. À utiliser dès que l'utilisateur demande de créer ou refondre un composant UI (SCSS et comportement TypeScript), de définir des variables/tokens CSS ou SCSS, d'écrire un service ou une interaction front, d'améliorer le style frontend, de respecter les règles de bordures, couleurs, contrastes, espacements, tailles, typographie et animations, ou d'ajouter ou ranger une page de documentation, un exemple ou un starter pack.
---

# SCSS / TypeScript Material Expressive Design System

## Rôle

**Tout le code généré l'est en tant qu'expert développeur front-end TypeScript / SCSS** : code typé strictement, accessible (WCAG AA, clavier, ARIA), performant, sans dépendance superflue, testé dans un vrai navigateur, et conforme aux conventions de ce dépôt plutôt qu'à des habitudes génériques (Bootstrap, React…).

Ce skill couvre :

- le **SCSS** du design system (tokens, composants, utilitaires) selon M3 Expressive ;
- les **interactions TypeScript** vanilla (délégation d'événements, attributs `data-ds-*`, événements `ds:*`) et les **services** (thème) ;
- la **documentation** Twig servie sous `/ui/docs` (pages de démo, starter packs) dans l'application Symfony.

## Quand utiliser ce skill

- Création ou refonte d'un composant UI (button, card, modal, input, segmented control, navbar, sidebar…), en SCSS et, si besoin, avec son comportement TypeScript.
- Mise en place ou mise à jour des fichiers de fondation (`abstracts/_primitives.scss`, `foundation/_tokens.scss`, `abstracts/_mixins.scss`, `foundation/_typography.scss`).
- Écriture d'une interaction (`assets/ts/interactions/`), d'un service (`assets/ts/services/`) ou d'un script de page (`assets/ts/pages/`).
- Questions ou revues de code sur les règles de design frontend : bordures, rayons, couleurs, contrastes, paddings/marges, tailles ou typographie.
- Thème clair/sombre : tokens sous `[data-ui-theme="dark"]` et service `themeService` (`'auto' | 'light' | 'dark'`).
- Création, déplacement ou rangement d'une page de documentation (`templates/docs/`) ou d'un starter pack.

## Workflow

Pour créer ou refondre un composant :

1. **Tokens** : vérifier que les System Tokens nécessaires existent (§1, §2 à §6) ; sinon les ajouter dans la fondation, jamais dans le composant.
2. **SCSS** : écrire le composant à partir du template standard (§8), en déclarant d'abord ses Component Tokens, et l'enregistrer dans le `_index.scss` de son domaine.
3. **États et motion** : définir hover, active, focus-visible, disabled et les transitions (§7).
4. **Comportement** : si le composant est interactif, écrire son module TypeScript selon §10 et l'initialiser dans `main.ts`.
5. **Contrôle** : compiler (`npm run compile`), relire « Pièges à éviter », vérifier le rendu et les interactions dans un navigateur (clavier compris).
6. **Documentation** : créer ou mettre à jour la page de démo dans la bonne catégorie (§9).

---

## 1. Architecture SCSS et hiérarchie des tokens

### 1.1 Organisation des fichiers

Séparer strictement les responsabilités : outils sans sortie CSS, fondation, puis composants rangés **par domaine**, avec les mêmes catégories que `templates/docs/` (§9.2) :

| Répertoire | Contenu |
|---|---|
| `abstracts/` | `_primitives.scss` (niveau 1), `_functions.scss` (`role-color()`, `state-layer()`, `effects()`, `spatial()`…), `_mixins.scss` (`media-up()`, `focus-ring`, `type()`, `touch-target`…). À charger avec `@use '../abstracts' as *;`. |
| `foundation/` | `_fonts.scss`, `_tokens.scss` (niveau 2), `_reset.scss`, `_typography.scss`. |
| `layout/` | Grille (`_container`, `_row`, `_col`), `_footer`, layouts de page (`_app`, `_auth`, `_dashboard`). |
| `components/`, `content/`, `forms/`, `navigation/`, `feedback/` | Composants, chacun avec son `_index.scss` qui fait les `@forward`. |
| `utilities/` | Classes utilitaires (en `!important`), chargées en dernier. |
| `ds-ui-kit.scss` | Point d'entrée du design system, compilé vers `public/css/ds-ui-kit.css`. |
| `ds-docs.scss` | Styles propres à la documentation (`.docs-section`, `.docs-example`, `.docs-box`…), compilé vers `public/css/ds-docs.css` et chargé par `docs/show.html.twig` uniquement. |

Tout fichier `assets/scss/ds-*.scss` est un point d'entrée compilé automatiquement (§11).

### 1.2 Tokens à 3 niveaux (préfixe `--ds-`)

| Niveau | Fichier | Rôle | Exemples |
|---|---|---|---|
| 1. Reference Tokens | `abstracts/_primitives.scss` | Valeurs brutes : palettes de teintes, échelle de 4px, familles de polices. **Ne jamais utiliser une primitive directement dans un composant.** | Palettes, `0.25rem`, `'Inter'` |
| 2. System Tokens | `foundation/_tokens.scss` | Variables CSS sémantiques globales déclarées dans `:root` et surchargées dans `[data-ui-theme="dark"]`. | `--ds-color-primary`, `--ds-surface-container`, `--ds-space-4`, `--ds-radius-lg` |
| 3. Component Tokens | En tête du fichier du composant | Variables CSS locales mappées sur les System Tokens. Les variantes (`.btn-soft-primary`, `.btn-sm`) ne font que redéfinir ces variables, sans dupliquer de propriétés CSS. | `--btn-bg: var(--ds-color-primary);` |

### 1.3 Règles d'écriture SCSS

- Utiliser `@use` et `@forward`, **jamais** `@import` (seule exception : l'import CSS des polices dans `foundation/_fonts.scss`).
- Chaque fichier commence par `@use '../abstracts' as *;` et utilise les helpers : `role-color()`, `state-layer()`, `disabled-content()`, `effects()`, `spatial()`, `spring()`, et les mixins `type()`, `focus-ring`, `touch-target`, `media-up()` / `media-down()`, `reduced-motion`, `responsive`.
- Limiter l'imbrication à **2 niveaux** (3 uniquement pour les pseudo-états `:hover`, `:focus-visible`, `:disabled`).
- Propriétés logiques (`inline-size`, `padding-inline`, `inset-inline-start`…), sauf `height` du collapse (lue par le JS).

### 1.4 Nommage des classes

Les classes publiques gardent le nommage en kebab-case du dépôt (les templates et le JS en dépendent) ; ne pas introduire de préfixe `.ds-` ni de BEM `__`.

| Type | Convention | Exemples |
|---|---|---|
| Composant | `.{composant}` | `.btn`, `.card`, `.segmented-control` |
| Élément | `.{composant}-{élément}` | `.card-body`, `.navbar-dropdown-header`, `.sidebar-sublink` |
| Variante de rôle | `.{composant}-{rôle}`, `.{composant}-{variante}-{rôle}` | `.badge-success`, `.btn-outline-danger` |
| Taille / forme | `.{composant}-{sm|lg|full…}` | `.btn-sm`, `.segmented-control-full` |
| État | `.active`, `.show`, `.disabled`, `.is-*`, attributs ARIA | `.is-open`, `.is-selected`, `[aria-checked="true"]` |
| Rôles de couleur | `primary`, `secondary`, `tertiary`, `success`, `warning`, `info`, `danger` (token `error`) | `.alert-soft-danger` → `--ds-color-error-container` |

---

## 2. Couleurs, surfaces et contrastes

En M3 Expressive, la couleur guide l'attention et crée la hiérarchie visuelle sans dépendre d'ombres lourdes.

### 2.1 Rôles de couleurs (couple fond + texte/icône)

Chaque rôle possède sa couleur de contenu associée (`on-*`) et une version conteneur plus douce (`*-container` / `on-*-container`).

| Rôle | Tokens | Usage |
|---|---|---|
| Primary | `--ds-color-primary`, `--ds-color-on-primary`, `--ds-color-primary-container`, `--ds-color-on-primary-container` | Actions principales (CTA), éléments actifs majeurs. |
| Secondary | `--ds-color-secondary`, `--ds-color-secondary-container`, etc. | Actions secondaires, filtres, chips. |
| Tertiary | `--ds-color-tertiary`, `--ds-color-tertiary-container`, etc. | Accents expressifs, badges de nouveauté, mise en valeur éditoriale. |
| Semantic | `error`, `success`, `warning`, `info` | Toujours décliner en couple plein + `-container`. |

### 2.2 Hiérarchie des surfaces (Tonal Elevation)

Remplacer les ombres portées classiques par des niveaux de surface pour séparer les zones (containment) :

| Token | Usage |
|---|---|
| `--ds-surface` | Fond principal de la page. |
| `--ds-surface-container-low` | Sections secondaires, fonds de grilles. |
| `--ds-surface-container` | Cartes standards, barres latérales. |
| `--ds-surface-container-high` | Cartes survolées, menus, panneaux flottants. |
| `--ds-surface-container-highest` | Modales, popovers, éléments au premier plan. |
| `--ds-color-on-surface` | Texte principal. |
| `--ds-color-on-surface-variant` | Texte secondaire, icônes, placeholders. |

### 2.3 Contraste (WCAG AA)

| Élément | Ratio minimum |
|---|---|
| Texte courant (< 18px) | **4.5:1** entre le fond et le texte |
| Grand texte (≥ 18px gras ou ≥ 24px), bordures et icônes fonctionnelles | **3:1** |

Interdiction d'utiliser du gris clair sur fond blanc, ou d'abaisser l'opacité d'un texte sous `0.65` pour simuler un texte secondaire : utiliser `--ds-color-on-surface-variant`.

---

## 3. Bordures, formes et rayons (Shape System)

M3 Expressive utilise la diversité des formes et le contraste des rayons pour créer une tension visuelle dynamique.

### 3.1 Échelle des rayons

| Token | Valeur | Usage |
|---|---|---|
| `--ds-radius-none` | `0px` | — |
| `--ds-radius-xs` | `0.25rem` (4px) | Petits badges techniques, tooltips. |
| `--ds-radius-sm` | `0.5rem` (8px) | Inputs compacts, sous-conteneurs internes. |
| `--ds-radius-md` | `0.75rem` (12px) | Champs de saisie standards, menus déroulants, petites cartes. |
| `--ds-radius-lg` | `1rem` (16px) | Cartes standards, panneaux de contenu. |
| `--ds-radius-xl` | `1.5rem` à `1.75rem` (24–28px) | Modales, conteneurs majeurs, cartes Hero. |
| `--ds-radius-full` | `9999px` | Forme pilule, **obligatoire par défaut** pour les boutons, chips, badges et indicateurs de navigation actifs. |

### 3.2 Principes expressifs

- **Containment avant les bordures** : préférer un changement de surface (`--ds-surface-container` sur `--ds-surface`) à une bordure 1px systématique.
- **Usage des bordures (outline)** :
  - décorative / séparateur : `1px solid var(--ds-color-outline-variant)` (subtile) ;
  - fonctionnelle (input, bouton outlined) : `1px solid var(--ds-color-outline)` (contraste 3:1).
- **Rayons imbriqués (concentric radius)** : si un parent a un rayon `R` et un padding `P`, l'enfant proche du bord prend un rayon `r = max(0px, R - P)` pour des courbes harmonieuses.
- **Shape morphing** : un composant interactif (bouton, chip, carte sélectionnable) peut changer de `border-radius` sur `:active` ou `.is-selected` (par ex. de `--ds-radius-full` à `--ds-radius-md`) pour un retour physique expressif.
- **Anneau de focus** (`:focus-visible`) : toujours `outline: 2px solid var(--ds-color-primary); outline-offset: 2px;`. Ne jamais écrire `outline: none` sans remplacement visible.

---

## 4. Espacements : paddings, marges et grille

Tout le système spatial repose sur une grille de base de **4px** (`0.25rem`), avec un rythme principal en multiples de **8px** (`0.5rem`).

### 4.1 Échelle d'espacement (`--ds-space-*`)

| Token | Valeur | Usage |
|---|---|---|
| `--ds-space-1` | `0.25rem` (4px) | Écart micro (icône/label compact). |
| `--ds-space-2` | `0.5rem` (8px) | Gap entre éléments proches (groupe de boutons, chips), padding compact. |
| `--ds-space-3` | `0.75rem` (12px) | Padding vertical d'inputs/boutons, gap interne de liste. |
| `--ds-space-4` | `1rem` (16px) | Padding standard de carte, gouttière mobile. |
| `--ds-space-5` | `1.25rem` (20px) | Padding horizontal de bouton standard. |
| `--ds-space-6` | `1.5rem` (24px) | Padding de carte large ou de modale, espacement entre sous-sections. |
| `--ds-space-8` | `2rem` (32px) | Espacement entre sections, respiration de layout. |
| `--ds-space-12` | `3rem` (48px) | Séparation macro et blocs Hero. |

### 4.2 Règles strictes

- **Zéro marge externe sur les composants** : une classe racine (`.card`, `.btn`, `.form-control`) ne contient **jamais** de `margin` externe. L'espacement entre composants est géré par le parent via `gap` (Flexbox / CSS Grid).
- **Loi de proximité (Gestalt)** : le padding d'un conteneur est toujours supérieur ou égal au `gap` entre ses enfants directs, pour que l'œil perçoive clairement le groupe.
- **Propriétés logiques** : préférer `padding-inline` (gauche/droite) et `padding-block` (haut/bas) à `padding: X Y`.

---

## 5. Tailles, densités et cibles tactiles

Les composants partagent des hauteurs cohérentes pour s'aligner parfaitement sur une même ligne.

### 5.1 Hauteurs des contrôles (boutons, inputs, selects)

| Token | Valeur | Usage |
|---|---|---|
| `--ds-control-height-sm` | `2rem` (32px) | Interface dense, barres d'outils secondaires. |
| `--ds-control-height-md` | `2.5rem` (40px) | **Défaut** pour les formulaires et boutons standards. |
| `--ds-control-height-lg` | `3rem` (48px) | Actions principales, formulaires aérés. |
| `--ds-control-height-xl` | `3.5rem` (56px) | Bouton Hero expressif (CTA M3 Expressive). |

### 5.2 Règles

- **Cible tactile minimale** : tout élément cliquable offre une zone de clic de `2.75rem` (44px) à `3rem` (48px). Si un bouton icône mesure visuellement 32px, étendre sa zone avec un pseudo-élément `::after` ou du padding.
- **Ratio padding / hauteur (boutons pilules)** : `padding-inline` ≈ 50 % de la hauteur (hauteur 40px → `padding-inline: 20px`).
- **Largeur de lecture** : limiter les blocs de texte courant à `max-inline-size: 65ch`.

---

## 6. Typographie (échelle M3 Expressive)

Organiser la typographie en 5 rôles sémantiques, chacun décliné en `lg`, `md`, `sm`. Utiliser `rem` pour toutes les tailles et `clamp()` pour les titres fluides.

| Rôle | Usage | `font-size` | `line-height` | `font-weight` | `letter-spacing` |
|---|---|---|---|---|---|
| Display (`display-lg/md/sm`) | Moments éditoriaux, chiffres phares, bannières Hero | `clamp(2.25rem, 4vw + 1rem, 3.5rem)` | `1.12` | `700` | `-0.02em` |
| Headline (`headline-lg/md/sm`) | Titres de pages et de grandes sections | `1.5rem` (24px) à `2rem` (32px) | `1.25` | `600` à `700` | `-0.015em` |
| Title (`title-lg/md/sm`) | Titres de cartes, modales, sous-sections | `0.875rem` (14px) à `1.375rem` (22px) | `1.35` | `600` | — |
| Body (`body-lg/md/sm`) | Paragraphes et contenus longs | lg `1rem` · md `0.875rem` · sm `0.75rem` | `1.5` | `400` | `0` |
| Label (`label-lg/md/sm`) | Boutons, onglets, badges, labels de champs | lg `0.875rem` · md `0.75rem` · sm `0.6875rem` | `1.4` | `600` | `0.01em` |

Règles :

- **Sentence case par défaut** : ne pas forcer `text-transform: uppercase` sur les boutons ou les onglets. Réservé aux petits badges et aux sur-titres éditoriaux, avec `letter-spacing: 0.06em`.
- **Emphasized typography** : varier franchement la graisse (400 vs 700) et la taille entre un titre et son sous-titre pour créer une hiérarchie instantanée.

---

## 7. États interactifs (State Layers) et motion (Spring Physics)

Un composant n'est complet que si tous ses états interactifs et ses transitions sont définis.

### 7.1 State layers (calques d'état via `color-mix`)

Plutôt que d'inventer des couleurs de survol arbitraires, mélanger la couleur de fond du composant avec sa couleur de contenu (`on-*`) :

| État | Sélecteur | Règle |
|---|---|---|
| Hover | `:hover` | `background-color: color-mix(in srgb, var(--comp-bg), var(--comp-color) 8%);` |
| Focus / Active | `:active` | `background-color: color-mix(in srgb, var(--comp-bg), var(--comp-color) 12%);` |
| Disabled | `:disabled`, `[aria-disabled="true"]` | Opacité globale maîtrisée, ou fond `color-mix(in srgb, var(--ds-color-on-surface) 12%, transparent)` et texte `color-mix(in srgb, var(--ds-color-on-surface) 38%, transparent)`, avec `cursor: not-allowed` ou `pointer-events: none`. |

### 7.2 Motion expressive (spatial vs effets)

| Type | Propriétés | Courbe | Durée |
|---|---|---|---|
| Transition spatiale | `transform`, `border-radius`, dimensions, mouvement | `--ds-ease-spatial: cubic-bezier(0.2, 0, 0, 1)` ou ressort doux `cubic-bezier(0.34, 1.56, 0.64, 1)` | 250–350ms |
| Transition d'effet | `background-color`, `color`, `opacity`, `box-shadow` | `--ds-ease-effects: cubic-bezier(0, 0, 0.2, 1)` (sans rebond) | 150–200ms |

**Accessibilité** : toujours désactiver ou réduire les animations spatiales sous `@media (prefers-reduced-motion: reduce)`.

---

## 8. Template standard de composant SCSS

Lors de la génération d'un composant SCSS, suivre ce patron :

```scss
// ==========================================================================
// Component: Button (components/_button.scss)
// ==========================================================================

@use '../abstracts' as *;

.btn {
  // 1. Component Tokens (mappés sur les System Tokens)
  --btn-bg: var(--ds-color-primary);
  --btn-color: var(--ds-color-on-primary);
  --btn-border-color: transparent;
  --btn-radius: var(--ds-radius-full);
  --btn-height: var(--ds-control-height-md);
  --btn-px: var(--ds-space-5);
  --btn-font-size: var(--ds-text-label-lg);

  // 2. Box Model & Layout (zéro marge externe)
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-2);
  block-size: var(--btn-height);
  padding-inline: var(--btn-px);
  border: var(--ds-border-width) solid var(--btn-border-color);
  border-radius: var(--btn-radius);

  // 3. Typographie & Couleurs
  background-color: var(--btn-bg);
  color: var(--btn-color);
  font-size: var(--btn-font-size);
  font-weight: var(--ds-font-weight-semibold);
  line-height: 1;
  cursor: pointer;

  // 4. Motion (effets + spatial)
  transition:
    effects(background-color, color, border-color),
    spatial(border-radius, transform);

  // 5. États interactifs (calques d'état et shape morphing)
  &:hover:not(:disabled) {
    background-color: state-layer(var(--btn-bg), var(--btn-color));
  }

  &:active:not(:disabled) {
    background-color: state-layer(var(--btn-bg), var(--btn-color), 'pressed');
    border-radius: var(--ds-radius-md);
    transform: scale(0.98);
  }

  &:focus-visible {
    @include focus-ring;
  }

  &:disabled,
  &[aria-disabled='true'] {
    background-color: disabled-container();
    color: disabled-content();
    pointer-events: none;
  }

  @include reduced-motion {
    &:active:not(:disabled) {
      transform: none;
    }
  }
}

// 6. Tailles (surcharge des Component Tokens uniquement)
.btn-sm {
  --btn-height: var(--ds-control-height-sm);
  --btn-px: var(--ds-space-3);
  --btn-font-size: var(--ds-text-label-md);

  @include touch-target; // zone cliquable de 44px
}

// 7. Variantes générées pour chaque rôle
@each $role, $token in $roles {
  .btn-soft-#{$role} {
    --btn-bg: #{role-color($role, 'container')};
    --btn-color: #{role-color($role, 'on-container')};
  }
}
```

---

## 9. Documenter le composant

Chaque composant doit avoir une page de démonstration dans l'application, servie sous `/ui/docs`.

### 9.1 Fonctionnement

- `ComponentDocumentationController` (`src/Controller/`) scanne **dynamiquement** les sous-dossiers de `templates/docs/`. Chaque sous-dossier est une catégorie, et chaque fichier `_{nom}.html.twig` qu'il contient est une page.
- Les fichiers sont détectés avec le motif `^_([a-zA-Z0-9_-]+)\.html\.twig$`. Le nom extrait (`_avatar.html.twig` → `avatar`) donne :
  - l'URL : `/ui/docs/{categorie}/{nom}` (route `component_docs_show`) ;
  - le titre affiché : `ucwords` du nom, tirets et underscores remplacés par des espaces (`list-group` → « List Group »).
- Il n'y a aucune route ni aucun menu à déclarer : créer le fichier suffit. Une catégorie vide n'apparaît pas.
- La page est incluse dans `templates/docs/show.html.twig`, qui ajoute le titre, le fil d'Ariane, le chemin du fichier source et charge `js/pages/demo-ui.js`.
- Données de démo : `ComponentDocumentationService::getData($nom)` reçoit **uniquement le nom** du composant, jamais la catégorie. Le service est donc indépendant de l'arborescence : déplacer une page d'une catégorie à une autre ne demande aucune modification du service.

### 9.2 Catégories (rangement par intention d'utilisation)

Ranger chaque page selon l'**intention d'utilisation** du composant, comme le font Material Design ou Bootstrap, plutôt que dans une catégorie fourre-tout.

| Dossier | Intention | Pages existantes → sources SCSS (`assets/scss/`) |
|---|---|---|
| `getting-started/` | Prise en main | `_installation` · `_starter-packs` (pages complètes dans `getting-started/starters/`, non scanné par le contrôleur) |
| `forms/` | Saisie de données | `_form-inputs` (`input[type=text/email/password/url…]`, `textarea` → `forms/_form-control.scss`, `forms/_form-floating.scss`) · `_file-upload` (`input[type=file]` → `forms/_form-control.scss`, `forms/_previewer.scss`) · `_choices` (radio, checkbox, `select` → `forms/_form-check.scss`, `forms/_form-control.scss`) · `_custom-choices` (selectable cards, toggle → `forms/_selectable-card.scss`, `forms/_form-check.scss`) · `_form-validation` (messages d'erreur et de succès → `forms/_form-validation.scss`) · `_chip` (→ `forms/_chip.scss`) · `_segmented-control` (→ `forms/_segmented-control.scss`, JS `interactions/components/segmented-control.ts`) · `_md-editor` (→ `forms/_md-editor.scss`, JS `interactions/components/md-editor.ts`) |
| `grid/` | Structure de page | `_col` (→ `layout/_col.scss`, `layout/_row.scss`) · `_container` (→ `layout/_container.scss`) · `_footer` (→ `layout/_footer.scss`) |
| `navigation/` | Déplacements dans l'app | `_breadcrumb` (→ `navigation/_breadcrumb.scss`) · `_nav-tabs` (nav et nav-tabs → `navigation/_nav.scss`) · `_navbar` (→ `navigation/_navbar.scss`, `navigation/_navbar-user.scss` : `.navbar-end`, `.navbar-dropdown`) · `_pagination` (→ `navigation/_pagination.scss`) · `_sidebar` (→ `navigation/_sidebar.scss` : sections, sous-menu sur un niveau) |
| `feedback/` | Retours visuels et surcouches | `_alert` (→ `feedback/_alert.scss`) · `_toast` (→ `feedback/_toast.scss`) · `_modal` (→ `feedback/_dialog.scss`) |
| `components/` | Blocs UI autonomes | `_accordion` · `_badge` · `_box` · `_btn-close` · `_button` · `_card` · `_collapse` · `_dropdown` · `_hero` · `_jumbotron` · `_list-group` (→ `components/_{nom}.scss`) |
| `content/` | Éléments statiques | `_avatar` · `_code` · `_gallery` · `_images-figures` (→ `content/_image.scss`, `content/_figure.scss`) · `_table` (→ `content/_{nom}.scss`) · `_typography` (→ `foundation/_typography.scss`) |
| `utilities/` | Ajustements cosmétiques | `_background` · `_grid` · `_icons` · `_spacing` · `_text` (→ `utilities/_{nom}.scss`) |
| `features/` | Fonctionnalités JavaScript | `_clipboard` · `_form-manager` · `_markdown` · `_theme` (→ `assets/ts/services/theme.ts`, `interactions/components/theme-switch.ts`) |

Pages prévues mais pas encore créées ou pas encore au nouveau format :

- `utilities/` : `_border`, `_columns`, `_display`, `_flex`, `_gap`, `_link`, `_object-fit`, `_shadow`, `_sizing` (à créer) ; `_background`, `_grid`, `_icons`, `_spacing`, `_text` (à réécrire) ;
- `navigation/` : `_breadcrumb`, `_nav-tabs`, `_pagination` (à réécrire) ;
- `features/` : `_clipboard`, `_form-manager`, `_markdown` (à réécrire).

Le previewer de fichiers (`forms/_previewer.scss`) est documenté dans `_file-upload`.

### 9.3 Créer une page de documentation (format « Bootstrap »)

1. Choisir la catégorie selon l'intention d'utilisation (tableau ci-dessus). Ne créer une nouvelle catégorie que si aucune ne convient.
2. Créer `templates/docs/{categorie}/_{nom}.html.twig`, avec un nom en kebab-case **unique dans toutes les catégories**.
3. Structure : un commentaire de sources, un `.component-demo` avec un chapô `.docs-lead`, puis une `<section class="docs-section" id="…">` par variante (`<h3>`, un court `<p>`, l'exemple). Finir par « Personnalisation » (tableau des Component Tokens) et « Classes ».
4. Chaque exemple passe par `docs/_example.html.twig` : le même balisage sert d'aperçu en direct **et** d'extrait de code, ils ne peuvent pas diverger. Écrire le balisage à la colonne 0 dans le `{% set %}` et générer les variantes par boucle Twig.
5. Tableaux de référence (classes, tokens, options) : `docs/_reference.html.twig` (`rows`, `headers`).
6. Code TypeScript ou extrait sans aperçu : inclure directement `fragments/components/_code-block.html.twig`.
7. Données de démo (images, listes) : de préférence en `{% set %}` dans la page ; sinon une branche dans `ComponentDocumentationService::getData()`.
8. Démos qui ont besoin de JS propre à la doc : attributs `data-demo-*` gérés par `assets/ts/pages/demo-ui.ts`.

```twig
{# Docs : Badge — source : assets/scss/components/_badge.scss #}
{% set roles = ['primary', 'secondary', 'tertiary', 'success', 'warning', 'info', 'danger'] %}

<div class="component-demo">
  <p class="docs-lead">Petites étiquettes en pilule pour un statut ou un compteur.</p>

  <section class="docs-section" id="solid">
    <h3>Solid</h3>
    <p>Fond plein du rôle.</p>
{% set code %}
{% for role in roles %}
<span class="badge badge-solid-{{ role }}">{{ role|capitalize }}</span>
{% endfor %}
{% endset %}
    {% include 'docs/_example.html.twig' with { code: code, layout: 'stack' } only %}
  </section>
</div>
```

Paramètres de `_example.html.twig` : `code` (obligatoire), `preview` (rendu différent de l'extrait, ex. une iframe), `layout` (`stack`, `column`, `center`, `flush`, `tall`, `surface`, `contained` pour une sidebar fixe, `menu` pour un menu montré ouvert), `title`, `language`. Inclure toujours avec `only`.

### 9.4 Starter packs

`getting-started/_starter-packs` affiche des pages complètes (blog/app avec et sans hero, authentification, dashboard) dans des iframes `srcdoc`, avec leur code copiable. Les sources sont dans `templates/docs/getting-started/starters/` (sous-dossier non scanné) : `_head.html.twig` (ressources et script de thème communs), `_account-menu.html.twig`, `_blog.html.twig`, `_auth.html.twig`, `_dashboard.html.twig`. Un starter n'utilise que des composants documentés.

### 9.5 Règles

- **Un nom = une page** : comme le service ne reçoit que le nom, deux fichiers portant le même nom dans deux catégories différentes recevraient les mêmes données. Garder les noms uniques.
- **Pas de doublon de page** : un composant n'est documenté que dans une seule catégorie (par ex. `_alert` dans `feedback/`, pas aussi dans `components/`).
- **Pages placées à la racine** de `templates/docs/` : elles ne sont pas scannées. Les réserver aux partials techniques de la doc (fil d'Ariane, layout).
- **Nommer la page d'après l'usage** quand elle regroupe plusieurs fichiers SCSS (`_images-figures`, `_custom-choices`), et d'après le fichier SCSS sinon.

---

## 10. Interactions TypeScript

### 10.1 Organisation (`assets/ts/`)

| Emplacement | Contenu |
|---|---|
| `main.ts` | Point d'entrée chargé sur toutes les pages : clic délégué (`data-ds-toggle`, `data-ds-dismiss`), Échap, copie, Markdown, puis `initSegmentedControls()`, `initThemeSwitches()`, `initMarkdownEditors()`. |
| `interactions/events/` | Gestionnaires délégués : `toggle.ts` (dropdown, collapse, accordion, sidebar, modal), `dismiss.ts` (fermetures, Échap). |
| `interactions/components/` | Comportement d'un composant : `modal.ts`, `segmented-control.ts`, `md-editor.ts`, `theme-switch.ts`. |
| `services/` | État partagé, instance unique : `theme.ts` (`themeService`). |
| `components/` | Classes qui créent du DOM : `Alert.ts`, `Toast.ts`. |
| `pages/` | Un script par page (`demo-ui.ts` pour la doc), point d'entrée à part. |

Alias : `@/…` → `assets/ts/…`, `@components/…`. Librairie utilitaire : `core-ts` (`$`, `createElement`, `FormManager`, presse-papier, `convertMarkdownToHtml`).

### 10.2 Conventions

- **Vanilla TypeScript strict**, aucun framework ; types exportés pour les contrats (`ThemeMode`, `SegmentedChangeDetail`, `AlertType`…).
- **Activation par attributs** : `data-ds-toggle`, `data-ds-target`, `data-ds-dismiss`, `data-ds-theme-switch`, `data-ds-md-editor`, `data-md-*`. Jamais de JS en ligne dans les templates (seule exception : le script de thème du `<head>`).
- **Délégation** : un listener sur `document`, posé une seule fois (garde `listening`), pour que les éléments ajoutés plus tard fonctionnent. Les fonctions `init*(root = document)` sont idempotentes (marqueur `data-*-ready`).
- **Communication par événements** `ds:*` émis sur l'élément (`bubbles: true`) : `ds:change` (SegmentedControl), `ds:open` / `ds:close` (dialog), `ds:theme-change` (document).
- **État dans le DOM** : classes d'état (`.show`, `.is-open`, `.collapsing`) et attributs ARIA (`aria-expanded`, `aria-checked`) tenus à jour par le JS ; le SCSS ne lit que ces états.
- **Accessibilité** : navigation clavier (flèches, Début, Fin, Échap), tabulation itinérante dans les groupes, focus rendu au déclencheur, `prefers-reduced-motion` respecté.
- **Robustesse** : attendre une transition CSS avec un filtre sur `event.target` et `propertyName`, plus un délai de secours ; `localStorage` toujours dans un `try/catch` ; modifier un champ via `execCommand('insertText')` pour garder l'historique d'annulation.

### 10.3 Service de thème

`themeService` (`services/theme.ts`) gère `'auto' | 'light' | 'dark'` : stockage `localStorage` (clé `ds-theme`), thème résolu sur `<html data-ui-theme>`, suivi de `prefers-color-scheme` en auto, synchronisation entre onglets, `subscribe()` et événement `ds:theme-change`. Tout SegmentedControl `[data-ds-theme-switch]` (options `auto`, `light`, `dark`) y est relié. Le script du `<head>` de `base.html.twig` (et de `starters/_head.html.twig`) applique le thème avant le premier rendu : même clé, mêmes valeurs.

---

## 11. Build et outillage

| Commande | Effet |
|---|---|
| `npm run dev` | Watch SCSS (recompile seulement les points d'entrée touchés) et TS en parallèle. |
| `npm run compile` | Compilation de développement (source maps). |
| `npm run build` | Compilation minifiée ; code de sortie 1 en cas d'erreur. |

- `scripts/compile-scss.js` : chaque `assets/scss/ds-*.scss` → `public/css/{nom}.css`.
- `scripts/compile-ts.js` (esbuild) : points d'entrée `main.ts` et `pages/*.ts`, code partagé extrait dans `public/js/chunks/` (scripts chargés en `type="module"`), fichiers obsolètes nettoyés.
- `public/css` et `public/js` sont des sorties de build (ignorées par git).
- Installation avec npm 12 : `.npmrc` (`allow-git=root` pour `core-ts`) et `allowScripts` dans `package.json` (esbuild autorisé).

---

## Pièges à éviter

| ❌ À éviter | ✅ À faire |
|---|---|
| **Valeurs en dur (magic numbers)** : couleurs hexadécimales (`#...`), px arbitraires (`padding: 13px`), `border-radius: 7px` dans un composant. | Tout passe par un token `--ds-*`. |
| **Marges sur les composants** : `margin-bottom` ou `margin-top` sur un composant atomique ou moléculaire. | Utiliser `gap` sur le parent. |
| **Abus de `box-shadow`** pour créer de la profondeur. | Gérer la profondeur par la couleur de surface (`--ds-surface-container-*`). Réserver les ombres aux éléments flottants au-dessus du flux (modales, popovers, FAB). |
| **`transition: all 0.3s ease`** | Cibler explicitement les propriétés (`background-color`, `border-radius`, `transform`) avec la bonne courbe (spatiale ou d'effet). |
| **Imbrication SCSS excessive** : `.card { .card-header { .card-title { span { ... } } } }`, qui génère un CSS lourd et difficile à surcharger. | Rester à 2 niveaux (3 pour les pseudo-états) avec des classes BEM plates. |
| **`outline: none`** sur un élément focusable. | Anneau de focus `outline: 2px solid var(--ds-color-primary); outline-offset: 2px;`. |
| **Composant sans page de démo** ou page rangée par type technique. | Créer la page dans la catégorie correspondant à son intention d'utilisation (§9). |
| **Renommer une classe publique** ou introduire un préfixe `.ds-` / du BEM `__`. | Garder le nommage existant (§1.4) : templates et JS en dépendent. |
| **Supprimer une transition** dont le JS attend la fin (collapse). | La raccourcir (1ms) sous `prefers-reduced-motion`, et prévoir un délai de secours côté JS. |
| **`display` d'un composant qui écrase l'attribut `hidden`.** | Le reset impose `[hidden] { display: none !important; }` : s'appuyer dessus. |
| **Listener posé sur chaque élément** ou initialisation appelée deux fois. | Délégation sur `document` avec garde, `init*()` idempotentes (§10.2). |
| **HTML injecté sans contrôle** (aperçu Markdown, contenu utilisateur). | Nettoyer (DOMPurify…) tout contenu qui ne vient pas de l'utilisateur courant. |
| **Exemple de doc écrit deux fois** (aperçu et code séparés). | Passer par `docs/_example.html.twig` (§9.3). |
