<?php

declare(strict_types=1);

namespace Drupal\kmfri_enterprise\Plugin\Block;

use Drupal\Core\Block\Attribute\Block;
use Drupal\Core\Block\BlockBase;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\Core\Url;
use Drupal\kmfri_enterprise\Repository\Catalogue;
use Drupal\kmfri_enterprise\Repository\HubContent;
use Drupal\kmfri_enterprise\Repository\HubRepository;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Site footer: identity, enterprise services, quick links, contacts, legal bar, accessibility help.
 */
#[Block(
  id: 'kmfri_enterprise_footer',
  admin_label: new TranslatableMarkup('KMFRI hub footer'),
  category: new TranslatableMarkup('KMFRI'),
)]
final class HubFooterBlock extends BlockBase implements ContainerFactoryPluginInterface {

  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    private readonly HubRepository $repository,
    private readonly HubContent $content,
    private readonly Catalogue $catalogue,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
  }

  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition): static {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('kmfri_enterprise.repository'),
      $container->get('kmfri_enterprise.content'),
      $container->get('kmfri_enterprise.catalogue'),
    );
  }

  public function build(): array {
    $main = $this->content->hub('main_site');
    $route = fn (string $name) => Url::fromRoute($name)->toString();
    return [
      '#theme' => 'kmfri_enterprise_footer',
      '#divisions' => array_map(fn (array $d) => ['title' => $d['title'], 'url' => Catalogue::url($d['path'])], $this->catalogue->divisions()),
      '#quick_links' => [
        ['label' => $this->t('Service Catalogue'), 'url' => Catalogue::url()],
        ['label' => $this->t('Laboratory Services'), 'url' => $route('kmfri_enterprise.laboratories')],
        ['label' => $this->t('Research Stations'), 'url' => $route('kmfri_enterprise.stations')],
        ['label' => $this->t('Tariffs & Service Charter'), 'url' => $route('kmfri_enterprise.charter')],
        ['label' => $this->t('Request a Quotation'), 'url' => $route('kmfri_enterprise.quote')],
        ['label' => $this->t('KMFRI Services (E-Citizen)'), 'url' => 'https://kmfri.ecitizen.go.ke/', 'external' => TRUE],
        ['label' => $this->t('KMFRI Main Website'), 'url' => $main, 'external' => TRUE],
      ],
      '#social' => $this->content->hub('social'),
      '#contact' => $this->content->hub('contact'),
      '#main_site' => $main,
      '#year' => date('Y'),
      '#cache' => $this->repository->cacheability(),
      '#attached' => ['library' => ['kmfri_enterprise/hub']],
    ];
  }

}
