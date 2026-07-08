### 1. Le service `ComponentDocumentationService`

Oui, **tu peux le conserver exactement tel quel !** Dans le nouveau contrôleur que nous avons mis en place, on extrait le `$component_name` du nom du fichier (par exemple, pour `_avatar.html.twig`, le nom extrait est `avatar`). C'est cette variable exacte qui est passée à ton service :

```php
// Extrait de notre nouveau ComponentDocumentationController.php
$data = $this->service->getData($component_name);

```

Donc, quand ton service évalue `if ($route === 'avatar')`, il trouvera une correspondance parfaite, peu importe si le composant se trouve dans `docs/components/` ou `docs/content/`. Ton service reste totalement agnostique de l'arborescence des dossiers.

---
    
### 2. Répartition des Catégories

Pour les composants qui ne rentrent pas dans les évidences (`forms`, `grid`, `utilities`), la meilleure approche est de s'inspirer des standards de l'industrie (comme Material Design ou Bootstrap) en regroupant par **intention d'utilisation**.

Voici une proposition de répartition logique pour structurer tes dossiers dans `templates/docs/` :

**📁 `forms/` (Saisie de données)**

* `_form-inputs.html.twig` : couvre les éléments `input[type="{email,password,text,url,...}"]` et `textarea`
* `_files_upload.html.twig` : couvre les éléments `input[type="file"]`
* `_choices.html.twig` : couvre les éléments `input[type="{radio,checkbox}"]` et `select`
* `_custom-choices.html.twig` : pour les `selectable-cards` et `toggle`
* `_form-validation.html.twig` : pour la validation du formulaire, affichage de messages d'erreur de succès, ...
* `_chip.html.twig` : pour les chips

**📁 `grid/` (Structure de page - *remplace 'grid'* pour être plus large)**

* `_col.html.twig` : `_col.scss`
* `_container.html.twig` : `_container.scss`

**📁 `navigation/` (Déplacements dans l'app)**

* `_breadcrumb.html.twig`
* `_nav-tabs.html.twig` (nav et nav-tables)
* `_navbar.html.twig`
* `_pagination.html.twig`
* `_sidebar.html.twig`

**📁 `feedback/` (Retours visuels et surcouches)**

* `_alert.html.twig` : `_alert.scss`
* `_toast.html.twig` : `_toast.scss`
* `_modal.html.twig` : `_dialog.scss`

**📁 `components/` (Blocs UI autonomes)**

* `_accordion.html.twig`
* `_alert.html.twig`
* `_badge.html.twig`
* `_box.html.twig`
* `_breadcrumb.html.twig`
* `_btn-close.html.twig`
* `_button.html.twig`
* `_card.html.twig`
* `_collapse.html.twig`
* `_modal.html.twig` (Modales et boite de dialog)
* `_dropdown.html.twig`
* `_list-group.html.twig`

**📁 `content/` (Éléments statiques)**

* `_avatar.html.twig`
* `_gallery.html.twig`
* `_images-figures.html.twig`
* `_typography.html.twig`
* `_tables.html.twig` 
* `_code.html.twig`

**📁 `utilities/` (Ajustements cosmétiques)**

* `_background.html.twig`
* `_display.html.twig`
* `_flex.html.twig`
* `_grid.html.twig`
* `_gap.html.twig`
* `_icons.html.twig`
* `_link.html.twig`
* `_object-fit.html.twig`
* `_spacing.html.twig`
* `_text.html.twig`

Cette structure en 8 dossiers offre un équilibre parfait : tu n'as pas de catégorie "fourre-tout" avec 30 composants, et l'architecture reste suffisamment intuitive pour qu'un développeur sache exactement où chercher un composant précis !