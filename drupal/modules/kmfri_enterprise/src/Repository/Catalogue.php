<?php

declare(strict_types=1);

namespace Drupal\kmfri_enterprise\Repository;

use Drupal\Core\Extension\ModuleExtensionList;
use Drupal\Core\Url;

/**
 * The KMFRI Service Catalogue: Division → Service group → [Sub-group] → Service.
 *
 * Loaded from data/catalogue.json, which drupal/build/build.mjs exports from the
 * shared source src/data/serviceCatalogue.ts. Each node carries its web address
 * segments (`path`, e.g. "laboratory/biota/proximate"), service counts, the lowest
 * published tariff and, per item, how the service is obtained (`availability`:
 * online | partial | office | planned).
 */
final class Catalogue {

  private ?array $data = NULL;

  /**
   * Node path ("laboratory/biota") => list of nodes from the division down.
   *
   * @var array<string, array<int, array>>
   */
  private array $paths = [];

  public function __construct(private readonly ModuleExtensionList $moduleList) {}

  public function divisions(): array {
    return $this->data()['divisions'];
  }

  public function total(): int {
    return $this->data()['total'];
  }

  public function onlineTotal(): int {
    return $this->data()['online_total'];
  }

  public function ecitizenUrl(): string {
    return $this->data()['ecitizen_url'];
  }

  /**
   * Division → … → node for a web address path, or NULL.
   */
  public function trail(string $path): ?array {
    $this->data();
    return $this->paths[trim($path, '/')] ?? NULL;
  }

  /**
   * The division presenting a service portfolio (services.slug), or NULL.
   */
  public function divisionForService(?string $slug): ?array {
    foreach ($this->divisions() as $division) {
      if ($slug !== NULL && $division['service_slug'] === $slug) {
        return $division;
      }
    }
    return NULL;
  }

  /**
   * Web address of a node path ('' = the catalogue itself).
   */
  public static function url(string $path = ''): string {
    $segments = array_values(array_filter(explode('/', $path)));
    $params = array_combine(
      array_slice(['division', 'group', 'subgroup'], 0, count($segments)),
      $segments
    ) ?: [];
    return Url::fromRoute('kmfri_enterprise.catalogue', $params)->toString();
  }

  /**
   * Catalogue page for a service portfolio slug (the catalogue overview when unknown).
   */
  public function serviceUrl(?string $slug): string {
    return self::url($this->divisionForService($slug)['path'] ?? '');
  }

  /**
   * Every node at or below $node that lists services, in display order.
   *
   * @return array<int, array> Nodes (with their items).
   */
  public static function sections(array $node): array {
    $out = $node['items'] ? [$node] : [];
    foreach ($node['children'] as $child) {
      array_push($out, ...self::sections($child));
    }
    return $out;
  }

  /**
   * Every service with the trail of the group that lists it.
   *
   * @return array<int, array{item: array, trail: array}>
   */
  public function index(): array {
    $out = [];
    foreach ($this->divisions() as $division) {
      foreach (self::sections($division) as $section) {
        foreach ($section['items'] as $item) {
          $out[] = ['item' => $item, 'trail' => $this->trail($section['path'])];
        }
      }
    }
    return $out;
  }

  /**
   * Services featured on the home page.
   */
  public function featured(): array {
    $byNo = [];
    foreach ($this->index() as $entry) {
      $byNo[$entry['item']['no']] = $entry;
    }
    return array_values(array_filter(array_map(fn (int $no) => $byNo[$no] ?? NULL, $this->data()['featured'])));
  }

  /* --------------------------------------------------------------- *
   * Research stations — same rules as src/data/stationServices.ts.
   * --------------------------------------------------------------- */

  /**
   * Web address segment of a station: its place name ("mombasa", "kisumu", …).
   */
  public static function stationSlug(array $station): string {
    $place = preg_replace('/[^a-z0-9-]/', '', self::place($station['name']));
    return $place !== '' ? $place : strtolower($station['code']);
  }

  /**
   * A station by web address slug or id, or NULL.
   */
  public static function findStation(array $stations, string $key): ?array {
    foreach ($stations as $station) {
      if ($station['id'] === $key || self::stationSlug($station) === $key) {
        return $station;
      }
    }
    return NULL;
  }

  /**
   * Banner photo of a station (module-relative path).
   */
  public function stationImage(array $station): string {
    return $this->data()['station_images'][self::stationSlug($station)] ?? 'images/vessel-aerial.webp';
  }

