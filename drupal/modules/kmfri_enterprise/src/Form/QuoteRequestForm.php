<?php

declare(strict_types=1);

namespace Drupal\kmfri_enterprise\Form;

use Drupal\Core\Flood\FloodInterface;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;
use Drupal\kmfri_enterprise\Repository\Catalogue;
use Drupal\kmfri_enterprise\Repository\HubContent;
use Drupal\kmfri_enterprise\Repository\HubRepository;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Official service & quotation request (registered via sp_register_service_inquiry).
 */
final class QuoteRequestForm extends FormBase {

  private const FLOOD_EVENT = 'kmfri_enterprise.quote_request';
  private const EMAIL_RE = '/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/';
  private const PHONE_RE = '/^\+?[\d\s()\-]{7,30}$/';
  private const KRA_RE = '/^[A-Z]\d{9}[A-Z]$/';

  /**
   * Not readonly: the form is serialized into the form cache, and
   * DependencySerializationTrait re-injects services on unserialize.
   */
  public function __construct(
    protected HubRepository $repository,
    protected HubContent $content,
    protected FloodInterface $flood,
    protected Catalogue $catalogue,
  ) {}

  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('kmfri_enterprise.repository'),
      $container->get('kmfri_enterprise.content'),
      $container->get('flood'),
      $container->get('kmfri_enterprise.catalogue'),
    );
  }

  public function getFormId(): string {
    return 'kmfri_enterprise_quote_request';
  }

  public function buildForm(array $form, FormStateInterface $form_state): array {
    $services = $this->repository->services();
    $live = $this->repository->isLive();
    $bySlug = array_column($services, NULL, 'slug');

    $slug = $form_state->getValue('service') ?? $this->getRequest()->query->get('service');
    if (!is_string($slug) || !isset($bySlug[$slug])) {
      $slug = $services[0]['slug'];
    }
    $service = $bySlug[$slug];
    $tiers = $service['pricing_tiers'];

    $form['#theme'] = 'kmfri_enterprise_quote_form';
    $form['#attributes']['class'][] = 'k-form';
    $form['#attached']['library'][] = 'kmfri_enterprise/hub';
    $form['#cache'] = $this->repository->cacheability();
    $form['#cache']['contexts'][] = 'url.query_args:service';
    $form['#cache']['contexts'][] = 'url.query_args:tier';
    $form['#cache']['contexts'][] = 'url.query_args:item';
    $form['#live'] = $live;

    $form['service'] = [
      '#type' => 'select',
      '#title' => $this->t('Select Enterprise Service'),
      '#options' => array_map(fn (array $s) => "{$s['code']} - {$s['title']}", array_column($services, NULL, 'slug')),
      '#default_value' => $slug,
      '#required' => TRUE,
      // Changing service only rebuilds the tariff block; nothing is validated or submitted.
      '#submit' => ['::rebuildTariff'],
      '#limit_validation_errors' => [['service']],
      '#ajax' => [
        'callback' => '::refreshTariff',
        'wrapper' => 'kmfri-quote-tariff',
        'event' => 'change',
        'progress' => ['type' => 'throbber', 'message' => $this->t('Loading tariffs…')],
      ],
    ];

    // Tariff, quantity and live estimate are rebuilt when the service changes.
    $form['tariff'] = [
      '#type' => 'container',
      '#attributes' => [
        'id' => 'kmfri-quote-tariff',
        'class' => ['k-quote-tariff', 'sm:col-span-2', 'grid', 'grid-cols-1', 'sm:grid-cols-2', 'gap-4'],
        'data-kmfri-estimate' => '',
      ],
    ];
    // Catalogue tariffs are grouped as in the catalogue ("Benchtop Analysis — Water" …).
    $groups = [];
    foreach ($this->catalogue->index() as ['item' => $item, 'trail' => $trail]) {
      $groups[$item['no']] = implode(' › ', array_slice(array_column($trail, 'title'), 1)) ?: $trail[0]['title'];
    }
    $key = fn (array $t): string => (string) ($t['id'] ?? $t['name']);
    // ?item= (a catalogue service, register number) or ?tier= preselects a tariff.
    $requestedItem = (int) $this->getRequest()->query->get('item', 0);
    $requestedTier = (string) $this->getRequest()->query->get('tier', '');
    $selectedTier = $tiers[0] ?? NULL;
    foreach ($tiers as $tier) {
      if (($requestedItem && ($tier['register_no'] ?? NULL) === $requestedItem) || ($requestedTier !== '' && $key($tier) === $requestedTier)) {
        $selectedTier = $tier;
        break;
      }
    }
    if ($tiers) {
      $tierOptions = [];
      foreach ($tiers as $tier) {
        $label = sprintf('%s (KES %s %s)', $tier['name'], number_format($tier['cost_kes']), $tier['unit']);
        $group = $groups[$tier['register_no'] ?? 0] ?? NULL;
        if ($group !== NULL) {
          $tierOptions[$group][$key($tier)] = $label;
        }
        else {
          $tierOptions[$key($tier)] = $label;
        }
      }
      $form['tariff']['tier'] = [
        '#type' => 'select',
        '#title' => $this->t('Select Test / Specimen Option'),
        '#options' => $tierOptions,
        '#default_value' => $key($selectedTier),
        '#required' => TRUE,
        '#attributes' => ['data-kmfri-tiers' => json_encode(array_map(fn ($t) => ['id' => (string) ($t['id'] ?? $t['name']), 'cost' => $t['cost_kes'], 'unit' => $t['unit']], $tiers))],
      ];
    }
    else {
      $form['tariff']['tier'] = [
        '#type' => 'select',
        '#title' => $this->t('Select Test / Specimen Option'),
        '#options' => ['' => $this->t('Tariff issued on quotation')],
        '#disabled' => TRUE,
      ];
    }
    $form['tariff']['quantity'] = [
      '#type' => 'number',
      '#title' => $this->t('Estimated Quantity (@unit)', ['@unit' => $selectedTier['unit'] ?? 'units']),
      '#min' => 1,
      '#max' => 100000,
      '#step' => 1,
      '#default_value' => 1,
      '#required' => TRUE,
      '#attributes' => ['inputmode' => 'numeric', 'data-kmfri-quantity' => ''],
    ];
    $form['tariff']['estimate'] = [
      '#theme' => 'kmfri_enterprise_estimate',
      '#amount' => $selectedTier['cost_kes'] ?? NULL,
    ];

    $stationOptions = [];
    foreach ($this->repository->stations() as $station) {
      $stationOptions[$station['db_id'] ?? $station['id']] = "{$station['name']} ({$station['county']})";
    }
    // Booking from a station page (?station=) preselects that centre.
    $requestedStation = (string) $this->getRequest()->query->get('station', '');
    $form['station'] = [
      '#type' => 'select',
      '#title' => $this->t('Preferred Research Centre'),
      '#options' => $stationOptions,
      '#default_value' => isset($stationOptions[$requestedStation]) ? $requestedStation : array_key_first($stationOptions),
    ];

    $form['client_type'] = [
      '#type' => 'select',
      '#title' => $this->t('Client Category'),
      '#options' => $this->content->hub('client_types'),
      '#default_value' => 'private',
      '#required' => TRUE,
    ];
    $form['full_name'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Full Name of Contact Person'),
      '#maxlength' => 150,
      '#required' => TRUE,
      '#attributes' => ['autocomplete' => 'name', 'placeholder' => 'e.g. Dr. Jane Mwangi'],
    ];
    $form['organization'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Organization / Company Name'),
      '#maxlength' => 200,
      '#required' => TRUE,
      '#attributes' => ['autocomplete' => 'organization', 'placeholder' => 'e.g. Mombasa Aqua-Processors Ltd'],
    ];
    $form['kra_pin'] = [
      '#type' => 'textfield',
      '#title' => $this->t('KRA PIN (Optional for Individuals)'),
      '#maxlength' => 20,
      '#attributes' => ['placeholder' => 'e.g. P051234567Z', 'class' => ['uppercase']],
    ];
    $form['email'] = [
      '#type' => 'email',
      '#title' => $this->t('Email Address'),
      '#maxlength' => 150,
      '#required' => TRUE,
      '#attributes' => ['autocomplete' => 'email', 'placeholder' => 'official@company.or.ke'],
    ];
    $form['phone'] = [
      '#type' => 'tel',
      '#title' => $this->t('Phone Number'),
      '#maxlength' => 30,
      '#required' => TRUE,
      '#attributes' => ['autocomplete' => 'tel', 'placeholder' => '+254 7XX XXXXXX'],
    ];
    $form['notes'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Scope Details / Specific Inquiries / Expedition Dates'),
      '#rows' => 3,
      '#attributes' => ['placeholder' => 'Provide details about sample types, expected test dates, target coordinates, or special requirements...'],
    ];

    $form['actions'] = ['#type' => 'actions'];
    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Submit Formal Request'),
      '#disabled' => !$live,
      '#attributes' => ['class' => ['btn', 'btn-primary']],
    ];
    $form['actions']['cancel'] = [
      '#type' => 'link',
      '#title' => $this->t('Cancel'),
      '#url' => isset($bySlug[$slug]) && $this->getRequest()->query->has('service')
        ? Url::fromRoute('kmfri_enterprise.service', ['slug' => $slug])
        : Url::fromRoute('kmfri_enterprise.home'),
      '#attributes' => ['class' => ['btn', 'btn-outline']],
    ];

    self::styleInputs($form);
    return $form;
  }

  /**
   * AJAX: tariff options, quantity unit and estimate for the selected service.
   */
  public function refreshTariff(array &$form, FormStateInterface $form_state): array {
    return $form['tariff'];
  }

  /**
   * Submit handler of the service select: rebuild with the new service's tariffs.
   */
  public function rebuildTariff(array &$form, FormStateInterface $form_state): void {
    $input = $form_state->getUserInput();
    unset($input['tier']);
    $form_state->setUserInput($input);
    $form_state->setRebuild();
  }

  public function validateForm(array &$form, FormStateInterface $form_state): void {
    if (($form_state->getTriggeringElement()['#name'] ?? '') === 'service') {
      return;
    }
    if (!$this->repository->isLive()) {
      $form_state->setErrorByName('', $this->unavailableMessage());
      return;
    }
    $limit = (int) ($this->config('kmfri_enterprise.settings')->get('flood_limit') ?: 10);
    $window = (int) ($this->config('kmfri_enterprise.settings')->get('flood_window') ?: 600);
    if (!$this->flood->isAllowed(self::FLOOD_EVENT, $limit, $window)) {
      $form_state->setErrorByName('', $this->t('Too many requests. Please try again in a few minutes.'));
      return;
    }

    $v = self::values($form_state);
    $service = $this->repository->service($v['slug']);
    if (!$service) {
      $form_state->setErrorByName('service', $this->t('Select a service.'));
      return;
    }
    if (!array_key_exists($v['client_type'], $this->content->hub('client_types'))) {
      $form_state->setErrorByName('client_type', $this->t('Select a client category.'));
    }
    $len = fn (string $s) => mb_strlen($s);
    if ($len($v['full_name']) < 2 || $len($v['full_name']) > 150) {
      $form_state->setErrorByName('full_name', $this->t('Enter the contact person’s full name.'));
    }
    if ($len($v['organization']) < 2 || $len($v['organization']) > 200) {
      $form_state->setErrorByName('organization', $this->t('Enter the organization or company name.'));
    }
    if (!preg_match(self::EMAIL_RE, $v['email']) || $len($v['email']) > 150) {
      $form_state->setErrorByName('email', $this->t('Enter a valid email address.'));
    }
    if (!preg_match(self::PHONE_RE, $v['phone'])) {
      $form_state->setErrorByName('phone', $this->t('Enter a valid phone number.'));
    }
    if ($v['kra_pin'] !== '' && !preg_match(self::KRA_RE, $v['kra_pin'])) {
      $form_state->setErrorByName('kra_pin', $this->t('KRA PIN format: letter, 9 digits, letter (e.g. P051234567Z).'));
    }
    if ($v['quantity'] < 1 || $v['quantity'] > 100000) {
      $form_state->setErrorByName('quantity', $this->t('Quantity must be between 1 and 100,000.'));
    }
    if ($len($v['notes']) > 2000) {
      $form_state->setErrorByName('notes', $this->t('Keep scope details under 2,000 characters.'));
    }

    try {
      $refs = $this->repository->validateReferences((int) $service['db_id'], $v['tier_id'], $v['station_id']);
    }
    catch (\Throwable $e) {
      $this->logger('kmfri_enterprise')->error('Quotation validation failed: @m', ['@m' => $e->getMessage()]);
      $form_state->setErrorByName('', $this->unavailableMessage());
      return;
    }
    foreach ($refs as $field => $message) {
      $form_state->setErrorByName($field, $message);
    }
  }

  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $v = self::values($form_state);
    $service = $this->repository->service($v['slug']);
    $ip = $this->getRequest()->getClientIp() ?? 'unknown';
    try {
      $result = $this->repository->registerInquiry([
        'service_id' => (int) $service['db_id'],
        'tier_id' => $v['tier_id'],
        'station_id' => $v['station_id'],
      ] + $v, $ip);
    }
    catch (\Throwable $e) {
      $this->logger('kmfri_enterprise')->error('Quotation request could not be registered: @m', ['@m' => $e->getMessage()]);
      $this->messenger()->addError($this->unavailableMessage());
      $form_state->setRebuild();
      return;
    }
    $this->logger('kmfri_enterprise')->notice('Quotation request @ref registered for @service.', ['@ref' => $result['reference'], '@service' => $service['title']]);
    $this->flood->register(self::FLOOD_EVENT, (int) ($this->config('kmfri_enterprise.settings')->get('flood_window') ?: 600));

    $tier = NULL;
    foreach ($service['pricing_tiers'] as $t) {
      if ($t['id'] === $v['tier_id']) {
        $tier = $t;
      }
    }
    $station = NULL;
    foreach ($this->repository->stations() as $st) {
      if (($st['db_id'] ?? NULL) === $v['station_id']) {
        $station = $st;
      }
    }
    $this->getRequest()->getSession()->set('kmfri_enterprise.receipt', $result + [
      'service' => $service['title'],
      'service_slug' => $service['slug'],
      'tier' => $tier['name'] ?? NULL,
      'units' => $tier ? "{$v['quantity']} ({$tier['unit']})" : (string) $v['quantity'],
      'station' => $station['name'] ?? NULL,
      'email' => $v['email'],
    ]);
    $form_state->setRedirect('kmfri_enterprise.quote_receipt');
  }

  /**
   * Normalised submitted values.
   */
  private static function values(FormStateInterface $form_state): array {
    $str = fn (string $k) => trim((string) $form_state->getValue($k, ''));
    $tier = $form_state->getValue('tier');
    $station = $form_state->getValue('station');
    return [
      'slug' => $str('service'),
      'tier_id' => is_numeric($tier) ? (int) $tier : NULL,
      'station_id' => is_numeric($station) ? (int) $station : NULL,
      'client_type' => $str('client_type'),
      'full_name' => $str('full_name'),
      'organization' => $str('organization'),
      'kra_pin' => strtoupper($str('kra_pin')),
      'email' => $str('email'),
      'phone' => $str('phone'),
      'quantity' => (int) $form_state->getValue('quantity', 1),
      'notes' => $str('notes'),
    ];
  }

  private function unavailableMessage(): string {
    return (string) $this->t('Online requests are temporarily unavailable. Please call the Client Inquiries Desk on +254 (0) 41 475151 or email director@kmfri.go.ke.');
  }

  /**
   * Adds the hub input/label classes to every form element.
   */
  private static function styleInputs(array &$elements): void {
    foreach ($elements as $key => &$element) {
      if (!is_array($element) || str_starts_with((string) $key, '#')) {
        continue;
      }
      if (in_array($element['#type'] ?? '', ['select', 'textfield', 'email', 'tel', 'number', 'textarea'], TRUE)) {
        $element['#attributes']['class'][] = 'k-input';
        $element['#label_attributes']['class'][] = 'k-label';
      }
      self::styleInputs($element);
    }
  }

}
