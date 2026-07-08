<?php
declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Twig\Environment;

final class LayoutController extends AbstractController
{

    public function __construct(private readonly Environment $twig,){}

    #[Route('/layout/{layout}', name: 'app_layout_index', methods: ['GET'], requirements: ['layout' => 'auth|dashboard|app'])]
    public function layout(string $layout): Response
    {
        $layoutTemplate = 'layouts/' . $layout . '.html.twig';

        // Vérifier si le template existe
        try {
            $this->twig->getLoader()->getSourceContext($layoutTemplate);
        } catch (\Twig\Error\LoaderError $e) {
            return $this->render($layoutTemplate, [
                'error' => true,
                'layout_name' => $layout,
                'layout_title' => ucwords(str_replace(['_', '-'], ' ', $layoutTemplate)),
                'page_title' => 'La template `' . $layoutTemplate . '`non trouvé',
            ]);
        }

        return $this->render($layoutTemplate);
    }
}