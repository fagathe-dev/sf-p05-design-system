<?php
namespace App\Service;

use App\Utils\Front\Breadcrumb\Breadcrumb;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

final class ComponentDocumentationService
{
    /**
     * Ordre et libellés de la navigation. Une page ou une catégorie absente de
     * cette liste apparaît quand même, à la fin, avec un titre déduit du fichier.
     */
    private const CATEGORIES = [
        'getting-started' => [
            'label' => 'Prise en main',
            'icon' => 'ri-rocket-2-line',
            'description' => 'Installer le design system et partir d\'une page complète.',
            'pages' => ['installation' => 'Installation', 'starter-packs' => 'Starter packs'],
        ],
        'grid' => [
            'label' => 'Mise en page',
            'icon' => 'ri-layout-grid-line',
            'description' => 'Conteneurs, grille à 12 colonnes et pied de page.',
            'pages' => ['container' => 'Container', 'col' => 'Grid', 'footer' => 'Footer'],
        ],
        'content' => [
            'label' => 'Contenu',
            'icon' => 'ri-text',
            'description' => 'Typographie, images, tableaux, avatars et blocs de code.',
            'pages' => [
                'typography' => 'Typography',
                'images-figures' => 'Images & Figures',
                'gallery' => 'Gallery',
                'table' => 'Table',
                'avatar' => 'Avatar',
                'code' => 'Code',
            ],
        ],
        'forms' => [
            'label' => 'Formulaires',
            'icon' => 'ri-input-field',
            'description' => 'Champs, choix, envoi de fichiers, éditeur Markdown et validation.',
            'pages' => [
                'form-inputs' => 'Form Inputs',
                'choices' => 'Choices',
                'custom-choices' => 'Custom Choices',
                'file-upload' => 'File Upload',
                'chip' => 'Chip',
                'segmented-control' => 'Segmented Control',
                'md-editor' => 'Markdown Editor',
                'form-validation' => 'Validation',
            ],
        ],
        'components' => [
            'label' => 'Composants',
            'icon' => 'ri-shapes-line',
            'description' => 'Boutons, cartes, menus déroulants, accordéons et plus encore.',
            'pages' => [
                'accordion' => 'Accordion',
                'badge' => 'Badge',
                'box' => 'Box',
                'button' => 'Button',
                'btn-close' => 'Close Button',
                'card' => 'Card',
                'collapse' => 'Collapse',
                'dropdown' => 'Dropdown',
                'hero' => 'Hero',
                'jumbotron' => 'Jumbotron',
                'list-group' => 'List Group',
            ],
        ],
        'navigation' => [
            'label' => 'Navigation',
            'icon' => 'ri-compass-3-line',
            'description' => 'Barre de navigation, sidebar, onglets, fil d\'Ariane et pagination.',
            'pages' => [
                'navbar' => 'Navbar',
                'sidebar' => 'Sidebar',
                'nav-tabs' => 'Nav & Tabs',
                'breadcrumb' => 'Breadcrumb',
                'pagination' => 'Pagination',
            ],
        ],
        'feedback' => [
            'label' => 'Feedback',
            'icon' => 'ri-notification-3-line',
            'description' => 'Alertes, toasts et boîtes de dialogue.',
            'pages' => ['alert' => 'Alert', 'toast' => 'Toast', 'modal' => 'Modal & Dialog'],
        ],
        'utilities' => [
            'label' => 'Utilitaires',
            'icon' => 'ri-tools-line',
            'description' => 'Espacement, flex, grille, texte, couleurs, bordures, ombres et icônes.',
            'pages' => [
                'spacing' => 'Spacing',
                'gap' => 'Gap',
                'display' => 'Display',
                'flex' => 'Flex',
                'grid' => 'CSS Grid',
                'columns' => 'Columns',
                'sizing' => 'Sizing & Position',
                'text' => 'Text',
                'background' => 'Background',
                'border' => 'Border',
                'shadow' => 'Shadow',
                'link' => 'Link',
                'icons' => 'Icons',
                'object-fit' => 'Object Fit',
            ],
        ],
        'features' => [
            'label' => 'Fonctionnalités',
            'icon' => 'ri-flashlight-line',
            'description' => 'Thème clair et sombre, presse-papier, formulaires et Markdown.',
            'pages' => [
                'theme' => 'Theme',
                'clipboard' => 'Clipboard',
                'form-manager' => 'Form Manager',
                'markdown' => 'Markdown',
            ],
        ],
    ];

    /** @var array<string, array>|null */
    private ?array $navigation = null;

