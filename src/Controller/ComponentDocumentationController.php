<?php

namespace App\Controller;

use App\Service\ComponentDocumentationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Twig\Environment;

#[Route('/ui/docs', name: 'component_docs_')]
class ComponentDocumentationController extends AbstractController
{
    public function __construct(
        private readonly Environment $twig,
        private readonly ComponentDocumentationService $service,
    ) {
    }

    /**
     * Scanne dynamiquement les dossiers et retourne la structure complète
     */
    private function getDocumentationStructure(): array
    {
        $baseDir = $this->getParameter('kernel.project_dir') . '/templates/docs';
        $documentation = [];

        if (is_dir($baseDir)) {
            $iterator = new \DirectoryIterator($baseDir);
            foreach ($iterator as $folder) {
                if ($folder->isDir() && !$folder->isDot()) {
                    $type = $folder->getFilename();
                    $documentation[$type] = [];

                    $files = scandir($folder->getPathname());
                    foreach ($files as $file) {
                        if (preg_match('/^_([a-zA-Z0-9_-]+)\.html\.twig$/', $file, $matches)) {
                            $componentName = $matches[1];
                            $documentation[$type][] = [
                                'name' => $componentName,
                                'title' => ucwords(str_replace(['_', '-'], ' ', $componentName)),
                                'url' => $this->generateUrl('component_docs_show', [
                                    'type' => $type,
                                    'component' => $componentName
                                ])
                            ];
                        }
                    }

                    if (empty($documentation[$type])) {
                        unset($documentation[$type]);
                    }
                }
            }
        }

        ksort($documentation);
        return $documentation;
    }

    /**
     * NIVEAU 1 : Liste toutes les catégories de composants (ex: forms, grid, components)
     */
    #[Route('', name: 'index', methods: ['GET'])]
    public function index(): Response
    {
        $documentation = $this->getDocumentationStructure();

        return $this->render('docs/index.html.twig', [
            'documentation' => $documentation,
            'page_title' => 'Base UI - Documentation'
        ]);
    }

    /**
     * NIVEAU 2 : Liste les composants appartenant à un type/catégorie spécifique
     */
    #[Route('/{type}', name: 'category', methods: ['GET'])]
    public function category(string $type): Response
    {
        $documentation = $this->getDocumentationStructure();

        if (!isset($documentation[$type])) {
            throw $this->createNotFoundException("Catégorie de composants '{$type}' introuvable.");
        }

        return $this->render('docs/category.html.twig', [
            'type' => $type,
            'components' => $documentation[$type],
            'page_title' => 'Composants - ' . ucfirst($type)
        ]);
    }

    /**
     * NIVEAU 3 : Affiche la démonstration d'un composant spécifique
     */
    #[Route('/{type}/{component}', name: 'show', methods: ['GET'])]
    public function show(string $type, string $component): Response
    {
        $componentTemplate = "docs/{$type}/_{$component}.html.twig";

        try {
            $this->twig->getLoader()->getSourceContext($componentTemplate);
        } catch (\Twig\Error\LoaderError $e) {
            return $this->render('docs/show.html.twig', [
                'error' => true,
                'type' => $type,
                'component_name' => $component,
                'component_title' => ucwords(str_replace(['_', '-'], ' ', $component)),
                'page_title' => 'Composant non trouvé'
            ]);
        }

        $data = $this->service->getData($component);

        return $this->render('docs/show.html.twig', [
            'error' => false,
            'type' => $type,
            'component_name' => $component,
            'component_title' => ucwords(str_replace(['_', '-'], ' ', $component)),
            'component_template' => $componentTemplate,
            'page_title' => 'Démo - ' . ucfirst($component),
            ...$data
        ]);
    }
}