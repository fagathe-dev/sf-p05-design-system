# Guide d'implémentation du Design System « Base UI » dans un projet Symfony

> **Destinataire : un agent IA** chargé d'intégrer ce design system dans un projet HTML/PHP Symfony (Twig).
> Ce document est autoporteur : il décrit les fichiers à copier, la chaîne de build, l'intégration Twig,
> l'API de classes, les comportements JavaScript et les règles à respecter. En cas de doute, le code source
> du design system fait foi (`assets/scss`, `assets/ts`, `templates/`), et les pages de démonstration
> `/ui/docs/{catégorie}/{composant}` du dépôt source montrent chaque variante avec son extrait de code.

---

## 0. Rôle et règles d'or

Tu interviens **en tant qu'expert développeur frontend TypeScript / SCSS**. Tout code que tu produis
(Twig, SCSS, TS) doit se lire comme le code existant : mêmes noms, même densité de commentaires (en
français), mêmes idiomes.

1. **Pas de CSS ad hoc dans les templates.** Compose avec les classes existantes (composants + utilitaires).
   Jamais d'attribut `style` pour la couleur, l'espacement ou la typographie.
2. **Jamais de valeur en dur** (couleur hexadécimale, `px`, `ms`) dans le SCSS d'un composant : uniquement
   des System Tokens `var(--ds-*)` ou des fonctions/mixins de `abstracts/`.
