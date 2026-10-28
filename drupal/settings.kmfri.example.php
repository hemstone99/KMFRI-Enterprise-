<?php

/**
 * @file
 * Append to sites/default/settings.php (or include it from there).
 *
 * The hub reads kmfri_services_db through its own connection. Use the
 * least-privilege application account (SELECT + EXECUTE only) that
 * `drush kmfri:db-setup` creates with the password you set here.
 */

$databases['kmfri_services']['default'] = [
  'driver' => 'mysql',
  'database' => 'kmfri_services_db',
  'username' => 'kmfri_hub',
  'password' => getenv('KMFRI_DB_PASSWORD') ?: 'change-me',
  'host' => '127.0.0.1',
  'port' => 3306,
  'prefix' => '',
  'namespace' => 'Drupal\\mysql\\Driver\\Database\\mysql',
  'autoload' => 'core/modules/mysql/src/Driver/Database/mysql/',
  'isolation_level' => 'READ COMMITTED',
];
