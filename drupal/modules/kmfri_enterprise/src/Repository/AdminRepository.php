<?php

declare(strict_types=1);

namespace Drupal\kmfri_enterprise\Repository;

use Drupal\Core\Database\Connection;
use Drupal\Core\Database\Query\PagerSelectExtender;
use Drupal\Core\Database\Query\SelectInterface;

/**
 * Queries and workflow operations behind the administration dashboard.
 *
 * Reads go through the hub's kmfri_services_db connection; the only write,
 * an inquiry status change, goes through sp_update_inquiry_status, which
 * enforces the allowed transitions and records the audit row.
 */
final class AdminRepository {

  /**
   * Inquiry statuses in workflow order => label.
   */
  public const STATUSES = [
    'pending' => 'Pending',
    'under_review' => 'Under review',
    'quote_issued' => 'Quote issued',
    'invoice_generated' => 'Invoice generated',
    'paid' => 'Paid',
    'fulfilled' => 'Fulfilled',
    'cancelled' => 'Cancelled',
  ];

  /**
   * Statuses that still need action from KMFRI.
   */
  public const OPEN = ['pending', 'under_review', 'quote_issued', 'invoice_generated'];

  /**
   * Allowed next statuses (mirrors sp_update_inquiry_status).
   */
  private const NEXT = [
    'pending' => ['under_review', 'cancelled'],
    'under_review' => ['quote_issued', 'cancelled'],
    'quote_issued' => ['invoice_generated', 'cancelled'],
    'invoice_generated' => ['paid', 'cancelled'],
    'paid' => ['fulfilled'],
    'fulfilled' => [],
    'cancelled' => [],
  ];

  /**
   * Sortable inquiry columns => SQL expression.
   */
  public const INQUIRY_SORTS = [
    'created' => 'si.created_at',
    'reference' => 'si.reference_number',
    'client' => 'si.full_name',
    'service' => 's.title',
    'value' => 'si.estimated_cost_kes',
    'status' => 'si.status',
  ];

  public function __construct(private readonly HubRepository $hub) {}

  private function db(): Connection {
    return $this->hub->connection();
  }

  public static function nextStatuses(string $current): array {
    return self::NEXT[$current] ?? [];
  }