3. **Pas de JavaScript inline** (`onclick`, `<script>` dans une page) : les comportements passent par les
   attributs `data-ds-*` lus par `main.js` (délégation d'événements).
4. **Accessibilité non négociable** : `aria-*` corrects, `aria-label` sur tout bouton sans texte, labels
   reliés aux champs, focus visible conservé.
5. **Ne pas renommer les classes** : le JS, la doc et les templates en dépendent. Pas de préfixe `.ds-`, pas
   de BEM (exception historique : `.md-editor--compact`).
6. **Ne pas modifier `public/css` ni `public/js`** : ce sont des sorties de build (ignorées par git).

---

## 1. Vue d'ensemble

| Élément | Choix |
|---|---|
| Back-end | Symfony 8.x, Twig, PHP 8.4 |
| Styles | Dart Sass (modules `@use` / `@forward`), tokens M3, formes et densité inspirées de Tailwind/Flowbite, thème clair/sombre |
| Scripts | TypeScript strict, bundlé par esbuild (ESM, code splitting) |
| Utilitaires JS | bibliothèque `core-ts` (`github:fagathe-dev/core-ts`) : `$`, `createElement`, `FormManager`, presse-papier, Markdown… |
| Icônes | `public/assets/ds-icons.css` : Remix Icon (`ri-*`, à privilégier), MDI (`mdi`), Boxicons (`bx`), Line Awesome (`la*`) |
| Polices | Inter (texte) et Fira Code (code), chargées depuis Google Fonts par `foundation/_fonts.scss` |
| Intégration | Fichiers compilés dans `public/`, référencés avec `asset()` — **ni AssetMapper/importmap, ni Webpack Encore** |

Principe : le SCSS et le TS sont compilés par deux scripts Node (`scripts/compile-scss.js`,
`scripts/compile-ts.js`) vers `public/css/*.css` et `public/js/*.js`. Twig n'a qu'à inclure ces fichiers.

---

## 2. Installation dans le projet cible

### 2.1 Fichiers à copier

| Source (dépôt du design system) | Destination (projet cible) | Remarque |
|---|---|---|
| `assets/scss/` | `assets/scss/` | Tout le dossier. `ds-docs.scss` et `ui-component-docs.md` sont facultatifs (doc uniquement) |
| `assets/ts/` | `assets/ts/` | Sans `pages/demo-ui.ts` (démo de la doc) |
| `scripts/compile-scss.js`, `scripts/compile-ts.js` | `scripts/` | Inchangés |
| `public/assets/ds-icons.css` + `public/assets/fonts/` | `public/assets/` | Polices d'icônes, à versionner |
| `templates/base.html.twig` | `templates/base.html.twig` | Ou fusionner (§4) |
| `templates/layouts/*.html.twig` | `templates/layouts/` | app, auth, dashboard |
| `templates/fragments/*.html.twig` | `templates/fragments/` | navbar, sidebar, footer, flash, menu du compte |
| `templates/fragments/components/_code-block.html.twig` | idem | Seulement si le projet affiche du code |
| `.npmrc` | racine | `allow-git=root` (voir 2.2) |

Ne copie pas `templates/docs/`, `ComponentDocumentationController` ni `LayoutController` : ils servent à la
documentation du design system.

### 2.2 `package.json`, `.npmrc`, `tsconfig.json`

Fusionne dans le `package.json` du projet :

```json
{
  "scripts": {
    "build:ts": "node scripts/compile-ts.js --mode build",
    "build:scss": "node scripts/compile-scss.js --mode build",
    "build": "concurrently --kill-others-on-fail -n ts,scss -c blue,magenta \"npm:build:ts\" \"npm:build:scss\"",
    "compile:ts": "node scripts/compile-ts.js",
    "compile:scss": "node scripts/compile-scss.js",
    "compile": "concurrently --kill-others-on-fail -n ts,scss -c blue,magenta \"npm:compile:ts\" \"npm:compile:scss\"",
    "dev:ts": "node scripts/compile-ts.js --watch",
    "dev:scss": "node scripts/compile-scss.js --watch",
    "dev": "concurrently -n ts,scss -c blue,magenta \"npm:dev:ts\" \"npm:dev:scss\""
  },
  "devDependencies": {
    "concurrently": "^9.2.1",
    "esbuild": "^0.28.0",
    "sass": "^1.99.0",
    "typescript": "^6.0.3"
  },
  "dependencies": {
    "core-ts": "github:fagathe-dev/core-ts#master"
  },
  "allowScripts": {
    "esbuild": true,
    "@parcel/watcher": false
  }
}
```

- `.npmrc` doit contenir `allow-git=root`, sinon npm ≥ 12 refuse la dépendance Git `core-ts` (`EALLOWGIT`).
- `allowScripts` autorise le script d'installation d'esbuild (binaire natif), indispensable.
- `tsconfig.json` doit déclarer les alias utilisés par les imports :

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "paths": {
      "@/*": ["./assets/ts/*"],
      "@components/*": ["./assets/ts/components/*"]
    }
  },
  "include": ["assets/ts/**/*.ts"]
}
```

> esbuild lit ces `paths`. TypeScript 6 déprécie `moduleResolution: "node"` et `baseUrl` : utilise
> `"bundler"` et des chemins relatifs à la racine comme ci-dessus.

Ajoute au `.gitignore` : `/public/css/` et `/public/js/`.

### 2.3 Build

| Commande | Effet |
|---|---|
| `npm install` | Dépendances (dont `core-ts` depuis GitHub) |
| `npm run dev` | Watch SCSS + TS, source maps, recompilation incrémentale |
| `npm run compile` | Compilation unique, mode dev (non minifié, source maps) |
| `npm run build` | Production : CSS compressé, JS minifié, pas de source maps, code de sortie 1 en cas d'erreur |

Sorties :

- **SCSS** : chaque `assets/scss/ds-*.scss` → `public/css/{nom}.css`. Seuls les fichiers préfixés `ds-` sont
  des points d'entrée ; les partiels commencent par `_`. En watch, seule l'entrée qui importe le fichier
  modifié est recompilée.
- **TS** : `assets/ts/main.ts` → `public/js/main.js`, et chaque `assets/ts/pages/*.ts` →
  `public/js/pages/*.js`. Les modules partagés vont dans `public/js/chunks/[name]-[hash].js` (code
  splitting), ce qui garantit **une seule instance** des singletons (ex. `themeService`) entre `main.js` et
  les scripts de page. Les anciens fichiers de sortie sont supprimés à chaque build.

En déploiement : `npm ci && npm run build` avant `cache:clear`. Les fichiers étant servis tels quels
depuis `public/`, aucun `asset-map:compile` n'est nécessaire.

> **AssetMapper** : si le projet cible l'a activé, son préfixe public par défaut est `/assets/`, comme
> `public/assets/ds-icons.css`. Ne mappe pas `assets/scss` ni `assets/ts` dans AssetMapper et ne remplace pas
> `asset('js/main.js')` par `importmap()`. Le plus simple est de ne pas utiliser AssetMapper pour le design
> system.

---

## 3. Architecture des sources

### 3.1 SCSS (`assets/scss/`)

```
abstracts/     Sass pur, aucune sortie CSS : _primitives (palettes, échelles), _functions, _mixins
foundation/    _fonts, _tokens (System Tokens --ds-*, clair + sombre), _reset, _typography
layout/        _container, _row, _col, _footer, _app, _auth, _dashboard
components/    _btn-close, _collapse, _button, _badge, _box, _card, _accordion, _dropdown, _list-group, _hero, _jumbotron
content/       _avatar, _code, _gallery, _image, _figure, _table
forms/         _form-control, _form-check, _form-floating, _selectable-card, _chip, _segmented-control, _md-editor, _form-validation (en dernier)
navigation/    _breadcrumb, _nav, _navbar, _navbar-user, _pagination, _sidebar
feedback/      _alert, _toast, _dialog
utilities/     background, shadow, border, display, flex, gap, grid, columns, sizing, icons, link, object-fit, spacing, text
ds-ui-kit.scss Point d'entrée de production (→ public/css/ds-ui-kit.css)
ds-docs.scss   Point d'entrée de la documentation (classes .docs-*) : ne pas l'inclure dans l'application
```

Chaque dossier a un `_index.scss` qui `@forward` ses partiels ; `ds-ui-kit.scss` les `@use` dans l'ordre
foundation → layout → components → content → forms → navigation → feedback → utilities (les utilitaires
gagnent les conflits).

Les tokens sont organisés sur **3 niveaux** :

| Niveau | Où | Exemple | Usage |
|---|---|---|---|
| Primitives | `abstracts/_primitives.scss` (Sass) | `$olive`, `$spacing`, `$breakpoints` | Jamais dans un composant, seulement pour générer les tokens |
| System Tokens | `foundation/_tokens.scss` (CSS) | `--ds-color-primary`, `--ds-space-4` | Partout |
| Component Tokens | en tête de chaque composant | `--btn-bg`, `--navbar-px` | Seul point de personnalisation d'un composant |

### 3.2 TypeScript (`assets/ts/`)

```
main.ts                                  Point d'entrée global (délégation des clics, Échap, initialisations)
interactions/events/toggle.ts            data-ds-toggle : dropdown, collapse, accordion, sidebar, modal/dialog
interactions/events/dismiss.ts           data-ds-dismiss : alert, toast, modal/dialog, sidebar ; touche Échap
interactions/components/modal.ts         openDialog(), closeDialog() (<dialog> natif)
interactions/components/segmented-control.ts  initSegmentedControls(), selectSegment(), getSegmentValue()
interactions/components/theme-switch.ts  Relie [data-ds-theme-switch] au service de thème
interactions/components/md-editor.ts     initMarkdownEditors() : éditeur [data-ds-md-editor]
services/theme.ts                        themeService : 'auto' | 'light' | 'dark'
components/Alert.ts, Toast.ts            Création programmatique d'alertes et de toasts (index.ts les réexporte)
pages/*.ts                               Un point d'entrée par page qui a besoin de JS spécifique
```

`main.ts`, au `DOMContentLoaded` :
1. pose **un seul** listener `click` délégué sur `document` (`[data-ds-dismiss]`, `[data-ds-toggle]`, clic
   extérieur qui ferme les dropdowns, clic sur le backdrop d'une `dialog.modal`) ;
2. pose le listener `keydown` (Échap) ;
3. appelle `initClipboardHandlers()` (core-ts : boutons `[data-copy-target]`) ;
4. convertit en HTML le texte de chaque `[data-markdown]` ;
5. appelle `initSegmentedControls()`, `initThemeSwitches()`, `initMarkdownEditors()`.

---

## 4. Intégration Twig

### 4.1 `base.html.twig`

```twig
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{% block title %}Mon application{% endblock %}</title>

  {# Thème appliqué avant le premier rendu (pas de flash clair → sombre).
     Même clé et mêmes valeurs que assets/ts/services/theme.ts #}
  <script>
    (function () {
      var mode = 'auto';
      try { mode = localStorage.getItem('ds-theme') || 'auto'; } catch (e) {}
      var dark = mode === 'dark' || (mode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.setAttribute('data-ui-theme', dark ? 'dark' : 'light');
    })();
  </script>

  <link rel="stylesheet" href="{{ asset('assets/ds-icons.css') }}">
  <link rel="stylesheet" href="{{ asset('css/ds-ui-kit.css') }}">
  {% block stylesheets %}{% endblock %}
</head>
<body>
  {% block body %}{% endblock %}

  <script type="module" src="{{ asset('js/main.js') }}"></script>
  {% block javascripts %}{% endblock %}
</body>
</html>
```

Règles :
- Le script de thème **reste en ligne dans `<head>`**, avant les feuilles de style. C'est le seul script en
  ligne autorisé. Si une CSP est en place, ajoute-lui un nonce ou un hash.
- `main.js` est chargé en `type="module"` (ESM, différé par nature).
- Le `base.html.twig` d'origine utilise une globale Twig `favicon_path` (`config/packages/twig.yaml`) :
  déclare-la, ou retire la ligne `<link rel="shortcut icon">`.
- JS propre à une page : crée `assets/ts/pages/ma-page.ts` (il est compilé automatiquement), puis :

```twig
{% block javascripts %}
  <script type="module" src="{{ asset('js/pages/ma-page.js') }}"></script>
{% endblock %}
```

### 4.2 Layouts de page

Trois layouts étendent `base.html.twig`. Une page choisit son layout et remplit `{% block content %}`.

**`layouts/app.html.twig`** : site public, blog, application simple.

```twig
{% extends 'base.html.twig' %}
{% block body %}
<div class="layout-app">                          {# header collant, footer poussé en bas #}
  {% include 'fragments/_navbar_app.html.twig' %} {# <header class="app-header"><nav class="navbar…"> #}
  <main class="app-main">
    <div class="container">
      {% include 'fragments/_flash_messages.html.twig' %}
      {% block content %}{% endblock %}
    </div>
  </main>
  {% include 'fragments/_footer_app.html.twig' %} {# <footer class="app-footer footer…"> #}
</div>
{% endblock %}
```

**`layouts/auth.html.twig`** : connexion, inscription, mot de passe oublié. Blocs : `auth_header`,
`content`, `auth_footer`.

```twig
<div class="layout-auth">
  <main class="auth-card">
    <header class="auth-header">{% block auth_header %}{% endblock %}</header>
    <div class="auth-body">
      {% include 'fragments/_flash_messages.html.twig' %}
      {% block content %}{% endblock %}
    </div>
    <footer class="auth-footer">{% block auth_footer %}{% endblock %}</footer>
  </main>
</div>
```

Onglets Connexion/Inscription : `<nav class="auth-tabs"><a class="auth-tab active" aria-current="page">…`.
Séparateur : `<div class="auth-divider"><span>ou</span></div>`.

**`layouts/dashboard.html.twig`** : back-office.

```twig
<div class="layout-dashboard">
  <div class="dashboard-overlay" data-ds-dismiss="sidebar"></div>  {# voile mobile, ferme le tiroir #}
  {% include 'fragments/_sidebar_dashboard.html.twig' %}           {# <aside class="dashboard-sidebar"> #}
  <div class="dashboard-main">
    {% include 'fragments/_navbar_dashboard.html.twig' %}          {# <header class="dashboard-header"> #}
    <main class="dashboard-content">
      {% include 'fragments/_flash_messages.html.twig' %}
      {% block content %}{% endblock %}
    </main>
  </div>
</div>
```

Sidebar fixe à partir de `lg`, tiroir en dessous (ouvert par `data-ds-toggle="sidebar"`, qui pose
`.is-open` sur `.dashboard-sidebar` et `.is-visible` sur `.dashboard-overlay`).

### 4.3 Fragments

| Fragment | Contenu | À adapter |
|---|---|---|
| `_navbar_app.html.twig` | Hamburger à gauche, marque, liens repliables, `.navbar-end` à droite | Liens réels (`path()`), état actif. **Retirer les conditions `app.environment == 'dev'`**, propres au dépôt source |
| `_navbar_auth_dropdown.html.twig` | Avatar + menu du compte (`.navbar-dropdown`) avec sélecteur de thème | Nom, email, initiales depuis `app.user`, routes profil et déconnexion |
| `_navbar_dashboard.html.twig` | Topbar : hamburger, recherche, notifications, menu du compte | Ajouter `aria-label` et `btn-ghost-secondary` au bouton hamburger (voir §12) |
| `_sidebar_dashboard.html.twig` | Sections titrées, liens, sous-menu à un niveau | Menu réel, état actif |
| `_flash_messages.html.twig` | `app.flashes` → `.alert.alert-soft-{type}` fermables | Mapper aussi `notice` (voir §9.2) |
| `_footer_app.html.twig` | Pied de page | Liens légaux |

Lien actif dans la navbar ou la sidebar, à partir de la route courante :

```twig
{% set route = app.request.attributes.get('_route') %}
<a href="{{ path('app_article_index') }}"
   class="nav-link{{ route starts with 'app_article_' ? ' active' }}"
   {{ route starts with 'app_article_' ? 'aria-current="page"' }}>Articles</a>
```

Menu du compte branché sur l'utilisateur :

```twig
{% set user = app.user %}
{% set initials = user.userIdentifier|slice(0, 1)|upper %}
<div class="dropdown">
  <button type="button" class="navbar-user-trigger dropdown-toggle" data-ds-toggle="dropdown" aria-expanded="false" aria-label="Menu du compte">
    <span class="avatar avatar-sm" aria-hidden="true">{{ initials }}</span>
    <span class="user-info">
      <span class="user-name">{{ user.userIdentifier }}</span>
      <span class="user-role">Membre</span>
    </span>
  </button>
  <div class="dropdown-menu navbar-dropdown dropdown-menu-end">
    <div class="navbar-dropdown-header">
      <span class="avatar avatar-sm" aria-hidden="true">{{ initials }}</span>
      <span class="navbar-dropdown-user">
        <span class="navbar-dropdown-name">{{ user.userIdentifier }}</span>
        <span class="navbar-dropdown-meta">Membre</span>
      </span>
    </div>
    <div class="dropdown-divider"></div>
    <a class="dropdown-item" href="{{ path('app_profile') }}"><i class="ri-user-line"></i> Profil</a>
    <div class="dropdown-divider"></div>
    <div class="navbar-dropdown-section">
      <span class="navbar-dropdown-label" id="navbar-theme-label">Thème</span>
      <div class="segmented-control segmented-control-sm segmented-control-full" role="radiogroup" aria-labelledby="navbar-theme-label" data-ds-theme-switch>
        <button type="button" class="segmented-control-option" role="radio" aria-checked="true" data-value="auto" aria-label="Automatique"><i class="ri-computer-line"></i></button>
        <button type="button" class="segmented-control-option" role="radio" aria-checked="false" data-value="light" aria-label="Clair"><i class="ri-sun-line"></i></button>
        <button type="button" class="segmented-control-option" role="radio" aria-checked="false" data-value="dark" aria-label="Sombre"><i class="ri-moon-line"></i></button>
      </div>
    </div>
    <div class="dropdown-divider"></div>
    <a class="dropdown-item" href="{{ path('app_logout') }}"><i class="ri-logout-box-r-line"></i> Déconnexion</a>
  </div>
</div>
```

> Le `.dropdown-menu` doit être **le frère qui suit immédiatement** le déclencheur : le JS le trouve avec
> `nextElementSibling`.

---

## 5. Tokens et thème

### 5.1 System Tokens disponibles (`--ds-*`)

| Famille | Tokens |
|---|---|
| Rôles de couleur | `--ds-color-{primary,secondary,tertiary,success,warning,info,error}`, `--ds-color-on-{rôle}`, `--ds-color-{rôle}-container`, `--ds-color-on-{rôle}-container` |
| Surfaces | `--ds-surface`, `--ds-surface-container-{low,∅,high,highest}` (`--ds-surface-container` sans suffixe), `--ds-color-on-surface`, `--ds-color-on-surface-variant`, `--ds-color-inverse-surface`, `--ds-color-inverse-on-surface` |
| Contours | `--ds-color-outline`, `--ds-color-outline-variant`, `--ds-border-width`, `--ds-border-width-thick` |
| Divers couleur | `--ds-color-scrim`, `--ds-color-on-scrim`, `--ds-color-shadow`, `--ds-color-white`, `--ds-color-black`, `--ds-code-*` (coloration syntaxique) |
| Espacement (grille 4px) | `--ds-space-{0,0_5,1,1_5,2,2_5,3,3_5,4,5,6,7,8,9,10,12,16,20,24}` (`4` = 1rem) |
| Rayons | `--ds-radius-{none,xs,sm,md,lg,xl,full}` |
| Typographie | `--ds-font-sans`, `--ds-font-mono`, `--ds-font-weight-{regular,medium,semibold,bold}`, `--ds-text-{display,headline,title,body,label}-{lg,md,sm}`, `--ds-line-height-*`, `--ds-letter-spacing-*` |
| Contrôles | `--ds-control-height-{sm,md,lg,xl}` (32/40/48/56px), `--ds-touch-target` (44px), `--ds-icon-size-{xs,sm,md,lg,xl}` |
| Mises en page | `--ds-container-{sm…xxl}`, `--ds-size-{reading,menu,menu-lg,sidebar,sidebar-collapsed,topbar,dialog,toast,auth-card,search,…}` |
| Élévation | `--ds-shadow-{sm,md,lg,inset}` |
| États | `--ds-state-{hover,pressed,stripe,disabled-container,disabled-content}`, `--ds-opacity-disabled` |
| Mouvement | `--ds-duration-{effects,effects-slow,spatial,spatial-slow}`, `--ds-ease-{effects,spatial,spring}` |
| Focus | `--ds-focus-ring-{color,width,offset}` |
| Plans | `--ds-z-{dropdown,sticky,overlay,drawer,modal,toast}` |

Le rôle **`danger`** des classes (`.btn-danger`, `.alert-soft-danger`) correspond au token `error`.

Points de rupture (Sass seulement) : `sm` 576, `md` 768, `lg` 992, `xl` 1200, `xxl` 1400 px.

### 5.2 Thème clair/sombre

- Le thème est piloté par `data-ui-theme="light|dark"` sur `<html>` ; les tokens sombres sont redéfinis
  sous `[data-ui-theme='dark']`. Un sous-arbre peut forcer un thème avec ce même attribut.
- Le choix de l'utilisateur (`auto`, `light`, `dark`) est stocké dans `localStorage['ds-theme']`. En `auto`, le thème suit
  `prefers-color-scheme` en direct.
- Interface : un `.segmented-control[data-ds-theme-switch]` avec des options `data-value="auto|light|dark"`
  suffit (voir §4.3) ; il se synchronise avec tous les autres sélecteurs et les autres onglets.
- En TS : `themeService.setMode('dark')`, `themeService.getState()`, `themeService.subscribe(fn)`, ou
  l'événement `document` `ds:theme-change` (`detail: { mode, theme }`).

### 5.3 Personnaliser la marque

Redéfinis les System Tokens dans une feuille chargée **après** `ds-ui-kit.css` (bloc `stylesheets`), ou
dans un `ds-app.scss` compilé par le même script :

```scss
// assets/scss/ds-app.scss → public/css/ds-app.css
:root {
  --ds-color-primary: #3d5afe;
  --ds-color-on-primary: #fff;
  --ds-color-primary-container: #dde1ff;
  --ds-color-on-primary-container: #001257;
}

[data-ui-theme='dark'] {
  --ds-color-primary: #b9c3ff;
  --ds-color-on-primary: #00218b;
}
```

Pour un seul composant, surcharge ses Component Tokens localement : `.ma-zone .btn { --btn-radius: var(--ds-radius-sm); }`.

---

## 6. Conventions de classes

- Rôles : `primary`, `secondary`, `tertiary`, `success`, `warning`, `info`, `danger`.
- Variantes de couleur selon le composant :
  - Boutons : `.btn-{rôle}` = `.btn-solid-{rôle}`, `.btn-soft-{rôle}`, `.btn-outline-{rôle}`, `.btn-ghost-{rôle}`
  - Alertes : `.alert-{rôle}` = `.alert-soft-{rôle}`, `.alert-solid-{rôle}`
  - Badges : `.badge-{rôle}` = `.badge-regular-{rôle}` = `.badge-soft-{rôle}`, `.badge-solid-{rôle}`
  - Autres : `.box-{rôle}`, `.card-{rôle}`, `.chip-{rôle}`, `.jumbotron-{rôle}`, `.footer-{rôle}`
- Tailles : `-sm` / `-lg` (`.btn-sm`, `.form-control-lg`, `.avatar-lg`, `.pagination-sm`…).
- Responsive : infixe de point de rupture `{prop}-{bp}-{valeur}` (`.d-lg-none`, `.col-md-6`, `.gap-md-4`).
- États :
  - `.active` + `aria-current="page"` pour la navigation
  - `.disabled` ou l'attribut `disabled` pour la désactivation
  - `.is-valid` / `.is-invalid` pour la validation
  - `.show` (ouvert), `.is-open` / `.is-visible` (sidebar), `.is-selected` (chip)
- Espacements logiques : `s`/`e` = start/end (et non left/right), `t`/`b`, `x`/`y`.

---

## 7. Catalogue des composants

Les extraits ci-dessous sont la forme canonique. Les pages `/ui/docs/{catégorie}/{composant}` du dépôt
source détaillent toutes les variantes.

### 7.1 Grille et conteneurs

```html
<div class="container">                 <!-- aussi .container-fluid, .container-{sm…xxl} -->
  <div class="row g-4">                 <!-- gouttière : .g-*, .gx-*, .gy-* (échelle d'espacement) -->
    <div class="col-12 col-md-6 col-lg-4">…</div>   <!-- 12 colonnes, .col, .col-auto, .offset-{bp}-{n} -->
  </div>
</div>

<div class="grid grid-cols-1 grid-cols-md-3 gap-4">  <!-- grille CSS ; .col-span-{n}, .col-span-full -->
  <div class="col-span-md-2">…</div>
</div>
```

### 7.2 Boutons

```html
<button type="button" class="btn btn-primary">Enregistrer</button>
<button type="button" class="btn btn-soft-primary btn-sm">Soft</button>
<button type="button" class="btn btn-outline-secondary">Contour</button>
<button type="button" class="btn btn-ghost-secondary">Texte</button>
<button type="button" class="btn btn-danger btn-lg btn-pill">Supprimer</button>
<button type="button" class="btn btn-icon btn-ghost-secondary" aria-label="Modifier"><i class="ri-pencil-line"></i></button>
<a href="#" class="btn btn-primary"><i class="ri-add-line"></i> Nouveau</a>
<button type="button" class="btn btn-primary" disabled>Indisponible</button>
<button type="button" class="btn-close" aria-label="Fermer"></button>
```

### 7.3 Badge, chip, avatar

```html
<span class="badge badge-success">Publié</span>
<span class="badge badge-solid-primary">12</span>

<button type="button" class="chip">Design</button>
<button type="button" class="chip is-selected" aria-pressed="true">Front-end</button>

<span class="avatar"><img src="…" alt="Jane Doe"></span>
<span class="avatar avatar-sm" aria-hidden="true">JD</span>          <!-- initiales -->
<div class="avatar-stack">
  <span class="avatar"><img src="…" alt=""></span>
  <span class="avatar avatar-count">+3</span>
</div>
```

### 7.4 Carte, box, list group, hero, jumbotron

```html
<article class="card card-elevated">     <!-- .card : ombre douce ; .card-elevated : survol -->
  <img src="…" class="card-img-top" alt="">
  <div class="card-header">…</div>
  <div class="card-body">
    <h3 class="card-title">Titre</h3>
    <p class="card-text">Texte.</p>
  </div>
  <div class="card-footer"><a href="#" class="btn btn-soft-primary btn-sm">Lire</a></div>
</article>

<div class="box box-info"><h4 class="box-title">Info</h4><p>Panneau de contenu.</p></div>

<ul class="list-group">                  <!-- .list-group-flush, .list-group-numbered -->
  <li class="list-group-item active" aria-current="true">Actif</li>
  <li class="list-group-item">Élément</li>
</ul>

<section class="hero">                  <!-- .hero-has-bg : voile sombre sur image de fond -->
  <div class="hero-content">
    <h1 class="hero-title">Titre</h1>
    <p class="lead">Accroche.</p>
  </div>
</section>

<div class="jumbotron jumbotron-primary"><h1 class="jumbotron-title">…</h1><p class="jumbotron-lead">…</p></div>
```

### 7.5 Dropdown

```html
<div class="dropdown">
  <button type="button" class="btn btn-primary dropdown-toggle" data-ds-toggle="dropdown" aria-expanded="false">Actions</button>
  <div class="dropdown-menu">                          <!-- .dropdown-menu-end : aligné à droite -->
    <h6 class="dropdown-header">Article</h6>
    <a class="dropdown-item" href="#"><i class="ri-pencil-line"></i> Modifier</a>
    <a class="dropdown-item disabled" aria-disabled="true">Archiver</a>
    <div class="dropdown-divider"></div>
    <button type="button" class="dropdown-item">Supprimer</button>
  </div>
</div>
```

### 7.6 Collapse et accordéon

```html
<button type="button" class="btn btn-outline-secondary" data-ds-toggle="collapse" data-ds-target="#details" aria-expanded="false" aria-controls="details">Détails</button>
<div class="collapse" id="details">…</div>              <!-- .collapse.show : ouvert au chargement -->

<div class="accordion">                                   <!-- un seul panneau ouvert à la fois -->
  <div class="accordion-item">
    <button type="button" class="accordion-button" data-ds-toggle="accordion" data-ds-target="#acc-1" aria-expanded="true" aria-controls="acc-1">
      Question <i class="ri-arrow-down-s-line accordion-icon"></i>
    </button>
    <div id="acc-1" class="accordion-collapse collapse show">
      <div class="accordion-body">Réponse.</div>
    </div>
  </div>
</div>
```

`data-ds-toggle="accordion"` bascule sans animation ; `data-ds-toggle="collapse"` dans un `.accordion`
anime la hauteur et referme aussi les autres panneaux.

### 7.7 Navigation

```html
<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    <li class="breadcrumb-item"><a href="#">Accueil</a></li>
    <li class="breadcrumb-item active" aria-current="page">Articles</li>
  </ol>
</nav>

<nav class="nav nav-tabs">                <!-- aussi .nav-pills, .nav-vertical -->
  <a class="nav-link active" href="#" aria-current="page">Général</a>
  <a class="nav-link" href="#">Sécurité</a>
  <a class="nav-link disabled" aria-disabled="true">Facturation</a>
</nav>

<nav aria-label="Pagination">
  <ul class="pagination">                 <!-- .pagination-sm, .pagination-lg -->
    <li class="page-item disabled"><a class="page-link" aria-disabled="true" aria-label="Page précédente"><i class="ri-arrow-left-s-line"></i></a></li>
    <li class="page-item active"><a class="page-link" href="#" aria-current="page">1</a></li>
    <li class="page-item"><a class="page-link" href="#">2</a></li>
  </ul>
</nav>
```

`.nav-tabs` ne gère que **l'apparence** : il n'existe pas de JS d'onglets à panneaux. Utilise des liens
vers des URL (ou des routes avec paramètre), ou des `collapse`.

### 7.8 Navbar

```html
<nav class="navbar navbar-expand-lg">       <!-- en ligne à partir de lg ; sm|md|lg|xl|xxl -->
  <div class="container">
    <button class="navbar-toggler" type="button" data-ds-toggle="collapse" data-ds-target="#main-nav" aria-expanded="false" aria-controls="main-nav" aria-label="Ouvrir le menu">
      <i class="ri-menu-line"></i>
    </button>
    <a class="navbar-brand" href="/"><i class="ri-box-3-fill text-primary"></i> Marque</a>
    <div class="collapse navbar-collapse" id="main-nav">
      <ul class="navbar-nav">
        <li><a class="nav-link active" href="#" aria-current="page">Accueil</a></li>
        <li><a class="nav-link" href="#">Articles</a></li>
      </ul>
      <div class="navbar-actions">            <!-- visiteur : boutons de connexion -->
        <a href="#" class="btn btn-ghost-secondary">Connexion</a>
        <a href="#" class="btn btn-primary">S'inscrire</a>
      </div>
    </div>
    <div class="navbar-end">                  <!-- toujours visible à droite : notifications, menu du compte -->
      <a href="#" class="navbar-notification" aria-label="Notifications (3 non lues)">
        <i class="ri-notification-3-line"></i><span class="notification-badge">3</span>
      </a>
      {# dropdown du compte : voir §4.3 #}
    </div>
  </div>
</nav>
```

Ordre attendu : hamburger, marque, `.navbar-collapse`, `.navbar-end`. Sur mobile, les liens s'ouvrent
sous la barre et l'avatar reste à droite.

### 7.9 Sidebar

Dans le layout dashboard, utilise `.dashboard-sidebar` (voir `_sidebar_dashboard.html.twig`) :

```html
<aside class="dashboard-sidebar">
  <header class="sidebar-header"><a class="sidebar-brand" href="/">Admin</a></header>
  <nav class="sidebar-body" aria-label="Navigation principale">
    <div class="sidebar-section" role="group" aria-labelledby="menu-main">
      <span class="sidebar-section-title" id="menu-main">Général</span>
      <a href="#" class="sidebar-link active" aria-current="page"><i class="ri-dashboard-line"></i> Tableau de bord</a>
      <div class="sidebar-item">
        <button type="button" class="sidebar-link" data-ds-toggle="collapse" data-ds-target="#menu-articles" aria-expanded="false" aria-controls="menu-articles">
          <i class="ri-article-line"></i> Articles <i class="ri-arrow-down-s-line sidebar-chevron"></i>
        </button>
        <div class="sidebar-submenu collapse" id="menu-articles">
          <a href="#" class="sidebar-sublink">Tous les articles</a>
          <a href="#" class="sidebar-sublink">Nouvel article</a>
        </div>
      </div>
      <a href="#" class="sidebar-link"><i class="ri-chat-3-line"></i> Commentaires <span class="badge badge-solid-primary sidebar-badge">12</span></a>
    </div>
  </nav>
  <div class="sidebar-footer"><a href="#" class="sidebar-link"><i class="ri-question-line"></i> Aide</a></div>
</aside>
```

- **Un seul niveau de sous-menu** (`.sidebar-submenu` > `.sidebar-sublink`) : n'imbrique jamais un
  sous-menu dans un sous-menu.
- Si la page courante est dans un sous-menu, rends-le ouvert côté serveur : `.sidebar-submenu.collapse.show`
  et `aria-expanded="true"` sur le bouton.
- Hors dashboard, `.sidebar` est un tiroir autonome : fermé par défaut, ouvert par `.show` ou `.is-open`,
  fixe à partir de `.sidebar-expand-{bp}`, réduit aux icônes avec `.sidebar-collapsed` (dans ce cas, le libellé
  des liens doit être dans un `<span>`).

### 7.10 Feedback

```html
<div class="alert alert-soft-success alert-dismissible" role="alert">  <!-- .alert-solid-{rôle} -->
  <i class="ri-checkbox-circle-line alert-icon"></i>
  <div class="alert-content">Article enregistré.</div>
  <button type="button" class="btn-close" data-ds-dismiss="alert" aria-label="Fermer"></button>
</div>

<button type="button" class="btn btn-primary" data-ds-toggle="modal" data-ds-target="#confirm-delete">Supprimer</button>
<dialog id="confirm-delete" class="modal" aria-labelledby="confirm-delete-title">
  <div class="modal-header">
    <h3 class="modal-title" id="confirm-delete-title">Supprimer l'article ?</h3>
    <button type="button" class="btn-close" data-ds-dismiss="modal" aria-label="Fermer"></button>
  </div>
  <div class="modal-body"><p>Cette action est irréversible.</p></div>
  <div class="modal-footer">
    <button type="button" class="btn btn-ghost-secondary" data-ds-dismiss="modal">Annuler</button>
    <form method="post" action="{{ path('app_article_delete', {id: article.id}) }}">
      <input type="hidden" name="_token" value="{{ csrf_token('delete' ~ article.id) }}">
      <button type="submit" class="btn btn-danger">Supprimer</button>
    </form>
  </div>
</dialog>
```

- `class="modal"` + `data-ds-toggle="modal"` : `showModal()`, avec backdrop ; un clic sur le backdrop ou
  Échap ferme la modale. Sans `.modal`, avec `data-ds-toggle="dialog"` : `show()`, non modal.
- Toasts : uniquement en JS (`new Toast(…)`, §8.3) ; le conteneur `#toast-container` est créé
  automatiquement.

### 7.11 Contenu

```html
<div class="table-responsive">
  <table class="table table-hover align-middle">   <!-- .table-striped, .table-bordered, .table-borderless -->
    <thead class="table-light"><tr><th scope="col">Titre</th></tr></thead>
    <tbody><tr><td>…</td></tr></tbody>
  </table>
</div>

<img src="…" class="img-fluid rounded-lg" alt="…">       <!-- .img-thumbnail -->
<figure class="figure"><img class="figure-img img-fluid" src="…" alt="…"><figcaption class="figure-caption">Légende</figcaption></figure>
<div class="gallery"><div class="gallery-item"><img src="…" alt="…"></div></div>
<code class="code-inline">npm run build</code>
```

Bloc de code avec copie :

```twig
{% include 'fragments/components/_code-block.html.twig' with {
  code: 'npm run build', language: 'bash', title: 'Build', copyable: true, collapsible: false
} only %}
```

Typographie : `h1`–`h6` / `.h1`–`.h6`, `.display-1`–`.display-6`, `.lead`, `.small`, `.mark`,
`.blockquote` (+ `.blockquote-footer`), `.dl-horizontal`.

---

## 8. Comportements JavaScript

### 8.1 Attributs déclaratifs (aucun JS à écrire)

| Attribut sur le déclencheur | Cible | Effet |
|---|---|---|
| `data-ds-toggle="dropdown"` | le `.dropdown-menu` **frère suivant** | Bascule `.show` et `aria-expanded` ; ferme les autres menus ; clic extérieur ou Échap ferment (Échap rend le focus au déclencheur) |
| `data-ds-toggle="collapse"` + `data-ds-target="#id"` | `.collapse` | Animation de hauteur (`.collapsing` → `.show`) ; dans un `.accordion`, ferme les autres panneaux |
| `data-ds-toggle="accordion"` + `data-ds-target` | `.accordion-collapse` | Bascule `.show` sans animation, un seul ouvert par `.accordion` |
| `data-ds-toggle="modal"` / `"dialog"` + `data-ds-target` | `<dialog>` | `showModal()` / `show()`, émet `ds:open` |
| `data-ds-toggle="sidebar"` (+ `data-ds-target`, défaut `.dashboard-sidebar`) | sidebar | Bascule `.is-open` et `.dashboard-overlay.is-visible` |
| `data-ds-dismiss="alert"` / `"toast"` | `.alert` / `.toast` ancêtre | Ajoute `.hide`, retire l'élément après 300 ms |
| `data-ds-dismiss="modal"` / `"dialog"` | `<dialog>` ancêtre | `close()`, émet `ds:close` |
| `data-ds-dismiss="sidebar"` | sidebar | Ferme le tiroir et l'overlay |
| `data-copy-target="id"` | élément à copier | Copie dans le presse-papier (core-ts) |
| `data-markdown` | l'élément lui-même | Remplace son texte par le HTML Markdown au chargement |
| `.segmented-control` + options `role="radio"` `data-value` | — | Sélection, flèches/Début/Fin, tabulation itinérante, émet `ds:change` |
| `data-ds-theme-switch` sur un `.segmented-control` | — | Choix `auto` / `light` / `dark` relié au service de thème |
| `data-ds-md-editor` sur `.md-editor` | — | Barre d'outils, raccourcis, mode Aperçu |

Les clics étant délégués, ces attributs fonctionnent aussi sur du HTML injecté après le chargement (Turbo,
fetch…). **Exception** : les segmented controls et les éditeurs Markdown injectés doivent être initialisés
(§8.3).

### 8.2 Événements personnalisés

| Événement | Émis sur | `detail` |
|---|---|---|
| `ds:change` | le `.segmented-control` (bouillonne) | `{ value: string }` |
| `ds:open` / `ds:close` | le `<dialog>` (bouillonne) | — |
| `ds:theme-change` | `document` | `{ mode: 'auto'|'light'|'dark', theme: 'light'|'dark' }` |

```ts
document.querySelector('#view-switch')?.addEventListener('ds:change', (event) => {
  const { value } = (event as CustomEvent<{ value: string }>).detail;
  // …
});
```

### 8.3 API TypeScript (dans `assets/ts/pages/*.ts`)

```ts
import { Alert } from '@components/Alert';
import { Toast } from '@components/Toast';
import { openDialog, closeDialog } from '@/interactions/components/modal';
import { initSegmentedControls, selectSegment, getSegmentValue } from '@/interactions/components/segmented-control';
import { initMarkdownEditors } from '@/interactions/components/md-editor';
import { themeService } from '@/services/theme';
import { FormManager, fetchPOST, escapeHtml } from 'core-ts';

new Alert('Profil mis à jour.', 'success', document.querySelector('#alerts')!); // info | success | warning | danger
new Toast('Fichier envoyé.', 'success');            // info | success | warning | error (≠ danger), durée 3000 ms par défaut
new Toast('Connexion perdue.', 'error', 5000);

openDialog(document.querySelector<HTMLDialogElement>('#confirm')!, 'modal');

selectSegment(group, 'grid', { focus: true });      // { silent: true } : sans émettre ds:change
getSegmentValue(group);                              // 'grid'

// Après injection de HTML contenant ces composants :
initSegmentedControls(container);
initMarkdownEditors(container);

themeService.setMode('dark');
const unsubscribe = themeService.subscribe(({ mode, theme }) => { /* … */ });
```

`Alert` et `Toast` injectent leur message via `innerHTML` : passe toute donnée utilisateur par
`escapeHtml()`.

### 8.4 Éditeur Markdown

```html
<div class="md-editor" data-ds-md-editor>
  <div class="md-editor-toolbar">
    <div class="segmented-control segmented-control-sm" role="radiogroup" aria-label="Mode de l'éditeur" data-md-mode>
      <button type="button" class="segmented-control-option" role="radio" aria-checked="true" data-value="write"><i class="ri-edit-line"></i> Écrire</button>
      <button type="button" class="segmented-control-option" role="radio" aria-checked="false" data-value="preview"><i class="ri-eye-line"></i> Aperçu</button>
    </div>
    <div class="md-editor-format-buttons" role="toolbar" aria-label="Mise en forme">
      <button type="button" class="md-format-btn" data-md-action="bold" aria-label="Gras" title="Gras (Ctrl+B)"><i class="ri-bold"></i></button>
      <span class="md-editor-separator" aria-hidden="true"></span>
      <button type="button" class="md-format-btn" data-md-action="link" aria-label="Lien" title="Lien (Ctrl+K)"><i class="ri-link"></i></button>
    </div>
  </div>
  <textarea class="form-control" name="content" rows="8" aria-label="Contenu Markdown"></textarea>
  <div class="md-editor-preview" hidden></div>
