<?php

declare(strict_types=1);

namespace Drupal\kmfri_enterprise\Repository;

use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Database\Connection;
use Drupal\Core\Database\Database;
use Drupal\Core\Database\IntegrityConstraintViolationException;
use Psr\Log\LoggerInterface;

/**
 * Read models and inquiry registration for kmfri_services_db.
 *
 * The services database is a separate connection declared in settings.php:
 *
 * @code
 * $databases['kmfri_services']['default'] = [
 *   'driver' => 'mysql',
 *   'database' => 'kmfri_services_db',
 *   'username' => 'kmfri_hub',
 *   'password' => '...',
 *   'host' => '127.0.0.1',
 *   'port' => 3306,
 *   'prefix' => '',
 *   'namespace' => 'Drupal\\mysql\\Driver\\Database\\mysql',
 *   'autoload' => 'core/modules/mysql/src/Driver/Database/mysql/',
 * ];
 * @endcode
 *
 * When it is unreachable the hub serves the bundled catalogue (data/fallback.yml)
 * in read-only mode and quotation requests are disabled.
 */
final class HubRepository {

  /**
   * Cache tag for everything rendered from the catalogue.
   */
  public const CACHE_TAG = 'kmfri_enterprise:catalogue';

  /**
   * Seconds a database read is reused before the catalogue is reloaded.
   */
  private const TTL = 900;

  /**
   * Seconds before a failed database read is retried.
   */
  private const OFFLINE_TTL = 60;

  /**
   * service_categories.slug => category key (drives icons and directory filters).
   */
  private const CATEGORY_KEY = [
    'analytical-laboratories' => 'analytical',
    'advisory-consultancy' => 'consultancy',
    'aquaculture-seed' => 'aquaculture',
    'marine-data' => 'data',
    'vessel-hire' => 'vessel',
    'value-addition' => 'value_addition',
    'education-tours' => 'education',
    'professional-training' => 'training',
    'conference-facilities' => 'facilities',
    'student-attachments' => 'internship',
  ];

  private ?array $catalogue = NULL;

  public function __construct(
    private readonly ConfigFactoryInterface $configFactory,
    private readonly CacheBackendInterface $cache,
    private readonly HubContent $content,
    private readonly LoggerInterface $logger,
    private readonly Catalogue $serviceCatalogue,
  ) {}

  /**
   * The kmfri_services_db connection.
   *
   * @throws \RuntimeException
   *   When settings.php declares no such connection.
   */
  public function connection(): Connection {
    $key = $this->configFactory->get('kmfri_enterprise.settings')->get('database_key') ?: 'kmfri_services';
    if (!Database::getConnectionInfo($key)) {
      throw new \RuntimeException(sprintf('settings.php has no $databases[\'%s\'] connection for kmfri_services_db.', $key));
    }
    return Database::getConnection('default', $key);
  }

  /**
   * Forgets the catalogue loaded during this request (after invalidation).
   */
  public function reset(): void {
    $this->catalogue = NULL;
  }

  /**
   * Whether the catalogue came from the database (FALSE = bundled fallback).
   */
  public function isLive(): bool {
    return $this->catalogue()['live'];
  }

  /**
   * @return array<int, array>
   */
  public function services(): array {
    return $this->catalogue()['services'];
  }

  public function service(string $slug): ?array {
    foreach ($this->services() as $service) {
      if ($service['slug'] === $slug) {
        return $service;
      }
    }
    return NULL;
  }

  /**
   * @return array<int, array>
   */
  public function stations(): array {
    return $this->catalogue()['stations'];
  }

  /**
   * Charter commitments (empty in fallback mode).
   *
   * @return array<int, array>
   */
  public function charter(): array {
    return $this->catalogue()['charter'];
  }

  /**
   * Cache metadata for render arrays built from the catalogue.
   */
  public function cacheability(): array {
    return [
      'tags' => [self::CACHE_TAG],
      'max-age' => $this->isLive() ? self::TTL : self::OFFLINE_TTL,
    ];
  }

  /**
   * Database status for the health endpoint.
   */
  public function health(): array {
    $row = $this->connection()->query('SELECT VERSION() AS version, DATABASE() AS db')->fetchAssoc();
    return ['ok' => TRUE, 'database' => $row['db'], 'server' => $row['version']];
  }

