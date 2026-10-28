<?php

declare(strict_types=1);

namespace Drupal\kmfri_enterprise\Controller;

use Drupal\Component\Render\FormattableMarkup;
use Drupal\Component\Utility\Unicode;
use Drupal\Core\Cache\Cache;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Connection;
use Drupal\Core\Database\Query\PagerSelectExtender;
use Drupal\Core\Datetime\DateFormatterInterface;
use Drupal\Core\Menu\MenuLinkManagerInterface;
use Drupal\Core\Pager\PagerManagerInterface;
use Drupal\Core\Url;
use Drupal\kmfri_enterprise\Form\InquiryStatusForm;
use Drupal\kmfri_enterprise\Form\SettingsForm;
use Drupal\kmfri_enterprise\Form\UserAdminForm;
use Drupal\kmfri_enterprise\Repository\AdminRepository;
use Drupal\kmfri_enterprise\Repository\Catalogue;
use Drupal\kmfri_enterprise\Repository\HubContent;
use Drupal\kmfri_enterprise\Repository\HubRepository;
use Drupal\user\RoleInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Administration dashboard: overview, inquiries, catalogue, users, activity, settings.
 */
final class AdminController extends ControllerBase {

  /**
   * Classes allowed when unserializing dblog placeholder values.
   */
  private const LOG_CLASSES = [
    \Drupal\Core\StringTranslation\TranslatableMarkup::class,
    \Drupal\Core\StringTranslation\PluralTranslatableMarkup::class,
    \Drupal\Core\Render\Markup::class,
    FormattableMarkup::class,
  ];