</div>
```

- Actions `data-md-action` : `bold`, `italic`, `strike`, `highlight`, `code`, `codeblock`, `link` (entourent
  la sélection) ; `heading`, `quote`, `ul`, `ol`, `task` (préfixent les lignes). Un second clic retire la
  mise en forme.
- Raccourcis : Ctrl/⌘ + B, I, K, E. Entrée dans une liste la continue.
- Le `<textarea>` doit être **enfant direct** de `.md-editor`. Variante compacte : `.md-editor--compact`.
- Avec un champ Symfony : `{{ form_widget(form.content, {attr: {class: 'form-control', rows: 8}}) }}` à
  l'intérieur du conteneur.
- L'aperçu (`convertMarkdownToHtml`) **n'est pas assaini**. Côté serveur, assainis toujours le HTML
  rendu avant de l'afficher (ex. `symfony/html-sanitizer`).

---

## 9. Formulaires Symfony

### 9.1 Thème de formulaire

Le design system reprend les classes de formulaire de Bootstrap 5 : `form-label`, `form-control`,
`form-select`, `form-check`, `form-check-input`, `form-check-label`, `form-switch`, `form-floating`,
`is-valid`, `is-invalid`, `valid-feedback`, `invalid-feedback`. Le thème natif de Symfony
`bootstrap_5_layout.html.twig` produit donc un balisage compatible :

```yaml
# config/packages/twig.yaml
twig:
    form_themes: ['bootstrap_5_layout.html.twig']