  /**
   * What a station offers: catalogue divisions (the station lists the division's portfolio,
   * or the portfolio lists the station or "All KMFRI Centres"), plus listed portfolios that
   * are not in the citizen catalogue.
   *
   * @param array $station
   *   Station record (HubRepository::stations()).
   * @param array $services
   *   Portfolio records (HubRepository::services()).
   *
   * @return array{divisions: array, other: string[], total: int, online: int}
   */
  public function stationOffer(array $station, array $services): array {
    $place = self::place($station['name']);
    $slugs = [];
    $other = [];
    $catalogueSlugs = array_filter(array_column($this->divisions(), 'service_slug'));
    foreach ($station['services_offered'] as $title) {
      $portfolio = NULL;
      foreach ($services as $s) {
        if ($s['title'] === $title || str_starts_with($s['title'], $title) || str_starts_with($title, $s['title'])) {
          $portfolio = $s;
          break;
        }
      }
      if ($portfolio && in_array($portfolio['slug'], $catalogueSlugs, TRUE)) {
        $slugs[$portfolio['slug']] = TRUE;
      }
      else {
        $other[] = $title;
      }
    }
    foreach ($services as $s) {
      foreach ($s['available_stations'] as $name) {
        if (self::place($name) === $place || preg_match('/^all\b/i', $name)) {
          $slugs[$s['slug']] = TRUE;
        }
      }
    }
    $divisions = array_values(array_filter($this->divisions(), fn (array $d) => $d['service_slug'] && isset($slugs[$d['service_slug']])));
    return [
      'divisions' => $divisions,
      'other' => $other,
      'total' => array_sum(array_column($divisions, 'count')),
      'online' => array_sum(array_column($divisions, 'online')),
    ];
  }

  /**
   * Stations offering a division, for "Where to get it".
   */
  public function stationsForDivision(array $division, array $stations, array $services): array {
    return array_values(array_filter($stations, function (array $st) use ($division, $services) {
      return in_array($division['id'], array_column($this->stationOffer($st, $services)['divisions'], 'id'), TRUE);
    }));
  }

  /**
   * "Mombasa Headquarters & Marine Centre" → "mombasa".
   */
  private static function place(string $name): string {
    return strtolower(preg_split('/[\s(]/', $name)[0]);
  }

  /* --------------------------------------------------------------- *
   * Tariffs — the same rules as sql/005_catalogue_tariffs.sql.
   * --------------------------------------------------------------- */

  /**
   * Charging unit of a priced service (laboratory tests carry none in the register).
   */
  public static function unit(array $item): ?string {
    return $item['fee_kes'] === NULL ? NULL : ($item['fee_unit'] ?? 'per test');
  }

  /**
   * The catalogue's published tariffs of a portfolio, shaped like pricing tiers
   * (used when kmfri_services_db is unreachable; the database holds the same rows).
   *
   * @return array<int, array>
   */
  public function tiers(string $slug, string $turnaround = ''): array {
    $tiers = [];
    foreach ($this->index() as ['item' => $item]) {
      if ($item['service_slug'] === $slug && $item['fee_kes'] !== NULL) {
        $tiers[] = [
          'id' => NULL,
          'register_no' => $item['no'],
          'name' => $item['name'],
          'unit' => self::unit($item),
          'cost_kes' => (float) $item['fee_kes'],
          'cost_usd' => NULL,
          'turnaround_time' => $turnaround,
        ];
      }
    }
    return $tiers;
  }