  /**
   * Referential checks for a quotation request.
   *
   * @return array<string, string>
   *   Error messages keyed by field.
   */
  public function validateReferences(int $serviceId, ?int $tierId, ?int $stationId): array {
    $db = $this->connection();
    $errors = [];
    if (!$db->query('SELECT id FROM services WHERE id = :id', [':id' => $serviceId])->fetchField()) {
      $errors['service'] = 'Unknown service.';
    }
    elseif ($tierId !== NULL) {
      $tier = $db->query(
        'SELECT id FROM pricing_tiers WHERE id = :id AND service_id = :sid AND is_active = 1',
        [':id' => $tierId, ':sid' => $serviceId]
      )->fetchField();
      if (!$tier) {
        $errors['tier'] = 'This tariff option does not belong to the selected service.';
      }
    }
    if ($stationId !== NULL && !$db->query('SELECT id FROM research_stations WHERE id = :id', [':id' => $stationId])->fetchField()) {
      $errors['station'] = 'Unknown research centre.';
    }
    return $errors;
  }

  /**
   * Registers a quotation request through sp_register_service_inquiry.
   *
   * @param array $v
   *   Validated values: service_id, tier_id, station_id, client_type,
   *   full_name, organization, kra_pin, email, phone, quantity, notes.
   *
   * @return array
   *   reference, estimated_cost_kes, status, created_at.
   */
  public function registerInquiry(array $v, string $ip): array {
    $db = $this->connection();
    $args = [
      ':service' => $v['service_id'],
      ':tier' => $v['tier_id'],
      ':station' => $v['station_id'],
      ':client_type' => $v['client_type'],
      ':full_name' => $v['full_name'],
      ':organization' => $v['organization'],
      ':kra_pin' => $v['kra_pin'] !== '' ? $v['kra_pin'] : NULL,
      ':email' => $v['email'],
      ':phone' => $v['phone'],
      ':quantity' => $v['quantity'],
      ':notes' => $v['notes'] !== '' ? $v['notes'] : NULL,
      ':ip' => substr($ip, 0, 45),
    ];
    // The procedure draws a random 4-digit suffix; retry on the (rare) duplicate reference.
    for ($attempt = 0; ; $attempt++) {
      try {
        $db->query(
          'CALL sp_register_service_inquiry(:service, :tier, :station, :client_type, :full_name, :organization, :kra_pin, :email, :phone, :quantity, :notes, :ip, @ref)',
          $args
        );
        break;
      }
      catch (IntegrityConstraintViolationException $e) {
        if ($attempt >= 4) {
          throw $e;
        }
      }
    }
    $row = $db->query(
      'SELECT reference_number, estimated_cost_kes, status, created_at FROM service_inquiries WHERE reference_number = @ref'
    )->fetchAssoc();
    return [
      'reference' => $row['reference_number'],
      'estimated_cost_kes' => (float) $row['estimated_cost_kes'],
      'status' => $row['status'],
      'created_at' => $row['created_at'],
    ];
  }

  /**
   * Loads (or reuses) the catalogue.
   */
  private function catalogue(): array {
    if ($this->catalogue !== NULL) {
      return $this->catalogue;
    }
    $cid = 'kmfri_enterprise:catalogue';
    if ($hit = $this->cache->get($cid)) {
      return $this->catalogue = $hit->data;
    }
    try {
      $db = $this->connection();
      $this->catalogue = [
        'live' => TRUE,
        'services' => $this->loadServices($db),
        'stations' => $this->loadStations($db),
        'charter' => $this->loadCharter($db),
      ];
      $ttl = self::TTL;
    }
    catch (\Throwable $e) {
      $this->logger->error('kmfri_services_db unavailable, serving the bundled catalogue: @message', ['@message' => $e->getMessage()]);
      $fallback = $this->content->fallback();
      $this->catalogue = [
        'live' => FALSE,
        // The bundled tariffs of portfolios the catalogue prices are the catalogue's own.
        'services' => array_map(function (array $s): array {
          $s = ['featured_image' => self::imagePath($s['featured_image'] ?? NULL)] + $s;
          $tiers = $this->serviceCatalogue->tiers($s['slug'], (string) ($s['turnaround_time'] ?? ''));
          $s['pricing_tiers'] = $tiers ?: array_map(fn (array $t) => $t + ['register_no' => NULL], $s['pricing_tiers'] ?? []);
          return $s;
        }, $fallback['services']),
        'stations' => $fallback['stations'],
        'charter' => [],
      ];
      $ttl = self::OFFLINE_TTL;
    }
    $this->cache->set($cid, $this->catalogue, time() + $ttl, [self::CACHE_TAG]);
    return $this->catalogue;
  }