```

Limites à connaître, à corriger dans un thème dérivé (`templates/form/ds_layout.html.twig` qui
`{% extends 'bootstrap_5_layout.html.twig' %}` et surcharge les blocs concernés) :

| Bootstrap 5 génère | Dans le design system |
|---|---|
| `.form-text` (aide) | Non stylé : surcharge `form_help` avec `class="small text-muted"` |
| `.input-group`, `.input-group-text` | Non stylé : n'utilise pas les types `MoneyType`/`PercentType` avec addon, ou crée le composant |
| `.btn-secondary` par défaut sur `ButtonType` | Existe : passe plutôt `attr: {class: 'btn btn-primary'}` sur les `SubmitType` |
| `.form-range`, `.form-control-color` | Non stylés |
| Erreurs `invalid-feedback d-block` avec un badge | Fonctionne (`.badge-danger` existe) |

Formulaire manuel, champ en erreur :

```twig
<div class="mb-4">
  {{ form_label(form.email, null, {label_attr: {class: 'form-label'}}) }}
  {{ form_widget(form.email, {attr: {
       class: 'form-control' ~ (form.email.vars.valid ? '' : ' is-invalid'),
       'aria-describedby': form.email.vars.id ~ '-error'
  }}) }}
  {% if not form.email.vars.valid %}
    <div class="invalid-feedback" id="{{ form.email.vars.id }}-error">{{ form_errors(form.email)|striptags }}</div>
  {% endif %}
