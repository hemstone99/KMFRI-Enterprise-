<?php

declare(strict_types=1);

namespace Drupal\kmfri_enterprise\Plugin\Derivative;

use Drupal\Component\Plugin\Derivative\DeriverBase;
use Drupal\Core\Plugin\Discovery\ContainerDeriverInterface;
use Drupal\kmfri_enterprise\Repository\Catalogue;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * "Service Catalogue" dropdown: one link per catalogue division.
 */
class CatalogueMenuLinks extends DeriverBase implements ContainerDeriverInterface {

  /**
   * Division id => icon in the module sprite (matches DIVISION_ICONS in the React app).
   */
  public const ICONS = [
    'laboratory' => 'flask-conical',
    'aquaculture' => 'fish',
    'maritime' => 'ship',
    'visits' => 'landmark',
    'conference' => 'building-2',
    'attachment' => 'graduation-cap',
    'research' => 'database',
    'customer' => 'headset',
  ];

  public function __construct(protected Catalogue $catalogue) {}

  public static function create(ContainerInterface $container, $base_plugin_id) {
    return new static($container->get('kmfri_enterprise.catalogue'));
  }

  public function getDerivativeDefinitions($base_plugin_definition) {
    $this->derivatives = [];
    foreach ($this->catalogue->divisions() as $weight => $division) {
      $groups = count($division['children']);
      $this->derivatives[$division['id']] = [
        'title' => $division['title'],
        'description' => sprintf('%d %s · %d %s', $division['count'], $division['count'] === 1 ? 'service' : 'services', $groups, $groups === 1 ? 'group' : 'groups'),
        'route_name' => 'kmfri_enterprise.catalogue',
        'route_parameters' => ['division' => $division['slug']],
        'weight' => $weight,
        'metadata' => ['kmfri_icon' => self::ICONS[$division['id']] ?? 'layers'],
      ] + $base_plugin_definition;
    }
    return $this->derivatives;
  }

}