  private function loadServices(Connection $db): array {
    $services = $db->query(
      'SELECT s.*, sc.name AS category_name, sc.slug AS category_slug
         FROM services s JOIN service_categories sc ON sc.id = s.category_id
        ORDER BY s.display_order, s.id'
    )->fetchAll(\PDO::FETCH_ASSOC);
    $tiers = self::groupBy($db->query('SELECT * FROM pricing_tiers WHERE is_active = 1 ORDER BY display_order, id')->fetchAll(\PDO::FETCH_ASSOC), 'service_id');
    $caps = self::groupBy($db->query('SELECT * FROM service_capabilities ORDER BY display_order, id')->fetchAll(\PDO::FETCH_ASSOC), 'service_id');
    $reqs = self::groupBy($db->query('SELECT * FROM service_requirements ORDER BY display_order, id')->fetchAll(\PDO::FETCH_ASSOC), 'service_id');
    $stations = self::groupBy($db->query(
      'SELECT sm.service_id, sm.is_lead_centre, rs.name
         FROM service_stations_map sm JOIN research_stations rs ON rs.id = sm.station_id
        ORDER BY sm.is_lead_centre DESC, rs.id'
    )->fetchAll(\PDO::FETCH_ASSOC), 'service_id');

    $vessels = array_map(fn (array $v) => [
      'name' => $v['vessel_name'],
      'home_port' => $v['home_port'],
      'length_metres' => (float) $v['length_metres'],
      'gross_tonnage' => (int) $v['gross_tonnage'],
      'endurance_days' => (int) $v['endurance_days'],
      'scientist_berths' => (int) $v['scientist_berths'],
      'cruise_speed_knots' => (float) $v['cruise_speed_knots'],
      'gear' => $v['primary_scientific_gear'],
      'rate_kes' => (float) $v['charter_rate_kes_per_day'],
      'rate_usd' => (float) $v['charter_rate_usd_per_day'],
      'status' => $v['status'],
    ], $db->query('SELECT * FROM research_vessels ORDER BY length_metres DESC')->fetchAll(\PDO::FETCH_ASSOC));

    $datasets = array_map(fn (array $d) => [
      'code' => $d['dataset_code'],
      'title' => $d['dataset_title'],
      'coverage' => $d['coverage_area'],
      'resolution' => $d['spatial_resolution'],
      'temporal_range' => $d['temporal_range'],
      'format' => $d['data_format'],
      'tariff_kes' => (float) $d['tariff_kes'],
      'academic_kes' => (float) $d['academic_concession_kes'],
      'curating_centre' => $d['curating_centre'],
    ], $db->query('SELECT * FROM scientific_datasets ORDER BY id')->fetchAll(\PDO::FETCH_ASSOC));

    return array_map(function (array $s) use ($tiers, $caps, $reqs, $stations, $vessels, $datasets): array {
      $id = (int) $s['id'];
      return [
        'id' => (string) $id,
        'db_id' => $id,
        'slug' => $s['slug'],
        'code' => $s['code'],
        'title' => $s['title'],
        'category' => self::CATEGORY_KEY[$s['category_slug']] ?? 'analytical',
        'category_label' => $s['category_name'],
        'description' => $s['short_description'],
        'full_overview' => $s['full_overview'],
        'remarks' => (string) $s['remarks'],
        'target_clients' => array_values(array_filter(array_map('trim', explode(',', (string) $s['remarks'])))),
        'key_capabilities' => array_map(
          fn (array $c) => $c['equipment_used'] ? "{$c['capability_title']} — {$c['equipment_used']}" : $c['capability_title'],
          $caps[$id] ?? []
        ),
        'sample_requirements' => isset($reqs[$id])
          ? array_map(fn (array $r) => "{$r['requirement_title']}: {$r['requirement_text']}", $reqs[$id])
          : NULL,
        'turnaround_time' => $s['turnaround_time'],
        'pricing_tiers' => array_map(fn (array $t) => [
          'id' => (int) $t['id'],
          'register_no' => $t['register_no'] === NULL ? NULL : (int) $t['register_no'],
          'name' => $t['tier_name'],
          'unit' => $t['unit_description'],
          'cost_kes' => (float) $t['cost_kes'],
          'cost_usd' => $t['cost_usd'] === NULL ? NULL : (float) $t['cost_usd'],
          'turnaround_time' => $t['turnaround_time'],
        ], $tiers[$id] ?? []),
        'available_stations' => array_map(fn (array $st) => $st['name'], $stations[$id] ?? []),
        'status' => $s['status'],
        'featured_image' => self::imagePath($s['featured_image']),
        'iso_standard' => $s['iso_standard'] ?: NULL,
        'contact_officer' => [
          'title' => $s['contact_officer_title'],
          'email' => $s['contact_email'],
          'phone' => $s['contact_phone'],
        ],
        'vessels' => $s['category_slug'] === 'vessel-hire' ? $vessels : NULL,
        'datasets' => $s['category_slug'] === 'marine-data' ? $datasets : NULL,
      ];
    }, $services);
  }

