<?php

declare(strict_types=1);

namespace Drupal\kmfri_enterprise\Plugin\Derivative;

use Drupal\Component\Plugin\Derivative\DeriverBase;
use Drupal\Core\Plugin\Discovery\ContainerDeriverInterface;
use Drupal\kmfri_enterprise\Repository\HubContent;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * "Laboratory Services" dropdown: the laboratory networks, Mariculture & Aquarium and the FAQ.
 */
class LaboratoryMenuLinks extends DeriverBase implements ContainerDeriverInterface {

  private const ICONS = [
    'ocean-coastal' => 'waves',
    'freshwater' => 'droplets',
    'aquaculture' => 'fish',
  ];

  public function __construct(protected HubContent $content) {}

  public static function create(ContainerInterface $container, $base_plugin_id) {
    return new static($container->get('kmfri_enterprise.content'));
  }

  public function getDerivativeDefinitions($base_plugin_definition) {
    $labs = $this->content->laboratories();
    $this->derivatives = [];
    foreach ($labs['groups'] as $weight => $group) {
      $this->derivatives[$group['id']] = [
        'title' => $group['short_name'],
        'description' => $group['summary'],
        'route_name' => 'kmfri_enterprise.laboratory_group',
        'route_parameters' => ['group' => $group['id']],
        'weight' => $weight,
        'metadata' => ['kmfri_icon' => self::ICONS[$group['id']] ?? 'flask-conical'],
      ] + $base_plugin_definition;
    }
    $this->derivatives['mariculture'] = [
      'title' => $labs['mariculture']['name'],
      'description' => $labs['mariculture']['summary'],
      'url' => $labs['mariculture']['url'],
      'weight' => 20,
      'metadata' => ['kmfri_icon' => 'anchor', 'external' => TRUE],
    ] + $base_plugin_definition;
    $this->derivatives['faq'] = [
      'title' => 'Frequently Asked Questions',
      'description' => 'Sample submission, turnaround times, accreditation and confidentiality',
      'route_name' => 'kmfri_enterprise.laboratories',
      'options' => ['fragment' => 'lab-faq'],
      'weight' => 30,
      'metadata' => ['kmfri_icon' => 'circle-help'],
    ] + $base_plugin_definition;
    return $this->derivatives;
  }

}