</div>
```

Autres contrôles :

```html
<select class="form-select">…</select>                                     <!-- -sm / -lg -->
<div class="form-check form-switch">
  <input class="form-check-input" type="checkbox" role="switch" id="notif">
  <label class="form-check-label" for="notif">Notifications</label>
</div>
<div class="form-floating">
  <input type="email" class="form-control" id="f-email" placeholder=" ">
  <label for="f-email">Email</label>
</div>
<div class="form-selectable-card">                                         <!-- radio/checkbox en carte -->
  <input type="radio" name="plan" id="plan-pro" class="form-selectable-input">
  <label class="form-selectable-label" for="plan-pro"><span><strong class="d-block">Pro</strong><span class="text-muted small">Équipes</span></span><i class="ri-check-line icon-check"></i></label>
</div>
```

Un segmented control n'est pas un champ de formulaire : pour soumettre sa valeur, synchronise un
`<input type="hidden">` sur `ds:change`, ou utilise des radios natifs.

### 9.2 Messages flash

`_flash_messages.html.twig` affiche `app.flashes` en alertes fermables et mappe `error` → `danger`.
Utilise dans les contrôleurs : `success`, `warning`, `info`, `danger` (ou `error`). Le libellé `notice`,
courant dans Symfony, produirait la classe inexistante `alert-soft-notice` : ajoute-le au mapping.

```twig
{% set alertType = {error: 'danger', notice: 'info'}[label] ?? label %}
```

---

## 10. Utilitaires

Tous les utilitaires ont `!important` et la plupart existent en version responsive (`-{bp}-`).

| Domaine | Classes |
|---|---|
| Espacement | `.m{,t,b,s,e,x,y}-{clé}`, `.p…`, `.m*-auto` ; clés : `0 0_5 1 1_5 2 2_5 3 3_5 4 5 6 7 8 9 10 12 16 20 24` |
| Gap | `.gap-{clé}`, `.row-gap-{clé}`, `.column-gap-{clé}`, `.gap-x-*`, `.gap-y-*` |
| Display | `.d-{none,block,inline,inline-block,flex,inline-flex,grid}`, `.d-print-*`, `.visually-hidden`, `.overflow-*`, `.visible`, `.invisible` |
| Flex | `.flex-{row,column,wrap,nowrap,fill,grow-*,shrink-*}`, `.justify-content-*`, `.align-items-*`, `.align-self-*`, `.order-*` |
| Grille CSS | `.grid`, `.grid-cols-{n}`, `.col-span-{n}`, `.col-span-full` |
| Colonnes de texte | `.columns-{n}`, `.column-span-all`, `.break-inside-avoid` |
| Dimensions, position | `.w-{25,50,75,100}`, `.w-auto`, `.h-*`, `.mw-100`, `.mh-100`, `.position-{static,relative,absolute,fixed,sticky}`, `.top-0`, `.start-0` |
| Texte | `.text-{start,center,end}`, `.text-{rôle}`, `.text-{rôle}-emphasis`, `.text-{rôle}-dark`, `.text-muted`, `.text-body`, `.fs-{1…6}`, `.fw-*`, `.fst-italic`, `.lh-*`, `.text-nowrap`, `.text-break`, `.text-reading`, `.font-monospace`, `.list-unstyled`, `.list-inline` |
| Fond | `.bg-{rôle}`, `.bg-{rôle}-subtle`, `.bg-gradient-{rôle}`, `.bg-surface-container-*`, `.bg-transparent` |
| Bordure, rayon | `.border`, `.border-{side}`, `.border-0`, `.border-2`, `.border-dashed`, `.border-{rôle}`, `.rounded`, `.rounded-{xs,sm,md,lg,xl}`, `.rounded-pill`, `.rounded-circle` |
| Ombre | `.shadow-{none,sm,md,lg}`, `.shadow-elevated`, `.shadow-inset` |
| Liens | `.link-{rôle}`, `.link-underline`, `.link-underline-opacity-*` |
| Images | `.object-fit-{cover,contain,…}` |
| Icônes | `.icon-{xs,sm,md,lg,xl}`, `.icon-spin` |

---

## 11. Étendre le design system

### 11.1 Nouveau composant SCSS

1. Crée le partiel dans le dossier de son domaine (`components/`, `forms/`, `navigation/`…) et ajoute-le au
   `_index.scss` du dossier (`@forward 'mon-composant';`).
2. Respecte la structure :

```scss
// ==========================================================================
// Component: Stat (components/_stat.scss)
// --------------------------------------------------------------------------
// Chiffre clé avec libellé ; variantes par rôle.
// ==========================================================================