    public function __construct(
        #[Autowire('%kernel.project_dir%')]
        private readonly string $projectDir,
        private readonly UrlGeneratorInterface $urlGenerator,
    ) {
    }

    /**
     * Catégories et pages, dans l'ordre d'affichage. Les pages sont les fichiers
     * templates/docs/{catégorie}/_{page}.html.twig.
     *
     * @return array<string, array{type: string, label: string, icon: string, description: string, pages: list<array>}>
     */
    public function getNavigation(): array
    {
        if ($this->navigation !== null) {
            return $this->navigation;
        }

        $files = $this->scanTemplates();
        $navigation = [];

        foreach ([...array_keys(self::CATEGORIES), ...array_keys($files)] as $type) {
            if (isset($navigation[$type]) || empty($files[$type])) {
                continue;
            }

            $config = self::CATEGORIES[$type] ?? [];
            $titles = $config['pages'] ?? [];
            // Pages connues dans l'ordre configuré, puis les nouvelles par ordre alphabétique
            $names = [...array_intersect(array_keys($titles), $files[$type]), ...array_diff($files[$type], array_keys($titles))];

            $navigation[$type] = [
                'type' => $type,
                'label' => $config['label'] ?? self::humanize($type),
                'icon' => $config['icon'] ?? 'ri-folder-2-line',
                'description' => $config['description'] ?? '',
                'pages' => array_map(fn (string $name): array => [
                    'name' => $name,
                    'title' => $titles[$name] ?? self::humanize($name),
                    'url' => $this->urlGenerator->generate('component_docs_show', ['type' => $type, 'component' => $name]),
                ], $names),
            ];
        }

        return $this->navigation = $navigation;
    }

    /**
     * Une page, sa catégorie et ses voisines dans la navigation (null si inconnue).
     *
     * @return array{category: array, page: array, previous: ?array, next: ?array}|null
     */
    public function findPage(string $type, string $component): ?array
    {
        $flat = [];
        foreach ($this->getNavigation() as $category) {
            foreach ($category['pages'] as $page) {
                $flat[] = ['category' => $category, 'page' => $page];
            }
        }

        foreach ($flat as $index => $entry) {
            if ($entry['category']['type'] === $type && $entry['page']['name'] === $component) {
                return [...$entry, 'previous' => $flat[$index - 1] ?? null, 'next' => $flat[$index + 1] ?? null];
            }
        }

        return null;
    }

    public function getPageCount(): int
    {
        return array_sum(array_map(fn (array $category): int => count($category['pages']), $this->getNavigation()));
    }

    public function getVersion(): string
    {
        $package = json_decode((string) file_get_contents($this->projectDir . '/package.json'), true);

        return $package['version'] ?? '';
    }

    public function getData(string $route): array
    {
        if ($route === 'avatar' || $route === 'images-figures') {

            $images = [
                'avatar/alex-suprun-ZHvM3XIOHoE-unsplash.jpg',
                'avatar/christopher-campbell-rDEOVtE7vOs-unsplash.jpg',
                'avatar/diego-hernandez-MSepzbKFz10-unsplash.jpg',
                'avatar/michael-dam-mEZ3PoFGs_k-unsplash.jpg',
            ];
            if ($route === 'images-figures') {
                $images = [
                    ...$images,
                    'thumbs/sasha-matveeva-ZDRTxP2aWpc-unsplash.jpg',
                    'thumbs/marco-grosso-AP6a3tBJD70-unsplash',
                    'thumbs/land-o-lakes-inc-k71TQkbVIgI-unsplash.jpg',
                    'thumbs/land-o-lakes-inc-1w3tO5F8HYY-unsplash.jpg',
                    'thumbs/land-o-lakes-inc--NwK3jWezuI-unsplash.jpg',
                    'thumbs/david-becker-xt5yt49f3_Y-unsplash.jpg',
                ];
            }

            return compact('images');
        }
        return [];
    }

    /**
     * @return array<string, list<string>> Noms de pages par catégorie
     */
    private function scanTemplates(): array
    {
        $files = [];

        foreach (glob($this->projectDir . '/templates/docs/*', GLOB_ONLYDIR) ?: [] as $directory) {
            foreach (glob($directory . '/_*.html.twig') ?: [] as $file) {
                if (preg_match('/^_([a-zA-Z0-9_-]+)\.html\.twig$/', basename($file), $matches)) {
                    $files[basename($directory)][] = $matches[1];
                }
            }
        }

        return $files;
    }

    private static function humanize(string $name): string
    {
        return ucwords(str_replace(['_', '-'], ' ', $name));
    }
}
