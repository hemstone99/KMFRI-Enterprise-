<?php

declare(strict_types=1);

namespace Drupal\kmfri_enterprise\Plugin\Derivative;

use Drupal\Component\Plugin\Derivative\DeriverBase;
use Drupal\Core\Plugin\Discovery\ContainerDeriverInterface;
use Drupal\kmfri_enterprise\Repository\Catalogue;
use Drupal\kmfri_enterprise\Repository\HubRepository;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * "Research Stations" dropdown: one link per station page (/enterprise/stations/{slug}).
 */
class StationMenuLinks extends DeriverBase implements ContainerDeriverInterface {

  public function __construct(protected HubRepository $repository) {}

  public static function create(ContainerInterface $container, $base_plugin_id) {
    return new static($container->get('kmfri_enterprise.repository'));
  }

  public function getDerivativeDefinitions($base_plugin_definition) {
    $this->derivatives = [];
    foreach ($this->repository->stations() as $weight => $station) {
      $this->derivatives[$station['id']] = [
        'title' => $station['name'],
        'description' => $station['county'],
        'route_name' => 'kmfri_enterprise.station',
        'route_parameters' => ['station' => Catalogue::stationSlug($station)],
        'weight' => $weight,
        'metadata' => ['kmfri_icon' => 'map-pin'],
      ] + $base_plugin_definition;
    }
    return $this->derivatives;
  }

}