  private function loadStations(Connection $db): array {
    $stations = $db->query('SELECT * FROM research_stations ORDER BY id')->fetchAll(\PDO::FETCH_ASSOC);
    $facilities = self::groupBy($db->query('SELECT * FROM station_facilities ORDER BY id')->fetchAll(\PDO::FETCH_ASSOC), 'station_id');
    $offered = self::groupBy($db->query(
      'SELECT sm.station_id, s.title
         FROM service_stations_map sm JOIN services s ON s.id = sm.service_id
        ORDER BY s.display_order'
    )->fetchAll(\PDO::FETCH_ASSOC), 'station_id');

    return array_map(function (array $st) use ($facilities, $offered): array {
      $id = (int) $st['id'];
      return [
        'id' => strtolower($st['code']),
        'db_id' => $id,
        'name' => $st['name'],
        'code' => $st['code'],
        'location' => $st['location'],
        'county' => preg_match('/county$/i', $st['county']) ? $st['county'] : $st['county'] . ' County',
        'description' => (string) ($st['description'] ?? ''),
        'primary_focus' => array_map(fn (array $f) => $f['facility_name'], $facilities[$id] ?? []),
        'services_offered' => array_map(fn (array $o) => $o['title'], $offered[$id] ?? []),
        'contact_email' => $st['contact_email'],
        'phone' => $st['contact_phone'],
        'head_of_station' => $st['head_title'] ? "{$st['head_of_station']} ({$st['head_title']})" : $st['head_of_station'],
        'coordinates' => ['lat' => (float) $st['latitude'], 'lng' => (float) $st['longitude']],
      ];
    }, $stations);
  }

  private function loadCharter(Connection $db): array {
    $rows = $db->query(
      'SELECT ch.*, s.code, s.slug
         FROM service_charter ch JOIN services s ON s.id = ch.service_id
        ORDER BY s.display_order, ch.id'
    )->fetchAll(\PDO::FETCH_ASSOC);
    return array_map(fn (array $r) => [
      'service_slug' => $r['slug'],
      'service_code' => $r['code'],
      'service_name' => $r['service_name'],
      'turnaround_time' => $r['statutory_turnaround_time'],
      'fee_summary' => $r['official_fee_summary'],
      'responsible_officer' => $r['responsible_officer'],
      'redress_channel' => $r['redress_channel'],
    ], $rows);
  }

  /**
   * Catalogue image paths ('/images/x.webp') relative to the module directory.
   */
  private static function imagePath(?string $path): string {
    return ltrim($path ?: '/images/vessel-aerial.webp', '/');
  }

  private static function groupBy(array $rows, string $key): array {
    $out = [];
    foreach ($rows as $row) {
      $out[(int) $row[$key]][] = $row;
    }
    return $out;
  }

}