  public function __construct(
    private readonly AdminRepository $admin,
    private readonly HubRepository $hub,
    private readonly HubContent $content,
    private readonly PagerManagerInterface $pagerManager,
    private readonly DateFormatterInterface $dateFormatter,
    private readonly Connection $drupalDb,
    private readonly MenuLinkManagerInterface $menuLinks,
    private readonly Catalogue $catalogue,
  ) {}

  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('kmfri_enterprise.admin_repository'),
      $container->get('kmfri_enterprise.repository'),
      $container->get('kmfri_enterprise.content'),
      $container->get('pager.manager'),
      $container->get('date.formatter'),
      $container->get('database'),
      $container->get('plugin.manager.menu.link'),
      $container->get('kmfri_enterprise.catalogue'),
    );
  }

  /* ------------------------------------------------------------------ */
  /* Pages                                                               */
  /* ------------------------------------------------------------------ */

  public function dashboard(): array {
    if ($offline = $this->offline('overview', 'Dashboard')) {
      return $offline;
    }
    $kpis = $this->admin->kpis();
    $services = $this->hub->services();
    $monthly = $this->admin->monthly(6);
    $statuses = $this->admin->statusBreakdown();
    $top = $this->admin->topServices(5);

    $content = [
      '#theme' => 'kmfri_enterprise_admin_dashboard',
      '#kpis' => $kpis,
      '#monthly' => $monthly,
      '#monthly_max' => max(1, ...array_column($monthly, 'count')),
      '#statuses' => $statuses,
      '#status_max' => max(1, ...array_column($statuses, 'count')),
      '#top_services' => $top,
      '#top_max' => max(1, ...array_column($top, 'n') ?: [1]),
      '#recent' => array_map([$this, 'inquiryRow'], $this->admin->inquiries(['sort' => 'created', 'dir' => 'desc'], 5)),
      '#activity' => array_map([$this, 'activityRow'], $this->admin->recentActivity(6)),
      '#catalogue' => [
        'services' => $this->catalogue->total(),
        'tiers' => array_sum(array_map(fn ($s) => count($s['pricing_tiers']), $services)),
        'stations' => count($this->hub->stations()),
      ],
      '#links' => [
        'inquiries' => Url::fromRoute('kmfri_enterprise.admin.inquiries')->toString(),
        'pending' => Url::fromRoute('kmfri_enterprise.admin.inquiries', [], ['query' => ['status' => 'pending']])->toString(),
        'open' => Url::fromRoute('kmfri_enterprise.admin.inquiries', [], ['query' => ['status' => 'open']])->toString(),
        'activity' => Url::fromRoute('kmfri_enterprise.admin.activity')->toString(),
        'catalogue' => Url::fromRoute('kmfri_enterprise.admin.catalogue')->toString(),
      ],
    ];
    $actions = [];
    if ($this->currentUser()->hasPermission('manage kmfri inquiries')) {
      $actions[] = $this->action('Export inquiries (CSV)', Url::fromRoute('kmfri_enterprise.admin.inquiries_export'), 'download', 'btn-outline');
    }
    $actions[] = $this->action('View public site', Url::fromRoute('kmfri_enterprise.home'), 'external-link', 'btn-primary');
    return $this->shell('overview', $this->t('Dashboard'), $content, $this->t('Quotation pipeline, catalogue and activity across the Enterprise Services Hub.'), $actions);
  }

  public function inquiries(Request $request): array {
    if ($offline = $this->offline('inquiries', 'Inquiries')) {
      return $offline;
    }
    $filters = $this->inquiryFilters($request);
    $rows = array_map([$this, 'inquiryRow'], $this->admin->inquiries($filters, 20));
    $total = $this->pagerManager->getPager()?->getTotalItems() ?? count($rows);

    $sorts = [];
    foreach (array_keys(AdminRepository::INQUIRY_SORTS) as $key) {
      $active = $filters['sort'] === $key;
      $dir = $active && $filters['dir'] === 'desc' ? 'asc' : 'desc';
      $sorts[$key] = [
        'url' => Url::fromRoute('kmfri_enterprise.admin.inquiries', [], ['query' => ['sort' => $key, 'dir' => $dir] + array_filter($filters)])->toString(),
        'active' => $active,
        'dir' => $active ? $filters['dir'] : NULL,
      ];
    }

    $content = [
      '#theme' => 'kmfri_enterprise_admin_inquiries',
      '#rows' => $rows,
      '#filters' => $filters,
      '#statuses' => AdminRepository::STATUSES,
      '#services' => array_column($this->hub->services(), 'title', 'db_id'),
      '#sorts' => $sorts,
      '#total' => $total,
      '#pager' => ['#type' => 'pager'],
      '#reset_url' => Url::fromRoute('kmfri_enterprise.admin.inquiries')->toString(),
      '#action_url' => Url::fromRoute('kmfri_enterprise.admin.inquiries')->toString(),
    ];
    $actions = [];
    if ($this->currentUser()->hasPermission('manage kmfri inquiries')) {
      $actions[] = $this->action('Export filtered (CSV)', Url::fromRoute('kmfri_enterprise.admin.inquiries_export', [], ['query' => array_filter($filters)]), 'download', 'btn-outline');
    }
    return $this->shell('inquiries', $this->t('Inquiries'), $content, $this->t('Quotation and service requests submitted through the hub.'), $actions);
  }

  public function inquiry(int $inquiry): array {
    if ($offline = $this->offline('inquiries', 'Inquiry')) {
      return $offline;
    }
    $row = $this->admin->inquiry($inquiry) ?? throw new NotFoundHttpException();
    $flow = ['pending', 'under_review', 'quote_issued', 'invoice_generated', 'paid', 'fulfilled'];
    $position = array_search($row['status'], $flow, TRUE);
    $content = [
      '#theme' => 'kmfri_enterprise_admin_inquiry',
      '#inquiry' => $this->inquiryRow($row) + [
        'kra_pin' => $row['kra_pin'],
        'notes' => $row['client_notes'],
        'ip_address' => $row['ip_address'],
        'unit' => $row['unit_description'],
        'tier_cost_kes' => $row['tier_cost_kes'] === NULL ? NULL : (float) $row['tier_cost_kes'],
        'service_url' => Url::fromRoute('kmfri_enterprise.service', ['slug' => $row['service_slug']])->toString(),
        'updated' => $this->dateFormatter->format(strtotime($row['updated_at']), 'custom', 'j M Y, H:i'),
      ],
      '#steps' => array_map(fn ($key, $i) => [
        'label' => AdminRepository::STATUSES[$key],
        'state' => $row['status'] === 'cancelled' ? 'idle' : ($position === FALSE ? 'idle' : ($i < $position ? 'done' : ($i === $position ? 'current' : 'idle'))),
      ], $flow, array_keys($flow)),
      '#cancelled' => $row['status'] === 'cancelled',
      '#history' => array_map([$this, 'activityRow'], $this->admin->history($inquiry)),
      '#status_form' => $this->currentUser()->hasPermission('manage kmfri inquiries')
        ? $this->formBuilder()->getForm(InquiryStatusForm::class, $row)
        : NULL,
      '#back_url' => Url::fromRoute('kmfri_enterprise.admin.inquiries')->toString(),
    ];
    return $this->shell('inquiries', $row['reference_number'], $content, $this->t('@service · submitted @date', [
      '@service' => $row['service_title'],
      '@date' => $this->dateFormatter->format(strtotime($row['created_at']), 'custom', 'j M Y, H:i'),
    ]));
  }

  public function export(Request $request): StreamedResponse {
    $filters = $this->inquiryFilters($request);
    $rows = $this->admin->inquiriesForExport($filters);
    $this->getLogger('kmfri_enterprise')->notice('@user exported @count inquiries to CSV.', [
      '@user' => $this->currentUser()->getDisplayName(),
      '@count' => count($rows),
    ]);
    $response = new StreamedResponse(function () use ($rows) {
      $out = fopen('php://output', 'w');
      // UTF-8 BOM so spreadsheet tools read accents correctly.
      fwrite($out, "\xEF\xBB\xBF");
      fputcsv($out, ['Reference', 'Submitted', 'Status', 'Service code', 'Service', 'Tariff', 'Quantity', 'Estimated KES', 'Client type', 'Contact', 'Organization', 'Email', 'Phone', 'Station']);
      foreach ($rows as $r) {
        fputcsv($out, array_map([self::class, 'csvSafe'], [
          $r['reference_number'], $r['created_at'], AdminRepository::STATUSES[$r['status']] ?? $r['status'],
          $r['service_code'], $r['service_title'], $r['tier_name'], $r['estimated_quantity'], $r['estimated_cost_kes'],
          $r['client_type'], $r['full_name'], $r['organization'], $r['email'], $r['phone'], $r['station_name'],
        ]));
      }
      fclose($out);
    });
    $response->headers->set('Content-Type', 'text/csv; charset=utf-8');
    $response->headers->set('Content-Disposition', 'attachment; filename="kmfri-inquiries-' . date('Y-m-d') . '.csv"');
    $response->headers->set('Cache-Control', 'private, no-store');
    return $response;
  }

  /**
   * Catalogue: sync status (website catalogue vs kmfri_services_db), every service with
   * its tariff and demand, the portfolios' standard rates, portfolios and stations.
   */
  public function catalogue(): array {
    $services = $this->hub->services();
    $live = $this->hub->isLive();
    $counts = $live ? $this->admin->inquiryCountsByService() : [];
    $tierCounts = $live ? $this->admin->inquiryCountsByTier() : [];
    $sync = $live ? $this->admin->catalogueSync($this->catalogue->index()) : NULL;
    $schedule = $this->catalogue->tariffSchedule($services);
    $issues = array_column($sync['issues'] ?? [], 'issue', 'no');
    $charterUrl = Url::fromRoute('kmfri_enterprise.charter')->toString();

    $tariffs = [];
    $divisions = [];
    foreach ($schedule['divisions'] as $d) {
      foreach ($d['rows'] as $r) {
        $tier = $sync['tiers'][$r['no']] ?? NULL;
        $tariffs[] = [
          'no' => $r['no'],
          'name' => $r['name'],
          'division' => $d['title'],
          'division_id' => $d['id'],
          'group' => $r['group'],
          'fee' => $r['fee_kes'],
          'fee_label' => $r['fee_kes'] !== NULL ? $r['unit_label'] : ($r['fee_note'] ?? ($r['availability'] === 'planned' ? '—' : 'On quotation')),
          'availability' => $r['availability'],
          'tier_id' => $tier['id'] ?? NULL,
          'requests' => $tier ? (int) ($tierCounts[$tier['id']] ?? 0) : 0,
          'issue' => $issues[$r['no']] ?? NULL,
          'url' => $r['group_url'],
          'text' => mb_strtolower(implode(' ', [$r['no'], $r['name'], $d['title'], $r['group'], $r['blurb']])),
        ];
      }
      $divisions[] = [
        'id' => $d['id'],
        'title' => $d['title'],
        'services' => count($d['rows']),
        'priced' => $d['priced'],
        'online' => count(array_filter($d['rows'], fn ($r) => $r['availability'] === 'online')),
        'min' => $d['min'],
        'max' => $d['max'],
        'rates' => count($d['rates']),
        'inquiries' => $d['portfolio'] ? (int) ($counts[$d['portfolio']['db_id'] ?? 0] ?? 0) : 0,
        'url' => $d['url'],
        'tariffs_url' => "$charterUrl#tariffs-{$d['id']}",
      ];
    }
    $rates = [];
    $rateGroups = array_merge(
      array_map(fn ($d) => ['portfolio' => $d['portfolio'], 'rates' => $d['rates']], array_filter($schedule['divisions'], fn ($d) => $d['rates'])),
      $schedule['other'],
    );
    foreach ($rateGroups as $g) {
      foreach ($g['rates'] as $t) {
        $rates[] = $t + ['portfolio' => $g['portfolio']['title'], 'requests' => (int) ($tierCounts[$t['id'] ?? 0] ?? 0)];
      }
    }

    $rows = array_map(fn (array $s) => [
      'code' => $s['code'],
      'title' => $s['title'],
      'category' => $s['category_label'],
      'tiers' => count($s['pricing_tiers']),
      'from_kes' => $s['pricing_tiers'] ? min(array_column($s['pricing_tiers'], 'cost_kes')) : NULL,
      'turnaround' => $s['turnaround_time'],
      'status' => $s['status'],
      'stations' => count($s['available_stations']),
      'inquiries' => (int) ($counts[$s['db_id'] ?? 0] ?? 0),
      'url' => Url::fromRoute('kmfri_enterprise.service', ['slug' => $s['slug']])->toString(),
      'inquiries_url' => isset($s['db_id']) ? Url::fromRoute('kmfri_enterprise.admin.inquiries', [], ['query' => ['service' => $s['db_id']]])->toString() : NULL,
    ], $services);
    $stations = array_map(fn (array $st) => $st + [
      'catalogue_services' => $this->catalogue->stationOffer($st, $services)['total'],
      'url' => Url::fromRoute('kmfri_enterprise.station', ['station' => Catalogue::stationSlug($st)])->toString(),
    ], $this->hub->stations());

    $content = [
      '#theme' => 'kmfri_enterprise_admin_catalogue',
      '#services' => $rows,
      '#stations' => $stations,
      '#live' => $live,
      '#stations_url' => Url::fromRoute('kmfri_enterprise.stations')->toString(),
      '#sync' => $sync,
      '#summary' => [
        'services' => $this->catalogue->total(),
        'priced' => $schedule['priced'],
        'rates' => $schedule['rates'],
        'online' => $this->catalogue->onlineTotal(),
        'divisions' => count($schedule['divisions']),
      ],
      '#divisions' => $divisions,
      '#tariffs' => $tariffs,
      '#rates' => $rates,
      '#charter_url' => $charterUrl,
      '#catalogue_url' => Catalogue::url(),
    ];
    $actions = [];
    if ($this->currentUser()->hasPermission('administer kmfri enterprise hub')) {
      $actions[] = $this->action('Reload from database', Url::fromRoute('kmfri_enterprise.admin.catalogue_refresh'), 'rotate-ccw', 'btn-outline');
    }
    $actions[] = $this->action('Public tariffs', Url::fromRoute('kmfri_enterprise.charter'), 'external-link', 'btn-primary');
    return $this->shell('catalogue', $this->t('Catalogue & tariffs'), $content, $this->t('Every catalogue service and tariff published on the hub, checked against kmfri_services_db.'), $actions);
  }

  public function refreshCatalogue(): RedirectResponse {
    Cache::invalidateTags([HubRepository::CACHE_TAG]);
    $this->hub->reset();
    $this->menuLinks->rebuild();
    $this->getLogger('kmfri_enterprise')->notice('@user reloaded the catalogue from kmfri_services_db.', ['@user' => $this->currentUser()->getDisplayName()]);
    $this->messenger()->addStatus($this->t('Catalogue reloaded: @services services, @stations stations.', [
      '@services' => count($this->hub->services()),
      '@stations' => count($this->hub->stations()),
    ]));
    return $this->redirect('kmfri_enterprise.admin.catalogue');
  }

  public function users(Request $request): array {
    $filters = [
      'q' => mb_substr(trim((string) $request->query->get('q', '')), 0, 100),
      'role' => (string) $request->query->get('role', ''),
      'status' => (string) $request->query->get('status', ''),
    ];
    $storage = $this->entityTypeManager()->getStorage('user');
    $query = $storage->getQuery()->accessCheck(TRUE)->condition('uid', 0, '>')->sort('created', 'DESC')->pager(20);
    if ($filters['q'] !== '') {
      $query->condition($query->orConditionGroup()
        ->condition('name', $filters['q'], 'CONTAINS')
        ->condition('mail', $filters['q'], 'CONTAINS'));
    }
    if ($filters['role'] !== '') {
      $query->condition('roles', $filters['role']);
    }
    if ($filters['status'] === 'active' || $filters['status'] === 'blocked') {
      $query->condition('status', $filters['status'] === 'active' ? 1 : 0);
    }
    $uids = $query->execute();
    $total = $this->pagerManager->getPager()?->getTotalItems() ?? count($uids);

    $roles = array_filter(
      $this->entityTypeManager()->getStorage('user_role')->loadMultiple(),
      fn (RoleInterface $r) => !in_array($r->id(), [RoleInterface::ANONYMOUS_ID, RoleInterface::AUTHENTICATED_ID], TRUE)
    );
    $active = (int) $storage->getQuery()->accessCheck(TRUE)->condition('uid', 0, '>')->condition('status', 1)->count()->execute();
    $all = (int) $storage->getQuery()->accessCheck(TRUE)->condition('uid', 0, '>')->count()->execute();

    $content = [
      '#theme' => 'kmfri_enterprise_admin_users',
      '#filters' => $filters,
      '#roles' => array_map(fn (RoleInterface $r) => $r->label(), $roles),
      '#total' => $total,
      '#summary' => ['all' => $all, 'active' => $active, 'blocked' => $all - $active],
      '#form' => $this->formBuilder()->getForm(UserAdminForm::class, array_values($uids)),
      '#pager' => ['#type' => 'pager'],
      '#action_url' => Url::fromRoute('kmfri_enterprise.admin.users')->toString(),
    ];
    $actions = [
      $this->action('Add user', Url::fromRoute('user.admin_create', [], ['query' => ['destination' => Url::fromRoute('kmfri_enterprise.admin.users')->toString()]]), 'user-plus', 'btn-primary'),
    ];
    if ($this->currentUser()->hasPermission('administer permissions')) {
      array_unshift($actions, $this->action('Roles & permissions', Url::fromRoute('user.admin_permissions'), 'shield-check', 'btn-outline'));
    }
    return $this->shell('users', $this->t('Users'), $content, $this->t('Staff accounts and their access to the hub dashboard.'), $actions);
  }

  public function activity(Request $request): array {
    $tab = $request->query->get('log') === 'system' ? 'system' : 'workflow';
    $filters = [
      'q' => mb_substr(trim((string) $request->query->get('q', '')), 0, 100),
      'status' => (string) $request->query->get('status', ''),
      'severity' => (string) $request->query->get('severity', ''),
    ];
    $hasDblog = $this->moduleHandler()->moduleExists('dblog');
    $rows = [];
    if ($tab === 'workflow' && $this->hub->isLive()) {
      $rows = array_map([$this, 'activityRow'], $this->admin->workflowLog($filters));
    }
    elseif ($tab === 'system' && $hasDblog) {
      $rows = $this->systemLog($filters);
    }
    $content = [
      '#theme' => 'kmfri_enterprise_admin_activity',
      '#tab' => $tab,
      '#rows' => $rows,
      '#filters' => $filters,
      '#statuses' => AdminRepository::STATUSES,
      '#severities' => ['3' => 'Error', '4' => 'Warning', '5' => 'Notice', '6' => 'Info'],
      '#total' => $this->pagerManager->getPager()?->getTotalItems() ?? count($rows),
      '#pager' => ['#type' => 'pager'],
      '#live' => $this->hub->isLive(),
      '#has_dblog' => $hasDblog,
      '#tabs' => [
        'workflow' => Url::fromRoute('kmfri_enterprise.admin.activity')->toString(),
        'system' => Url::fromRoute('kmfri_enterprise.admin.activity', [], ['query' => ['log' => 'system']])->toString(),
      ],
      '#action_url' => Url::fromRoute('kmfri_enterprise.admin.activity')->toString(),
    ];
    return $this->shell('activity', $this->t('Activity log'), $content, $this->t('Inquiry workflow audit trail and hub system events.'));
  }

  public function settings(): array {
    $content = [
      '#theme' => 'kmfri_enterprise_admin_settings',
      '#form' => $this->formBuilder()->getForm(SettingsForm::class),
      '#links' => array_filter([
        'site' => $this->currentUser()->hasPermission('administer site configuration') ? ['label' => $this->t('Site information'), 'url' => Url::fromRoute('system.site_information_settings')->toString()] : NULL,
        'menu' => $this->moduleHandler()->moduleExists('menu_ui') && $this->currentUser()->hasPermission('administer menu') ? ['label' => $this->t('Main navigation menu'), 'url' => Url::fromRoute('entity.menu.edit_form', ['menu' => 'main'])->toString()] : NULL,
        'perms' => $this->currentUser()->hasPermission('administer permissions') ? ['label' => $this->t('Permissions'), 'url' => Url::fromRoute('user.admin_permissions.module', ['modules' => 'kmfri_enterprise'])->toString()] : NULL,
        'cache' => $this->currentUser()->hasPermission('administer site configuration') ? ['label' => $this->t('Performance & caching'), 'url' => Url::fromRoute('system.performance_settings')->toString()] : NULL,
      ]),
    ];
    return $this->shell('settings', $this->t('Settings'), $content, $this->t('Database connection, quotation limits and related Drupal configuration.'));
  }

  /* ------------------------------------------------------------------ */
  /* Shell & helpers                                                      */
  /* ------------------------------------------------------------------ */

  /**
   * Wraps page content in the dashboard layout (sidebar, top bar, messages).
   */
  private function shell(string $section, $title, array $content, $subtitle = NULL, array $actions = []): array {
    $account = $this->currentUser();
    $pending = NULL;
    if ($this->hub->isLive()) {
      try {
        $pending = $this->admin->pendingCount();
      }
      catch (\Throwable) {
      }
    }
    $nav = [];
    foreach ([
      ['overview', 'Overview', 'layout-dashboard', 'kmfri_enterprise.admin.dashboard', NULL],
      ['inquiries', 'Inquiries', 'inbox', 'kmfri_enterprise.admin.inquiries', $pending],
      ['catalogue', 'Catalogue', 'layers', 'kmfri_enterprise.admin.catalogue', NULL],
      ['users', 'Users', 'users', 'kmfri_enterprise.admin.users', NULL],
      ['activity', 'Activity log', 'history', 'kmfri_enterprise.admin.activity', NULL],
      ['settings', 'Settings', 'settings', 'kmfri_enterprise.admin.settings', NULL],
    ] as [$key, $label, $icon, $route, $badge]) {
      $url = Url::fromRoute($route);
      if ($url->access($account)) {
        $nav[] = ['key' => $key, 'label' => $this->t($label), 'icon' => $icon, 'url' => $url->toString(), 'active' => $key === $section, 'badge' => $badge ?: NULL];
      }
    }
    $roles = array_map(
      fn (RoleInterface $r) => $r->label(),
      $this->entityTypeManager()->getStorage('user_role')->loadMultiple(array_diff($account->getRoles(), [RoleInterface::AUTHENTICATED_ID]))
    );
    $name = $account->getDisplayName();
    return [
      '#theme' => 'kmfri_enterprise_admin',
      '#section' => $section,
      '#page_title' => $title,
      '#subtitle' => $subtitle,
      '#actions' => $actions,
      '#content' => $content,
      '#messages' => ['#type' => 'status_messages'],
      '#nav' => $nav,
      '#pending' => $pending,
      '#user' => [
        'name' => $name,
        'initials' => strtoupper(mb_substr(preg_replace('/[^\p{L}\p{N}]+/u', '', $name), 0, 2)) ?: 'U',
        'role' => $roles ? implode(', ', $roles) : $this->t('Staff'),
        'account_url' => Url::fromRoute('user.page')->toString(),
        'edit_url' => Url::fromRoute('entity.user.edit_form', ['user' => $account->id()])->toString(),
        'logout_url' => Url::fromRoute('user.logout')->toString(),
      ],
      '#search_url' => Url::fromRoute('kmfri_enterprise.admin.inquiries')->toString(),
      '#site_url' => Url::fromRoute('kmfri_enterprise.home')->toString(),
      '#drupal_admin_url' => $account->hasPermission('access administration pages') ? Url::fromRoute('system.admin')->toString() : NULL,
      '#pending_url' => Url::fromRoute('kmfri_enterprise.admin.inquiries', [], ['query' => ['status' => 'pending']])->toString(),
      '#live' => $this->hub->isLive(),
      // Live operational data, per user: never cache.
      '#cache' => ['max-age' => 0],
      '#attached' => ['library' => ['kmfri_enterprise/hub', 'kmfri_enterprise/fonts']],
    ];
  }

  /**
   * Dashboard page shown instead of database-backed content while kmfri_services_db is down.
   */
  private function offline(string $section, string $title): ?array {
    if ($this->hub->isLive()) {
      return NULL;
    }
    return $this->shell($section, $this->t($title), [
      '#theme' => 'kmfri_enterprise_admin_offline',
      '#settings_url' => Url::fromRoute('kmfri_enterprise.admin.settings')->toString(),
    ]);
  }

  private function action(string $label, Url $url, string $icon, string $style): array {
    return ['label' => $this->t($label), 'url' => $url->toString(), 'icon' => $icon, 'style' => $style];
  }

  private function inquiryFilters(Request $request): array {
    $q = $request->query;
    $sort = (string) $q->get('sort', 'created');
    return [
      'q' => mb_substr(trim((string) $q->get('q', '')), 0, 100),
      'status' => (string) $q->get('status', ''),
      'service' => (string) $q->get('service', ''),
      'from' => (string) $q->get('from', ''),
      'to' => (string) $q->get('to', ''),
      'sort' => isset(AdminRepository::INQUIRY_SORTS[$sort]) ? $sort : 'created',
      'dir' => strtolower((string) $q->get('dir', 'desc')) === 'asc' ? 'asc' : 'desc',
    ];
  }

  private function inquiryRow(array $r): array {
    $created = strtotime($r['created_at']);
    return [
      'id' => (int) $r['id'],
      'reference' => $r['reference_number'],
      'client' => $r['full_name'],
      'organization' => $r['organization'],
      'email' => $r['email'],
      'phone' => $r['phone'],
      'client_type' => $this->content->hub('client_types')[$r['client_type']] ?? $r['client_type'],
      'service' => $r['service_title'],
      'service_code' => $r['service_code'],
      'tier' => $r['tier_name'] ?? NULL,
      'station' => $r['station_name'] ?? NULL,
      'quantity' => (int) $r['estimated_quantity'],
      'value' => (float) $r['estimated_cost_kes'],
      'status' => $r['status'],
      'status_label' => AdminRepository::STATUSES[$r['status']] ?? $r['status'],
      'created' => $this->dateFormatter->format($created, 'custom', 'j M Y'),
      'created_full' => $this->dateFormatter->format($created, 'custom', 'j M Y, H:i'),
      'created_ago' => $this->dateFormatter->formatTimeDiffSince($created, ['granularity' => 1]),
      'url' => Url::fromRoute('kmfri_enterprise.admin.inquiry', ['inquiry' => $r['id']])->toString(),
    ];
  }

  private function activityRow(array $h): array {
    $time = strtotime($h['created_at']);
    return [
      'reference' => $h['reference_number'] ?? NULL,
      'client' => $h['full_name'] ?? NULL,
      'service' => $h['service_title'] ?? NULL,
      'from' => $h['previous_status'] ? (AdminRepository::STATUSES[$h['previous_status']] ?? $h['previous_status']) : NULL,
      'to' => AdminRepository::STATUSES[$h['new_status']] ?? $h['new_status'],
      'to_key' => $h['new_status'],
      'by' => $h['changed_by'],
      'remarks' => $h['remarks'],
      'time' => $this->dateFormatter->format($time, 'custom', 'j M Y, H:i'),
      'ago' => $this->dateFormatter->formatTimeDiffSince($time, ['granularity' => 1]),
      'url' => isset($h['inquiry_id']) ? Url::fromRoute('kmfri_enterprise.admin.inquiry', ['inquiry' => $h['inquiry_id']])->toString() : NULL,
    ];
  }

  /**
   * Hub-related entries from Drupal's database log (dblog).
   */
  private function systemLog(array $filters): array {
    $q = $this->drupalDb->select('watchdog', 'w')->extend(PagerSelectExtender::class)->limit(25);
    $q->leftJoin('users_field_data', 'u', 'u.uid = w.uid');
    $q->fields('w', ['wid', 'type', 'message', 'variables', 'severity', 'timestamp', 'location', 'hostname']);
    $q->addField('u', 'name', 'user_name');
    $q->condition('w.type', ['kmfri_enterprise', 'user'], 'IN');
    if ($filters['severity'] !== '' && ctype_digit($filters['severity'])) {
      $q->condition('w.severity', (int) $filters['severity']);
    }
    if ($filters['q'] !== '') {
      $q->condition('w.message', '%' . $q->escapeLike($filters['q']) . '%', 'LIKE');
    }
    $q->orderBy('w.wid', 'DESC');
    $levels = [0 => 'Emergency', 1 => 'Alert', 2 => 'Critical', 3 => 'Error', 4 => 'Warning', 5 => 'Notice', 6 => 'Info', 7 => 'Debug'];
    $rows = [];
    foreach ($q->execute() as $log) {
      // Placeholders may hold Drupal markup objects; allow only those string wrappers.
      $variables = @unserialize((string) $log->variables, ['allowed_classes' => self::LOG_CLASSES]);
      $variables = is_array($variables) ? array_map(fn ($v) => is_scalar($v) || $v instanceof Stringable ? (string) $v : '', $variables) : [];
      $message = (string) new FormattableMarkup((string) $log->message, $variables);
      $rows[] = [
        'message' => Unicode::truncate(strip_tags($message), 220, TRUE, TRUE),
        'type' => $log->type === 'user' ? 'Account' : 'Hub',
        'severity' => $levels[(int) $log->severity] ?? 'Info',
        'severity_key' => (int) $log->severity <= 3 ? 'error' : ((int) $log->severity === 4 ? 'warning' : 'info'),
        'user' => $log->user_name ?: $this->t('Anonymous'),
        'time' => $this->dateFormatter->format((int) $log->timestamp, 'custom', 'j M Y, H:i'),
        'ago' => $this->dateFormatter->formatTimeDiffSince((int) $log->timestamp, ['granularity' => 1]),
      ];
    }
    return $rows;
  }

  /**
   * Neutralises spreadsheet formulas in exported cells.
   */
  private static function csvSafe($value): string {
    $value = (string) $value;
    // Phone numbers and plain amounts are safe; anything else that a spreadsheet
    // would evaluate (=, +, -, @, tab, CR) is prefixed with an apostrophe.
    if (preg_match('/^[+\-]?[\d\s().]+$/', $value)) {
      return $value;
    }
    return preg_match('/^[=+\-@\t\r]/', $value) ? "'" . $value : $value;
  }

}
