<?php

declare(strict_types=1);

namespace Drupal\kmfri_enterprise\Controller;

use Drupal\Core\Cache\CacheableJsonResponse;
use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\File\FileUrlGeneratorInterface;
use Drupal\kmfri_enterprise\Repository\HubRepository;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Read-only JSON API over the catalogue.
 */
final class ApiController extends ControllerBase {

  public function __construct(
    private readonly HubRepository $repository,
    private readonly FileUrlGeneratorInterface $fileUrlGenerator,
  ) {}

  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('kmfri_enterprise.repository'),
      $container->get('file_url_generator'),
    );
  }

  public function health(): JsonResponse {
    try {
      return new JsonResponse($this->repository->health());
    }
    catch (\Throwable) {
      return new JsonResponse(['ok' => FALSE, 'error' => 'The services database is currently unavailable.'], 503);
    }
  }

  public function services(): CacheableJsonResponse {
    return $this->json(array_map([$this, 'withImageUrl'], $this->repository->services()));
  }

  public function service(string $slug): JsonResponse {
    $service = $this->repository->service($slug);
    if (!$service) {
      return new JsonResponse(['error' => 'Service not found'], 404);
    }
    return $this->json($this->withImageUrl($service));
  }

  public function stations(): CacheableJsonResponse {
    return $this->json($this->repository->stations());
  }

  public function charter(): CacheableJsonResponse {
    return $this->json($this->repository->charter());
  }

  private function json(array $data): CacheableJsonResponse {
    $response = new CacheableJsonResponse($data);
    $response->addCacheableDependency(CacheableMetadata::createFromRenderArray(['#cache' => $this->repository->cacheability()])->addCacheContexts(['url.site']));
    return $response;
  }

  private function withImageUrl(array $service): array {
    $path = $this->moduleHandler()->getModule('kmfri_enterprise')->getPath() . '/' . $service['featured_image'];
    $service['featured_image'] = $this->fileUrlGenerator->generateAbsoluteString($path);
    return $service;
  }

}