@use '../abstracts' as *;

.stat {
  // 1. Component Tokens
  --stat-bg: var(--ds-surface-container);
  --stat-color: var(--ds-color-on-surface);
  --stat-radius: var(--ds-radius-lg);
  --stat-padding: var(--ds-space-6);

  // 2. Box Model
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  padding: var(--stat-padding);
  border-radius: var(--stat-radius);

  // 3. Couleurs et typographie
  background-color: var(--stat-bg);
  color: var(--stat-color);
  @include type(body, md);

  // 4. États
  transition: effects(background-color);

  &:hover {
    background-color: state-layer(var(--stat-bg), var(--stat-color));
  }

  &:focus-visible {
    @include focus-ring;
  }
}

// Variantes (surcharge uniquement des Component Tokens)
@each $role, $token in $roles {
  .stat-#{$role} {
    --stat-bg: #{role-color($role, 'container')};
    --stat-color: #{role-color($role, 'on-container')};
  }
}
```

Boîte à outils de `abstracts/` :

| Outil | Rôle |
|---|---|
| `role-color($role, $variant)` | `var(--ds-color-…)` ; variantes `on`, `container`, `on-container` |
| `state-layer($bg, $content, 'hover'\|'pressed')` | Calque d'état M3 (`color-mix`) |
| `disabled-container()`, `disabled-content()` | Couleurs désactivées M3 |
| `effects(props…)`, `spatial(props…)`, `spring(props…)` | Transitions normées |
| `@include media-up(md)`, `media-down(md)`, `responsive using ($infix)` | Points de rupture |
| `@include focus-ring($offset)` | Anneau de focus |
| `@include touch-target($pseudo, $position)` | Zone cliquable de 44px |
| `@include reduced-motion { … }` | Respect de `prefers-reduced-motion` |
| `@include visually-hidden` | Masquage accessible |
| `@include type(body, md)` | Rôle typographique (`display`, `headline`, `title`, `body`, `label` × `lg`/`md`/`sm`) |

Interdits : `@import` (déprécié), valeur en dur, sélecteur d'ID, imbrication de plus de 3 niveaux,
`!important` hors utilitaires, propriétés physiques là où une propriété logique existe
(`margin-inline-start` plutôt que `margin-left`).

### 11.2 Nouveau comportement TS

- Comportement réutilisable : un module dans `interactions/components/` qui exporte `initX(root = document)`,
  pose ses listeners **délégués une seule fois** (garde `let listening = false`), et émet des événements
  `ds:*` (`CustomEvent`, `bubbles: true`). Appelle `initX()` depuis `main.ts`.
- Déclencheur : un attribut `data-ds-*`, jamais une classe CSS.
- État : reflété par des attributs ARIA (`aria-expanded`, `aria-checked`…) et des classes d'état (`.show`,
  `.is-*`), jamais par des styles en ligne (sauf la hauteur transitoire du collapse).
- Code propre à une page : `assets/ts/pages/{page}.ts`.
- Utilise `core-ts` (`$`, `createElement`, `insertElementToDOM`, `fetchPOST`, `FormManager`, `escapeHtml`…)
  plutôt que de réécrire ces aides.

---

## 12. Accessibilité (rappels)

- `aria-label` sur tout bouton composé d'une icône seule (hamburger, `.btn-icon`, `.btn-close`,
  `.navbar-user-trigger`).
- Déclencheurs dropdown/collapse : `aria-expanded` initial correct ; collapse : `aria-controls` = id de la cible.
- Navigation : `<nav aria-label="…">`, `.active` + `aria-current="page"`.
- Modale : `aria-labelledby` vers `.modal-title`.
- Champs : `<label for>` ou `aria-label` ; erreurs reliées avec `aria-describedby` et `aria-invalid="true"`.
- Segmented control : `role="radiogroup"` + `aria-label`/`aria-labelledby`, options `role="radio"` +
  `aria-checked`.
- Icônes décoratives : sans texte alternatif ; avatars à initiales : `aria-hidden="true"` si le nom est
  affiché à côté.
- Ne supprime jamais l'outline de focus ; les composants utilisent `@include focus-ring`.

---

## 13. Pièges connus et écarts du dépôt source

1. **`.dropdown-menu` doit suivre immédiatement** son déclencheur (`nextElementSibling`).
2. **Ids uniques** pour toutes les cibles `data-ds-target` : dans une boucle Twig, suffixe-les
   (`id="menu-{{ item.id }}"`), y compris les ids `aria-labelledby` des fragments inclus plusieurs fois.
3. `[hidden]` est forcé à `display: none !important` : pour afficher un élément masqué, retire l'attribut
   au lieu d'ajouter `.d-block`.
4. Toast : type `error` ; Alert et flash : type `danger`.
5. `_navbar_app.html.twig` n'affiche le hamburger et les liens qu'en environnement `dev` : supprime ces
   conditions.
6. `_footer_app.html.twig` utilise `.copyright`, `.footer-legal` et `.legal-link`, qui n'existent pas dans le
   SCSS. Préfère la structure stylée :
   `<footer class="footer app-footer"><div class="container"><div class="footer-content">…<ul class="nav footer-links">…</ul></div><div class="footer-bottom">…</div></div></footer>`.
7. `_navbar_dashboard.html.twig` : le bouton hamburger n'a ni `aria-label` ni variante de couleur
   (`btn-ghost-secondary`). `.header-actions` n'est pas stylé (les utilitaires `d-flex gap-3` suffisent).
8. `_navbar_auth_dropdown.html.twig` contient des données en dur (email, initiale) : branche-les sur
   `app.user` (§4.3). Son id `navbar-theme-label` doit rester unique dans la page.
9. Le contenu de `[data-markdown]` et l'aperçu de l'éditeur ne sont pas assainis : ne les alimente pas
   avec des données non fiables sans les assainir côté serveur.
10. `ds-docs.css` et les classes `.docs-*` / `.component-demo` sont réservées à la documentation.
11. Après injection de HTML : `initSegmentedControls(container)` et `initMarkdownEditors(container)`.
12. `tsc` peut signaler des options dépréciées par TypeScript 6 si le `tsconfig` d'origine est repris tel
    quel : esbuild n'est pas bloqué, mais préfère la configuration du §2.2.

---

## 14. Checklist d'intégration

- [ ] Fichiers copiés (§2.1), `.npmrc` avec `allow-git=root`, `package.json` fusionné, `tsconfig.json` avec les alias
- [ ] `npm install` puis `npm run build` sans erreur ; `public/css/ds-ui-kit.css`, `public/js/main.js` et `public/js/chunks/` présents
- [ ] `/public/css/` et `/public/js/` dans `.gitignore` ; `public/assets/ds-icons.css` et ses polices versionnés
- [ ] `base.html.twig` : script de thème dans `<head>`, `ds-icons.css`, `ds-ui-kit.css`, `main.js` en `type="module"`
- [ ] Chaque page étend `layouts/app`, `layouts/auth` ou `layouts/dashboard`
- [ ] Fragments adaptés : routes réelles, `app.user`, lien actif, conditions `dev` retirées
- [ ] `form_themes: ['bootstrap_5_layout.html.twig']` (ou thème dérivé) ; boutons `btn btn-primary`
- [ ] Flash : mapping `error` → `danger` et `notice` → `info`
- [ ] Thème clair/sombre vérifié avec le sélecteur du menu du compte, sans flash au rechargement
- [ ] Navbar testée à 375px (hamburger à gauche, avatar à droite) et à 1280px
- [ ] Dashboard testé sous 992px (tiroir, overlay, Échap/clic overlay)
- [ ] Clavier : Tab, Échap sur dropdown et modale, flèches dans les segmented controls
- [ ] Aucun `style=""`, aucun `onclick`, aucune couleur en dur ajoutés
- [ ] Déploiement : `npm ci && npm run build` dans la chaîne de livraison
