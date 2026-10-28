<?php

declare(strict_types=1);

namespace Drupal\kmfri_enterprise\Form;

use Drupal\Core\Cache\Cache;
use Drupal\Core\Database\Database;
use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\kmfri_enterprise\Repository\HubRepository;

/**
 * Hub settings: database connection key, flood limits, catalogue refresh.
 */
final class SettingsForm extends ConfigFormBase {

  public function getFormId(): string {
    return 'kmfri_enterprise_settings';
  }

  protected function getEditableConfigNames(): array {
    return ['kmfri_enterprise.settings'];
  }

  public function buildForm(array $form, FormStateInterface $form_state): array {
    $config = $this->config('kmfri_enterprise.settings');
    $key = $config->get('database_key') ?: 'kmfri_services';

    try {
      $health = \Drupal::service('kmfri_enterprise.repository')->health();
      $status = $this->t('Connected to %db (server %server).', ['%db' => $health['database'], '%server' => $health['server']]);
    }
    catch (\Throwable $e) {
      $status = $this->t('Not connected: @message The site is serving the bundled read-only catalogue and quotation requests are disabled.', ['@message' => $e->getMessage()]);
    }
    $form['status'] = [
      '#type' => 'item',
      '#title' => $this->t('Services database'),
      '#markup' => $status,
    ];
    $form['database_key'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Database connection key'),
      '#description' => $this->t('Key of the <code>$databases</code> entry in settings.php that points at kmfri_services_db. Defined keys: @keys.', [
        '@keys' => implode(', ', array_keys(Database::getAllConnectionInfo())),
      ]),
      '#default_value' => $key,
      '#required' => TRUE,
    ];
    $form['flood_limit'] = [
      '#type' => 'number',
      '#title' => $this->t('Quotation requests allowed per client IP'),
      '#min' => 1,
      '#default_value' => $config->get('flood_limit'),
      '#required' => TRUE,
    ];
    $form['flood_window'] = [
      '#type' => 'number',
      '#title' => $this->t('Within this many seconds'),
      '#min' => 60,
      '#default_value' => $config->get('flood_window'),
      '#required' => TRUE,
    ];
    $form['actions']['refresh'] = [
      '#type' => 'submit',
      '#value' => $this->t('Reload catalogue from the database'),
      '#submit' => ['::refreshCatalogue'],
      '#weight' => 10,
    ];
    return parent::buildForm($form, $form_state);
  }

  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $this->config('kmfri_enterprise.settings')
      ->set('database_key', trim($form_state->getValue('database_key')))
      ->set('flood_limit', (int) $form_state->getValue('flood_limit'))
      ->set('flood_window', (int) $form_state->getValue('flood_window'))
      ->save();
    self::invalidate();
    parent::submitForm($form, $form_state);
  }

  public function refreshCatalogue(array &$form, FormStateInterface $form_state): void {
    self::invalidate();
    $this->messenger()->addStatus($this->t('The catalogue, menus and pages will be rebuilt from kmfri_services_db.'));
  }

  private static function invalidate(): void {
    Cache::invalidateTags([HubRepository::CACHE_TAG]);
    \Drupal::service('kmfri_enterprise.repository')->reset();
    // Service and station menu links are derived from the catalogue.
    \Drupal::service('plugin.manager.menu.link')->rebuild();
  }

}