  /**
   * Headline figures for the overview.
   */
  public function kpis(): array {
    $db = $this->db();
    $open = "'" . implode("','", self::OPEN) . "'";
    $row = $db->query("SELECT
        COUNT(*) AS total,
        SUM(status = 'pending') AS pending,
        SUM(status IN ($open)) AS open_count,
        COALESCE(SUM(CASE WHEN status IN ($open) THEN estimated_cost_kes END), 0) AS open_value,
        COALESCE(SUM(CASE WHEN status IN ('paid', 'fulfilled') THEN estimated_cost_kes END), 0) AS realised_value,
        SUM(status IN ('paid', 'fulfilled')) AS realised_count,
        SUM(created_at >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')) AS this_month,
        SUM(created_at >= DATE_FORMAT(CURRENT_DATE - INTERVAL 1 MONTH, '%Y-%m-01')
            AND created_at < DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')) AS last_month
      FROM service_inquiries")->fetchAssoc();
    $feedback = $db->query('SELECT COUNT(*) AS n, AVG(rating_score) AS avg_rating FROM client_feedback')->fetchAssoc();
    return [
      'total' => (int) $row['total'],
      'pending' => (int) $row['pending'],
      'open_count' => (int) $row['open_count'],
      'open_value' => (float) $row['open_value'],
      'realised_value' => (float) $row['realised_value'],
      'realised_count' => (int) $row['realised_count'],
      'this_month' => (int) $row['this_month'],
      'last_month' => (int) $row['last_month'],
      'feedback_count' => (int) $feedback['n'],
      'avg_rating' => $feedback['avg_rating'] === NULL ? NULL : round((float) $feedback['avg_rating'], 1),
    ];
  }

  public function pendingCount(): int {
    return (int) $this->db()->query("SELECT COUNT(*) FROM service_inquiries WHERE status = 'pending'")->fetchField();
  }

  /**
   * Inquiries per calendar month for the last $months months (oldest first, gaps filled).
   */
  public function monthly(int $months = 6): array {
    $rows = $this->db()->query(
      "SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS n, COALESCE(SUM(estimated_cost_kes), 0) AS value
         FROM service_inquiries
        WHERE created_at >= DATE_FORMAT(CURRENT_DATE - INTERVAL :back MONTH, '%Y-%m-01')
        GROUP BY ym",
      [':back' => $months - 1]
    )->fetchAllAssoc('ym', \PDO::FETCH_ASSOC);
    $out = [];
    $month = new \DateTimeImmutable('first day of this month');
    for ($i = $months - 1; $i >= 0; $i--) {
      $m = $month->modify("-$i month");
      $key = $m->format('Y-m');
      $out[] = [
        'key' => $key,
        'label' => $m->format('M'),
        'long' => $m->format('F Y'),
        'count' => (int) ($rows[$key]['n'] ?? 0),
        'value' => (float) ($rows[$key]['value'] ?? 0),
      ];
    }
    return $out;
  }

  /**
   * Count of inquiries per status, every status present.
   */
  public function statusBreakdown(): array {
    $counts = $this->db()->query('SELECT status, COUNT(*) AS n FROM service_inquiries GROUP BY status')->fetchAllKeyed();
    $out = [];
    foreach (self::STATUSES as $key => $label) {
      $out[] = ['key' => $key, 'label' => $label, 'count' => (int) ($counts[$key] ?? 0)];
    }
    return $out;
  }

  public function topServices(int $limit = 5): array {
    return $this->db()->query(
      'SELECT s.code, s.title, s.slug, COUNT(si.id) AS n, COALESCE(SUM(si.estimated_cost_kes), 0) AS value
         FROM services s LEFT JOIN service_inquiries si ON si.service_id = s.id
        GROUP BY s.id, s.code, s.title, s.slug
        HAVING n > 0
        ORDER BY n DESC, value DESC
        LIMIT ' . max(1, $limit)
    )->fetchAll(\PDO::FETCH_ASSOC);
  }

  /**
   * Inquiry counts per service id (catalogue page).
   */
  public function inquiryCountsByService(): array {
    return $this->db()->query('SELECT service_id, COUNT(*) FROM service_inquiries GROUP BY service_id')->fetchAllKeyed();
  }

  /**
   * Inquiry counts per pricing tier id (catalogue tariff schedule).
   */
  public function inquiryCountsByTier(): array {
    return $this->db()->query('SELECT pricing_tier_id, COUNT(*) FROM service_inquiries WHERE pricing_tier_id IS NOT NULL GROUP BY pricing_tier_id')->fetchAllKeyed();
  }

  /**
   * Compares the published catalogue (data/catalogue.json) with kmfri_services_db.
   *
   * @param array $index
   *   Catalogue::index() entries.
   *
   * @return array
   *   ok (bool), error (string|NULL: tables missing), db_items, db_priced, db_tiers,
   *   retired (superseded portfolio rates), issues [{no, name, issue}], tiers
   *   (register_no => active pricing tier {id, cost_kes}).
   */
  public function catalogueSync(array $index): array {
    $db = $this->db();
    try {
      $items = $db->query('SELECT register_no, name, fee_kes FROM catalogue_items')->fetchAllAssoc('register_no', \PDO::FETCH_ASSOC);
      $tiers = $db->query('SELECT register_no, id, cost_kes FROM pricing_tiers WHERE register_no IS NOT NULL AND is_active = 1')->fetchAllAssoc('register_no', \PDO::FETCH_ASSOC);
      $retired = (int) $db->query('SELECT COUNT(*) FROM pricing_tiers WHERE is_active = 0')->fetchField();
    }
    catch (\Throwable $e) {
      return ['ok' => FALSE, 'error' => 'The catalogue tables are missing from kmfri_services_db (run sql/004 and sql/005, or drush kmfri:db-setup).', 'db_items' => 0, 'db_priced' => 0, 'db_tiers' => 0, 'retired' => 0, 'issues' => [], 'tiers' => []];
    }
    $issues = [];
    $seen = [];
    foreach ($index as ['item' => $item]) {
      $no = $item['no'];
      $seen[$no] = TRUE;
      $row = $items[$no] ?? NULL;
      $fee = $item['fee_kes'] === NULL ? NULL : (float) $item['fee_kes'];
      if (!$row) {
        $issues[] = ['no' => $no, 'name' => $item['name'], 'issue' => 'Not in the database'];
        continue;
      }
      $dbFee = $row['fee_kes'] === NULL ? NULL : (float) $row['fee_kes'];
      if ($dbFee !== $fee) {
        $issues[] = ['no' => $no, 'name' => $item['name'], 'issue' => sprintf('Tariff differs: website %s, database %s', $fee === NULL ? '—' : 'Ksh ' . number_format($fee), $dbFee === NULL ? '—' : 'Ksh ' . number_format($dbFee))];
      }
      elseif ($fee !== NULL && $item['service_slug'] && !isset($tiers[$no])) {
        $issues[] = ['no' => $no, 'name' => $item['name'], 'issue' => 'No quotable pricing tier'];
      }
      elseif ($fee !== NULL && isset($tiers[$no]) && (float) $tiers[$no]['cost_kes'] !== $fee) {
        $issues[] = ['no' => $no, 'name' => $item['name'], 'issue' => 'Pricing tier amount differs from the catalogue'];
      }
    }
    foreach ($items as $no => $row) {
      if (!isset($seen[$no])) {
        $issues[] = ['no' => (int) $no, 'name' => $row['name'], 'issue' => 'In the database but not on the website'];
      }
    }
    return [
      'ok' => !$issues,
      'error' => NULL,
      'db_items' => count($items),
      'db_priced' => count(array_filter($items, fn (array $r) => $r['fee_kes'] !== NULL)),
      'db_tiers' => count($tiers),
      'retired' => $retired,
      'issues' => $issues,
      'tiers' => array_map(fn (array $t) => ['id' => (int) $t['id'], 'cost_kes' => (float) $t['cost_kes']], $tiers),
    ];
  }

  /**
   * One page of inquiries.
   *
   * @param array $filters
   *   q, status, service (id), from, to (Y-m-d), sort (key of INQUIRY_SORTS), dir (asc|desc).
   */
  public function inquiries(array $filters, int $perPage = 20): array {
    $query = $this->inquiryQuery($filters)->extend(PagerSelectExtender::class)->limit($perPage);
    return $query->execute()->fetchAll(\PDO::FETCH_ASSOC);
  }

  /**
   * Every inquiry matching the filters (CSV export), capped for safety.
   */
  public function inquiriesForExport(array $filters, int $cap = 5000): array {
    return $this->inquiryQuery($filters)->range(0, $cap)->execute()->fetchAll(\PDO::FETCH_ASSOC);
  }

  private function inquiryQuery(array $filters): SelectInterface {
    $q = $this->db()->select('service_inquiries', 'si');
    $q->innerJoin('services', 's', 's.id = si.service_id');
    $q->leftJoin('pricing_tiers', 't', 't.id = si.pricing_tier_id');
    $q->leftJoin('research_stations', 'rs', 'rs.id = si.preferred_station_id');
    $q->fields('si', ['id', 'reference_number', 'client_type', 'full_name', 'organization', 'email', 'phone', 'estimated_quantity', 'estimated_cost_kes', 'status', 'created_at', 'updated_at']);
    $q->addField('s', 'title', 'service_title');
    $q->addField('s', 'code', 'service_code');
    $q->addField('t', 'tier_name', 'tier_name');
    $q->addField('rs', 'name', 'station_name');

    if (($text = trim((string) ($filters['q'] ?? ''))) !== '') {
      $like = '%' . $q->escapeLike($text) . '%';
      $or = $q->orConditionGroup()
        ->condition('si.reference_number', $like, 'LIKE')
        ->condition('si.full_name', $like, 'LIKE')
        ->condition('si.organization', $like, 'LIKE')
        ->condition('si.email', $like, 'LIKE');
      $q->condition($or);
    }
    if (!empty($filters['status'])) {
      if ($filters['status'] === 'open') {
        $q->condition('si.status', self::OPEN, 'IN');
      }
      elseif (isset(self::STATUSES[$filters['status']])) {
        $q->condition('si.status', $filters['status']);
      }
    }
    if (!empty($filters['service']) && ctype_digit((string) $filters['service'])) {
      $q->condition('si.service_id', (int) $filters['service']);
    }
    if (!empty($filters['from']) && self::isDate($filters['from'])) {
      $q->condition('si.created_at', $filters['from'] . ' 00:00:00', '>=');
    }
    if (!empty($filters['to']) && self::isDate($filters['to'])) {
      $q->condition('si.created_at', $filters['to'] . ' 23:59:59', '<=');
    }
    $sort = self::INQUIRY_SORTS[$filters['sort'] ?? 'created'] ?? 'si.created_at';
    $dir = strtolower((string) ($filters['dir'] ?? 'desc')) === 'asc' ? 'ASC' : 'DESC';
    $q->orderBy($sort, $dir)->orderBy('si.id', $dir);
    return $q;
  }

  public function inquiry(int $id): ?array {
    $row = $this->db()->query(
      'SELECT si.*, s.title AS service_title, s.code AS service_code, s.slug AS service_slug,
              t.tier_name, t.unit_description, t.cost_kes AS tier_cost_kes,
              rs.name AS station_name, rs.code AS station_code
         FROM service_inquiries si
         JOIN services s ON s.id = si.service_id
         LEFT JOIN pricing_tiers t ON t.id = si.pricing_tier_id
         LEFT JOIN research_stations rs ON rs.id = si.preferred_station_id
        WHERE si.id = :id',
      [':id' => $id]
    )->fetchAssoc();
    return $row ?: NULL;
  }

  public function history(int $inquiryId): array {
    return $this->db()->query(
      'SELECT * FROM inquiry_status_history WHERE inquiry_id = :id ORDER BY created_at, id',
      [':id' => $inquiryId]
    )->fetchAll(\PDO::FETCH_ASSOC);
  }

  /**
   * Moves an inquiry to its next status (validated again by the procedure).
   *
   * @throws \InvalidArgumentException
   *   When the transition is not allowed.
   */
  public function updateStatus(int $id, string $status, string $changedBy, string $remarks): void {
    $current = $this->inquiry($id)['status'] ?? NULL;
    if ($current === NULL || !in_array($status, self::nextStatuses($current), TRUE)) {
      throw new \InvalidArgumentException('Status transition not allowed.');
    }
    $this->db()->query('CALL sp_update_inquiry_status(:id, :status, :by, :remarks)', [
      ':id' => $id,
      ':status' => $status,
      ':by' => mb_substr($changedBy, 0, 100),
      ':remarks' => mb_substr($remarks, 0, 2000),
    ]);
  }

  /**
   * One page of the inquiry workflow log.
   *
   * @param array $filters
   *   q (reference, client or officer), status (new status).
   */
  public function workflowLog(array $filters, int $perPage = 25): array {
    $q = $this->db()->select('inquiry_status_history', 'h')->extend(PagerSelectExtender::class)->limit($perPage);
    $q->innerJoin('service_inquiries', 'si', 'si.id = h.inquiry_id');
    $q->innerJoin('services', 's', 's.id = si.service_id');
    $q->fields('h', ['id', 'inquiry_id', 'previous_status', 'new_status', 'changed_by', 'remarks', 'created_at']);
    $q->addField('si', 'reference_number');
    $q->addField('si', 'full_name');
    $q->addField('s', 'title', 'service_title');
    if (($text = trim((string) ($filters['q'] ?? ''))) !== '') {
      $like = '%' . $q->escapeLike($text) . '%';
      $q->condition($q->orConditionGroup()
        ->condition('si.reference_number', $like, 'LIKE')
        ->condition('si.full_name', $like, 'LIKE')
        ->condition('h.changed_by', $like, 'LIKE'));
    }
    if (!empty($filters['status']) && isset(self::STATUSES[$filters['status']])) {
      $q->condition('h.new_status', $filters['status']);
    }
    $q->orderBy('h.created_at', 'DESC')->orderBy('h.id', 'DESC');
    return $q->execute()->fetchAll(\PDO::FETCH_ASSOC);
  }

  public function recentActivity(int $limit = 6): array {
    return $this->db()->query(
      'SELECT h.*, si.reference_number, si.full_name
         FROM inquiry_status_history h JOIN service_inquiries si ON si.id = h.inquiry_id
        ORDER BY h.created_at DESC, h.id DESC
        LIMIT ' . max(1, $limit)
    )->fetchAll(\PDO::FETCH_ASSOC);
  }

  private static function isDate(string $value): bool {
    $d = \DateTimeImmutable::createFromFormat('Y-m-d', $value);
    return $d !== FALSE && $d->format('Y-m-d') === $value;
  }

}
