<?php

declare(strict_types=1);

namespace Drupal\kmfri_enterprise\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Url;
use Drupal\kmfri_enterprise\Repository\Catalogue;
use Drupal\kmfri_enterprise\Repository\HubContent;
use Drupal\kmfri_enterprise\Repository\HubRepository;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Pages of the Enterprise Services Hub.
 */
final class HubController extends ControllerBase {

  /**
   * Availability filters of the catalogue (?channel=).
   */
  private const CHANNELS = ['all' => 'All services', 'online' => 'Apply online', 'priced' => 'Published tariff'];

  public function __construct(
    private readonly HubRepository $repository,
    private readonly HubContent $content,
    private readonly Catalogue $catalogue,
  ) {}

  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('kmfri_enterprise.repository'),
      $container->get('kmfri_enterprise.content'),
      $container->get('kmfri_enterprise.catalogue'),
    );
  }

  /**
   * Brief homepage: hero → catalogue → ready to order → how it works → request banner.
   */
  public function home(): array {
    $bySlug = array_column($this->repository->services(), NULL, 'slug');
    $slides = [];
    foreach ($this->content->hub('hero_slides') as $slide) {
      $service = isset($slide['slug']) ? ($bySlug[$slide['slug']] ?? NULL) : NULL;
      $division = $this->catalogue->divisionForService($slide['slug'] ?? NULL);
      $slide['eyebrow'] ??= $service['iso_standard'] ?? $service['category_label'] ?? '';
      $slide['subtitle'] ??= $division['tagline'] ?? $service['description'] ?? '';
      $slide['division_url'] = $division ? Catalogue::url($division['path']) : NULL;
      $slide['route_url'] = isset($slide['route']) ? Url::fromRoute($slide['route'])->toString() : NULL;
      $slides[] = $slide;
    }
    $audiences = array_map(fn (array $a) => $a + ['url' => Catalogue::url($a['division'])], $this->content->hub('audiences'));

    return $this->page('kmfri_enterprise_home', [
      '#slides' => $slides,
      '#stats' => $this->content->hub('hero_stats'),
      '#divisions' => $this->catalogue->divisions(),
      '#featured' => $this->catalogue->featured(),
      '#audiences' => $audiences,
      '#steps' => $this->content->hub('steps'),
      '#trust' => $this->content->hub('trust'),
      '#total' => $this->catalogue->total(),
      '#online_total' => $this->catalogue->onlineTotal(),
      '#ecitizen_url' => $this->catalogue->ecitizenUrl(),
    ]);
  }

  /**
   * Service Catalogue: overview, division, group or sub-group page.
   *
   * ?q= and ?channel= filter the services (the page script filters live).
   */
  public function catalogue(Request $request, string $division = '', string $group = '', string $subgroup = ''): array {
    $path = implode('/', array_filter([$division, $group, $subgroup]));
    $trail = $path === '' ? [] : ($this->catalogue->trail($path) ?? throw new NotFoundHttpException());
    $selected = $trail ? end($trail) : NULL;
    $top = $trail[0] ?? NULL;
    $isDivision = count($trail) === 1;

    $q = mb_substr(trim((string) $request->query->get('q', '')), 0, 100);
    $channel = (string) $request->query->get('channel', 'all');
    $channel = isset(self::CHANNELS[$channel]) ? $channel : 'all';
    $filtering = $q !== '' || $channel !== 'all';

    $shown = 0;
    $sections = $this->sections($selected ? [$selected] : $this->catalogue->divisions(), $selected ? count($trail) - 1 : 0, $selected['path'] ?? NULL, $q, $channel, $shown);

    $portfolio = $top && $top['service_slug'] ? $this->repository->service($top['service_slug']) : NULL;
    $stationsHere = $isDivision
      ? array_map(fn (array $st) => ['name' => explode(' (', $st['name'])[0], 'url' => $this->stationUrl($st)], $this->catalogue->stationsForDivision($top, $this->repository->stations(), $this->repository->services()))
      : [];
    $crumbs = [
      ['label' => $this->t('Home'), 'url' => Url::fromRoute('kmfri_enterprise.home')->toString()],
      ['label' => $this->t('Service Catalogue'), 'url' => Catalogue::url()],
    ];
    foreach ($trail as $node) {
      $crumbs[] = ['label' => $node['title'], 'url' => Catalogue::url($node['path'])];
    }

    $build = $this->page('kmfri_enterprise_catalogue', [
      '#divisions' => array_map(fn (array $d) => $this->withUrls($d), $this->catalogue->divisions()),
      '#trail' => $trail,
      '#selected' => $selected,
      '#division' => $top,
      '#is_division' => $isDivision,
      '#portfolio' => $portfolio,
      '#stations_here' => $stationsHere,
      // Portfolio packages only where the register publishes no per-item tariffs.
      '#packages' => $isDivision && $top['from_kes'] === NULL ? ($portfolio['pricing_tiers'] ?? []) : [],
      '#related' => $top ? array_slice(array_values(array_filter($this->catalogue->divisions(), fn (array $d) => $d['id'] !== $top['id'])), 0, 4) : [],
      '#sections' => $sections,
      '#crumbs' => $crumbs,
      '#filters' => ['q' => $q, 'channel' => $channel, 'active' => $filtering],
      '#channels' => self::CHANNELS,
      '#shown' => $shown,
      '#scope_count' => $selected['count'] ?? $this->catalogue->total(),
      '#total' => $this->catalogue->total(),
      '#online_total' => $this->catalogue->onlineTotal(),
      '#ecitizen_url' => $this->catalogue->ecitizenUrl(),
      '#action_url' => Catalogue::url($path),
    ]);
    $build['#cache']['contexts'][] = 'url.query_args:q';
    $build['#cache']['contexts'][] = 'url.query_args:channel';
    return $build;
  }

  public function catalogueTitle(string $division = '', string $group = '', string $subgroup = ''): string {
    $trail = $this->catalogue->trail(implode('/', array_filter([$division, $group, $subgroup])));
    return $trail ? end($trail)['title'] : (string) $this->t('Service Catalogue');
  }

  /**
   * Former services directory: the catalogue (search terms carried over).
   */
  public function services(Request $request): RedirectResponse {
    $q = trim((string) $request->query->get('q', ''));
    $url = Catalogue::url() . ($q !== '' ? '?' . http_build_query(['q' => $q]) : '');
    return new RedirectResponse($url, 301);
  }

  /**
   * Former portfolio page: the catalogue division presenting the portfolio.
   */
  public function service(string $slug): RedirectResponse {
    return new RedirectResponse($this->catalogue->serviceUrl($slug), 301);
  }

  public function laboratories(?string $group = NULL): array {
    $labs = $this->content->laboratories();
    $active = 0;
    if ($group !== NULL) {
      $ids = array_column($labs['groups'], 'id');
      $active = array_search($group, $ids, TRUE);
      if ($active === FALSE) {
        throw new NotFoundHttpException();
      }
    }
    return $this->page('kmfri_enterprise_laboratories', [
      '#labs' => $labs,
      '#active_group' => $active,
      '#quote_slug' => 'laboratory-analytical-services',
    ]);
  }

  public function laboratoryTitle(string $group): string {
    $lab = $this->content->laboratoryGroup($group);
    return $lab ? $lab['name'] : (string) $this->t('Laboratory Services');
  }

  /**
   * Research stations directory: one card per station, each linking to its own page.
   */
  public function stations(): array {
    $services = $this->repository->services();
    $stations = array_map(fn (array $st) => $st + [
      'url' => $this->stationUrl($st),
      'image' => $this->catalogue->stationImage($st),
      'offer' => $this->catalogue->stationOffer($st, $services),
    ], $this->repository->stations());
    return $this->page('kmfri_enterprise_stations', ['#stations' => $stations]);
  }

  /**
   * One station: overview and contacts, every catalogue service offered there, booking.
   *
   * Bookings carry the station (?station=) so the quotation names it as the preferred centre.
   */
  public function station(string $station): array|RedirectResponse {
    $stations = $this->repository->stations();
    $record = Catalogue::findStation($stations, $station) ?? throw new NotFoundHttpException();
    $slug = Catalogue::stationSlug($record);
    if ($station !== $slug) {
      return new RedirectResponse($this->stationUrl($record), 301);
    }
    $offer = $this->catalogue->stationOffer($record, $this->repository->services());

    $divisions = [];
    foreach ($offer['divisions'] as $division) {
      $shown = 0;
      // Headings drop the division title (each division has its own header on the page).
      $divisions[] = $division + ['sections' => $this->sections([$division], 1, NULL, '', 'all', $shown)];
    }

    $quoteQuery = ['station' => $record['db_id'] ?? $record['id']];
    return $this->page('kmfri_enterprise_station', [
      '#station' => $record + [
        'slug' => $slug,
        'short_name' => explode(' (', $record['name'])[0],
        // "Kegati, Kisii County" already names the county.
        'address' => str_contains($record['location'], $record['county']) ? $record['location'] : "{$record['location']}, {$record['county']}",
        'image' => $this->catalogue->stationImage($record),
        'tel' => preg_replace('/[^\d+]/', '', explode('/', $record['phone'])[0]),
        'map_url' => sprintf('https://www.google.com/maps/search/?api=1&query=%F,%F', $record['coordinates']['lat'], $record['coordinates']['lng']),
      ],
      '#offer' => ['divisions' => $divisions] + $offer,
      '#others' => array_map(fn (array $st) => ['name' => explode(' (', $st['name'])[0], 'url' => $this->stationUrl($st)], array_values(array_filter($stations, fn (array $st) => $st['id'] !== $record['id']))),
      '#quote_query' => $quoteQuery,
      '#quote_url' => Url::fromRoute('kmfri_enterprise.quote', [], ['query' => $quoteQuery])->toString(),
      '#ecitizen_url' => $this->catalogue->ecitizenUrl(),
    ]);
  }

  public function stationTitle(string $station): string {
    return Catalogue::findStation($this->repository->stations(), $station)['name'] ?? (string) $this->t('Research Station');
  }

  /**
   * Tariffs & Charter: the complete tariff schedule (every catalogue service with its
   * tariff, plus the standard rates of portfolios the catalogue does not price) and
   * the charter commitments. ?q= filters the schedule (the page script filters live).
   */
  public function charter(Request $request): array {
    $services = $this->repository->services();
    $schedule = $this->catalogue->tariffSchedule($services);
    $q = trim((string) $request->query->get('q', ''));

    // Each schedule section: rows that match ?q= and the section's anchor.
    $anchors = [];
    $shown = 0;
    $mark = function (array $rows, callable $text) use ($q, &$shown): array {
      return array_map(function (array $r) use ($q, $text, &$shown) {
        $r['search_text'] = mb_strtolower($text($r));
        $r['visible'] = Catalogue::matches($r['search_text'], $q);
        $shown += (int) $r['visible'];
        return $r;
      }, $rows);
    };
    $rateText = fn (array $portfolio) => fn (array $t) => implode(' ', [$t['name'], $t['unit'], $portfolio['title'], $portfolio['category_label']]);
    foreach ($schedule['divisions'] as &$d) {
      $d['rows'] = $mark($d['rows'], fn (array $r) => implode(' ', array_filter([$r['name'], $r['blurb'], $r['group'], $d['title'], $r['unit_label'], $r['fee_note']])));
      $d['rates'] = $d['portfolio'] ? $mark($d['rates'], $rateText($d['portfolio'])) : [];
      $d['anchor'] = 'tariffs-' . $d['id'];
      if ($d['service_slug']) {
        $anchors[$d['service_slug']] = $d['anchor'];
      }
    }
    unset($d);
    foreach ($schedule['other'] as &$o) {
      $o['rates'] = $mark($o['rates'], $rateText($o['portfolio']));
      $o['anchor'] = 'tariffs-' . $o['portfolio']['slug'];
      $anchors[$o['portfolio']['slug']] = $o['anchor'];
    }
    unset($o);

    // Charter commitments: kmfri_services_db.service_charter, or derived from the portfolios.
    $commitments = $this->repository->charter() ?: array_map(fn (array $s) => [
      'service_slug' => $s['slug'],
      'service_code' => $s['code'],
      'service_name' => $s['title'],
      'turnaround_time' => trim(explode('(', $s['turnaround_time'])[0]),
      'fee_summary' => self::feeSummary($s['pricing_tiers']),
      'responsible_officer' => $s['contact_officer']['title'],
      'redress_channel' => NULL,
    ], $services);
    foreach ($commitments as &$c) {
      $c['anchor'] = $anchors[$c['service_slug']] ?? NULL;
    }
    unset($c);

    $build = $this->page('kmfri_enterprise_charter', [
      '#principles' => $this->content->hub('charter_principles'),
      '#schedule' => $schedule,
      '#charter' => $commitments,
      '#q' => $q,
      '#shown' => $shown,
      '#ecitizen_url' => $this->catalogue->ecitizenUrl(),
    ]);
    $build['#cache']['contexts'][] = 'url.query_args:q';
    return $build;
  }

  /**
   * "Ksh 25,000 – 50,000 · 4 published tariffs" (same wording as sql/005).
   */
  private static function feeSummary(array $tiers): string {
    $fees = array_column($tiers, 'cost_kes');
    if (!$fees) {
      return 'On quotation';
    }
    [$lo, $hi] = [min($fees), max($fees)];
    return 'Ksh ' . number_format($lo) . ($hi > $lo ? ' – ' . number_format($hi) : '') . ' · ' . count($fees) . ' published tariffs';
  }

  /**
   * Confirmation for the request just submitted in this session.
   */
  public function receipt(Request $request): array|RedirectResponse {
    $receipt = $request->getSession()->get('kmfri_enterprise.receipt');
    if (!$receipt) {
      return $this->redirect('kmfri_enterprise.quote');
    }
    $build = $this->page('kmfri_enterprise_receipt', ['#receipt' => $receipt]);
    $build['#cache'] = ['max-age' => 0];
    return $build;
  }

  /**
   * Groups at or below $scopes with their services; each row knows whether it matches
   * the filters (?q=, ?channel=) and how its heading reads relative to the scope.
   *
   * @param array $scopes
   *   Catalogue nodes whose groups to list.
   * @param int $relativeFrom
   *   Number of leading trail titles to drop from headings (the scope's depth).
   * @param string|null $selectedPath
   *   The page's own node (its heading is not linked).
   * @param int $shown
   *   Receives the number of matching services.
   */
  private function sections(array $scopes, int $relativeFrom, ?string $selectedPath, string $q, string $channel, int &$shown): array {
    $sections = [];
    foreach ($scopes as $scope) {
      foreach (Catalogue::sections($scope) as $section) {
        $titles = array_column($this->catalogue->trail($section['path']), 'title');
        $relative = array_slice($titles, $relativeFrom);
        $visible = 0;
        $items = array_map(function (array $item) use ($titles, $q, $channel, &$visible) {
          $item['fee_label'] = Catalogue::fee($item);
          $item['search_text'] = mb_strtolower(implode(' ', array_filter([$item['name'], $item['blurb'], $item['note'], $item['fee_unit'], ...$titles])));
          $item['priced'] = $item['fee_kes'] !== NULL || $item['fee_note'] !== NULL;
          $item['visible'] = Catalogue::matches($item['search_text'], $q)
            && ($channel === 'all' || ($channel === 'online' ? $item['online'] : $item['priced']));
          $visible += (int) $item['visible'];
          return $item;
        }, $section['items']);
        $shown += $visible;
        $sections[] = [
          'node' => $section,
          'url' => Catalogue::url($section['path']),
          'is_selected' => $section['path'] === $selectedPath,
          'context' => count($relative) > 1 ? $relative[0] : NULL,
          'heading' => count($relative) > 1 ? implode(' › ', array_slice($relative, 1)) : ($relative[0] ?? $section['title']),
          'items' => $items,
          'visible' => $visible,
        ];
      }
    }
    return $sections;
  }

  private function stationUrl(array $station): string {
    return Url::fromRoute('kmfri_enterprise.station', ['station' => Catalogue::stationSlug($station)])->toString();
  }

  /**
   * Division (and its groups) with web addresses, for the navigator tree.
   */
  private function withUrls(array $node): array {
    $node['url'] = Catalogue::url($node['path']);
    $node['children'] = array_map(fn (array $c) => $this->withUrls($c), $node['children']);
    return $node;
  }

  /**
   * Common render array: theme hook, catalogue cacheability, hub library.
   */
  private function page(string $theme, array $variables): array {
    return [
      '#theme' => $theme,
      '#live' => $this->repository->isLive(),
      '#cache' => $this->repository->cacheability(),
      '#attached' => ['library' => ['kmfri_enterprise/hub']],
    ] + $variables;
  }

}
