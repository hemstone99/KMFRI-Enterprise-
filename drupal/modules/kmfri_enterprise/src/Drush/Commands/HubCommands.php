<?php

declare(strict_types=1);

namespace Drupal\kmfri_enterprise\Drush\Commands;

use Drupal\Core\Cache\Cache;
use Drupal\Core\Database\Database;
use Drupal\Core\Extension\ModuleExtensionList;
use Drupal\Core\Menu\MenuLinkManagerInterface;
use Drupal\kmfri_enterprise\Repository\HubRepository;
use Drush\Attributes as CLI;
use Drush\Commands\DrushCommands;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Drush commands for the Enterprise Services Hub.
 */
final class HubCommands extends DrushCommands {

  public function __construct(
    private readonly ModuleExtensionList $moduleList,
    private readonly HubRepository $repository,
    private readonly MenuLinkManagerInterface $menuLinks,
  ) {
    parent::__construct();
  }

  public static function create(ContainerInterface $container): self {
    return new self(
      $container->get('extension.list.module'),
      $container->get('kmfri_enterprise.repository'),
      $container->get('plugin.manager.menu.link'),
    );
  }

  /**
   * Builds kmfri_services_db from sql/NNN_*.sql and provisions the application account.
   *
   * The admin account must be able to create databases, routines and users. The
   * application account (host, database, username, password) is read from the
   * settings.php $databases entry the hub uses, and is granted only SELECT plus
   * EXECUTE on the stored procedures (inquiry registration, service details,
   * dashboard status workflow).
   *
   * WARNING: 001_kmfri_services_db.sql drops and recreates every table, so this
   * resets all inquiries to the seed data.
   */
  #[CLI\Command(name: 'kmfri:db-setup')]
  #[CLI\Option(name: 'admin-user', description: 'MySQL/MariaDB account with CREATE, ROUTINE and GRANT privileges.')]
  #[CLI\Option(name: 'admin-password', description: 'Password for the admin account (default: empty).')]
  #[CLI\Usage(name: 'drush kmfri:db-setup --admin-user=root', description: 'Create the schema, seed data and kmfri_hub account.')]
  public function dbSetup(array $options = ['admin-user' => 'root', 'admin-password' => '']): void {
    $key = \Drupal::config('kmfri_enterprise.settings')->get('database_key') ?: 'kmfri_services';
    $info = Database::getConnectionInfo($key)['default'] ?? NULL;
    if (!$info) {
      throw new \RuntimeException("Add a \$databases['$key'] entry to settings.php first (see README).");
    }
    if (empty($info['password'])) {
      throw new \RuntimeException("Set a password for the application account in \$databases['$key'].");
    }
    if (!$this->io()->confirm(sprintf('This drops and recreates every table in %s on %s. Continue?', $info['database'], $info['host']))) {
      return;
    }

    $admin = new \PDO(
      sprintf('mysql:host=%s;port=%d;charset=utf8mb4', $info['host'], $info['port'] ?? 3306),
      $options['admin-user'],
      $options['admin-password'],
      [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION, \PDO::MYSQL_ATTR_MULTI_STATEMENTS => FALSE],
    );
    $this->logger()->notice(sprintf('Connected as %s (server %s).', $options['admin-user'], $admin->query('SELECT VERSION()')->fetchColumn()));

    $dir = $this->moduleList->getPath('kmfri_enterprise') . '/sql';
    $files = glob("$dir/[0-9][0-9][0-9]_*.sql");
    sort($files);
    foreach ($files as $file) {
      $statements = self::splitSql((string) file_get_contents($file));
      foreach ($statements as $i => $sql) {
        try {
          $admin->exec($sql);
        }
        catch (\PDOException $e) {
          throw new \RuntimeException(sprintf("%s statement #%d failed: %s\n%s", basename($file), $i + 1, $e->getMessage(), substr($sql, 0, 400)), 0, $e);
        }
      }
      $this->logger()->success(sprintf('%s (%d statements)', basename($file), count($statements)));
    }

    // Least-privilege application account.
    $db = '`' . str_replace('`', '``', $info['database']) . '`';
    foreach (['localhost', '127.0.0.1'] as $host) {
      $account = $admin->quote($info['username']) . '@' . $admin->quote($host);
      $password = $admin->quote($info['password']);
      $admin->exec("CREATE USER IF NOT EXISTS $account IDENTIFIED BY $password");
      $admin->exec("ALTER USER $account IDENTIFIED BY $password");
      $admin->exec("GRANT SELECT ON $db.* TO $account");
      $admin->exec("GRANT EXECUTE ON PROCEDURE $db.sp_register_service_inquiry TO $account");
      $admin->exec("GRANT EXECUTE ON PROCEDURE $db.sp_get_service_full_details TO $account");
      $admin->exec("GRANT EXECUTE ON PROCEDURE $db.sp_update_inquiry_status TO $account");
    }
    $admin->exec('FLUSH PRIVILEGES');
    $this->logger()->success(sprintf('Application account %s: SELECT + EXECUTE on %s.', $info['username'], $info['database']));

    $counts = $admin->query("SELECT
        (SELECT COUNT(*) FROM $db.services) AS services,
        (SELECT COUNT(*) FROM $db.catalogue_items) AS catalogue_services,
        (SELECT COUNT(*) FROM $db.pricing_tiers WHERE is_active = 1) AS tiers,
        (SELECT COUNT(*) FROM $db.research_stations) AS stations,
        (SELECT COUNT(*) FROM $db.service_inquiries) AS inquiries")->fetch(\PDO::FETCH_ASSOC);
    $this->logger()->success('Seeded: ' . http_build_query($counts, '', ', '));
    $this->refresh();
  }

  /**
   * Reloads the catalogue, service/station menu links and pages from kmfri_services_db.
   */
  #[CLI\Command(name: 'kmfri:refresh')]
  public function refresh(): void {
    Cache::invalidateTags([HubRepository::CACHE_TAG]);
    $this->repository->reset();
    $this->menuLinks->rebuild();
    $live = $this->repository->isLive();
    $this->logger()->success(sprintf(
      'Catalogue reloaded: %d services, %d stations (%s).',
      count($this->repository->services()),
      count($this->repository->stations()),
      $live ? 'live database' : 'database unreachable, bundled fallback'
    ));
  }

  /**
   * Splits a MySQL script into statements, honouring DELIMITER, quotes and comments.
   *
   * @return string[]
   */
  public static function splitSql(string $script): array {
    $out = [];
    $delimiter = ';';
    $buf = '';
    $n = strlen($script);
    for ($i = 0; $i < $n;) {
      // DELIMITER directive (client command, only at line start).
      if (($i === 0 || $script[$i - 1] === "\n") && preg_match('/\G[ \t]*DELIMITER[ \t]+(\S+)[ \t]*\r?(\n|$)/Ai', $script, $m, 0, $i)) {
        $delimiter = $m[1];
        $i += strlen($m[0]);
        continue;
      }
      $ch = $script[$i];
      $next = $script[$i + 1] ?? '';
      // Comments.
      if (($ch === '-' && $next === '-' && ctype_space($script[$i + 2] ?? ' ')) || $ch === '#') {
        $end = strpos($script, "\n", $i);
        $i = $end === FALSE ? $n : $end + 1;
        $buf .= "\n";
        continue;
      }
      if ($ch === '/' && $next === '*') {
        $end = strpos($script, '*/', $i + 2);
        $i = $end === FALSE ? $n : $end + 2;
        $buf .= ' ';
        continue;
      }
      // Quoted strings and identifiers.
      if ($ch === "'" || $ch === '"' || $ch === '`') {
        $j = $i + 1;
        while ($j < $n) {
          if ($script[$j] === '\\' && $ch !== '`') {
            $j += 2;
            continue;
          }
          if ($script[$j] === $ch) {
            if (($script[$j + 1] ?? '') === $ch) {
              $j += 2;
              continue;
            }
            break;
          }
          $j++;
        }
        $buf .= substr($script, $i, $j - $i + 1);
        $i = $j + 1;
        continue;
      }
      // Statement terminator.
      if (substr_compare($script, $delimiter, $i, strlen($delimiter)) === 0) {
        if (trim($buf) !== '') {
          $out[] = trim($buf);
        }
        $buf = '';
        $i += strlen($delimiter);
        continue;
      }
      $buf .= $ch;
      $i++;
    }
    if (trim($buf) !== '') {
      $out[] = trim($buf);
    }
    return $out;
  }

}