  /**
   * The complete public tariff schedule, per division: every catalogue service with its
   * tariff, plus the portfolio rates of services the catalogue does not price (vessel
   * charter, conference halls, datasets …). Portfolios outside the catalogue are `other`.
   *
   * @param array $services
   *   Portfolio records (HubRepository::services()).
   *
   * @return array{divisions: array, other: array, priced: int, rates: int}
   */
  public function tariffSchedule(array $services): array {
    $bySlug = array_column($services, NULL, 'slug');
    $rates = fn (?array $s) => $s ? array_values(array_filter($s['pricing_tiers'], fn (array $t) => empty($t['register_no']))) : [];
    $divisions = [];
    $priced = 0;
    $rateCount = 0;
    $covered = [];
    foreach ($this->divisions() as $division) {
      $rows = [];
      foreach (self::sections($division) as $section) {
        $group = implode(' › ', array_slice(array_column($this->trail($section['path']), 'title'), 1));
        foreach ($section['items'] as $item) {
          $rows[] = $item + [
            'group' => $group,
            'group_url' => self::url($section['path']),
            'fee_label' => self::fee($item),
            'unit_label' => self::unit($item),
            'priced' => $item['fee_kes'] !== NULL || $item['fee_note'] !== NULL,
          ];
        }
      }
      $fees = array_filter(array_column($rows, 'fee_kes'), fn ($f) => $f !== NULL);
      $portfolio = $bySlug[$division['service_slug'] ?? ''] ?? NULL;
      $covered[$division['service_slug'] ?? ''] = TRUE;
      $divisionRates = $rates($portfolio);
      $priced += count($fees);
      $rateCount += count($divisionRates);
      $divisions[] = [
        'id' => $division['id'],
        'title' => $division['title'],
        'tagline' => $division['tagline'],
        'url' => self::url($division['path']),
        'service_slug' => $division['service_slug'],
        'portfolio' => $portfolio,
        'rows' => $rows,
        'priced' => count($fees),
        'min' => $fees ? min($fees) : NULL,
        'max' => $fees ? max($fees) : NULL,
        'rates' => $divisionRates,
      ];
    }
    $other = [];
    foreach ($services as $s) {
      if (!isset($covered[$s['slug']]) && $s['pricing_tiers']) {
        $other[] = ['portfolio' => $s, 'rates' => $rates($s)];
        $rateCount += count($rates($s));
      }
    }
    return ['divisions' => $divisions, 'other' => $other, 'priced' => $priced, 'rates' => $rateCount];
  }

  /* --------------------------------------------------------------- *
   * Search — the same rules as kmfriTokens()/kmfriScore() in js/hub.js.
   * --------------------------------------------------------------- */

  /**
   * Words that describe the question rather than the service ("tilapia price").
   */
  public const STOPWORDS = ['a', 'an', 'and', 'the', 'of', 'for', 'in', 'on', 'to', 'at', 'by', 'with', 'my', 'i', 'is', 'how', 'much', 'what', 'where', 'do', 'you', 'kmfri', 'price', 'prices', 'pricing', 'cost', 'costs', 'fee', 'fees', 'tariff', 'tariffs', 'charge', 'charges', 'rate', 'rates', 'service', 'services', 'ksh', 'kes'];

  /**
   * Query → search tokens: lower case, stop words dropped, plural -s / -ing trimmed
   * ("feeds" → "feed", "testing" → "test"; "species" → "specie" still matches).
   *
   * @return string[]
   */
  public static function searchTokens(string $query): array {
    $words = preg_split('/[^\p{L}\p{N}]+/u', mb_strtolower($query), -1, PREG_SPLIT_NO_EMPTY);
    $tokens = [];
    foreach ($words as $w) {
      if (in_array($w, self::STOPWORDS, TRUE)) {
        continue;
      }
      if (mb_strlen($w) > 5 && str_ends_with($w, 'ing')) {
        $w = mb_substr($w, 0, -3);
      }
      elseif (mb_strlen($w) > 3 && str_ends_with($w, 's') && !str_ends_with($w, 'ss')) {
        $w = mb_substr($w, 0, -1);
      }
      $tokens[] = $w;
    }
    return $tokens;
  }

  /**
   * Whether every search token occurs in $text (any order). An empty query matches;
   * a query of stop words only ("prices") matches everything.
   */
  public static function matches(string $text, string $query): bool {
    $text = mb_strtolower($text);
    foreach (self::searchTokens($query) as $token) {
      if (!str_contains($text, $token)) {
        return FALSE;
      }
    }
    return TRUE;
  }

  /**
   * Display fee: "Ksh 1,500 per test", "Free" or "On quotation".
   */
  public static function fee(array $item): string {
    if ($item['fee_kes'] !== NULL) {
      return 'Ksh ' . number_format((float) $item['fee_kes']) . ' ' . self::unit($item);
    }
    return $item['fee_note'] ?? ($item['availability'] === 'planned' ? '—' : 'On quotation');
  }

  private function data(): array {
    if ($this->data === NULL) {
      $file = $this->moduleList->getPath('kmfri_enterprise') . '/data/catalogue.json';
      $this->data = json_decode((string) file_get_contents($file), TRUE, 512, JSON_THROW_ON_ERROR);
      foreach ($this->data['divisions'] as $division) {
        $this->indexNode($division, []);
      }
    }
    return $this->data;
  }

  private function indexNode(array $node, array $trail): void {
    $trail[] = $node;
    $this->paths[$node['path']] = $trail;
    foreach ($node['children'] as $child) {
      $this->indexNode($child, $trail);
    }
  }

}
