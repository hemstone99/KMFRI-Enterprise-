<?php

declare(strict_types=1);

namespace Drupal\kmfri_enterprise\Form;

use Drupal\Component\Utility\Html;
use Drupal\Core\Datetime\DateFormatterInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Render\Markup;
use Drupal\Core\Url;
use Drupal\user\RoleInterface;
use Drupal\user\UserInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * User management table with bulk actions (block, unblock, add/remove a role).
 */
final class UserAdminForm extends FormBase {

  /**
   * Not readonly: forms are serialized into the form cache.
   */
  public function __construct(
    protected EntityTypeManagerInterface $entityTypeManager,
    protected DateFormatterInterface $dateFormatter,
  ) {}

  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('entity_type.manager'),
      $container->get('date.formatter'),
    );
  }

  public function getFormId(): string {
    return 'kmfri_enterprise_user_admin';
  }

  /**
   * Roles that can be granted from the dashboard (everything but the built-ins and admin roles).
   *
   * @return \Drupal\user\RoleInterface[]
   */
  private function assignableRoles(): array {
    $roles = $this->entityTypeManager->getStorage('user_role')->loadMultiple();
    return array_filter($roles, fn (RoleInterface $r) => !in_array($r->id(), [RoleInterface::ANONYMOUS_ID, RoleInterface::AUTHENTICATED_ID], TRUE) && !$r->isAdmin());
  }

  public function buildForm(array $form, FormStateInterface $form_state, array $uids = []): array {
    $users = $this->entityTypeManager->getStorage('user')->loadMultiple($uids);
    $roleLabels = array_map(fn (RoleInterface $r) => $r->label(), $this->entityTypeManager->getStorage('user_role')->loadMultiple());
    $form['#attributes']['class'][] = 'k-form';

    $options = [];
    foreach ($users as $user) {
      /** @var \Drupal\user\UserInterface $user */
      $roles = array_map(fn ($rid) => '<span class="k-badge k-badge--navy">' . Html::escape((string) ($roleLabels[$rid] ?? $rid)) . '</span>', array_diff($user->getRoles(), [RoleInterface::AUTHENTICATED_ID]));
      $initials = strtoupper(mb_substr($user->getAccountName(), 0, 2));
      $options[$user->id()] = [
        'user' => ['data' => Markup::create(sprintf(
          '<span class="flex items-center gap-3"><span class="kd-avatar" aria-hidden="true">%s</span><span class="min-w-0"><span class="block font-semibold text-navy-800">%s</span><span class="block text-xs text-muted truncate">%s</span></span></span>',
          Html::escape($initials),
          Html::escape($user->getDisplayName()),
          Html::escape((string) $user->getEmail())
        ))],
        'roles' => ['data' => Markup::create($roles ? '<span class="flex flex-wrap gap-1">' . implode('', $roles) . '</span>' : '<span class="text-subtle">—</span>')],
        'status' => ['data' => Markup::create($user->isActive()
          ? '<span class="kd-status kd-status--fulfilled">Active</span>'
          : '<span class="kd-status kd-status--cancelled">Blocked</span>')],
        'created' => $this->dateFormatter->format($user->getCreatedTime(), 'custom', 'j M Y'),
        'access' => $user->getLastAccessedTime()
          ? $this->t('@time ago', ['@time' => $this->dateFormatter->formatTimeDiffSince($user->getLastAccessedTime(), ['granularity' => 1])])
          : $this->t('Never'),
        'edit' => ['data' => [
          '#type' => 'link',
          '#title' => $this->t('Edit'),
          '#url' => Url::fromRoute('entity.user.edit_form', ['user' => $user->id()], ['query' => ['destination' => Url::fromRoute('kmfri_enterprise.admin.users')->toString()]]),
          '#attributes' => ['class' => ['k-link', 'text-sm']],
        ]],
      ];
    }

    $form['users'] = [
      '#type' => 'tableselect',
      '#header' => [
        'user' => $this->t('User'),
        'roles' => $this->t('Roles'),
        'status' => $this->t('Status'),
        'created' => $this->t('Member since'),
        'access' => $this->t('Last access'),
        'edit' => ['data' => $this->t('Actions'), 'class' => ['text-right']],
      ],
      '#options' => $options,
      '#empty' => $this->t('No users match these filters.'),
      '#attributes' => ['class' => ['kd-table']],
      '#js_select' => TRUE,
    ];

    $actions = [
      'block' => $this->t('Block selected users'),
      'unblock' => $this->t('Unblock selected users'),
    ];
    foreach ($this->assignableRoles() as $rid => $role) {
      $actions["add:$rid"] = $this->t('Add role: @role', ['@role' => $role->label()]);
      $actions["remove:$rid"] = $this->t('Remove role: @role', ['@role' => $role->label()]);
    }
    $form['bulk'] = [
      '#type' => 'container',
      '#attributes' => ['class' => ['kd-bulk']],
      '#weight' => -10,
    ];
    $form['bulk']['operation'] = [
      '#type' => 'select',
      '#title' => $this->t('Bulk action'),
      '#title_display' => 'invisible',
      '#options' => $actions,
      '#empty_option' => $this->t('- Bulk action -'),
      '#attributes' => ['class' => ['k-input']],
    ];
    $form['bulk']['apply'] = [
      '#type' => 'submit',
      '#value' => $this->t('Apply to selected'),
      '#attributes' => ['class' => ['btn', 'btn-outline', 'btn-sm']],
    ];
    return $form;
  }

  public function validateForm(array &$form, FormStateInterface $form_state): void {
    if (!$form_state->getValue('operation')) {
      $form_state->setErrorByName('operation', $this->t('Choose a bulk action.'));
    }
    if (!array_filter((array) $form_state->getValue('users'))) {
      $form_state->setErrorByName('users', $this->t('Select at least one user.'));
    }
  }

  public function submitForm(array &$form, FormStateInterface $form_state): void {
    [$op, $rid] = array_pad(explode(':', (string) $form_state->getValue('operation'), 2), 2, NULL);
    if (($op === 'add' || $op === 'remove') && !isset($this->assignableRoles()[$rid])) {
      $this->messenger()->addError($this->t('That role cannot be assigned here.'));
      return;
    }
    $ids = array_keys(array_filter((array) $form_state->getValue('users')));
    $me = (int) $this->currentUser()->id();
    $done = 0;
    $skipped = 0;
    foreach ($this->entityTypeManager->getStorage('user')->loadMultiple($ids) as $user) {
      /** @var \Drupal\user\UserInterface $user */
      // Never lock out yourself or the site owner.
      if ($op === 'block' && ((int) $user->id() === $me || (int) $user->id() === 1)) {
        $skipped++;
        continue;
      }
      match ($op) {
        'block' => $user->block(),
        'unblock' => $user->activate(),
        'add' => $user->addRole($rid),
        'remove' => $user->removeRole($rid),
        default => NULL,
      };
      $user->save();
      $done++;
    }
    $this->logger('kmfri_enterprise')->notice('@user applied "@op" to @count user account(s).', [
      '@user' => $this->currentUser()->getDisplayName(),
      '@op' => (string) ($form['bulk']['operation']['#options'][$form_state->getValue('operation')] ?? $op),
      '@count' => $done,
    ]);
    $this->messenger()->addStatus($this->formatPlural($done, 'Updated 1 user.', 'Updated @count users.'));
    if ($skipped) {
      $this->messenger()->addWarning($this->t('Your own account and the site owner account cannot be blocked from here.'));
    }
  }

}
