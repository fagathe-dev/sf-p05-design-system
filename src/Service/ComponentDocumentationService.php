<?php
namespace App\Service;

use App\Utils\Front\Breadcrumb\Breadcrumb;

final class ComponentDocumentationService
{
    public function __construct()
    {
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

}