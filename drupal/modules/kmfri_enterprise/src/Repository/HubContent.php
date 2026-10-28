<?php

declare(strict_types=1);

namespace Drupal\kmfri_enterprise\Repository;

use Drupal\Component\Serialization\Yaml;
use Drupal\Core\Extension\ModuleExtensionList;

/**
 * Editorial content shipped with the module (data/*.yml).
 *
 * - hub.yml: hero slides, homepage sections, filters, contacts.
 * - laboratories.yml: Laboratory Services content from kmfri.go.ke.
 * - fallback.yml: read-only catalogue used when the database is unreachable.
 */
final class HubContent {

  /**
   * Parsed files, keyed by name.
   *
   * @var array<string, array>
   */
  private array $files = [];

  public function __construct(private readonly ModuleExtensionList $moduleList) {}

  /**
   * Returns hub.yml, or one top-level key of it.
   */
  public function hub(?string $key = NULL): array|string {
    $data = $this->load('hub');
    return $key === NULL ? $data : ($data[$key] ?? []);
  }

  public function laboratories(): array {
    return $this->load('laboratories');
  }

  /**
   * One laboratory network (ocean-coastal, freshwater, aquaculture) or NULL.
   */
  public function laboratoryGroup(string $id): ?array {
    foreach ($this->laboratories()['groups'] as $group) {
      if ($group['id'] === $id) {
        return $group;
      }
    }
    return NULL;
  }

  public function fallback(): array {
    return $this->load('fallback');
  }

  private function load(string $name): array {
    if (!isset($this->files[$name])) {
      $path = $this->moduleList->getPath('kmfri_enterprise') . "/data/$name.yml";
      $this->files[$name] = Yaml::decode((string) file_get_contents($path)) ?? [];
    }
    return $this->files[$name];
  }

}
