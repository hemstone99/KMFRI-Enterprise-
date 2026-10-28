<?php

declare(strict_types=1);

namespace Drupal\kmfri_enterprise\Plugin\Block;

use Drupal\Core\Block\Attribute\Block;
use Drupal\Core\Block\BlockBase;
use Drupal\Core\Cache\Cache;
use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Menu\MenuActiveTrailInterface;
use Drupal\Core\Menu\MenuLinkTreeInterface;
use Drupal\Core\Menu\MenuTreeParameters;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\Core\Url;
use Drupal\kmfri_enterprise\Repository\Catalogue;
use Drupal\kmfri_enterprise\Repository\HubContent;
use Drupal\kmfri_enterprise\Repository\HubRepository;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Site header: announcement strip, main navigation (Drupal "main" menu), drawer and search.
 */
#[Block(
  id: 'kmfri_enterprise_header',
  admin_label: new TranslatableMarkup('KMFRI hub header and main navigation'),
  category: new TranslatableMarkup('KMFRI'),
)]
final class HubHeaderBlock extends BlockBase implements ContainerFactoryPluginInterface {

  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    private readonly MenuLinkTreeInterface $menuTree,
    private readonly MenuActiveTrailInterface $activeTrail,
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
      $container->get('menu.link_tree'),
      $container->get('menu.active_trail'),
      $container->get('kmfri_enterprise.repository'),
      $container->get('kmfri_enterprise.content'),
      $container->get('kmfri_enterprise.catalogue'),
    );
  }

  public function build(): array {
    $cache = new CacheableMetadata();

    $parameters = (new MenuTreeParameters())
      ->setMaxDepth(2)
      ->onlyEnabledLinks()
      ->setActiveTrail($this->activeTrail->getActiveTrailIds('main'));
    $tree = $this->menuTree->transform($this->menuTree->load('main', $parameters), [
      ['callable' => 'menu.default_tree_manipulators:checkAccess'],
      ['callable' => 'menu.default_tree_manipulators:generateIndexAndSort'],
    ]);
    $menu = $this->menuTree->build($tree);
    $cache->addCacheableDependency(CacheableMetadata::createFromRenderArray($menu));

    $build = [
      '#theme' => 'kmfri_enterprise_header',
      '#menu' => self::items($menu['#items'] ?? [], $cache),
      '#topbar_links' => $this->content->hub('topbar_links'),
      '#social' => $this->content->hub('social'),
      '#contact' => $this->content->hub('contact'),
      '#search_groups' => $this->searchGroups(),
      '#total' => $this->catalogue->total(),
      '#stations' => $this->repository->stations(),
      '#attached' => ['library' => ['kmfri_enterprise/hub']],
    ];
    $cache->addCacheableDependency(CacheableMetadata::createFromRenderArray(['#cache' => $this->repository->cacheability()]));
    $cache->applyTo($build);
    return $build;
  }

  /**
   * The highlighted tab depends on the active trail; links change with the menu config.
   */
  public function getCacheContexts(): array {
    return Cache::mergeContexts(parent::getCacheContexts(), ['route.menu_active_trails:main']);
  }

  public function getCacheTags(): array {
    return Cache::mergeTags(parent::getCacheTags(), ['config:system.menu.main', HubRepository::CACHE_TAG]);
  }

  /**
   * Everything the search dialog can find, as result groups (filtered in the browser by
   * js/hub.js kmfriSearch with the same word matching as Catalogue::matches()).
   *
   * Each result: type (services|labs|stations|pages, for the filter tabs), education,
   * default (shown before typing), title, kicker, sub, meta, icon or division_icon,
   * tone, url, text (lower-case search text).
   *
   * @return array<int, array{key: string, label: string, unit: string, limit: ?int, more: ?string, more_label: ?string, items: array}>
   */
  private function searchGroups(): array {
    $education = ['visits', 'attachment'];
    $result = fn (array $r): array => $r + [
      'education' => FALSE,
      'default' => FALSE,
      'kicker' => NULL,
      'sub' => NULL,
      'meta' => NULL,
      'icon' => NULL,
      'division_icon' => NULL,
      'tone' => 'teal',
      'text' => mb_strtolower(implode(' ', array_filter([$r['title'], $r['kicker'] ?? NULL, $r['sub'] ?? NULL, $r['meta'] ?? NULL, $r['keywords'] ?? NULL]))),
    ];
    $count = fn (array $n) => $n['count'] . ' ' . ($n['count'] == 1 ? 'service' : 'services') . ($n['from_kes'] !== NULL ? ' · from Ksh ' . number_format((float) $n['from_kes']) : '');

    // Service areas, groups and individual services.
    $divisions = [];
    $nodes = [];
    $walk = function (array $node, array $parents) use (&$walk, &$nodes, $result, $count, $education): void {
      foreach ($node['children'] as $child) {
        $nodes[] = $result([
          'type' => 'services',
          'education' => in_array($parents[0]['id'] ?? $node['id'], $education, TRUE),
          'title' => $child['title'],
          'kicker' => implode(' › ', array_column([...$parents, $node], 'title')),
          'sub' => $child['summary'],
          'meta' => $count($child),
          'icon' => 'layers',
          'tone' => 'navy',
          'url' => Catalogue::url($child['path']),
          'keywords' => $child['register_label'],
        ]);
        $walk($child, [...$parents, $node]);
      }
    };
    foreach ($this->catalogue->divisions() as $i => $d) {
      $divisions[] = $result([
        'type' => 'services',
        'education' => in_array($d['id'], $education, TRUE),
        'default' => $i < 4,
        'title' => $d['title'],
        'sub' => $d['tagline'],
        'meta' => $count($d),
        'division_icon' => $d['id'],
        'url' => Catalogue::url($d['path']),
        'keywords' => implode(' ', [$d['highlight'], $d['register_label'], ...array_column($d['children'], 'title')]),
      ]);
      $walk($d, []);
    }
    $services = array_map(fn (array $e) => $result([
      'type' => 'services',
      'education' => in_array($e['trail'][0]['id'], $education, TRUE),
      'title' => $e['item']['name'],
      'kicker' => implode(' › ', array_column($e['trail'], 'title')),
      'meta' => Catalogue::fee($e['item']) . ($e['item']['online'] ? ' · Apply online on eCitizen' : ''),
      'icon' => 'list-tree',
      'tone' => 'navy',
      'url' => Catalogue::url(end($e['trail'])['path']),
      'keywords' => implode(' ', array_filter([$e['item']['blurb'], $e['item']['note'], 'register ' . $e['item']['no']])),
    ]), $this->catalogue->index());

    // Standard rates of portfolios (vessel charter, conference halls, datasets …).
    $charter = Url::fromRoute('kmfri_enterprise.charter')->toString();
    $rates = [];
    foreach ($this->repository->services() as $s) {
      $division = $this->catalogue->divisionForService($s['slug']);
      $anchor = 'tariffs-' . ($division['id'] ?? $s['slug']);
      foreach ($s['pricing_tiers'] as $t) {
        if (empty($t['register_no'])) {
          $rates[] = $result([
            'type' => 'services',
            'education' => in_array($division['id'] ?? '', $education, TRUE),
            'title' => $t['name'],
            'kicker' => $s['title'],
            'meta' => 'Ksh ' . number_format($t['cost_kes']) . ' ' . $t['unit'],
            'icon' => 'receipt',
            'url' => "$charter#$anchor",
            'keywords' => $s['category_label'],
          ]);
        }
      }
    }

    // Laboratory Services (laboratory groups and their units).
    $labs = [];
    foreach ($this->content->laboratories()['groups'] as $g) {
      $url = Url::fromRoute('kmfri_enterprise.laboratory_group', ['group' => $g['id']])->toString();
      $labs[] = $result(['type' => 'labs', 'title' => $g['name'], 'kicker' => 'Laboratory Services', 'sub' => $g['summary'], 'icon' => 'microscope', 'url' => $url, 'keywords' => $g['intro'] ?? NULL]);
      foreach ($g['units'] ?? [] as $u) {
        $labs[] = $result(['type' => 'labs', 'title' => $u['name'], 'kicker' => $g['short_name'] ?? $g['name'], 'sub' => implode(' · ', $u['services'] ?? []), 'icon' => 'flask-conical', 'tone' => 'navy', 'url' => $url]);
      }
    }

    // Research stations.
    $stations = [];
    foreach ($this->repository->stations() as $i => $st) {
      $stations[] = $result([
        'type' => 'stations',
        'default' => $i < 3,
        'title' => $st['name'],
        'kicker' => "{$st['code']} · {$st['county']}",
        'sub' => $st['description'],
        'icon' => 'map-pin',
        'tone' => 'solid',
        'url' => Url::fromRoute('kmfri_enterprise.station', ['station' => Catalogue::stationSlug($st)])->toString(),
        'keywords' => implode(' ', [$st['location'], ...$st['primary_focus']]),
      ]);
    }

    // Hub pages people look for by task.
    $pages = array_map($result, [
      ['type' => 'pages', 'title' => 'Tariffs & Charter', 'sub' => 'Every published price, standard rates and service charter commitments.', 'icon' => 'receipt', 'url' => $charter, 'keywords' => 'tariffs prices price list fees charges cost how much charter turnaround complaints redress'],
      ['type' => 'pages', 'title' => 'Request a quotation', 'sub' => 'Send your sample list, quantities or dates for an official KMFRI quotation.', 'icon' => 'file-pen-line', 'url' => Url::fromRoute('kmfri_enterprise.quote')->toString(), 'keywords' => 'quote quotation order book booking buy purchase request invoice estimate'],
      ['type' => 'pages', 'title' => 'Service Catalogue', 'sub' => 'All ' . $this->catalogue->total() . ' KMFRI services by area, group and sub-group.', 'icon' => 'building-2', 'url' => Catalogue::url(), 'keywords' => 'catalogue directory all services list'],
      ['type' => 'pages', 'title' => 'Apply online on eCitizen', 'sub' => $this->catalogue->onlineTotal() . ' services can be applied for and paid online.', 'icon' => 'external-link', 'url' => $this->catalogue->ecitizenUrl(), 'keywords' => 'ecitizen apply online pay payment mpesa account'],
    ]);

    return [
      ['key' => 'pages', 'label' => 'Pages', 'unit' => 'pages', 'limit' => 3, 'more' => NULL, 'more_label' => NULL, 'items' => $pages],
      ['key' => 'divisions', 'label' => 'Service Areas', 'unit' => 'areas', 'limit' => NULL, 'more' => NULL, 'more_label' => NULL, 'items' => $divisions],
      ['key' => 'groups', 'label' => 'Service Groups', 'unit' => 'groups', 'limit' => 4, 'more' => NULL, 'more_label' => NULL, 'items' => $nodes],
      ['key' => 'catalogue', 'label' => 'Tests, Products & Applications', 'unit' => 'services', 'limit' => 8, 'more' => Catalogue::url(), 'more_label' => 'See all @count matching services in the catalogue', 'items' => $services],
      ['key' => 'rates', 'label' => 'Standard Rates', 'unit' => 'rates', 'limit' => 5, 'more' => "$charter#tariff-schedule", 'more_label' => 'See all @count matching rates on Tariffs & Charter', 'items' => $rates],
      ['key' => 'labs', 'label' => 'Laboratory Services', 'unit' => 'results', 'limit' => 5, 'more' => NULL, 'more_label' => NULL, 'items' => $labs],
      ['key' => 'stations', 'label' => 'Research Stations & Centres', 'unit' => 'stations', 'limit' => NULL, 'more' => NULL, 'more_label' => NULL, 'items' => $stations],
    ];
  }

  /**
   * Flattens menu tree items for the template (URLs as strings, icon metadata).
   */
  private static function items(array $items, CacheableMetadata $cache): array {
    $out = [];
    foreach ($items as $item) {
      $generated = $item['url']->toString(TRUE);
      $cache->addCacheableDependency($generated);
      $link = $item['original_link'];
      $meta = $link->getMetaData();
      $out[] = [
        'id' => preg_replace('/[^a-z0-9]+/', '-', strtolower($link->getPluginId())),
        'title' => $item['title'],
        'description' => $link->getDescription(),
        'url' => $generated->getGeneratedUrl(),
        'external' => $item['url']->isExternal(),
        'active' => !empty($item['in_active_trail']),
        'icon' => $meta['kmfri_icon'] ?? NULL,
        'below' => self::items($item['below'] ?? [], $cache),
      ];
    }
    return $out;
  }

}
