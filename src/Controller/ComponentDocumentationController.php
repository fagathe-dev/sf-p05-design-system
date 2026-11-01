<?php

namespace App\Controller;

use App\Service\ComponentDocumentationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/ui/docs', name: 'component_docs_')]
class ComponentDocumentationController extends AbstractController
{
    public function __construct(
        private readonly ComponentDocumentationService $service,
    ) {
    }

    /**
     * L'entrée de la documentation est sa première page
     */
    #[Route('', name: 'index', methods: ['GET'])]
    public function index(): RedirectResponse
    {
        $navigation = $this->service->getNavigation();
        $firstCategory = reset($navigation);

        if (!$firstCategory) {
            throw $this->createNotFoundException('Aucune page de documentation.');
        }

        return $this->redirect($firstCategory['pages'][0]['url']);
    }

    /**
     * Une catégorie n'a pas de page propre : on ouvre sa première page
     */
    #[Route('/{type}', name: 'category', methods: ['GET'])]
    public function category(string $type): RedirectResponse
    {
        $category = $this->service->getNavigation()[$type] ?? null;

        if (!$category) {
            throw $this->createNotFoundException("Catégorie de composants '{$type}' introuvable.");
        }

        return $this->redirect($category['pages'][0]['url']);
    }

    /**
     * Affiche une page de documentation
     */
    #[Route('/{type}/{component}', name: 'show', methods: ['GET'])]
    public function show(string $type, string $component): Response
    {
        $entry = $this->service->findPage($type, $component);

        if (!$entry) {
            throw $this->createNotFoundException("Page de documentation '{$type}/{$component}' introuvable.");
        }

        return $this->render('docs/show.html.twig', [
            ...$entry,
            'component_template' => "docs/{$type}/_{$component}.html.twig",
            'page_title' => $entry['page']['title'],
            ...$this->service->getData($component),
        ]);
    }
}
